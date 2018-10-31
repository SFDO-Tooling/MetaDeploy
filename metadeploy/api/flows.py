import bleach
from cumulusci.core import flows

from .constants import WARN, ERROR, SKIP, OPTIONAL


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
        """
        Turn the step_return_values into a merged error dict.

        Each value in step_return_values gets turned into a (key,
        [error_dict]) pair. This is then turned into a dict, merging any
        identical keys by combining their lists of error dicts.

        Finally, this is attached to the preflight_result object, which
        the caller must then save.
        """
        results = {}
        for status in self.step_return_values:
            kv = self._emit_k_v_for_status_dict(status)
            if kv is None:
                continue
            k, v = kv
            try:
                results[k].extend(v)
            except KeyError:
                results[k] = v
        self.preflight_result.results.update(results)

    def _post_task_exception(self, task, e):
        error_result = {
            'plan': [{'status': ERROR, 'message': str(e)}],
        }
        self.preflight_result.results.update(error_result)

    def _get_step_id(self, task_name):
        return self.preflight_result.plan.step_set.filter(
            task_name=task_name,
        ).first().id  # Right now, we just trust it exists!

    def _emit_k_v_for_status_dict(self, status):
        if status['status_code'] == 'ok':
            return None

        if status['status_code'] == ERROR:
            step_id = self._get_step_id(status['task_name'])
            return (
                step_id,
                [{
                    'status': ERROR,
                    'message': bleach.clean(status.get('msg', '')),
                }],
            )

        if status['status_code'] == WARN:
            step_id = self._get_step_id(status['task_name'])
            return (
                step_id,
                [{
                    'status': WARN,
                    'message': bleach.clean(status.get('msg', '')),
                }],
            )

        if status['status_code'] == SKIP:
            step_id = self._get_step_id(status['task_name'])
            return (
                step_id,
                [{
                    'status': SKIP,
                    'message': bleach.clean(status.get('msg', '')),
                }],
            )

        if status['status_code'] == OPTIONAL:
            step_id = self._get_step_id(status['task_name'])
            return (
                step_id,
                [{
                    'status': OPTIONAL,
                    'message': bleach.clean(status.get('msg', '')),
                }],
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
