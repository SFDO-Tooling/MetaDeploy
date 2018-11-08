"""
Websocket notifications you can subscribe to:

    user-:id
        USER_TOKEN_INVALID
        BACKEND_ERROR
    preflightrequest-:id
        PREFLIGHT_COMPLETED
        PREFLIGHT_FAILED
        PREFLIGHT_INVALIDATED
    job-:id
        TASK_COMPLETED
"""


from channels.layers import get_channel_layer


async def push_message_about_instance(instance, json_message):
    model_name = instance.__class__.__name__.lower()
    id = str(instance.id)
    group_name = f"{model_name}-{id}"
    channel_layer = get_channel_layer()
    await channel_layer.group_send(group_name, {
        'type': 'notify',
        'content': json_message,
    })


async def user_token_expired(user):
    message = {
        'type': 'USER_TOKEN_INVALID',
    }
    await push_message_about_instance(user, message)


async def preflight_completed(preflight):
    from .serializers import PreflightResultSerializer

    payload = PreflightResultSerializer(instance=preflight).data
    message = {
        'type': 'PREFLIGHT_COMPLETED',
        'payload': payload,
    }
    await push_message_about_instance(preflight, message)


async def preflight_failed(preflight):
    from .serializers import PreflightResultSerializer

    payload = PreflightResultSerializer(instance=preflight).data
    message = {
        'type': 'PREFLIGHT_FAILED',
        'payload': payload,
    }
    await push_message_about_instance(preflight, message)


async def preflight_invalidated(preflight):
    from .serializers import PreflightResultSerializer

    payload = PreflightResultSerializer(instance=preflight).data
    message = {
        'type': 'PREFLIGHT_INVALIDATED',
        'payload': payload,
    }
    await push_message_about_instance(preflight, message)


async def report_error(user):
    message = {
        'type': 'BACKEND_ERROR',
        # We don't pass the message through to the frontend in case it
        # contains sensitive material:
        'payload': {'message': 'There was an error'},
    }
    await push_message_about_instance(user, message)


async def notify_post_task(job):
    from .serializers import JobSerializer

    if not job.completed_steps:
        return

    task_name = job.completed_steps[-1]

    payload = {
        'task_name': task_name,
        'job': JobSerializer(instance=job).data,
    }
    message = {
        'type': 'TASK_COMPLETED',
        'payload': payload,
    }
    await push_message_about_instance(job, message)
