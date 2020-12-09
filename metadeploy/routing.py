from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.sessions import SessionMiddlewareStack
from django.urls import path

from .consumers import PushNotificationConsumer

websockets = URLRouter(
    [path("ws/notifications/", PushNotificationConsumer, name="ws_notifications")]
)


application = ProtocolTypeRouter(
    {
        # (http->django views is added by default)
        "websocket": SessionMiddlewareStack(AuthMiddlewareStack(websockets)),
    }
)
