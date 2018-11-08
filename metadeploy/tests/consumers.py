import pytest
from django.contrib.auth.models import AnonymousUser
from channels.testing import WebsocketCommunicator
from ..consumers import PushNotificationConsumer
from ..api.push import user_token_expired


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__user_token_invalid(user_factory):
    user = user_factory()

    communicator = WebsocketCommunicator(
        PushNotificationConsumer,
        "/ws/notifications/",
    )
    communicator.scope["user"] = user
    connected, subprotocol = await communicator.connect()
    assert connected

    await communicator.send_json_to({
        "model": "user",
        "id": str(user.id),
    })

    await user_token_expired(user)
    response = await communicator.receive_json_from()
    assert response == {
        "type": "USER_TOKEN_INVALID",
    }

    await communicator.disconnect()


@pytest.mark.asyncio
async def test_push_notification_consumer__anonymous():
    communicator = WebsocketCommunicator(
        PushNotificationConsumer,
        "/ws/notifications/",
    )
    communicator.scope["user"] = AnonymousUser()
    connected, subprotocol = await communicator.connect()
    assert not connected
