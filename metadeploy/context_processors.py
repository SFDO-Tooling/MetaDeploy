from django.conf import settings
from django.contrib.sites.shortcuts import get_current_site
from raven.contrib.django.raven_compat.models import client

from metadeploy.api.serializers import SiteSerializer


def env(request):
    site_profile = SiteSerializer(
        getattr(get_current_site(request), "siteprofile", None)
    )
    GLOBALS = {
        "PREFLIGHT_LIFETIME_MINUTES": settings.PREFLIGHT_LIFETIME_MINUTES,
        "TOKEN_LIFETIME_MINUTES": settings.TOKEN_LIFETIME_MINUTES,
        "SITE": site_profile.data,
    }
    if settings.SENTRY_DSN:
        GLOBALS["SENTRY_DSN_PUBLIC"] = client.get_public_dsn(scheme="https")
    return {"GLOBALS": GLOBALS}
