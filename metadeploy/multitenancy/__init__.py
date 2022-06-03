import os
from contextlib import contextmanager
from threading import local
from typing import Optional

from django.conf import settings
from django.contrib.sites.models import Site
from django.core.cache import cache
from django.http import Http404, HttpRequest

state = local()


@contextmanager
def override_current_site_id(site_id: int):
    """
    Allow filtering for objects on other sites
    """
    previous = getattr(state, "site_id", None)
    state.site_id_override = site_id
    try:
        yield
    finally:
        state.site_id_override = previous


@contextmanager
def disable_site_filtering():
    """
    Escape hatch context manager to disable site filtering altogether
    """
    state.site_filtering_enabled = False
    try:
        yield
    finally:
        state.site_filtering_enabled = True


def site_filtering_enabled() -> bool:
    """
    Determine if site filtering is enabled by both env vars and context manager
    """
    env_disabled = os.environ.get("DJANGO_SITE_FILTERING_DISABLED", False)
    state_enabled = getattr(state, "site_filtering_enabled", True)
    return not env_disabled and state_enabled


def current_request() -> Optional[HttpRequest]:
    """
    Get the request associated with the current thread
    """
    return getattr(state, "request", None)


def current_site_id() -> int:
    """
    Responsible for determining the current `Site` instance to use when retrieving data
    for any `SiteRelated` models. If we're inside an `override_current_site_id` context
    manager, return the overriding site ID. Otherwise, try to determine the site using
    the following methods in order:

      - `site_id` in session. Used in the admin so that admin users can switch sites and
        stay on the same domain for the admin.
      - The id of the Site object corresponding to the hostname in the current request.
        This result is cached.
      - `DJANGO_SITE_ID` environment variable, so management commands or anything else
        outside of a request can specify a site.
      - `SITE_ID` setting.

    If a current request exists and the current site is not overridden, the site ID is
    stored on the request object to speed up subsequent calls. If we are inside a
    request and the host doesn't match any Site instances, Http404 is raised.
    """

    if getattr(state, "site_id_override", None) is not None:
        return state.site_id_override

    request = current_request()
    site_id = getattr(request, "site_id", None)
    if request and not site_id:
        if request.path.startswith(settings.ADMIN_AREA_PREFIX):
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
                    if settings.DEBUG:
                        sites = ", ".join(Site.objects.values_list("domain", flat=True))
                        msg = f"{msg}. Known sites are: {sites}."
                    raise Http404(msg)
                site_id = site.id
                cache.set(cache_key, site_id)
    if not site_id:
        site_id = int(os.environ.get("DJANGO_SITE_ID", settings.SITE_ID))
    if request and site_id:
        request.site_id = site_id
    return site_id
