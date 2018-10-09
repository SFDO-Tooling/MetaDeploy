from channels.consumer import SyncConsumer


class EchoConsumer(SyncConsumer):
    def websocket_connect(self, event):
        self.send({"type": "websocket.accept"})

    def websocket_disconnect(self, event):
        pass

    def websocket_receive(self, event):
        self.send({"type": "websocket.send", "text": event["text"]})
