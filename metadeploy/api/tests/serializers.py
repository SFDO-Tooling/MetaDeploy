import pytest

from ..models import PreflightResult
from ..serializers import PreflightResultSerializer


@pytest.mark.django_db
class TestPreflightSerializer:
    def test_preflight_error_count(
            self, user_factory, plan_factory, preflight_result_factory):
        user = user_factory()
        plan = plan_factory()
        preflight = preflight_result_factory(
            user=user,
            organization_url=user.instance_url,
            plan=plan,
            results={
                0: [{'status': 'error'}],
            },
            status=PreflightResult.Status.complete,
        )
        serializer = PreflightResultSerializer(instance=preflight).data
        assert serializer["error_count"] == 1
        assert serializer["warning_count"] == 0

    def test_preflight_warning_count(
            self, user_factory, plan_factory, preflight_result_factory):
        user = user_factory()
        plan = plan_factory()
        preflight = preflight_result_factory(
            user=user,
            organization_url=user.instance_url,
            plan=plan,
            results={
                0: [{'status': 'warn'}],
            },
            status=PreflightResult.Status.complete,
        )
        serializer = PreflightResultSerializer(instance=preflight).data
        assert serializer["error_count"] == 0
        assert serializer["warning_count"] == 1

    def test_preflight_is_ready(
            self, user_factory, plan_factory, preflight_result_factory):
        user = user_factory()
        plan = plan_factory()
        preflight = preflight_result_factory(
            user=user,
            organization_url=user.instance_url,
            plan=plan,
            results={
                0: [{'status': 'warn'}],
            },
            status=PreflightResult.Status.complete,
        )
        serializer = PreflightResultSerializer(instance=preflight).data
        assert serializer["is_ready"]

    def test_preflight_is_not_ready(
            self, user_factory, plan_factory, preflight_result_factory):
        user = user_factory()
        plan = plan_factory()
        preflight = preflight_result_factory(
            user=user,
            organization_url=user.instance_url,
            plan=plan,
            results={
                0: [{'status': 'error'}],
            },
            status=PreflightResult.Status.complete,
        )
        serializer = PreflightResultSerializer(instance=preflight).data
        assert not serializer["is_ready"]
