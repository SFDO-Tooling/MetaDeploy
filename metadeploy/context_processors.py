from django.conf import settings
from raven.contrib.django.raven_compat.models import client


def env(request):
    GLOBALS = {"PREFLIGHT_LIFETIME_MINUTES": settings.PREFLIGHT_LIFETIME_MINUTES}
    if settings.SENTRY_DSN:
        GLOBALS["SENTRY_DSN_PUBLIC"] = client.get_public_dsn(scheme="https")
    return {"GLOBALS": GLOBALS}
