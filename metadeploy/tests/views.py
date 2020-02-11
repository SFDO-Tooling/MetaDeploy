from unittest import mock

import pytest
from django.test import RequestFactory

from ..multisalesforce.views import SalesforcePermissionsError
from ..views import custom_permission_denied_view


@pytest.mark.django_db
@mock.patch("metadeploy.views.render")
def test_custom_permission_denied_view__sf_permissions(render):
    request = RequestFactory()
    exc = SalesforcePermissionsError("I'm sorry Dave.")
    custom_permission_denied_view(request, exc)

    assert (
        render.call_args[1]["context"]["JS_CONTEXT"]["error_message"]
        == "I'm sorry Dave."
    )


@pytest.mark.django_db
@mock.patch("metadeploy.views.render")
def test_custom_permission_denied_view__unknown_error(render):
    request = RequestFactory()
    exc = Exception("I'm sorry Dave.")
    custom_permission_denied_view(request, exc)

    assert (
        render.call_args[1]["context"]["JS_CONTEXT"]["error_message"]
        == "An internal error occurred while processing your request."
    )
