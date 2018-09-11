import pytest

from ..jobs import run_flow, enqueuer


def test_run_flow(mocker):
    # TODO: I don't like this test at all. But there's a lot of IO that
    # this code causes, so I'm mocking it out.
    mocker.patch('git.Repo.clone_from')
    mocker.patch('cumulusci.core.config.OrgConfig')
    mocker.patch('cumulusci.core.config.ServiceConfig')
    mocker.patch('cumulusci.core.config.YamlGlobalConfig')
    mocker.patch('cumulusci.core.config.YamlProjectConfig')
    mocker.patch('cumulusci.core.keychain.BaseProjectKeychain')
    base_flow = mocker.patch('cumulusci.core.flows.BaseFlow')

    token = 'token'
    token_secret = 'token_secret'
    instance_url = 'https://example.com/'
    package_url = 'https://example.com/'
    flow_name = 'test_flow'

    run_flow(token, token_secret, instance_url, package_url, flow_name)

    # TODO assert? What we really need to assert is a change in the SF
    # org, but that'd be an integration test.

    assert base_flow.called


@pytest.mark.django_db
def test_enqueuer(mocker, job_factory):
    run_flow_job = mocker.patch('metadeploy.api.jobs.run_flow_job')
    job = job_factory()
    enqueuer()

    job.refresh_from_db()
    assert run_flow_job.delay.called
    assert job.enqueued_at is not None
