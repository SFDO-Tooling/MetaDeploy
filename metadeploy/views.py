from django.shortcuts import render

from metadeploy.multisalesforce.views import SalesforcePermissionsError


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
