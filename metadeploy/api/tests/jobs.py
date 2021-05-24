import json
from contextlib import ExitStack
from datetime import datetime, timedelta
from unittest.mock import MagicMock, patch

import pytest
import pytz
import vcr
from cumulusci.salesforce_api.exceptions import MetadataParseError
from django.utils import timezone
from django.utils.timezone import make_aware
from rq.worker import StopRequested
from asgiref.sync import sync_to_async

from metadeploy.api.belvedere_utils import convert_to_18

from ..flows import StopFlowException
from ..jobs import (
    create_scratch_org,
    delete_org_on_error,
    delete_scratch_org,
    enqueuer,
    expire_preflights,
    finalize_result,
    preflight,
    run_flows,
)
from ..models import Job, PreflightResult


@pytest.mark.django_db
def test_report_error(mocker, job_factory, user_factory, plan_factory, step_factory):
    mocker.patch("metadeploy.api.jobs.local_github_checkout", side_effect=Exception)
    report_error = mocker.patch("metadeploy.api.jobs.sync_report_error")

    user = user_factory()
    plan = plan_factory()
    step_factory(plan=plan)
    job = job_factory(user=user, plan=plan, org_id=user.org_id)

    with pytest.raises(Exception):
        run_flows(
            plan=plan,
            skip_steps=[],
            result_class=Job,
            result_id=job.id,
        )

    assert report_error.called
    job.refresh_from_db()
    assert job.status == Job.Status.failed


@pytest.mark.django_db
@vcr.use_cassette()
def test_run_flows(mocker, job_factory, user_factory, plan_factory, step_factory):
    run_flow = mocker.patch("cumulusci.core.flowrunner.FlowCoordinator.run")

    user = user_factory()
    plan = plan_factory()
    step_factory(plan=plan)
    job = job_factory(user=user, plan=plan, org_id=user.org_id)

    run_flows(
        plan=plan,
        skip_steps=[],
        result_class=Job,
        result_id=job.id,
    )

    assert run_flow.called


@pytest.mark.django_db
@vcr.use_cassette()
def test_run_flows__preflight(
    mocker, preflight_result_factory, user_factory, plan_factory, step_factory
):
    run_flow = mocker.patch("cumulusci.core.flowrunner.PreflightFlowCoordinator.run")

    user = user_factory()
    plan = plan_factory()
    step_factory(plan=plan)
    preflight_result = preflight_result_factory(
        user=user, plan=plan, org_id=user.org_id
    )

    run_flows(
        plan=plan,
        skip_steps=[],
        result_class=PreflightResult,
        result_id=preflight_result.id,
    )

    assert run_flow.called


@pytest.mark.django_db
def test_enqueuer(mocker, job_factory):
    delay = mocker.patch("metadeploy.api.jobs.run_flows_job.delay")
    # Just a random UUID:
    delay.return_value.id = "294fc6d2-0f3c-4877-b849-54184724b6b2"
    october_first = datetime(2018, 10, 1, 12, 0, 0, 0, pytz.UTC)
    delay.return_value.enqueued_at = october_first
    job = job_factory(org_id="00Dxxxxxxxxxxxxxxx")
    enqueuer()

    job.refresh_from_db()
    assert delay.called
    assert job.enqueued_at is not None
    assert job.job_id is not None


@pytest.mark.django_db
def test_preflight(mocker, user_factory, plan_factory, preflight_result_factory):
    run_flows = mocker.patch("metadeploy.api.jobs.run_flows")

    user = user_factory()
    plan = plan_factory()
    preflight_result = preflight_result_factory(
        user=user, plan=plan, org_id=user.org_id
    )
    preflight(preflight_result.pk)

    assert run_flows.called


@pytest.mark.django_db
def test_preflight_failure(
    mocker, user_factory, plan_factory, preflight_result_factory
):
    local_github_checkout = mocker.patch("metadeploy.api.jobs.local_github_checkout")
    local_github_checkout.side_effect = Exception

    user = user_factory()
    plan = plan_factory()
    preflight_result = preflight_result_factory(
        user=user, plan=plan, org_id=user.org_id
    )
    with pytest.raises(Exception):
        preflight(preflight_result.pk)

    preflight_result = PreflightResult.objects.last()
    assert preflight_result.status == PreflightResult.Status.failed


