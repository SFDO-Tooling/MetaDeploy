import pytest

from django.urls import reverse


@pytest.mark.django_db
def test_plan__preflight(client, user_factory, plan_factory):
    plan = plan_factory()
    response = client.post(reverse('plan-preflight', kwargs={'pk': plan.id}))

    assert response.status_code == 202
