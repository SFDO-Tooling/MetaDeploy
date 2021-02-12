import sys
from django.shortcuts import render

from sfdo_template_helpers.oauth2.salesforce.views import SalesforcePermissionsError

from config.settings.base import IPS_TO_ALLOWLIST

GENERIC_ERROR_MSG = "An internal error occurred while processing your request."

IP_RESTRICTED_MSG = (
    "Unable to access this org because your user has IP Login Ranges that block access."
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
        message = IP_RESTRICTED_MSG
        if IPS_TO_ALLOWLIST:
            message += (
                " Please ensure that the following IP addresses are "
                f"included in the IP Login Ranges for you user's Profile: {IPS_TO_ALLOWLIST}"
            )

    return render(
        request,
        "index.html",
        context={"JS_CONTEXT": {"error_message": message}},
        status=500,
    )
