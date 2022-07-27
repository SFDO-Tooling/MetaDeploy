from .base import *  # NOQA
from .base import env

# Default token expiration to 1 hr
TOKEN_LIFETIME_MINUTES = env.int("TOKEN_LIFETIME_MINUTES", default=60)
PREFLIGHT_LIFETIME_MINUTES = env.int("PREFLIGHT_LIFETIME_MINUTES", default=60)

INSTALLED_APPS = INSTALLED_APPS + ["django_extensions"]  # NOQA

# DEFAULT_FILE_STORAGE = "metadeploy.redis_storage.RedisStorage"

# REDIS_STORAGE_CONFIG = {"USE_REDIS_CACHE": "default"}

METADEPLOY_FAST_FORWARD = env.bool("METADEPLOY_FAST_FORWARD", default=False)
