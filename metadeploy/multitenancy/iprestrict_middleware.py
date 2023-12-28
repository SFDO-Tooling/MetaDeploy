from ipaddress import ip_network, ip_address
from django.conf import settings
from django.http import HttpResponseForbidden
from metadeploy.api.models import SiteProfile
from . import current_site_id

ADMIN_URL = f"/{settings.ADMIN_URL}/".replace("//", "/")


class IPRestrictMiddleware:
    def get_site_profile(self):
        profile = SiteProfile.objects.filter(site=current_site_id()).first()
        return profile

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        client_ip = request.META.get('REMOTE_ADDR', None)
        profile = self.get_site_profile()
        is_admin_url = request.path.startswith(ADMIN_URL)
        has_ip_allowlist = (
            hasattr(profile, "allowed_ip_addresses") and profile.allowed_ip_addresses
        )
        should_filter = not is_admin_url and has_ip_allowlist

        if should_filter and not self.validate_ip(client_ip, profile.allowed_ip_addresses):
            return HttpResponseForbidden(
                "You don't have permission to access this resource."
            )

        response = self.get_response(request)
        return response

    def validate_ip(self, target_ip, allowed_ips):
        target_ip_obj = ip_address(target_ip)
        for allowed_ip in allowed_ips:
            try:
                allowed_ip_obj = ip_network(allowed_ip, strict=False)
                if target_ip_obj in allowed_ip_obj:
                    return True
            except ValueError:
                continue
        return False
