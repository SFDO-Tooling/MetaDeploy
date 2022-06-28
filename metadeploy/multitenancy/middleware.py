from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.conf import settings
from django.contrib.sites.models import Site
from django.core.cache import cache
from django.http import Http404

from . import override_current_site_id

ADMIN_PREFIX = f"/{settings.ADMIN_AREA_PREFIX}/".replace("//", "/")


def site_id_for_host(host: str) -> int:
    """
    Fetch the Site ID for `host` (with caching)
    """
    host = host.lower()
    cache_key = f"SITE_ID:{host}"
    site_id = cache.get(cache_key)
    if not site_id:
        site = Site.objects.get(domain__iexact=host)
        site_id = site.id
        cache.set(cache_key, site_id)
    return site_id


async_site_id_for_host = database_sync_to_async(site_id_for_host)


class CurrentSiteMiddleware:
    """
    Try to determine the Site for the current request using the following methods in
    order:

      - `site_id` in session. Used ONLY in the admin so that staff users can switch
        sites and stay on the same domain. Ensure this middleware is listed after
        `SessionMiddleware` so it can read `request.session`.
      - The id of the Site object corresponding to the hostname in the current request.
        This result is cached.

    The site ID is stored on the request so it remains accessible to templates and
    views. If the  host doesn't match any Site instances, Http404 is raised.
    """

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        site_id = None
        is_admin = request.path.startswith(ADMIN_PREFIX)
        is_admin_rest = request.path.startswith(f"{ADMIN_PREFIX}rest/")
        if is_admin and not is_admin_rest:
            site_id = request.session.get("site_id", None)

        if not site_id:
            host = request.get_host()
            try:
                site_id = site_id_for_host(host)
            except Site.DoesNotExist:
                msg = f"{host} doesn't match any known sites"
                if settings.DEBUG:  # pragma: nocover
                    sites = ", ".join(Site.objects.values_list("domain", flat=True))
                    msg = f"{msg}. Known sites are: {sites}."
                raise Http404(msg)

        with override_current_site_id(site_id):
            request.site_id = site_id
            return self.get_response(request)


class ChannelsCurrentSiteMiddleware(BaseMiddleware):
    """
    Add the ID for the current Site to the Channels scope
    """

    async def __call__(self, scope, receive, send):
        scope = dict(scope)
        headers = dict(scope["headers"])
        host = headers.get(b"host", b"").decode()
        try:
            scope["site_id"] = await async_site_id_for_host(host)
        except Site.DoesNotExist:
            pass

        return await super().__call__(scope, receive, send)
