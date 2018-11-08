import pytest

from django.urls import reverse


def format_timestamp(value):
    value = value.isoformat()
    if value.endswith('+00:00'):
        value = value[:-6] + 'Z'
    return value


@pytest.mark.django_db
class TestBasicGetViews:
    def test_job(self, client, job_factory):
        job = job_factory()
        response = client.get(reverse('job-detail', kwargs={'pk': job.id}))

        assert response.status_code == 200
        assert response.json() == {
            'id': str(job.id),
            'creator': {
                'username': job.user.username,
                'is_staff': False,
            },
            'plan': str(job.plan.id),
            'steps': [],
            'completed_steps': [],
            'created_at': format_timestamp(job.created_at),
            'enqueued_at': None,
            'job_id': None,
            'status': 'started',
            'org_name': '',
            'org_type': '',
        }

    def test_product(self, client, product_factory, version_factory):
        product = product_factory()
        version = version_factory(product=product)
        response = client.get(
            reverse('product-detail', kwargs={'pk': product.id}),
        )

        assert response.status_code == 200
        assert response.json() == {
            'id': str(product.id),
            'title': product.title,
            'description': 'This is a sample product.',
            'category': 'salesforce',
            'color': '#FFFFFF',
            'icon': None,
            'image': None,
            'most_recent_version': {
                'id': str(version.id),
                'product': str(product.id),
                'label': 'v0.1.0',
                'description': 'A sample version.',
                'created_at': format_timestamp(version.created_at),
                'primary_plan': None,
                'secondary_plan': None,
                'additional_plans': [],
            },
            'slug': product.slug,
        }

    def test_version(self, client, version_factory):
        version = version_factory()
        response = client.get(
            reverse('version-detail', kwargs={'pk': version.id}),
        )

        assert response.status_code == 200
        assert response.json() == {
            'id': str(version.id),
            'product': str(version.product.id),
            'label': 'v0.1.0',
            'description': 'A sample version.',
            'created_at': format_timestamp(version.created_at),
            'primary_plan': None,
            'secondary_plan': None,
            'additional_plans': [],
        }

    def test_plan(self, client, plan_factory):
        plan = plan_factory()
        response = client.get(reverse('plan-detail', kwargs={'pk': plan.id}))

        assert response.status_code == 200
        assert response.json() == {
            'id': str(plan.id),
            'title': 'Sample plan',
            'version': str(plan.version.id),
            'preflight_message': '',
            'tier': 'primary',
            'slug': 'sample-plan',
            'steps': [],
        }


@pytest.mark.django_db
class TestPreflight:
    def test_post(self, client, plan_factory):
        plan = plan_factory()
        response = client.post(
            reverse('plan-preflight', kwargs={'pk': plan.id}),
        )

        assert response.status_code == 202

    def test_get__good(self, client, plan_factory, preflight_result_factory):
        plan = plan_factory()
        preflight = preflight_result_factory(
            plan=plan,
            user=client.user,
            organization_url=client.user.instance_url,
        )
        response = client.get(
            reverse('plan-preflight', kwargs={'pk': plan.id}),
        )

        assert response.status_code == 200
        assert response.json() == {
            'organization_url': client.user.instance_url,
            'plan': str(plan.id),
            'created_at': format_timestamp(preflight.created_at),
            'is_valid': True,
            'status': 'started',
            'results': {},
            'error_count': 0,
            'warning_count': 0,
            'is_ready': False,
        }

    def test_get__bad(self, client, plan_factory):
        plan = plan_factory()
        response = client.get(
            reverse('plan-preflight', kwargs={'pk': plan.id}),
        )

        assert response.status_code == 404
