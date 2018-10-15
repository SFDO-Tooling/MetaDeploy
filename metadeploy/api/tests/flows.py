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
            {'name 1': ['error 1']},
            {'name 2': ['error 2']},
        ]
        preflight_flow.post_flow()

        assert pfr.results == {
            'name 1': ['error 1'],
            'name 2': ['error 2'],
        }
