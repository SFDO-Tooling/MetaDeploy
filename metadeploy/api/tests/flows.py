from unittest.mock import sentinel, MagicMock

from ..flows import PreflightFlow


class TestPreflightFlow:
    def test_init(self, mocker):
        init = mocker.patch('cumulusci.core.flows.BaseFlow.__init__')
        init.return_value = None
        preflight_flow = PreflightFlow(preflight_result=sentinel.preflight)
        assert preflight_flow.preflight_result == sentinel.preflight

    def test_post_flow(self, mocker):
        init = mocker.patch('cumulusci.core.flows.BaseFlow.__init__')
        init.return_value = None
        pfr = MagicMock()
        pfr.results = {}
        preflight_flow = PreflightFlow(preflight_result=pfr)
        preflight_flow.step_return_values = [
            {'msg': 'error 1', 'status_code': 'error', 'task_name': 'name 1'},
            {'msg': '', 'status_code': 'ok', 'task_name': 'name 2'},
            {'msg': 'error 2', 'status_code': 'error', 'task_name': 'name 3'},
        ]
        preflight_flow._post_flow()

        assert pfr.results == {
            'name 1': ['error 1'],
            'name 3': ['error 2'],
        }
