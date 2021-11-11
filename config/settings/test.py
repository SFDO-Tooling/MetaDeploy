from .base import *  # NOQA

CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "metadeploy.tests.layer_utils.MockedRedisInMemoryChannelLayer"
    }
}
ADMIN_API_ALLOWED_SUBNETS = ipv4_networks("127.0.0.1/32")  # NOQA

HEROKU_TOKEN = "abcdefg1234567"
HEROKU_APP_NAME = "test_heroku_app_name"
