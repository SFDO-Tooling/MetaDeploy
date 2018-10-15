from cumulusci.core import flows


class BasicFlow(flows.BaseFlow):
    # TODO:
    # We'll want to subclass BaseFlow and add logic in the progress
    # callbacks to record and possibly push progress:
    # pre_flow, post_flow, pre_task, post_task, pre_subflow,
    # post_subflow
    pass


class PreflightFlow(flows.BaseFlow):
    def __init__(self, *args, preflight_result=None, **kwargs):
        self.preflight_result = preflight_result
        return super().__init__(*args, **kwargs)

    # def pre_flow(self, *args, **kwargs):
    #     pass

    def post_flow(self):
        results = {
            k: v
            for return_value in self.step_return_values
            for k, v in return_value.items()
        }
        self.preflight_result.results = results

    # def pre_task(self, *args, **kwargs):
    #     pass

    # def post_task(self, *args, **kwargs):
    #     pass

    # def pre_subflow(self, *args, **kwargs):
    #     pass

    # def post_subflow(self, *args, **kwargs):
    #     pass
