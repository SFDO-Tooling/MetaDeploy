from unittest.mock import MagicMock, sentinel

import pytest
from django.core.cache import cache

from ..constants import REDIS_JOB_CANCEL_KEY
from ..flows import BasicFlow, JobFlow, PreflightFlow, StopFlowException
from ..models import Step


def test_get_step_id(mocker):
    init = mocker.patch("cumulusci.core.flows.BaseFlow.__init__")
    init.return_value = None
    basic_flow = BasicFlow()
    basic_flow._step_set = Step.objects.none()
    result = basic_flow._get_step_id("anything")

    assert result is None


class TestJobFlow:
    def test_init(self, mocker):
        init = mocker.patch("cumulusci.core.flows.BaseFlow.__init__")
        init.return_value = None
        flow = JobFlow(result=sentinel.job)
        assert flow.result == sentinel.job

    @pytest.mark.django_db
    def test_cancel_job(self, mocker, job_factory):
        init = mocker.patch("cumulusci.core.flows.BaseFlow.__init__")
        init.return_value = None
        job = job_factory()
        flow = JobFlow(result=job)
        cache.set(REDIS_JOB_CANCEL_KEY.format(id=job.id), True)
        with pytest.raises(StopFlowException):
            flow._pre_task(None)

    @pytest.mark.django_db
    def test_post_task(
        self, mocker, user_factory, plan_factory, step_factory, job_factory
    ):
        init = mocker.patch("cumulusci.core.flows.BaseFlow.__init__")
        init.return_value = None
        plan = plan_factory()
        steps = [step_factory(plan=plan, task_name=f"task_{i}") for i in range(3)]

        job = job_factory(plan=plan, steps=steps)

        flow = JobFlow(result=job)

        tasks = [MagicMock() for _ in range(3)]
        for i, task in enumerate(tasks):
            task.name = f"task_{i}"

        flow._init_logger()
        for task in tasks:
            flow._post_task(task)
        flow._post_flow()

        assert job.results == {str(step.id): [{"status": "ok"}] for step in steps}

    @pytest.mark.django_db
    def test_post_task_exception(
        self, mocker, user_factory, plan_factory, step_factory, job_factory
    ):
        init = mocker.patch("cumulusci.core.flows.BaseFlow.__init__")
        init.return_value = None
        user = user_factory()
        plan = plan_factory()
        steps = [step_factory(plan=plan, task_name=f"task_{i}") for i in range(3)]

        job = job_factory(user=user, plan=plan, steps=steps)

        flow = JobFlow(result=job)

        task = MagicMock()
        task.name = f"task_0"

        flow._init_logger()
        flow._post_task_exception(task, ValueError("Some error"))

        assert job.results == {
            str(steps[0].id): [{"status": "error", "message": "Some error"}]
        }


class TestPreflightFlow:
    def test_init(self, mocker):
        init = mocker.patch("cumulusci.core.flows.BaseFlow.__init__")
        init.return_value = None
        preflight_flow = PreflightFlow(result=sentinel.preflight)
        assert preflight_flow.result == sentinel.preflight

    @pytest.mark.django_db
    def test_post_flow(
        self, mocker, user_factory, plan_factory, step_factory, preflight_result_factory
    ):
        init = mocker.patch("cumulusci.core.flows.BaseFlow.__init__")
        init.return_value = None
        user = user_factory()
        plan = plan_factory()
        step1 = step_factory(plan=plan, task_name="name_1")
        step_factory(plan=plan, task_name="name_2")
        step3 = step_factory(plan=plan, task_name="name_3")
        step4 = step_factory(plan=plan, task_name="name_4")
        step5 = step_factory(plan=plan, task_name="name_5")
        pfr = preflight_result_factory(user=user, plan=plan)
        preflight_flow = PreflightFlow(result=pfr)
        preflight_flow.step_return_values = [
            {"task_name": "name_1", "status_code": "error", "msg": "error 1"},
            {"task_name": "name_2", "status_code": "ok"},
            {"task_name": "name_3", "status_code": "warn", "msg": "warn 1"},
            {"task_name": "name_4", "status_code": "optional"},
            {"task_name": "name_5", "status_code": "skip", "msg": "skip 1"},
        ]

        preflight_flow._post_flow()

        assert pfr.results == {
            step1.id: [{"status": "error", "message": "error 1"}],
            step3.id: [{"status": "warn", "message": "warn 1"}],
            step4.id: [{"status": "optional", "message": ""}],
            step5.id: [{"status": "skip", "message": "skip 1"}],
        }

    @pytest.mark.django_db
    def test_post_task_exception(
        self, mocker, user_factory, plan_factory, preflight_result_factory
    ):
        init = mocker.patch("cumulusci.core.flows.BaseFlow.__init__")
        init.return_value = None
        user = user_factory()
        plan = plan_factory()
        pfr = preflight_result_factory(user=user, plan=plan)
        preflight_flow = PreflightFlow(result=pfr)

        exc = ValueError("A value error.")
        preflight_flow._post_task_exception(None, exc)

        assert pfr.results == {
            "plan": [{"status": "error", "message": "A value error."}]
        }
