from .base import *  # NOQA

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "metadeploy.tests.layer_utils.MockedRedisInMemoryChannelLayer"
    }
}
ADMIN_API_ALLOWED_SUBNETS = ipv4_networks("127.0.0.1/32")  # NOQA
