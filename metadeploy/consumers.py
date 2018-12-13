from collections import namedtuple

from channels.generic.websocket import AsyncJsonWebsocketConsumer

from metadeploy.api.models import Job

Request = namedtuple("Request", "user")


def user_context(user):
    return {"request": Request(user)}


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
        if "content" in event:
            await self.send_json(event["content"])
            return
        if "serializer" in event and "instance" in event and "inner_type" in event:
            instance = event["instance"]
            serializer = event["serializer"]
            payload = {
                "payload": serializer(
                    instance=instance, context=user_context(self.scope["user"])
                ).data,
                "type": event["inner_type"],
            }
            await self.send_json(payload)
            return

    async def receive_json(self, content, **kwargs):
        # Just used to subscribe to notification channels.
        is_valid = self.is_valid(content)
        is_known_model = self.is_known_model(content["model"])
        has_good_permissions = self.has_good_permissions(content)
        all_good = is_valid and is_known_model and has_good_permissions
        if not all_good:
            return
        group_name = f"{content['model']}-{content['id']}"
        self.groups.append(group_name)
        await self.channel_layer.group_add(group_name, self.channel_name)

    def is_valid(self, content):
        return content.keys() == {"model", "id"}

    def is_known_model(self, model):
        known_models = {"user", "preflightrequest", "job"}
        return model in known_models

    def has_good_permissions(self, content):
        if content["model"] == "job":
            # If we use this version, we must make this an async
            # function.
            # from channels.db import database_sync_to_async
            # job = await database_sync_to_async(self.get_job)(content["id"])
            # Why does database_sync_to_async not work in the tests?
            job = self.get_job(content["id"])
            return job and job.visible_to(self.scope["user"])
        return True

    def get_job(self, id):
        return Job.objects.filter(pk=id).first()
