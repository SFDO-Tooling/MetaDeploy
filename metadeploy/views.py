import sys
from django.shortcuts import render

from allauth.socialaccount.providers.oauth2.client import OAuth2Error
from sfdo_template_helpers.oauth2.salesforce.views import SalesforcePermissionsError

from config.settings.base import IPS_TO_WHITELIST

GENERIC_ERROR_MSG = "An internal error occurred while processing your request."

IP_RESTRICTED_MSG = (
    "We've detected that your user has login IP ranges in place. "
    "Please ensure that the following IP addresses are whitelisted in the org you're attempting to login to: {}"
)


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
    error_type, value, traceback = sys.exc_info()

    if "ip restricted" in value.args[0]:
        message = IP_RESTRICTED_MSG.format(IPS_TO_WHITELIST)

    return render(
        request,
        "index.html",
        context={"JS_CONTEXT": {"error_message": message}},
        status=500,
    )
