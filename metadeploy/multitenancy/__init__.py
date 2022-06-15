import os
from contextlib import contextmanager
from threading import local

from django.conf import settings

state = local()


@contextmanager
def override_current_site_id(site_id: int):
    """
    Allow filtering for objects on other sites
    """
    previous = getattr(state, "site_id_override", None)
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


def current_site_id() -> int:
    """
    Responsible for determining the current `Site` instance to use when retrieving data
    for models that use `CurrentSiteManager`. If we're inside an
    `override_current_site_id` context manager (most likely while serving a request),
    return the overriding site ID. Otherwise, try to determine the site using the
    following methods in order:

      - `DJANGO_SITE_ID` environment variable, so management commands or anything else
        outside of a request can specify a site.
      - `SITE_ID` setting.
    """

    if getattr(state, "site_id_override", None) is not None:
        return state.site_id_override
    return int(os.environ.get("DJANGO_SITE_ID", settings.SITE_ID))
