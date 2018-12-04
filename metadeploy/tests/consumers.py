import pytest
from channels.testing import WebsocketCommunicator
from django.contrib.auth.models import AnonymousUser

from ..api.push import user_token_expired
from ..consumers import PushNotificationConsumer


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__user_token_invalid(user_factory):
    user = user_factory()

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, subprotocol = await communicator.connect()
    assert connected

    await user_token_expired(user)
    response = await communicator.receive_json_from()
    assert response == {"type": "USER_TOKEN_INVALID"}

    await communicator.disconnect()


@pytest.mark.asyncio
async def test_push_notification_consumer__anonymous():
    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = AnonymousUser()
    connected, subprotocol = await communicator.connect()
    assert not connected
