from unittest.mock import MagicMock, sentinel

import pytest
from django.core.cache import cache

from ..constants import REDIS_JOB_CANCEL_KEY
from ..flows import (
    BasicFlowCallback,
    JobFlowCallback,
    PreflightFlowCallback,
    StopFlowException,
)
from ..models import Step


def test_get_step_id(mocker):
    callbacks = BasicFlowCallback(sentinel.result)
    callbacks._steps = Step.objects.none()
    result = callbacks._get_step_id("anything")

    assert result is None


class TestJobFlow:
    def test_init(self, mocker):
        callbacks = JobFlowCallback(sentinel.job)
        assert callbacks.context == sentinel.job

    @pytest.mark.django_db
    def test_cancel_job(self, mocker, job_factory):
        job = job_factory()
        callbacks = JobFlowCallback(job)
        cache.set(REDIS_JOB_CANCEL_KEY.format(id=job.id), True)
        with pytest.raises(StopFlowException):
            callbacks.pre_task(None)

    @pytest.mark.django_db
    def test_post_task(
        self, mocker, user_factory, plan_factory, step_factory, job_factory
    ):
        plan = plan_factory()
        steps = [step_factory(plan=plan, path=f"task_{i}") for i in range(3)]

        job = job_factory(plan=plan, steps=steps)

        callbacks = JobFlowCallback(job)

        stepspecs = [MagicMock() for _ in range(3)]
        for i, stepspec in enumerate(stepspecs):
            stepspec.path = f"task_{i}"
        result = MagicMock(exception=None)

        callbacks.pre_flow(sentinel.flow_coordinator)
        for stepspec in stepspecs:
            callbacks.post_task(stepspec, result)
        callbacks.post_flow(sentinel.flow_coordinator)

        assert job.results == {str(step.id): [{"status": "ok"}] for step in steps}

    @pytest.mark.django_db
    def test_post_task__exception(
        self, mocker, user_factory, plan_factory, step_factory, job_factory
    ):
        user = user_factory()
        plan = plan_factory()
        steps = [step_factory(plan=plan, path=f"task_{i}") for i in range(3)]

        job = job_factory(user=user, plan=plan, steps=steps)

        callbacks = JobFlowCallback(job)

        step = MagicMock(path="task_0")
        step.result = MagicMock(exception=ValueError("Some error"))

        callbacks.pre_flow(sentinel.flow_coordinator)
        callbacks.post_task(step, step.result)

        assert job.results == {
            str(steps[0].id): [{"status": "error", "message": "Some error"}]
        }


class TestPreflightFlow:
    def test_init(self, mocker):
        callbacks = PreflightFlowCallback(sentinel.preflight)
        assert callbacks.context == sentinel.preflight

    @pytest.mark.django_db
    def test_post_flow(
        self, mocker, user_factory, plan_factory, step_factory, preflight_result_factory
    ):
        user = user_factory()
        plan = plan_factory()
        step1 = step_factory(plan=plan, path="name_1")
        step_factory(plan=plan, path="name_2")
        step3 = step_factory(plan=plan, path="name_3")
        step4 = step_factory(plan=plan, path="name_4")
        step5 = step_factory(plan=plan, path="name_5")
        pfr = preflight_result_factory(user=user, plan=plan)
        results = [
            MagicMock(
                return_values={
                    "task_name": "name_1",
                    "status_code": "error",
                    "msg": "error 1",
                }
            ),
            MagicMock(return_values={"task_name": "name_2", "status_code": "ok"}),
            MagicMock(
                return_values={
                    "task_name": "name_3",
                    "status_code": "warn",
                    "msg": "warn 1",
                }
            ),
            MagicMock(return_values={"task_name": "name_4", "status_code": "optional"}),
            MagicMock(
                return_values={
                    "task_name": "name_5",
                    "status_code": "skip",
                    "msg": "skip 1",
                }
            ),
        ]
        flow_coordinator = MagicMock(results=results)

        callbacks = PreflightFlowCallback(pfr)
        callbacks.post_flow(flow_coordinator)

        assert pfr.results == {
            step1.id: [{"status": "error", "message": "error 1"}],
            step3.id: [{"status": "warn", "message": "warn 1"}],
            step4.id: [{"status": "optional", "message": ""}],
            step5.id: [{"status": "skip", "message": "skip 1"}],
        }

    @pytest.mark.django_db
    def test_post_task__exception(
        self, mocker, user_factory, plan_factory, preflight_result_factory
    ):
        user = user_factory()
        plan = plan_factory()
        pfr = preflight_result_factory(user=user, plan=plan)
        callbacks = PreflightFlowCallback(pfr)

        step = MagicMock()
        step.result = MagicMock(exception=ValueError("A value error."))
        callbacks.post_task(step, step.result)

        assert pfr.results == {
            "plan": [{"status": "error", "message": "A value error."}]
        }
