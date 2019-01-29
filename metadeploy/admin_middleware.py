from ipaddress import IPv4Address

from django.conf import settings
from django.core.exceptions import SuspiciousOperation

from metadeploy.utils import get_client_ip


class AdminRestrictMiddleware:
    """
    A middleware that restricts all access to the admin prefix to allowed IPs.
    """

    def __init__(self, get_response):
        self.get_response = get_response
        self.ip_ranges = settings.ADMIN_API_ALLOWED_SUBNETS

    def __call__(self, request):
        if request.path.startswith(f"/{settings.ADMIN_AREA_PREFIX}"):
            self._validate_ip(request)

        return self.get_response(request)

    def _validate_ip(self, request):
        ip_str, _ = get_client_ip(request)
        ip_addr = IPv4Address(ip_str)

        if not any(ip_addr in subnet for subnet in self.ip_ranges):
            raise SuspiciousOperation(f"Disallowed IP address: {ip_addr}")
