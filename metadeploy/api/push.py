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
    org.:org_url
        ORG_CHANGED
    scratch_org.:job_id
        SCRATCH_ORG_CREATED
        SCRATCH_ORG_ERROR
"""
import logging

from channels.layers import get_channel_layer
from django.utils.translation import gettext_lazy as _

from ..consumer_utils import get_set_message_semaphore
from .constants import CHANNELS_GROUP_NAME
from .hash_url import convert_org_id_to_key

logger = logging.getLogger("metadeploy.api.push")


async def push_message_about_instance(instance, message):
    model_name = instance._meta.model_name
    id = str(instance.id)
    group_name = CHANNELS_GROUP_NAME.format(model=model_name, id=id)
    channel_layer = get_channel_layer()
    sent_message = {"type": "notify", "group": group_name, "content": message}
    if await get_set_message_semaphore(channel_layer, sent_message):
        logger.info(f"Sending message {sent_message}")
        await channel_layer.group_send(group_name, sent_message)


async def push_serializable(instance, serializer, type_):
    model_name = instance._meta.model_name
    id = str(instance.id)
    group_name = CHANNELS_GROUP_NAME.format(model=model_name, id=id)
    serializer_name = f"{serializer.__module__}.{serializer.__name__}"
    message = {
        "type": "notify",
        "group": group_name,
        "instance": {"model": model_name, "id": id},
        "serializer": serializer_name,
        "inner_type": type_,
    }
    channel_layer = get_channel_layer()
    if await get_set_message_semaphore(channel_layer, message):
        logger.info(f"Sending message {message}")
        await channel_layer.group_send(group_name, message)


async def user_token_expired(user):
    message = {"type": "USER_TOKEN_INVALID"}
    await push_message_about_instance(user, message)


async def preflight_completed(preflight):
    from .serializers import PreflightResultSerializer

    payload = PreflightResultSerializer(instance=preflight).data
    message = {"type": "PREFLIGHT_COMPLETED", "payload": payload}
    await push_message_about_instance(preflight, message)


async def preflight_failed(preflight):
    from .serializers import PreflightResultSerializer

    payload = PreflightResultSerializer(instance=preflight).data
    message = {"type": "PREFLIGHT_FAILED", "payload": payload}
    await push_message_about_instance(preflight, message)


async def preflight_canceled(preflight):
    from .serializers import PreflightResultSerializer

    payload = PreflightResultSerializer(instance=preflight).data
    message = {"type": "PREFLIGHT_CANCELED", "payload": payload}
    await push_message_about_instance(preflight, message)


async def preflight_invalidated(preflight):
    from .serializers import PreflightResultSerializer

    payload = PreflightResultSerializer(instance=preflight).data
    message = {"type": "PREFLIGHT_INVALIDATED", "payload": payload}
    await push_message_about_instance(preflight, message)


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
    from .models import Job, PreflightResult
    from .serializers import OrgSerializer

    type_ = "ORG_CHANGED"
    org_id = result.org_id

    current_job = Job.objects.filter(org_id=org_id, status=Job.Status.started).first()
    current_preflight = PreflightResult.objects.filter(
        org_id=org_id, status=PreflightResult.Status.started
    ).first()
    serializer = OrgSerializer(
        {"current_job": current_job, "current_preflight": current_preflight}
    )
    group_name = CHANNELS_GROUP_NAME.format(
        model="org", id=convert_org_id_to_key(org_id)
    )
    message = {
        "type": "notify",
        "group": group_name,
        "content": {"type": type_, "payload": serializer.data},
    }
    channel_layer = get_channel_layer()
    if await get_set_message_semaphore(channel_layer, message):
        logger.info(f"Sending message {message}")
        await channel_layer.group_send(group_name, message)


async def notify_org_finished(scratch_org_job, error=None):
    from .serializers import ScratchOrgJobSerializer

    if error:
        type_ = "SCRATCH_ORG_ERROR"
        payload = ({"message": str(error), "id": str(scratch_org_job.plan_id)},)
    else:
        type_ = "SCRATCH_ORG_CREATED"
        payload = ScratchOrgJobSerializer(scratch_org_job).data

    message = {
        "type": type_,
        "payload": payload,
    }
    group_name = CHANNELS_GROUP_NAME.format(
        model="scratch_org", id=scratch_org_job.job_id
    )
    channel_layer = get_channel_layer()
    sent_message = {"type": "notify", "group": group_name, "content": message}
    if await get_set_message_semaphore(channel_layer, sent_message):
        logger.info(f"Sending message {sent_message}")
        await channel_layer.group_send(group_name, sent_message)
