from .base import *  # NOQA
from .base import env

# Default token expiration to 1 hr
TOKEN_LIFETIME_MINUTES = env("TOKEN_LIFETIME_MINUTES", type_=int, default=60)
PREFLIGHT_LIFETIME_MINUTES = env("PREFLIGHT_LIFETIME_MINUTES", type_=int, default=60)

INSTALLED_APPS = INSTALLED_APPS + ["django_extensions"]  # NOQA

# DEFAULT_FILE_STORAGE = "metadeploy.redis_storage.RedisStorage"

# REDIS_STORAGE_CONFIG = {"USE_REDIS_CACHE": "default"}

METADEPLOY_FAST_FORWARD = env("METADEPLOY_FAST_FORWARD", type_=bool, default=False)
PREFLIGHT_LIFETIME_MINUTES = 1
