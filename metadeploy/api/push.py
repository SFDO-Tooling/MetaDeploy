from channels.layers import get_channel_layer


async def push_message_to_user(user, json_message):
    user_id = user.id
    channel_layer = get_channel_layer()
    await channel_layer.group_send(f'user-{user_id}', {
        'type': 'notify',
        'content': json_message,
    })


async def user_token_expired(user):
    message = {
        'type': 'USER_TOKEN_INVALID',
    }
    await push_message_to_user(user, message)


async def preflight_completed(preflight):
    from .serializers import PreflightResultSerializer

    payload = PreflightResultSerializer(instance=preflight).data
    message = {
        'type': 'PREFLIGHT_COMPLETED',
        'payload': payload,
    }
    await push_message_to_user(preflight.user, message)


async def preflight_invalidated(preflight):
    from .serializers import PreflightResultSerializer

    payload = PreflightResultSerializer(instance=preflight).data
    message = {
        'type': 'PREFLIGHT_INVALIDATED',
        'payload': payload,
    }
    await push_message_to_user(preflight.user, message)


async def report_error(user, error_msg):
    message = {
        'type': 'BACKEND_ERROR',
        'payload': {'message': error_msg},
    }
    await push_message_to_user(user, message)
