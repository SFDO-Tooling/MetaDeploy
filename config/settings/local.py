from .base import *  # NOQA
from .base import env


# Default token expiration to 1 hr
TOKEN_LIFETIME_MINUTES = env('TOKEN_LIFETIME_MINUTES', type_=int, default=60)
PREFLIGHT_LIFETIME_MINUTES = env(
    'PREFLIGHT_LIFETIME_MINUTES',
    type_=int,
    default=60,
)
