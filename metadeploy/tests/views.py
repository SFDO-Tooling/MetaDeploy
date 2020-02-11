import pytest
from django.test import RequestFactory

from ..multisalesforce.views import SalesforcePermissionsError
from ..views import custom_permission_denied_view


@pytest.mark.django_db
def test_custom_permission_denied_view__sf_permissions():
    request = RequestFactory()
    exc = SalesforcePermissionsError("I'm sorry Dave.")
    response = custom_permission_denied_view(request, exc)

    assert response.status_code == 403
    assert rb"I'm sorry Dave." in response.content


@pytest.mark.django_db
def test_custom_permission_denied_view__unknown_error():
    request = RequestFactory()
    exc = Exception("I'm sorry Dave.")
    response = custom_permission_denied_view(request, exc)

    assert response.status_code == 403
    assert (
        b"An internal error occurred while processing your request." in response.content
    )
