import pytest


@pytest.mark.django_db
def test_trigger_build_view__good(client, mocker):
    # This is pretty real test data, so we should mock out the resultant
    # job so it doesn't do IO:
    run_flow_job = mocker.patch('metadeploy.api.jobs.run_flow_job')
    data = {
        'instance_url': 'https://na53.salesforce.com/',
        'package_url': 'https://github.com/SalesforceFoundation/HEDAP.git',
        'flow_name': 'install_prod',
    }
    response = client.post('/api/start/', data=data)

    assert response.status_code == 202
    assert run_flow_job.delay.called


@pytest.mark.django_db
def test_trigger_build_view__bad(client, mocker):
    # This is bad test data, but we should still mock out the resultant
    # job so it doesn't do IO:
    mocker.patch('metadeploy.api.jobs.run_flow_job')
    data = {
        'package_url': 'https://github.com/SalesforceFoundation/HEDAP.git',
        'flow_name': 'install_prod',
    }
    response = client.post('/api/start/', data=data)

    assert response.status_code == 400
