from django.shortcuts import render

from metadeploy.multisalesforce.views import SalesforcePermissionsError


def custom_permission_denied_view(request, exception):
    if isinstance(exception, SalesforcePermissionsError):
        message = exception
    else:
        message = "An internal error occurred while processing your request."

    return render(request, "auth_error.html", context={"error_message": message})
