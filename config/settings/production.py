from .base import (
    PROJECT_ROOT,
    TEMPLATES,
)

STATICFILES_DIRS = [
    str(PROJECT_ROOT / 'dist' / 'prod'),
]

TEMPLATES[0]['DIRS'] = [
    str(PROJECT_ROOT / 'dist' / 'prod'),
]
