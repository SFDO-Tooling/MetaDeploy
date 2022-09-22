import sys

from django.conf import settings
from django.contrib.auth.decorators import user_passes_test
from django.contrib.sites.models import Site
from django.http import Http404
from django.shortcuts import redirect, render
from django.urls import reverse, reverse_lazy
from django.utils.http import url_has_allowed_host_and_scheme
from sfdo_template_helpers.oauth2.salesforce.views import SalesforcePermissionsError

from config.settings.base import IP_RESTRICTED_MESSAGE

GENERIC_ERROR_MSG = "An internal error occurred while processing your request."


def custom_permission_denied_view(request, exception):
    message = GENERIC_ERROR_MSG
    if isinstance(exception, SalesforcePermissionsError):
        message = str(exception)

    return render(
        request,
        "index.html",
        context={"JS_CONTEXT": {"error_message": message}},
        status=403,
    )


def custom_500_view(request):
    message = GENERIC_ERROR_MSG
    value = sys.exc_info()[1]

    if "ip restricted" in value.args[0]:
        message = IP_RESTRICTED_MESSAGE

    return render(
        request,
        "index.html",
        context={"JS_CONTEXT": {"error_message": message}},
        status=500,
    )


@user_passes_test(lambda user: user.is_superuser, login_url=reverse_lazy("admin:login"))
def set_site(request):
    """
    Put the selected `site_id` into the session. The ID is then used in favor of the
    current request's domain in `CurrentSiteMiddleware`.
    """
    next_url = request.GET.get("next", "")
    try:
        site = Site.objects.get(pk=request.GET.get("site_id"))
    except (Site.DoesNotExist, ValueError):
        raise Http404("Couldn't find a matching site")
    request.session["site_id"] = site.id

    # Ensure the URL is safe
    if not url_has_allowed_host_and_scheme(next_url, settings.ALLOWED_HOSTS):
        next_url = reverse("admin:index")

    # Don't redirect to a change view for an object that won't exist on the selected
    # site - go to its list view instead
    if next_url.endswith("/change/"):
        # Remove the ID, "/change/" suffix, and trailing slash
        parts = next_url.split("/")[:-3]
        next_url = "/".join(parts) + "/"

    return redirect(next_url)
