from django.shortcuts import render
from sfdo_template_helpers.oauth2.salesforce.views import SalesforcePermissionsError


def custom_permission_denied_view(request, exception):
    if isinstance(exception, SalesforcePermissionsError):
        message = str(exception)
    else:
        message = "An internal error occurred while processing your request."

    return render(
        request,
        "index.html",
        context={"JS_CONTEXT": {"error_message": message}},
        status=403,
    )
