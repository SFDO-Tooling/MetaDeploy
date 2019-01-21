import logging
from io import StringIO

import bleach
from cumulusci.core import flows
from django.core.cache import cache

from .belvedere_utils import obscure_salesforce_log
from .constants import ERROR, OK, OPTIONAL, REDIS_JOB_CANCEL_KEY, SKIP, WARN

logger = logging.getLogger(__name__)


class StopFlowException(Exception):
    pass


class BasicFlow(flows.BaseFlow):
    # TODO:
    # We'll want to subclass BaseFlow and add logic in the progress
    # callbacks to record and possibly push progress:
    # pre_flow, post_flow, pre_task, post_task, pre_subflow,
    # post_subflow
    def __init__(self, *args, result=None, **kwargs):
        self.result = result
        return super().__init__(*args, **kwargs)

    def _get_step_id(self, path):
        try:
            return str(self.result.plan.steps.filter(path=path).first().id)
        except AttributeError:
            logger.error(f"Unknown task name {path} for {self.result}")
            return None

    def _pre_task(self, task):
        """
        Before each task, we should check if we've been told to abandon this job.
        """
        if self._flow_canceled():
            raise StopFlowException("Job canceled.")

    def _flow_canceled(self):
        return cache.get(REDIS_JOB_CANCEL_KEY.format(id=self.result.id))


class JobFlow(BasicFlow):
    def _init_logger(self):
        logger = logging.getLogger("cumulusci")
        self.string_buffer = StringIO()
        self.handler = logging.StreamHandler(stream=self.string_buffer)
        self.handler.setFormatter(logging.Formatter())
        logger.addHandler(self.handler)
        logger.setLevel(logging.DEBUG)
        self.logger = logger
        return self.logger

    def _post_flow(self):
        self.logger.removeHandler(self.handler)

    def _post_task(self, task):
        step_id = self._get_step_id(task.name)
        if step_id:
            self.result.results[step_id] = [{"status": OK}]
            self.result.log = obscure_salesforce_log(self.string_buffer.getvalue())
            self.result.save()
        return super()._post_task(task)

    def _post_task_exception(self, task, exception):
        step_id = self._get_step_id(task.name)
        if step_id:
            self.result.results[step_id] = [
                {"status": ERROR, "message": bleach.clean(str(exception))}
            ]
            self.result.log = obscure_salesforce_log(self.string_buffer.getvalue())
            self.result.save()
        return super()._post_task_exception(task, exception)


class PreflightFlow(BasicFlow):
    def _post_flow(self):
        """
        Turn the step_return_values into a merged error dict.

        Each value in step_return_values gets turned into a (key,
        [error_dict]) pair. This is then turned into a dict, merging any
        identical keys by combining their lists of error dicts.

        Finally, this is attached to the result object, which the caller
        must then save.
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
        self.result.results.update(results)

    def _post_task_exception(self, task, e):
        error_result = {"plan": [{"status": ERROR, "message": bleach.clean(str(e))}]}
        self.result.results.update(error_result)

    def _emit_k_v_for_status_dict(self, status):
        if status["status_code"] == OK:
            return None

        if status["status_code"] == ERROR:
            step_id = self._get_step_id(status["path"])
            return (
                step_id,
                [{"status": ERROR, "message": bleach.clean(status.get("msg", ""))}],
            )

        if status["status_code"] == WARN:
            step_id = self._get_step_id(status["path"])
            return (
                step_id,
                [{"status": WARN, "message": bleach.clean(status.get("msg", ""))}],
            )

        if status["status_code"] == SKIP:
            step_id = self._get_step_id(status["path"])
            return (
                step_id,
                [{"status": SKIP, "message": bleach.clean(status.get("msg", ""))}],
            )

        if status["status_code"] == OPTIONAL:
            step_id = self._get_step_id(status["path"])
            return (
                step_id,
                [{"status": OPTIONAL, "message": bleach.clean(status.get("msg", ""))}],
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
