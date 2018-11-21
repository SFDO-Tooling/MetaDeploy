from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer

from metadeploy.api.models import Job


class PushNotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close()
        else:
            await self.accept()

    async def notify(self, event):
        """
        Handler for calls like::

            channel_layer.group_send(group_name, {
                'type': 'notify',  # This routes it to this handler.
                'content': json_message,
            })
        """
        await self.send_json(event['content'])

    async def receive_json(self, content, **kwargs):
        # Just used to subscribe to notification channels.
        all_good = (
            self.is_valid(content)
            and self.is_known_model(content["model"])
            and await self.has_good_permissions(content)
        )
        if not all_good:
            return
        group_name = f"{content['model']}-{content['id']}"
        self.groups.append(group_name)
        await self.channel_layer.group_add(
            group_name,
            self.channel_name,
        )

    def is_valid(self, content):
        return content.keys() == {"model", "id"}

    def is_known_model(self, model):
        known_models = {
            "user",
            "preflightrequest",
            "job",
        }
        return model in known_models

    @database_sync_to_async
    def has_good_permissions(self, content):
        if content["model"] == "job":
            job = Job.objects.filter(pk=content["id"]).first()
            return job and job.visible_to(self.scope["user"])
        return True
