import pytest

from ..models import PreflightResult
from ..serializers import PreflightResultSerializer


@pytest.mark.django_db
def test_preflight_is_not_ready(
        user_factory, plan_factory, preflight_result_factory):
    user = user_factory()
    plan = plan_factory()
    preflight = preflight_result_factory(
        user=user,
        organization_url=user.instance_url,
        plan=plan,
    )
    serializer = PreflightResultSerializer(instance=preflight).data
    assert not serializer["is_ready"]


@pytest.mark.django_db
def test_preflight_is_ready(
        user_factory, plan_factory, preflight_result_factory):
    user = user_factory()
    plan = plan_factory()
    preflight = preflight_result_factory(
        user=user,
        organization_url=user.instance_url,
        plan=plan,
        results={},
        is_valid=True,
        status=PreflightResult.Status.complete,
    )
    serializer = PreflightResultSerializer(instance=preflight).data
    assert serializer["is_ready"]
