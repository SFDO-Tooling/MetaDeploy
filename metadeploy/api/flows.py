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

    def _post_flow(self):
        results = dict([
            self._emit_k_v_for_status_dict(status)
            for status
            in self.step_return_values
            if self._emit_k_v_for_status_dict(status) is not None
        ])
        self.preflight_result.results = results

    def _emit_k_v_for_status_dict(self, status):
        if status['status_code'] == 'ok':
            return None

        if status['status_code'] == 'error':
            step_id = self.preflight_result.plan.step_set.filter(
                task_name=status['task_name'],
            ).first().id  # Right now, we just trust it exists!
            return (step_id, [{'status': 'error', 'message': status['msg']}])

        # Else status_code == 'warning', and we don't have that yet

    # def pre_flow(self, *args, **kwargs):
    #     pass

    # def pre_task(self, *args, **kwargs):
    #     pass

    # def post_task(self, *args, **kwargs):
    #     pass

    # def pre_subflow(self, *args, **kwargs):
    #     pass

    # def post_subflow(self, *args, **kwargs):
    #     pass
