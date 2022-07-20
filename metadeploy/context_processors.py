from datetime import datetime

from django.conf import settings
from django.utils.translation import get_language

from metadeploy.api.models import SiteProfile
from metadeploy.api.serializers import SiteSerializer


def env(request):
    site_profile = SiteProfile.objects.filter(site_id=request.site_id).first()
    if site_profile:
        site_profile.set_current_language(get_language())
        site_profile.refresh_from_db()
    site_serializer = SiteSerializer(site_profile)
    GLOBALS = {
        "PREFLIGHT_LIFETIME_MINUTES": settings.PREFLIGHT_LIFETIME_MINUTES,
        "TOKEN_LIFETIME_MINUTES": settings.TOKEN_LIFETIME_MINUTES,
        "SITE": site_serializer.data,
        "YEAR": datetime.utcnow().year,
        "SENTRY_DSN": settings.SENTRY_DSN,
        "SCRATCH_ORGS_AVAILABLE": bool(settings.DEVHUB_USERNAME),
    }
    return {"GLOBALS": GLOBALS}
