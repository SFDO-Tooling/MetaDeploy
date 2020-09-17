from datetime import datetime

from django.conf import settings
from django.contrib.sites.shortcuts import get_current_site
from django.utils.translation import get_language

from metadeploy.api.serializers import SiteSerializer


def env(request):
    site_profile = getattr(get_current_site(request), "siteprofile", None)
    if site_profile:
        site_profile.set_current_language(get_language())
    site_serializer = SiteSerializer(site_profile)
    GLOBALS = {
        "PREFLIGHT_LIFETIME_MINUTES": settings.PREFLIGHT_LIFETIME_MINUTES,
        "TOKEN_LIFETIME_MINUTES": settings.TOKEN_LIFETIME_MINUTES,
        "SITE": site_serializer.data,
        "YEAR": datetime.utcnow().year,
        "SENTRY_DSN": settings.SENTRY_DSN,
        "DEVHUB_USERNAME": bool(settings.DEVHUB_USERNAME),
    }
    return {"GLOBALS": GLOBALS}
