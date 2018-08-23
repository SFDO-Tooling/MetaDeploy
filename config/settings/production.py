from .base import *  # NOQA

#STATICFILES_DIRS = [
#    str(PROJECT_ROOT / 'dist'),
#]
#STATIC_URL = '/static/'
#STATIC_ROOT = str(PROJECT_ROOT / 'staticfiles')

static_dir_root = 'static/dist/min'

WHITENOISE_ROOT = PROJECT_ROOT.joinpath(static_dir_root)
