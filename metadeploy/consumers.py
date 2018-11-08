from channels.generic.websocket import AsyncJsonWebsocketConsumer


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
        if "model" in content and "id" in content:
            group_name = f"{content['model']}-{content['id']}"
            self.groups.add(group_name)
            await self.channel_layer.group_add(
                group_name,
                self.channel_name,
            )
