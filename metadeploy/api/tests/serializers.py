import pytest

from ..models import PreflightResult
from ..serializers import (
    PreflightResultSerializer,
    JobSerializer,
)


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


@pytest.mark.django_db
class TestJob:
    def test_create_good(
            self, rf, user_factory, plan_factory, preflight_result_factory):
        plan = plan_factory()
        user = user_factory()
        request = rf.get('/')
        request.user = user
        preflight_result_factory(
            plan=plan,
            user=user,
            status=PreflightResult.Status.complete,
        )
        data = {
            'plan': plan.id,
            'steps': [],
        }
        serializer = JobSerializer(data=data, context=dict(request=request))

        assert serializer.is_valid()

    def test_create_bad(self, rf, user_factory, plan_factory):
        plan = plan_factory()
        user = user_factory()
        request = rf.get('/')
        request.user = user
        data = {
            'plan': plan.id,
            'steps': [],
        }
        serializer = JobSerializer(data=data, context=dict(request=request))

        assert not serializer.is_valid()
