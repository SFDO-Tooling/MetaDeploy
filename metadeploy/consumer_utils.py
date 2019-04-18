"""
We presume that Channels is operating over a Redis channel_layer here, and use it
explicitly.
"""

from base64 import b64encode
from json import dumps


def message_to_hash(message):
    message_hash = b64encode(dumps(message).encode("utf-8"))
    return b"semaphore:" + message_hash


async def message_exists(channel_layer, message):
    msg_hash = message_to_hash(message)
    async with channel_layer.connection(0) as connection:
        return await connection.exists(msg_hash)


async def set_message_exists(channel_layer, message):
    msg_hash = message_to_hash(message)
    async with channel_layer.connection(0) as connection:
        return await connection.set(msg_hash, 1)


async def del_message_exists(channel_layer, message):
    msg_hash = message_to_hash(message)
    async with channel_layer.connection(0) as connection:
        return await connection.delete(msg_hash)
