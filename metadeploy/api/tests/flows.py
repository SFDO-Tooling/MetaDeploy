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
        step4 = step_factory(plan=plan, task_name='name_4')
        step5 = step_factory(plan=plan, task_name='name_5')
        pfr = preflight_result_factory(user=user, plan=plan)
        preflight_flow = PreflightFlow(preflight_result=pfr)
        preflight_flow.step_return_values = [
            {'task_name': 'name_1', 'status_code': 'error', 'msg': 'error 1'},
            {'task_name': 'name_2', 'status_code': 'ok'},
            {'task_name': 'name_3', 'status_code': 'warn', 'msg': 'warn 1'},
            {'task_name': 'name_4', 'status_code': 'optional'},
            {'task_name': 'name_5', 'status_code': 'skip'},
        ]

        preflight_flow._post_flow()

        assert pfr.results == {
            step1.id: [{'status': 'error', 'message': 'error 1'}],
            step3.id: [{'status': 'warn', 'message': 'warn 1'}],
            step4.id: [{'status': 'optional'}],
            step5.id: [{'status': 'skip'}],
        }
