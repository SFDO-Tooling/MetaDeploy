from django.http import HttpResponse

from metadeploy.multisalesforce.views import SalesforcePermissionsError


def custom_server_error_view(request):
    error = ""
    if isinstance(error, SalesforcePermissionsError):
        return HttpResponse("<show exception message here>")
    else:
        # TODO: Should this be translatable?
        return HttpResponse("An internal error occurred while processing your request.")
