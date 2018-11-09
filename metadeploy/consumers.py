from channels.generic.websocket import AsyncJsonWebsocketConsumer

from metadeploy.api.models import Job


class PushNotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close()
            return

        self.groups = set()
        await self.accept()

    async def disconnect(self, close_code):
        for group_name in self.groups:
            await self.channel_layer.group_discard(
                group_name,
                self.channel_name,
            )
        self.groups = set()

    async def notify(self, event):
        await self.send_json(event['content'])

    async def receive_json(self, content, **kwargs):
        # Just used to subscribe to notification channels.
        # TODO confirm that this user has rights to see events on this
        # model instance
        if not self.has_good_permissions(content):
            return
        group_name = f"{content['model']}-{content['id']}"
        self.groups.add(group_name)
        await self.channel_layer.group_add(
            group_name,
            self.channel_name,
        )

    def has_good_permissions(self, content):
        known_models = {
            "user",
            "preflightrequest",
            "job",
        }
        if not ("model" in content and "id" in content):
            return False
        model = content["model"]
        if model not in known_models:
            return False
        if model == "job":
            # Test job permissions:
            job = Job.objects.get(pk=content["id"])
            return job.visible_to(self.scope["user"])
        return True
