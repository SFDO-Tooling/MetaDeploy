from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.sessions import SessionMiddlewareStack
from django.core.asgi import get_asgi_application
from django.urls import path

from .consumers import PushNotificationConsumer

websockets = URLRouter(
    [
        path(
            "ws/notifications/",
            PushNotificationConsumer.as_asgi(),
            name="ws_notifications",
        )
    ]
)


application = ProtocolTypeRouter(
    {
        "http": get_asgi_application(),
        "websocket": SessionMiddlewareStack(AuthMiddlewareStack(websockets)),
    }
)
