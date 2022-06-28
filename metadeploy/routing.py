from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from django.urls import path

from metadeploy.multitenancy.middleware import ChannelsCurrentSiteMiddleware

from .consumers import PushNotificationConsumer


def metadeploy_stack(inner):
    return ChannelsCurrentSiteMiddleware(AuthMiddlewareStack(inner))


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
        "websocket": metadeploy_stack(websockets),
    }
)
