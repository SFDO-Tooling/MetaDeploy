import pytest
from django.contrib.sites.shortcuts import get_current_site
from django.test import override_settings

from ..api.models import SiteProfile
from ..context_processors import env


@pytest.mark.django_db
@override_settings(SENTRY_DSN="https://example.com")
def test_env(rf):
    request = rf.get("/")
    site_profile = SiteProfile(site_id=1)
    site_profile.save()
    site = get_current_site(request)
    site.siteprofile = site_profile
    result = env(request)

    assert "GLOBALS" in result
    assert "SENTRY_DSN" in result["GLOBALS"]
    assert "SITE" in result["GLOBALS"]
