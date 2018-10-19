import pytest

from unittest.mock import sentinel

from ..flows import PreflightFlow


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
