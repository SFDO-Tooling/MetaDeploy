from django.urls import path

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter

from .consumers import PushNotificationConsumer


application = ProtocolTypeRouter({
    # (http->django views is added by default)
    "websocket": AuthMiddlewareStack(URLRouter([
        path("ws/notifications/", PushNotificationConsumer),
    ])),
})
