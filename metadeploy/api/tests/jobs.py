from datetime import datetime, timedelta
from unittest.mock import MagicMock
import pytz
from django.utils import timezone

import pytest

from ..models import PreflightResult, Job
from ..jobs import (
    run_flows,
    enqueuer,
    expire_user_tokens,
    preflight,
    expire_preflights,
)
from ..flows import JobFlow


@pytest.mark.django_db
def test_report_error(
        mocker, job_factory, user_factory, plan_factory, step_factory):
    report_error = mocker.patch('metadeploy.api.jobs.sync_report_error')
    user = user_factory()
    plan = plan_factory()
    job = job_factory(user=user)
    steps = [step_factory(plan=plan)]

    run_flows(
        user,
        plan,
        steps,
        flow_class=JobFlow,
        result_class=Job,
        result_id=job.id,
    )

    assert report_error.called
    job.refresh_from_db()
    assert job.status == Job.Status.failed


@pytest.mark.django_db
def test_run_flows(
        mocker, job_factory, user_factory, plan_factory, step_factory):
    # TODO: I don't like this test at all. But there's a lot of IO that
    # this code causes, so I'm mocking it out.
    mocker.patch('shutil.move')
    mocker.patch('shutil.rmtree')
    glob = mocker.patch('metadeploy.api.jobs.glob')
    glob.return_value = ['test']
    mocker.patch('github3.login')
    mocker.patch('zipfile.ZipFile')
    mocker.patch('metadeploy.api.jobs.OrgConfig')
    mocker.patch('metadeploy.api.jobs.ServiceConfig')
    mocker.patch('metadeploy.api.jobs.YamlGlobalConfig')
    mocker.patch('metadeploy.api.jobs.cci_configs')
    mocker.patch('metadeploy.api.jobs.BaseProjectKeychain')
    job_flow = mocker.patch('metadeploy.api.jobs.JobFlow')

    user = user_factory()
    plan = plan_factory()
    steps = [step_factory(plan=plan)]
    job = job_factory(user=user)

    run_flows(
        user,
        plan,
        steps,
        flow_class=job_flow,
        result_class=Job,
        result_id=job.id,
    )

    # TODO assert? What we really need to assert is a change in the SF
    # org, but that'd be an integration test.

    assert job_flow.called


@pytest.mark.django_db
def test_enqueuer(mocker, job_factory):
    delay = mocker.patch('metadeploy.api.jobs.run_flows_job.delay')
    # Just a random UUID:
    delay.return_value.id = '294fc6d2-0f3c-4877-b849-54184724b6b2'
    october_first = datetime(2018, 10, 1, 12, 0, 0, 0, pytz.UTC)
    delay.return_value.enqueued_at = october_first
    job = job_factory()
    enqueuer()

    job.refresh_from_db()
    assert delay.called
    assert job.enqueued_at is not None
    assert job.job_id is not None


@pytest.mark.django_db
def test_malicious_zip_file(
        mocker, job_factory, user_factory, plan_factory, step_factory):
    # TODO: I don't like this test at all. But there's a lot of IO that
    # this code causes, so I'm mocking it out.
    mocker.patch('shutil.move')
    mocker.patch('shutil.rmtree')
    glob = mocker.patch('metadeploy.api.jobs.glob')
    glob.return_value = ['test']
    mocker.patch('github3.login')
    zip_info = MagicMock()
    zip_info.filename = '/etc/passwd'
    zip_file_instance = MagicMock()
    zip_file_instance.infolist.return_value = [zip_info]
    zip_file = mocker.patch('zipfile.ZipFile')
    zip_file.return_value = zip_file_instance
    mocker.patch('metadeploy.api.jobs.OrgConfig')
    mocker.patch('metadeploy.api.jobs.ServiceConfig')
    mocker.patch('metadeploy.api.jobs.YamlGlobalConfig')
    mocker.patch('metadeploy.api.jobs.cci_configs')
    mocker.patch('metadeploy.api.jobs.BaseProjectKeychain')
    job_flow = mocker.patch('metadeploy.api.jobs.JobFlow')

    user = user_factory()
    plan = plan_factory()
    steps = [step_factory(plan=plan)]
    job = job_factory(user=user)

    run_flows(
        user,
        plan,
        steps,
        flow_class=job_flow,
        result_class=Job,
        result_id=job.id,
    )

    # TODO assert? What we really need to assert is a change in the SF
    # org, but that'd be an integration test.

    assert not job_flow.called


@pytest.mark.django_db
def test_expire_user_tokens(user_factory):
    user1 = user_factory()
    user1.socialaccount_set.update(last_login=timezone.now())
    user2 = user_factory()
    user2.socialaccount_set.update(
        last_login=timezone.now() - timedelta(minutes=30),
    )

    expire_user_tokens()

    user1.refresh_from_db()
    user2.refresh_from_db()

    assert user1.valid_token_for == 'https://example.com'
    assert user2.valid_token_for is None


@pytest.mark.django_db
def test_preflight(mocker, user_factory, plan_factory):
    mocker.patch('shutil.move')
    mocker.patch('shutil.rmtree')
    glob = mocker.patch('metadeploy.api.jobs.glob')
    glob.return_value = ['test']
    mocker.patch('github3.login')
    mocker.patch('zipfile.ZipFile')
    mocker.patch('metadeploy.api.jobs.OrgConfig')
    mocker.patch('metadeploy.api.jobs.ServiceConfig')
    mocker.patch('metadeploy.api.jobs.YamlGlobalConfig')
    mocker.patch('metadeploy.api.jobs.cci_configs')
    mocker.patch('metadeploy.api.jobs.BaseProjectKeychain')
    preflight_flow = mocker.patch('metadeploy.api.jobs.PreflightFlow')

    user = user_factory()
    plan = plan_factory()
    preflight(user, plan)

    assert preflight_flow.called


@pytest.mark.django_db
def test_preflight_failure(mocker, user_factory, plan_factory):
    glob = mocker.patch('metadeploy.api.jobs.glob')
    glob.side_effect = Exception
    mocker.patch('github3.login')

    user = user_factory()
    plan = plan_factory()
    preflight(user, plan)

    preflight_result = PreflightResult.objects.last()
    assert preflight_result.status == PreflightResult.Status.failed


@pytest.mark.django_db
def test_expire_preflights(
        user_factory, plan_factory, preflight_result_factory):
    now = timezone.now()
    eleven_minutes_ago = now - timedelta(minutes=11)
    user = user_factory()
    plan = plan_factory()
    preflight1 = preflight_result_factory(
        user=user,
        plan=plan,
        status=PreflightResult.Status.complete,
    )
    preflight2 = preflight_result_factory(
        user=user,
        plan=plan,
        status=PreflightResult.Status.started,
    )
    PreflightResult.objects.filter(id__in=[
        preflight1.id,
        preflight2.id,
    ]).update(
        created_at=eleven_minutes_ago,
    )
    preflight3 = preflight_result_factory(
        user=user,
        plan=plan,
        status=PreflightResult.Status.complete,
    )

    expire_preflights()

    preflight1.refresh_from_db()
    preflight2.refresh_from_db()
    preflight3.refresh_from_db()

    assert not preflight1.is_valid
    assert preflight2.is_valid
    assert preflight3.is_valid
