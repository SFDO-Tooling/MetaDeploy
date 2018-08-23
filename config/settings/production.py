from .base import *  # NOQA

STATICFILES_DIRS = [
    str(PROJECT_ROOT / 'dist/prod'),
]

static_dir_root = 'dist/prod'

WHITENOISE_ROOT = PROJECT_ROOT.joinpath(static_dir_root)
