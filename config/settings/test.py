from .base import *  # NOQA

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "metadeploy.tests.layer_utils.MockedRedisInMemoryChannelLayer"
    }
}
