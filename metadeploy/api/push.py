"""
Websocket notifications you can subscribe to:

    user.:id
        USER_TOKEN_INVALID
        BACKEND_ERROR
    preflightresult.:id
        PREFLIGHT_COMPLETED
        PREFLIGHT_FAILED
        PREFLIGHT_CANCELED
        PREFLIGHT_INVALIDATED
    job.:id
        TASK_COMPLETED
        JOB_COMPLETED
        JOB_FAILED
        JOB_CANCELED
    org.:org_id
        ORG_CHANGED
    scratchorg.:id
        SCRATCH_ORG_CREATED
        SCRATCH_ORG_ERROR
        SCRATCH_ORG_UPDATED
        SCRATCH_ORG_DELETED
        PREFLIGHT_STARTED
        JOB_STARTED
"""
import logging

from asgiref.sync import sync_to_async
from channels.layers import get_channel_layer
from django.utils.translation import gettext_lazy as _

from ..consumer_utils import get_set_message_semaphore
from .constants import CHANNELS_GROUP_NAME
from .hash_url import convert_org_id_to_key

logger = logging.getLogger("metadeploy.api.push")


async def push_message(group_name, message):
    """Send a message to a group using the default channel layer.

    Checks a semaphore to see if the same message was sent very recently; if so, don't send.
    """
    channel_layer = get_channel_layer()
    action_type = message.get("content", {}).get("type")
    if await get_set_message_semaphore(channel_layer, message):
        logger.info(f"Push message: group={group_name} type={action_type}")
        await channel_layer.group_send(group_name, message)


# Events sent via this method are serialized manually,
# and therefore may not have access to user/session context in the serializer
async def push_message_about_instance(instance, message, group_name=None):
    model_name = instance._meta.model_name
    id = str(instance.id)
    group_name = group_name or CHANNELS_GROUP_NAME.format(model=model_name, id=id)
    sent_message = {"type": "notify", "group": group_name, "content": message}
    await push_message(group_name, sent_message)


# Objects serialized via this method will have access to user/session context
async def push_serializable(instance, serializer, type_, group_name=None):
    model_name = instance._meta.model_name
    id = str(instance.id)
    group_name = group_name or CHANNELS_GROUP_NAME.format(model=model_name, id=id)
    serializer_name = f"{serializer.__module__}.{serializer.__name__}"
    message = {
        "type": "notify",
        "group": group_name,
        "instance": {"model": model_name, "id": id},
        "serializer": serializer_name,
        "inner_type": type_,
    }
    await push_message(group_name, message)


async def user_token_expired(user):
    message = {"type": "USER_TOKEN_INVALID"}
    await push_message_about_instance(user, message)


async def preflight_completed(preflight):
    from .serializers import PreflightResultSerializer

    await push_serializable(
        preflight,
        PreflightResultSerializer,
        "PREFLIGHT_COMPLETED",
    )


async def preflight_failed(preflight):
    from .serializers import PreflightResultSerializer

    await push_serializable(
        preflight,
        PreflightResultSerializer,
        "PREFLIGHT_FAILED",
    )


async def preflight_canceled(preflight):
    from .serializers import PreflightResultSerializer

    await push_serializable(
        preflight,
        PreflightResultSerializer,
        "PREFLIGHT_CANCELED",
    )


async def preflight_invalidated(preflight):
    from .serializers import PreflightResultSerializer

    await push_serializable(
        preflight,
        PreflightResultSerializer,
        "PREFLIGHT_INVALIDATED",
    )


async def report_error(user):
    message = {
        "type": "BACKEND_ERROR",
        # We don't pass the message through to the frontend in case it
        # contains sensitive material:
        "payload": {"message": str(_("There was an error"))},
    }
    await push_message_about_instance(user, message)


async def notify_post_task(job):
    from .serializers import JobSerializer

    await push_serializable(job, JobSerializer, "TASK_COMPLETED")


async def notify_post_job(job):
    from .models import Job
    from .serializers import JobSerializer

    if job.status == Job.Status.complete:
        type_ = "JOB_COMPLETED"
    elif job.status == Job.Status.failed:
        type_ = "JOB_FAILED"
    elif job.status == Job.Status.canceled:
        type_ = "JOB_CANCELED"
    await push_serializable(job, JobSerializer, type_)


async def notify_org_result_changed(result):

    type_ = "ORG_CHANGED"
    org_id = result.org_id

    data = await serialize_org(org_id)

    group_name = CHANNELS_GROUP_NAME.format(
        model="org", id=convert_org_id_to_key(org_id)
    )
    message = {
        "type": "notify",
        "group": group_name,
        "content": {"type": type_, "payload": data},
    }
    await push_message(group_name, message)


@sync_to_async
def serialize_org(org_id):
    from .models import Job, PreflightResult
    from .serializers import OrgSerializer

    current_job = Job.objects.filter(org_id=org_id, status=Job.Status.started).first()
    current_preflight = PreflightResult.objects.filter(
        org_id=org_id, status=PreflightResult.Status.started
    ).first()
    serializer = OrgSerializer(
        {
            "org_id": org_id,
            "current_job": current_job,
            "current_preflight": current_preflight,
        }
    )
    return serializer.data


async def notify_org(scratch_org, type_, payload=None, error=None):
    if not payload:
        payload = {
            "org": str(scratch_org.id),
            "plan": str(scratch_org.plan.id),
        }
        if error:
            # unwrap the error in the case that there's only one,
            # which is the most common case:
            try:
                prepared_message = error.content
                if isinstance(prepared_message, list) and len(prepared_message) == 1:
                    prepared_message = prepared_message[0]
                if isinstance(prepared_message, dict):
                    prepared_message = prepared_message.get("message", prepared_message)
                prepared_message = str(prepared_message)
            except AttributeError:
                prepared_message = str(error)
            payload["message"] = prepared_message

    message = {
        "type": type_,
        "payload": payload,
    }
    group_name = CHANNELS_GROUP_NAME.format(model="scratchorg", id=scratch_org.id)
    sent_message = {"type": "notify", "group": group_name, "content": message}
    await push_message(group_name, sent_message)


async def notify_org_changed(scratch_org, error=None, _type=None):
    from .serializers import ScratchOrgSerializer

    if error:
        await notify_org(scratch_org, _type or "SCRATCH_ORG_ERROR", error=error)
    else:
        payload = ScratchOrgSerializer(scratch_org).data
        await notify_org(scratch_org, _type or "SCRATCH_ORG_UPDATED", payload=payload)


async def preflight_started(scratch_org, preflight):
    from .serializers import PreflightResultSerializer

    group_name = CHANNELS_GROUP_NAME.format(model="scratchorg", id=scratch_org.id)
    await push_serializable(
        preflight, PreflightResultSerializer, "PREFLIGHT_STARTED", group_name=group_name
    )


async def job_started(scratch_org, job):
    from .serializers import JobSerializer

    group_name = CHANNELS_GROUP_NAME.format(model="scratchorg", id=scratch_org.id)
    await push_serializable(
        job,
        JobSerializer,
        "JOB_STARTED",
        group_name=group_name,
    )
