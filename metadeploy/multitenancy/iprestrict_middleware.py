from metadeploy.api.models import SiteProfile
from . import current_site_id
from django.conf import settings
from django.http import HttpResponseForbidden

ADMIN_URL = f"/{settings.ADMIN_URL}/".replace("//", "/")


class IPRestrictMiddleware:
    def getSiteProfile(self):
        profile = SiteProfile.objects.filter(site=current_site_id()).first()
        return profile

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        client_ip = request.META.get('REMOTE_ADDR', None)
        profile = self.getSiteProfile()
        is_admin_url = request.path.startswith(ADMIN_URL)

        if not is_admin_url and hasattr(profile, "allowed_ip_addresses") and profile.allowed_ip_addresses:
            if client_ip not in profile.allowed_ip_addresses:
                return HttpResponseForbidden("You don't have permission to access this resource.")

        response = self.get_response(request)
        return response
