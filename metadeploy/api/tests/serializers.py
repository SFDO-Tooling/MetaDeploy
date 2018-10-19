import pytest

from ..models import PreflightResult
from ..serializers import PreflightResultSerializer


@pytest.mark.django_db
def test_preflight_has_no_errors(
        user_factory, plan_factory, preflight_result_factory):
    user = user_factory()
    plan = plan_factory()
    preflight = preflight_result_factory(
        user=user,
        organization_url=user.instance_url,
        plan=plan,
        results={},
        status=PreflightResult.Status.complete,
    )
    serializer = PreflightResultSerializer(instance=preflight).data
    assert not serializer["has_errors"]


@pytest.mark.django_db
def test_preflight_has_errors(
        user_factory, plan_factory, preflight_result_factory):
    user = user_factory()
    plan = plan_factory()
    preflight = preflight_result_factory(
        user=user,
        organization_url=user.instance_url,
        plan=plan,
        results={
            'name 1': ['error 1'],
        },
        status=PreflightResult.Status.complete,
    )
    serializer = PreflightResultSerializer(instance=preflight).data
    assert serializer["has_errors"]
