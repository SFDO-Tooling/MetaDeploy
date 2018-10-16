import pytest

from django.urls import reverse


def format_timestamp(value):
    value = value.isoformat()
    if value.endswith('+00:00'):
        value = value[:-6] + 'Z'
    return value


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
            'plan': plan.id,
            'created_at': format_timestamp(preflight.created_at),
            'is_valid': True,
            'status': 'started',
            'results': {},
            'is_ready': False,
        }

    def test_get__bad(self, client, plan_factory):
        plan = plan_factory()
        response = client.get(
            reverse('plan-preflight', kwargs={'pk': plan.id}),
        )

        assert response.status_code == 404
