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
"""
from channels.layers import get_channel_layer
from django.utils.translation import gettext_lazy as _

from ..consumer_utils import message_exists, set_message_exists
from .constants import CHANNELS_GROUP_NAME
from .hash_url import convert_org_url_to_key


async def push_message_about_instance(instance, message):
    model_name = instance._meta.model_name
    id = str(instance.id)
    group_name = CHANNELS_GROUP_NAME.format(model=model_name, id=id)
    channel_layer = get_channel_layer()
    sent_message = {"type": "notify", "content": message}
    if not await message_exists(channel_layer, sent_message):
        await set_message_exists(channel_layer, sent_message)
        await channel_layer.group_send(group_name, sent_message)


async def push_serializable(instance, serializer, type_):
    model_name = instance._meta.model_name
    id = str(instance.id)
    group_name = CHANNELS_GROUP_NAME.format(model=model_name, id=id)
    serializer_name = f"{serializer.__module__}.{serializer.__name__}"
    message = {
        "type:": "notify",
        "instance": {"model": model_name, "id": id},
        "serializer": serializer_name,
        "inner_type": type_,
    }
    channel_layer = get_channel_layer()
    if not await message_exists(channel_layer, message):
        await set_message_exists(channel_layer, message)
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
    from .serializers import JobSerializer
    from .models import Job

    if job.status == Job.Status.complete:
        type_ = "JOB_COMPLETED"
    elif job.status == Job.Status.failed:
        type_ = "JOB_FAILED"
    elif job.status == Job.Status.canceled:
        type_ = "JOB_CANCELED"
    await push_serializable(job, JobSerializer, type_)


async def notify_org_result_changed(result):
    from .serializers import OrgSerializer
    from .models import Job, PreflightResult

    type_ = "ORG_CHANGED"
    org_url = result.organization_url

    current_job = Job.objects.filter(
        organization_url=org_url, status=Job.Status.started
    ).first()
    current_preflight = PreflightResult.objects.filter(
        organization_url=org_url, status=PreflightResult.Status.started
    ).first()
    serializer = OrgSerializer(
        {"current_job": current_job, "current_preflight": current_preflight}
    )
    message = {"type": "notify", "content": {"type": type_, "payload": serializer.data}}
    group_name = CHANNELS_GROUP_NAME.format(
        model="org", id=convert_org_url_to_key(org_url)
    )
    channel_layer = get_channel_layer()
    if not await message_exists(channel_layer, message):
        await set_message_exists(channel_layer, message)
        await channel_layer.group_send(group_name, message)
