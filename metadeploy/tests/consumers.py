import pytest
from channels.testing import WebsocketCommunicator

from ..api.models import Job, PreflightResult
from ..api.push import notify_post_job, preflight_completed, user_token_expired
from ..api.serializers import JobSerializer, PreflightResultSerializer
from ..consumers import PushNotificationConsumer, user_context


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__user_token_invalid(user_factory):
    user = user_factory()

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to({"model": "user", "id": str(user.id)})
    response = await communicator.receive_json_from()
    assert "ok" in response

    await user_token_expired(user)
    response = await communicator.receive_json_from()
    assert response == {"type": "USER_TOKEN_INVALID"}

    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__subscribe_preflight(
    user_factory, preflight_result_factory, plan_factory
):
    user = user_factory()
    plan = plan_factory()
    preflight = preflight_result_factory(
        user=user, status=PreflightResult.Status.complete, plan=plan
    )

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to(
        {"model": "preflightresult", "id": str(preflight.id)}
    )
    response = await communicator.receive_json_from()
    assert "ok" in response

    await preflight_completed(preflight)
    response = await communicator.receive_json_from()
    assert response == {
        "type": "PREFLIGHT_COMPLETED",
        "payload": PreflightResultSerializer(
            instance=preflight, context=user_context(user)
        ).data,
    }

    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__subscribe_job(user_factory, job_factory):
    user = user_factory()
    job = job_factory(user=user, status=Job.Status.complete)

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to({"model": "job", "id": str(job.id)})
    response = await communicator.receive_json_from()
    assert "ok" in response

    await notify_post_job(job)
    response = await communicator.receive_json_from()
    assert response == {
        "type": "JOB_COMPLETED",
        "payload": JobSerializer(instance=job, context=user_context(user)).data,
    }

    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__subscribe_job__bad(
    user_factory, job_factory
):
    user = user_factory()
    job = job_factory(status=Job.Status.complete)

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to({"model": "job", "id": str(job.id)})
    response = await communicator.receive_json_from()
    assert "error" in response

    await notify_post_job(job)
    assert await communicator.receive_nothing()

    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__subscribe_job__missing(
    user_factory, job_factory
):
    user = user_factory()

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to({"model": "job", "id": "missingjob"})
    response = await communicator.receive_json_from()
    assert "error" in response

    await communicator.disconnect()
