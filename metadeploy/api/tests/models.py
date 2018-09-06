import pytest

from ..models import (
    Product,
    Job,
)


class TestIconProperty:
    def test_uses_icon_url(self):
        product = Product(icon_url='https://example.com/example.png')
        assert product.icon == {
            'type': 'url',
            'url': 'https://example.com/example.png',
        }

    def test_uses_slds_attrs(self):
        product = Product(slds_icon_category='action', slds_icon_name='test')
        assert product.icon == {
            'type': 'slds',
            'category': 'action',
            'name': 'test',
        }

    def test_default(self):
        product = Product()
        assert product.icon is None


@pytest.mark.django_db
def test_job_save(mocker, user_factory):
    run_flow_job = mocker.patch('metadeploy.api.jobs.run_flow_job')
    user = user_factory()

    job = Job(
        token='sample token',
        user=user,
        instance_url='https://example.com/',
        package_url='https://example.com/',
        flow_name='sample_flow',
    )
    job.save()

    assert run_flow_job.delay.called
