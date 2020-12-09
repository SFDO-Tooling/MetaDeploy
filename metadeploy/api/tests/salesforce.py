from contextlib import ExitStack
from unittest.mock import MagicMock, patch

import pytest
from django.core.exceptions import ImproperlyConfigured
from django.test import override_settings
from requests.exceptions import HTTPError

from ..salesforce import (
    ScratchOrgError,
    _get_devhub_api,
    delete_scratch_org,
    refresh_access_token,
)


class TestGetDevhubApi:
    @override_settings(DEVHUB_USERNAME=None)
    def test_no_devhub_username(self):
        with pytest.raises(ImproperlyConfigured):
            _get_devhub_api()

    @override_settings(DEVHUB_USERNAME="test@example.com")
    def test_bad(self):
        with ExitStack() as stack:
            jwt_session = stack.enter_context(
                patch("metadeploy.api.salesforce.jwt_session")
            )
            jwt_session.side_effect = HTTPError(
                "Error message.", response=MagicMock(status_code=400)
            )

            scratch_org = MagicMock()
            with pytest.raises(ScratchOrgError, match=".*org still exists*"):
                _get_devhub_api(scratch_org=scratch_org)

            assert scratch_org.delete.called


class TestRefreshAccessToken:
    def test_good(self):
        with ExitStack() as stack:
            OrgConfig = stack.enter_context(
                patch("metadeploy.api.salesforce.OrgConfig")
            )

            refresh_access_token(
                scratch_org=MagicMock(),
                config=MagicMock(),
                org_name=MagicMock(),
            )

            assert OrgConfig.called

    def test_bad(self):
        with ExitStack() as stack:
            get_current_job = stack.enter_context(
                patch("metadeploy.api.salesforce.get_current_job")
            )
            get_current_job.return_value = MagicMock(id=123)
            OrgConfig = stack.enter_context(
                patch("metadeploy.api.salesforce.OrgConfig")
            )
            OrgConfig.side_effect = HTTPError(
                "Error message.", response=MagicMock(status_code=400)
            )

            scratch_org = MagicMock()
            with pytest.raises(ScratchOrgError, match=".*job ID.*"):
                refresh_access_token(
                    scratch_org=scratch_org,
                    config=MagicMock(),
                    org_name=MagicMock(),
                )

            assert scratch_org.delete.called


@pytest.mark.django_db
def test_delete_org(scratch_org_factory):
    scratch_org = scratch_org_factory(config={"org_id": "some-id"})
    with ExitStack() as stack:
        devhub_api = MagicMock()
        _get_devhub_api = stack.enter_context(
            patch("metadeploy.api.salesforce._get_devhub_api")
        )
        _get_devhub_api.return_value = devhub_api
        devhub_api.query.return_value = {"records": [{"Id": "some-id"}]}

        delete_scratch_org(scratch_org)

        assert devhub_api.ActiveScratchOrg.delete.called
