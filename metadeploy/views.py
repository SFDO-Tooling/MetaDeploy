import sys

from django.shortcuts import render
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
