import pytest

from unittest.mock import sentinel, MagicMock

from ..flows import BasicFlow, PreflightFlow


class TestBasicFlow:
    def test_init(self, mocker):
        init = mocker.patch('cumulusci.core.flows.BaseFlow.__init__')
        init.return_value = None
        flow = BasicFlow(job=sentinel.job)
        assert flow.job == sentinel.job

    @pytest.mark.django_db
    def test_post_task(
            self, mocker, user_factory, plan_factory, step_factory,
            job_factory):
        init = mocker.patch('cumulusci.core.flows.BaseFlow.__init__')
        init.return_value = None
        user = user_factory()
        plan = plan_factory()
        steps = [
            step_factory(plan=plan, task_name=f'task_{i}')
            for i
            in range(3)
        ]

        job = job_factory(user=user, plan=plan, steps=steps)

        flow = BasicFlow(job=job)

        tasks = [MagicMock() for _ in range(3)]
        for i, task in enumerate(tasks):
            task.name = f'task_{i}'

        for task in tasks:
            flow._post_task(task)

        assert job.completed_steps == [
            'task_0',
            'task_1',
            'task_2',
        ]


class TestPreflightFlow:
    def test_init(self, mocker):
        init = mocker.patch('cumulusci.core.flows.BaseFlow.__init__')
        init.return_value = None
        preflight_flow = PreflightFlow(preflight_result=sentinel.preflight)
        assert preflight_flow.preflight_result == sentinel.preflight

    @pytest.mark.django_db
    def test_post_flow(
            self, mocker, user_factory, plan_factory, step_factory,
            preflight_result_factory):
        init = mocker.patch('cumulusci.core.flows.BaseFlow.__init__')
        init.return_value = None
        user = user_factory()
        plan = plan_factory()
        step1 = step_factory(plan=plan, task_name='name_1')
        step_factory(plan=plan, task_name='name_2')
        step3 = step_factory(plan=plan, task_name='name_3')
        pfr = preflight_result_factory(user=user, plan=plan)
        preflight_flow = PreflightFlow(preflight_result=pfr)
        preflight_flow.step_return_values = [
            {'msg': 'error 1', 'status_code': 'error', 'task_name': 'name_1'},
            {'msg': '', 'status_code': 'ok', 'task_name': 'name_2'},
            {'msg': 'error 2', 'status_code': 'error', 'task_name': 'name_3'},
        ]

        preflight_flow._post_flow()

        assert pfr.results == {
            step1.id: [{'status': 'error', 'message': 'error 1'}],
            step3.id: [{'status': 'error', 'message': 'error 2'}],
        }