@pytest.mark.django_db
def test_expire_preflights(user_factory, plan_factory, preflight_result_factory):
    now = timezone.now()
    eleven_minutes_ago = now - timedelta(minutes=11)
    user = user_factory()
    plan = plan_factory()
    preflight1 = preflight_result_factory(
        user=user, plan=plan, status=PreflightResult.Status.complete, org_id=user.org_id
    )
    preflight2 = preflight_result_factory(
        user=user, plan=plan, status=PreflightResult.Status.started, org_id=user.org_id
    )
    PreflightResult.objects.filter(id__in=[preflight1.id, preflight2.id]).update(
        created_at=eleven_minutes_ago
    )
    preflight3 = preflight_result_factory(
        user=user, plan=plan, status=PreflightResult.Status.complete, org_id=user.org_id
    )

    expire_preflights()

    preflight1.refresh_from_db()
    preflight2.refresh_from_db()
    preflight3.refresh_from_db()

    assert not preflight1.is_valid
    assert preflight2.is_valid
    assert preflight3.is_valid


@pytest.mark.django_db
def test_delete_org_on_error(scratch_org_factory):
    scratch_org = scratch_org_factory(org_id="00Dxxxxxxxxxxxxxxx")
    try:
        with delete_org_on_error(scratch_org):
            raise Exception()
    except Exception:
        pass
    assert scratch_org.status == scratch_org.Status.failed


@pytest.mark.django_db
def test_finalize_result_worker_died(job_factory):
    """
    Why do we raise and then catch a StopRequested you might ask? Well, because it's
    what RQ will internally raise on a SIGTERM, so we're essentially faking the "I got a
    SIGTERM" behavior here. We catch it because we don't want it to actually propagate
    and kill the tests. But we do want the context manager's except block to be
    triggered, so we can test its behavior.
    """
    job = job_factory(org_id="00Dxxxxxxxxxxxxxxx")
    try:
        with finalize_result(job):
            raise StopRequested()
    except StopRequested:
        pass
    assert job.status == job.Status.canceled


@pytest.mark.django_db
def test_finalize_result_canceled_job(job_factory):
    # User-requested job cancellation.
    # Unlike cancelation due to the worker restarting,
    # this kind doesn't propagate the exception.
    job = job_factory(org_id="00Dxxxxxxxxxxxxxxx")
    with finalize_result(job):
        raise StopFlowException()
    assert job.status == job.Status.canceled


@pytest.mark.django_db
def test_finalize_result_preflight_worker_died(
    user_factory, plan_factory, preflight_result_factory
):
    user = user_factory()
    plan = plan_factory()
    preflight = preflight_result_factory(user=user, plan=plan, org_id=user.org_id)
    try:
        with finalize_result(preflight):
            raise StopRequested()
    except StopRequested:
        pass
    assert preflight.status == preflight.Status.canceled


@pytest.mark.django_db
def test_finalize_result_mdapi_error(job_factory):
    job = job_factory(org_id="00Dxxxxxxxxxxxxxxx")
    response = MagicMock(text="text")
    try:
        with finalize_result(job):
            raise MetadataParseError("MDAPI error", response=response)
    except MetadataParseError:
        pass
    assert job.status == job.Status.failed
    assert job.exception == "MDAPI error\ntext"


class MockDict(dict):
    namespaced = False

    @property
    def config(self):
        return self

    @property
    def instance_url(self):
        return self["instance_url"]

    @property
    def expires(self):
        return make_aware(datetime(2020, 11, 11))

    @property
    def org_id(self):
        return "0123456789abcef"


@pytest.mark.django_db
class TestDeleteScratchOrg:
    def test_delete_scratch_org(self, scratch_org_factory):
        scratch_org = scratch_org_factory()
        with patch(
            "metadeploy.api.jobs.delete_scratch_org_on_sf"
        ) as delete_scratch_org_on_sf:
            delete_scratch_org(scratch_org)

            assert delete_scratch_org_on_sf.called


