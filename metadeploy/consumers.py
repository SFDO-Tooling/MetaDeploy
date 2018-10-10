from channels.generic.websocket import AsyncJsonWebsocketConsumer


class PushNotificationConsumer(AsyncJsonWebsocketConsumer):
    async def connect(self):
        """
        Called when the websocket is handshaking as part of initial
        connection.
        """
        if self.scope["user"].is_anonymous:
            await self.close()
        else:
            await self.accept()
        # Add this channel to the user-id group, so all browser windows
        # where they're logged in will get notifcations:
        user_id = self.scope["user"].id
        await self.channel_layer.group_add(
            f'user-{user_id}',
            self.channel_name,
        )

    async def receive_json(self, content):
        pass

    async def disconnect(self, code):
        pass

    async def notify(self, event):
        self.send_json(event['content'])
