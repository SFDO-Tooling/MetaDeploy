from uuid import uuid4

import pytest
from channels.db import database_sync_to_async
from channels.testing import WebsocketCommunicator
from django.utils import timezone

from ..api.models import Job, PreflightResult, ScratchOrg
from ..api.push import (
    notify_org_finished,
    notify_org_result_changed,
    notify_post_job,
    preflight_completed,
    user_token_expired,
)
from ..api.serializers import JobSerializer, OrgSerializer, PreflightResultSerializer
from ..consumers import PushNotificationConsumer, get_language_from_scope, user_context


def test_get_language_from_scope():
    scope = {"headers": ((b"accept-language", b"de"),)}
    lang = get_language_from_scope(scope)
    assert lang == "de"


def test_get_language_from_scope__default():
    assert (
        get_language_from_scope({"headers": ((b"accept-language", b"*"),)}) == "en-us"
    )
    assert (
        get_language_from_scope({"headers": ((b"accept-language", b"xx"),)}) == "en-us"
    )


@database_sync_to_async
def generate_model(model_factory, **kwargs):
    return model_factory(**kwargs)


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__subscribe_scratch_org(scratch_org_factory):
    uuid = str(uuid4())
    scratch_org = await generate_model(
        scratch_org_factory, uuid=uuid, enqueued_at=timezone.now()
    )

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = None
    communicator.scope["session"] = {
        "scratch_org_id": uuid,
    }
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to({"model": "scratchorg", "id": str(scratch_org.id)})
    response = await communicator.receive_json_from()
    assert "ok" in response

    await notify_org_finished(scratch_org)
    response = await communicator.receive_json_from()
    assert response["type"] == "SCRATCH_ORG_CREATED"

    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__user_token_invalid(user_factory):
    user = await generate_model(user_factory)

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    communicator.scope["session"] = {}
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
    user = await generate_model(user_factory)
    plan = await generate_model(plan_factory)
    preflight = await generate_model(
        preflight_result_factory,
        user=user,
        status=PreflightResult.Status.complete,
        plan=plan,
        org_id=user.org_id,
    )

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    communicator.scope["session"] = {}
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
    user = await generate_model(user_factory)
    job = await generate_model(
        job_factory, user=user, status=Job.Status.complete, org_id=user.org_id
    )

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    communicator.scope["session"] = {}
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
    user = await generate_model(user_factory)
    job = await generate_model(
        job_factory, status=Job.Status.complete, org_id="00Dxxxxxxxxxxxxxxx"
    )

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
async def test_push_notification_consumer__subscribe_job__missing(user_factory):
    user = await generate_model(user_factory)

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to({"model": "job", "id": "missingjob"})
    response = await communicator.receive_json_from()
    assert "error" in response

    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__subscribe_org(
    social_account_factory, user_factory, job_factory, plan_factory
):
    org_id = "00Dxxxxxxxxxxxxxxx"
    user = await generate_model(user_factory, socialaccount_set=[])
    await generate_model(
        social_account_factory,
        user=user,
        extra_data={
            # instance_url is the important part here:
            "instance_url": "https://example.com/",
            "organization_id": org_id,
            "organization_details": {
                "Name": "Sample Org",
                "OrganizationType": "Developer Edition",
            },
        },
    )
    plan = await generate_model(plan_factory)
    job = await generate_model(
        job_factory,
        status=Job.Status.started,
        user=user,
        plan=plan,
        org_id=user.org_id,
    )

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["user"] = user
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to({"model": "org", "id": org_id})
    response = await communicator.receive_json_from()
    assert "ok" in response

    await notify_org_result_changed(job)
    response = await communicator.receive_json_from()
    assert response == {
        "type": "ORG_CHANGED",
        "payload": OrgSerializer(
            {
                "org_id": org_id,
                "current_job": job,
                "current_preflight": None,
            }
        ).data,
    }

    await communicator.disconnect()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_push_notification_consumer__anon_subscribe_org(
    social_account_factory, user_factory, job_factory, plan_factory, scratch_org_factory
):
    uuid = str(uuid4())
    org_id = "00Dyyyyyyyyyyyyyyy"
    await generate_model(
        scratch_org_factory, uuid=uuid, org_id=org_id, status=ScratchOrg.Status.complete
    )
    user = await generate_model(user_factory, socialaccount_set=[])
    await generate_model(
        social_account_factory,
        user=user,
        extra_data={
            # instance_url is the important part here:
            "instance_url": "https://example.com/",
            "organization_id": org_id,
            "organization_details": {
                "Name": "Sample Org",
                "OrganizationType": "Developer Edition",
            },
        },
    )
    plan = await generate_model(plan_factory)
    job = await generate_model(
        job_factory,
        status=Job.Status.started,
        user=user,
        plan=plan,
        org_id=user.org_id,
    )

    communicator = WebsocketCommunicator(PushNotificationConsumer, "/ws/notifications/")
    communicator.scope["session"] = {
        "scratch_org_id": uuid,
    }
    connected, _ = await communicator.connect()
    assert connected

    await communicator.send_json_to({"model": "org", "id": org_id})
    response = await communicator.receive_json_from()
    assert "ok" in response

    await notify_org_result_changed(job)
    response = await communicator.receive_json_from()
    assert response == {
        "type": "ORG_CHANGED",
        "payload": OrgSerializer(
            {
                "org_id": org_id,
                "current_job": job,
                "current_preflight": None,
            }
        ).data,
    }, response

    await communicator.disconnect()
