from datetime import datetime, timedelta
from unittest.mock import MagicMock
import pytz
from django.utils import timezone

import pytest

from ..jobs import (
    run_flows,
    enqueuer,
    expire_user_tokens,
    preflight,
)


@pytest.mark.django_db
def test_report_error(mocker, user_factory, plan_factory, step_factory):
    report_error = mocker.patch('metadeploy.api.jobs.sync_report_error')
    user = user_factory()
    plan = plan_factory()
    steps = [step_factory(plan=plan)]

    with pytest.raises(Exception):
        run_flows(user, plan, steps)

    assert report_error.called


@pytest.mark.django_db
def test_run_flows(mocker, user_factory, plan_factory, step_factory):
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
    basic_flow = mocker.patch('metadeploy.api.jobs.BasicFlow')

    user = user_factory()
    plan = plan_factory()
    steps = [step_factory(plan=plan)]

    run_flows(user, plan, steps)

    # TODO assert? What we really need to assert is a change in the SF
    # org, but that'd be an integration test.

    assert basic_flow.called


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
def test_malicious_zip_file(mocker, user_factory, plan_factory, step_factory):
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
    basic_flow = mocker.patch('metadeploy.api.jobs.BasicFlow')

    from ..jobs import run_flows

    user = user_factory()
    plan = plan_factory()
    steps = [step_factory(plan=plan)]

    run_flows(user, plan, steps)

    # TODO assert? What we really need to assert is a change in the SF
    # org, but that'd be an integration test.

    assert not basic_flow.called


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