@pytest.mark.django_db(transaction=True)
class TestCreateScratchOrg:
    def test_create_scratch_org(self, settings, plan_factory, scratch_org_factory):
        settings.DEVHUB_USERNAME = "test@example.com"
        plan = plan_factory(preflight_checks=[{"when": "True", "action": "error"}])
        with ExitStack() as stack:
            stack.enter_context(patch("metadeploy.api.jobs.local_github_checkout"))
            jwt_session = stack.enter_context(
                patch("metadeploy.api.salesforce.jwt_session")
            )
            jwt_session.return_value = {
                "instance_url": "https://sample.salesforce.org/",
                "access_token": "abc123",
                "refresh_token": "abc123",
            }
            OrgConfig = stack.enter_context(
                patch("metadeploy.api.salesforce.OrgConfig")
            )
            OrgConfig.return_value = MagicMock(
                instance_url="https://sample.salesforce.org/",
                access_token="abc123",
                refresh_token="abc123",
            )
            open = stack.enter_context(patch("metadeploy.api.salesforce.open"))
            fake_json = json.dumps({"edition": ""})
            open.return_value = MagicMock(
                **{
                    "__enter__.return_value": MagicMock(
                        **{"read.return_value": fake_json}
                    )
                }
            )
            SimpleSalesforce = stack.enter_context(
                patch("metadeploy.api.salesforce.SimpleSalesforce")
            )
            SimpleSalesforce.return_value = MagicMock(
                **{
                    "ScratchOrgInfo.get.return_value": {
                        "LoginUrl": "https://sample.salesforce.org/",
                        "ScratchOrg": "abc123",
                        "SignupUsername": "test",
                        "AuthCode": "abc123",
                    }
                }
            )
            OAuth2Client = stack.enter_context(
                patch("metadeploy.api.salesforce.OAuth2Client")
            )
            OAuth2Client.return_value = MagicMock(
                **{
                    "auth_code_grant.return_value": MagicMock(
                        **{
                            "json.return_value": {
                                "access_token": "abc123",
                                "refresh_token": "abc123",
                            }
                        }
                    )
                }
            )
            BaseCumulusCI = stack.enter_context(
                patch("metadeploy.api.salesforce.BaseCumulusCI")
            )
            MetaDeployCCI = stack.enter_context(
                patch("metadeploy.api.jobs.MetaDeployCCI")
            )
            org_config = MockDict()
            org_config.config_file = "/"
            MetaDeployCCI.return_value = MagicMock(
                **{
                    "project_config.repo_root": "/",
                    "keychain.get_org.return_value": org_config,
                }
            )
            BaseCumulusCI.return_value = MagicMock(
                **{
                    "project_config.repo_root": "/",
                    "keychain.get_org.return_value": org_config,
                }
            )
            stack.enter_context(patch("metadeploy.api.salesforce.DeployOrgSettings"))
            stack.enter_context(
                patch("cumulusci.core.flowrunner.PreflightFlowCoordinator.run")
            )
            # Cheat the auto-triggering of the job by adding a fake
            # enqueued_at:
            scratch_org = scratch_org_factory(
                plan=plan,
                enqueued_at=datetime(2020, 9, 4, 12),
            )
            create_scratch_org(scratch_org.id)

            scratch_org.refresh_from_db()
            assert scratch_org.expires_at == org_config.expires
            assert scratch_org.org_id == convert_to_18(org_config.org_id)

    def test_create_scratch_org__no_preflight(
        self, settings, plan_factory, scratch_org_factory
    ):
        settings.DEVHUB_USERNAME = "test@example.com"
        plan = plan_factory()
        with ExitStack() as stack:
            stack.enter_context(patch("metadeploy.api.jobs.local_github_checkout"))
            jwt_session = stack.enter_context(
                patch("metadeploy.api.salesforce.jwt_session")
            )
            jwt_session.return_value = {
                "instance_url": "https://sample.salesforce.org/",
                "access_token": "abc123",
                "refresh_token": "abc123",
            }
            OrgConfig = stack.enter_context(
                patch("metadeploy.api.salesforce.OrgConfig")
            )
            OrgConfig.return_value = MagicMock(
                instance_url="https://sample.salesforce.org/",
                access_token="abc123",
                refresh_token="abc123",
            )
            open = stack.enter_context(patch("metadeploy.api.salesforce.open"))
            fake_json = json.dumps({"edition": ""})
            open.return_value = MagicMock(
                **{
                    "__enter__.return_value": MagicMock(
                        **{"read.return_value": fake_json}
                    )
                }
            )
            SimpleSalesforce = stack.enter_context(
                patch("metadeploy.api.salesforce.SimpleSalesforce")
            )
            SimpleSalesforce.return_value = MagicMock(
                **{
                    "ScratchOrgInfo.get.return_value": {
                        "LoginUrl": "https://sample.salesforce.org/",
                        "ScratchOrg": "abc123",
                        "SignupUsername": "test",
                        "AuthCode": "abc123",
                    }
                }
            )
            OAuth2Client = stack.enter_context(
                patch("metadeploy.api.salesforce.OAuth2Client")
            )
            OAuth2Client.return_value = MagicMock(
                **{
                    "auth_code_grant.return_value": MagicMock(
                        **{
                            "json.return_value": {
                                "access_token": "abc123",
                                "refresh_token": "abc123",
                            }
                        }
                    )
                }
            )
            BaseCumulusCI = stack.enter_context(
                patch("metadeploy.api.salesforce.BaseCumulusCI")
            )
            org_config = MockDict()
            org_config.config_file = "/"
            BaseCumulusCI.return_value = MagicMock(
                **{
                    "project_config.repo_root": "/",
                    "keychain.get_org.return_value": org_config,
                }
            )
            stack.enter_context(patch("metadeploy.api.salesforce.DeployOrgSettings"))
            stack.enter_context(
                patch("cumulusci.core.flowrunner.PreflightFlowCoordinator.run")
            )
            # Cheat the auto-triggering of the job by adding a fake
            # enqueued_at:
            scratch_org = scratch_org_factory(
                plan=plan,
                enqueued_at=datetime(2020, 9, 4, 12),
            )
            create_scratch_org(scratch_org.id)

            scratch_org.refresh_from_db()
            assert scratch_org.expires_at == org_config.expires
            assert scratch_org.org_id == convert_to_18(org_config.org_id)

    def test_create_scratch_org__error(
        self, settings, plan_factory, scratch_org_factory
    ):
        settings.DEVHUB_USERNAME = "test@example.com"
        plan = plan_factory()
        with ExitStack() as stack:
            local_github_checkout = stack.enter_context(
                patch("metadeploy.api.jobs.local_github_checkout")
            )
            local_github_checkout.side_effect = TypeError
            jwt_session = stack.enter_context(
                patch("metadeploy.api.salesforce.jwt_session")
            )
            jwt_session.return_value = {
                "instance_url": "https://sample.salesforce.org/",
                "access_token": "abc123",
                "refresh_token": "abc123",
            }
            OrgConfig = stack.enter_context(
                patch("metadeploy.api.salesforce.OrgConfig")
            )
            OrgConfig.return_value = MagicMock(
                instance_url="https://sample.salesforce.org/",
                access_token="abc123",
                refresh_token="abc123",
            )
            open = stack.enter_context(patch("metadeploy.api.salesforce.open"))
            fake_json = json.dumps({"edition": ""})
            open.return_value = MagicMock(
                **{
                    "__enter__.return_value": MagicMock(
                        **{"read.return_value": fake_json}
                    )
                }
            )
            stack.enter_context(patch("metadeploy.api.salesforce.SimpleSalesforce"))
            stack.enter_context(patch("metadeploy.api.salesforce.OAuth2Client"))
            BaseCumulusCI = stack.enter_context(
                patch("metadeploy.api.salesforce.BaseCumulusCI")
            )
            BaseCumulusCI.return_value = MagicMock(**{"project_config.repo_root": "/"})
            stack.enter_context(patch("metadeploy.api.salesforce.DeployOrgSettings"))
            # Cheat the auto-triggering of the job by adding a fake
            # enqueued_at:
            scratch_org = scratch_org_factory(
                plan=plan,
                enqueued_at=datetime(2020, 9, 4, 12),
            )
            create_scratch_org(scratch_org.id)
