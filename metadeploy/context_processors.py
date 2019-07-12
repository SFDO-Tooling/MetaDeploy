from datetime import datetime

from django.conf import settings
from django.contrib.sites.shortcuts import get_current_site

from metadeploy.api.serializers import SiteSerializer


def env(request):
    site_profile = SiteSerializer(
        getattr(get_current_site(request), "siteprofile", None)
    )
    GLOBALS = {
        "PREFLIGHT_LIFETIME_MINUTES": settings.PREFLIGHT_LIFETIME_MINUTES,
        "TOKEN_LIFETIME_MINUTES": settings.TOKEN_LIFETIME_MINUTES,
        "SITE": site_profile.data,
        "YEAR": datetime.utcnow().year,
        "SENTRY_DSN": settings.SENTRY_DSN,
    }
    return {"GLOBALS": GLOBALS}
