import pytest
from requests import exceptions

from ..adapter import CustomSocialAccountAdapter


def test_authentication_error_logs(mocker):
    mocker.patch(
        "allauth.socialaccount.adapter.DefaultSocialAccountAdapter.authentication_error"
    )  # noqa
    error = mocker.patch("metadeploy.multisalesforce.adapter.logger.error")
    adapter = CustomSocialAccountAdapter()

    with pytest.raises(exceptions.ConnectionError):
        adapter.authentication_error(exception=exceptions.ConnectionError)

    assert error.called
