from django.conf import settings
from django.contrib.sites.models import Site
from django.core.cache import cache
from django.http import Http404

from . import override_current_site_id

ADMIN_PREFIX = f"/{settings.ADMIN_AREA_PREFIX}/".replace("//", "/")


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
            domain = request.get_host().lower()
            cache_key = f"SITE_ID:{domain}"
            site_id = cache.get(cache_key)
            if not site_id:
                try:
                    site = Site.objects.get(domain__iexact=domain)
                except Site.DoesNotExist:
                    msg = f"{request.get_host()} doesn't match any known sites"
                    if settings.DEBUG:  # pragma: nocover
                        sites = ", ".join(Site.objects.values_list("domain", flat=True))
                        msg = f"{msg}. Known sites are: {sites}."
                    raise Http404(msg)
                site_id = site.id
                cache.set(cache_key, site_id)

        with override_current_site_id(site_id):
            request.site_id = site_id
            return self.get_response(request)
