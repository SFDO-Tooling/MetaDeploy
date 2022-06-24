from .base import *  # NOQA

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "metadeploy.tests.layer_utils.MockedRedisInMemoryChannelLayer"
    }
}

HEROKU_TOKEN = "abcdefg1234567"
HEROKU_APP_NAME = "test_heroku_app_name"
