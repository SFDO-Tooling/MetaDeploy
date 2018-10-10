from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


def push_message_to_user(user, json_message):
    user_id = user.id
    channel_layer = get_channel_layer()
    sync_group_send = async_to_sync(channel_layer.group_send)
    sync_group_send(f'user-{user_id}', {
        'type': 'notify',
        'content': json_message,
    })
