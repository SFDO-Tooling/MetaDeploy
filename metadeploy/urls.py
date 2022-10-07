"""MetaDeploy URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.11/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.conf.urls import url, include
    2. Add a URL to urlpatterns:  url(r'^blog/', include('blog.urls'))
"""
from urllib.parse import urljoin

from django.conf import settings
from django.contrib import admin
from django.urls import include, path, re_path
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.generic import TemplateView

from . import views
from .routing import websockets

ADMIN_URL = settings.ADMIN_URL
TENANT_AREA_PREFIX = settings.TENANT_AREA_PREFIX

# Custom error views
handler403 = "metadeploy.views.custom_permission_denied_view"
handler500 = "metadeploy.views.custom_500_view"


urlpatterns = [
    # TENANT_AREA_PREFIX is accessible to Tenant Admins
    path(
        urljoin(TENANT_AREA_PREFIX, r"rest/"),
        include("metadeploy.adminapi.urls", namespace="admin_rest"),
    ),
    # Everything under ADMIN_URL is only accessible to super users
    path(urljoin(ADMIN_URL, r"django-rq/"), include("django_rq.urls")),
    path(ADMIN_URL, admin.site.urls),
    path("set-site/", views.set_site, name="set_site"),
    path("accounts/", include("allauth.urls")),
    path("api/", include("metadeploy.api.urls")),
    # These paths render the frontend SPA
    # Ensure the CSRF token is always present via a cookie to be read by JS
    re_path(
        r"^products",
        ensure_csrf_cookie(TemplateView.as_view(template_name="index.html")),
        name="frontend",
    ),
    path(
        "",
        ensure_csrf_cookie(TemplateView.as_view(template_name="index.html")),
        name="home",
    ),
    # Add WebSocket routes so that non-HTTP paths can be accessible by
    # `reverse` in Python and `window.api_urls` in JavaScript. These will
    # usually only be the path component, not a full URL, and so the caller
    # will have to build them with the right scheme and authority sections.
] + websockets.routes

if "binary_database_files" in settings.INSTALLED_APPS:  # pragma: no cover
    from binary_database_files.views import serve_mixed

    urlpatterns += [re_path(r"^files/(?P<name>.+)$", serve_mixed, name="database_file")]
