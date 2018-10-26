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

    def _get_step_id(self, task_name):
        return self.preflight_result.plan.step_set.filter(
            task_name=task_name,
        ).first().id  # Right now, we just trust it exists!

    def _emit_k_v_for_status_dict(self, status):
        if status['status_code'] == 'ok':
            return None

        if status['status_code'] == 'error':
            step_id = self._get_step_id(status['task_name'])
            return (
                step_id,
                [{'status': 'error', 'message': status.get('msg', '')}],
            )

        if status['status_code'] == 'warn':
            step_id = self._get_step_id(status['task_name'])
            return (
                step_id,
                [{'status': 'warn', 'message': status.get('msg', '')}],
            )

        if status['status_code'] == 'skip':
            step_id = self._get_step_id(status['task_name'])
            return (
                step_id,
                [{'status': 'skip', 'message': status.get('msg', '')}],
            )

        if status['status_code'] == 'optional':
            step_id = self._get_step_id(status['task_name'])
            return (
                step_id,
                [{'status': 'optional', 'message': status.get('msg', '')}],
            )

    # def _pre_flow(self, *args, **kwargs):
    #     pass

    # def _pre_task(self, *args, **kwargs):
    #     pass

    # def _post_task(self, *args, **kwargs):
    #     pass

    # def _pre_subflow(self, *args, **kwargs):
    #     pass

    # def _post_subflow(self, *args, **kwargs):
    #     pass
