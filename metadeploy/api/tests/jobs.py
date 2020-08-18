from datetime import datetime, timedelta
from unittest.mock import MagicMock

import pytest
import pytz
import vcr
from cumulusci.salesforce_api.exceptions import MetadataParseError
from django.utils import timezone
from rq.worker import StopRequested

from ..flows import StopFlowException
from ..jobs import (
    enqueuer,
    expire_preflights,
    expire_user_tokens,
    finalize_result,
    preflight,
    run_flows,
)
from ..models import Job, PreflightResult


@pytest.mark.django_db
def test_report_error(mocker, job_factory, user_factory, plan_factory, step_factory):
    mocker.patch("metadeploy.api.jobs.get_github_api_for_repo", side_effect=Exception)
    report_error = mocker.patch("metadeploy.api.jobs.sync_report_error")

    user = user_factory()
    plan = plan_factory()
    step_factory(plan=plan)
    job = job_factory(user=user, plan=plan, org_id=user.org_id)

    with pytest.raises(Exception):
        run_flows(
            user=user,
            plan=plan,
            skip_steps=[],
            organization_url=job.organization_url,
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
        user=user,
        plan=plan,
        skip_steps=[],
        organization_url=job.organization_url,
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
        user=user,
        plan=plan,
        skip_steps=[],
        organization_url=preflight_result.organization_url,
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
def test_malicious_zip_file(
    mocker, job_factory, user_factory, plan_factory, step_factory
):
    # TODO: I don't like this test at all. But there's a lot of IO that
    # this code causes, so I'm mocking it out.
    mocker.patch("shutil.move")
    mocker.patch("shutil.rmtree")
    glob = mocker.patch("metadeploy.api.jobs.glob")
    glob.return_value = ["test"]
    mocker.patch("metadeploy.api.jobs.get_github_api_for_repo")
    zip_info = MagicMock()
    zip_info.filename = "/etc/passwd"
    zip_file_instance = MagicMock()
    zip_file_instance.infolist.return_value = [zip_info]
    zip_file = mocker.patch("zipfile.ZipFile")
    zip_file.return_value = zip_file_instance
    mocker.patch("metadeploy.api.jobs.OrgConfig")
    mocker.patch("metadeploy.api.jobs.ServiceConfig")
    mocker.patch("metadeploy.api.jobs.MetaDeployCCI")
    job_flow = mocker.patch("metadeploy.api.flows.JobFlowCallback")

    user = user_factory()
    plan = plan_factory()
    step_factory(plan=plan)
    job = job_factory(user=user, org_id=user.org_id)

    run_flows(
        user=user,
        plan=plan,
        skip_steps=[],
        organization_url=job.organization_url,
        result_class=Job,
        result_id=job.id,
    )

    assert not job_flow.called


@pytest.mark.django_db
def test_expire_user_tokens(user_factory):
    user1 = user_factory()
    user1.socialaccount_set.update(last_login=timezone.now())
    user2 = user_factory()
    user2.socialaccount_set.update(last_login=timezone.now() - timedelta(minutes=30))

    expire_user_tokens()

    user1.refresh_from_db()
    user2.refresh_from_db()

    assert user1.valid_token_for == "00Dxxxxxxxxxxxxxxx"
    assert user2.valid_token_for is None


@pytest.mark.django_db
def test_expire_user_tokens_with_started_job(job_factory):
    job = job_factory(org_id="00Dxxxxxxxxxxxxxxx")
    job.user.socialaccount_set.update(last_login=timezone.now() - timedelta(minutes=30))

    expire_user_tokens()

    assert job.user.valid_token_for is not None


@pytest.mark.django_db
def test_preflight(mocker, user_factory, plan_factory, preflight_result_factory):
    run_flows = mocker.patch("metadeploy.api.jobs.run_flows")

    user = user_factory()
    plan = plan_factory()
    preflight_result = preflight_result_factory(
        user=user, plan=plan, organization_url=user.instance_url, org_id=user.org_id
    )
    preflight(preflight_result.pk)

    assert run_flows.called


@pytest.mark.django_db
def test_preflight_failure(
    mocker, user_factory, plan_factory, preflight_result_factory
):
    glob = mocker.patch("metadeploy.api.jobs.glob")
    glob.side_effect = Exception
    mocker.patch("metadeploy.api.jobs.get_github_api_for_repo")

    user = user_factory()
    plan = plan_factory()
    preflight_result = preflight_result_factory(
        user=user, plan=plan, organization_url=user.instance_url, org_id=user.org_id
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
