from datetime import datetime
import pytz
from unittest.mock import MagicMock

import pytest

from ..jobs import run_flows, enqueuer


@pytest.mark.django_db
def test_run_flows(mocker, user_factory, plan_factory, step_factory):
    # TODO: I don't like this test at all. But there's a lot of IO that
    # this code causes, so I'm mocking it out.
    mocker.patch('github3.login')
    mocker.patch('zipfile.ZipFile')
    mocker.patch('cumulusci.core.config.OrgConfig')
    mocker.patch('cumulusci.core.config.ServiceConfig')
    mocker.patch('cumulusci.core.config.YamlGlobalConfig')
    mocker.patch('cumulusci.core.config.YamlProjectConfig')
    mocker.patch('cumulusci.core.keychain.BaseProjectKeychain')
    base_flow = mocker.patch('cumulusci.core.flows.BaseFlow')

    user = user_factory()
    plan = plan_factory()
    steps = [step_factory(plan=plan)]

    run_flows(user, plan, steps)

    # TODO assert? What we really need to assert is a change in the SF
    # org, but that'd be an integration test.

    assert base_flow.called


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
