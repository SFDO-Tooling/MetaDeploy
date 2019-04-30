import logging
from io import StringIO

import bleach
import coloredlogs
from cumulusci.core.flowrunner import FlowCallback
from django.core.cache import cache

from .belvedere_utils import obscure_salesforce_log
from .constants import ERROR, OK, OPTIONAL, REDIS_JOB_CANCEL_KEY, SKIP, WARN
from .result_spool_logger import ResultSpoolLogger

logger = logging.getLogger(__name__)


class StopFlowException(Exception):
    pass


class BasicFlowCallback(FlowCallback):
    def __init__(self, ctx):
        self.context = ctx  # will be either a preflight or a job...

    def _get_step_id(self, path):
        try:
            return str(self.context.plan.steps.filter(path=path).first().id)
        except AttributeError:
            logger.error(f"Unknown task name {path} for {self.context}")
            return None

    def pre_task(self, step):
        """
        Before each task, we should check if we've been told to abandon this job.
        """
        if self._flow_canceled():
            raise StopFlowException("Job canceled.")

    def _flow_canceled(self):
        return cache.get(REDIS_JOB_CANCEL_KEY.format(id=self.context.id))


class JobFlowCallback(BasicFlowCallback):
    def pre_flow(self, coordinator):
        logger = logging.getLogger("cumulusci")
        self.string_buffer = StringIO()

        self.handler = logging.StreamHandler(stream=self.string_buffer)
        self.handler.setFormatter(logging.Formatter())
        logger.addHandler(self.handler)

        self.result_handler = ResultSpoolLogger(result=self.context)
        # TODO: This fmt needs to be defined correctly in light of the actual shape of
        # expected logging data?
        self.result_handler.setFormatter(coloredlogs.ColoredFormatter(fmt="%(msg)s"))
        logger.addHandler(self.result_handler)

        logger.setLevel(logging.DEBUG)
        self.logger = logger
        return self.logger

    def post_flow(self, coordinator):
        self.logger.removeHandler(self.handler)

    def pre_task(self, step):
        super().pre_task(step)
        self.set_current_key_by_step(step)

    def post_task(self, step, result):
        step_id = self._get_step_id(step.path)
        if step_id:
            if step_id not in self.context.results:
                self.context.results[step_id] = {}
            if result.exception:
                self.context.results[step_id].update(
                    {"status": ERROR, "message": bleach.clean(str(result.exception))}
                )
            else:
                self.context.results[step_id].update({"status": OK})
            self.context.log = obscure_salesforce_log(self.string_buffer.getvalue())
            self.context.save()
        self.set_current_key_by_step(None)

    def set_current_key_by_step(self, step):
        if step is not None:
            self.result_handler.current_key = self._get_step_id(step.path)
        else:
            self.result_handler.current_key = None


class PreflightFlowCallback(BasicFlowCallback):
    def post_flow(self, coordinator):
        """
        Turn the step_return_values into a merged error dict.

        Each value in step_return_values gets turned into a (key,
        [error_dict]) pair. This is then turned into a dict, merging any
        identical keys by combining their lists of error dicts.

        Finally, this is attached to the result object, and saved.
        """
        results = {}
        for result in coordinator.results:
            kv = self._emit_k_v_for_status_dict(result.return_values)
            if kv is None:
                continue
            k, v = kv
            try:
                results[k].extend(v)
            except KeyError:
                results[k] = v
        self.context.results.update(results)
        self.context.save()

    def post_task(self, step, result):
        if result.exception:
            error_result = {
                "plan": {
                    "status": ERROR,
                    "message": bleach.clean(str(result.exception)),
                }
            }
            self.context.results.update(error_result)
            self.context.save()

    def _emit_k_v_for_status_dict(self, status):
        if status["status_code"] == OK:
            return None

        if status["status_code"] == ERROR:
            step_id = self._get_step_id(status["task_name"])
            return (
                step_id,
                {"status": ERROR, "message": bleach.clean(status.get("msg", ""))},
            )

        if status["status_code"] == WARN:
            step_id = self._get_step_id(status["task_name"])
            return (
                step_id,
                {"status": WARN, "message": bleach.clean(status.get("msg", ""))},
            )

        if status["status_code"] == SKIP:
            step_id = self._get_step_id(status["task_name"])
            return (
                step_id,
                {"status": SKIP, "message": bleach.clean(status.get("msg", ""))},
            )

        if status["status_code"] == OPTIONAL:
            step_id = self._get_step_id(status["task_name"])
            return (
                step_id,
                {"status": OPTIONAL, "message": bleach.clean(status.get("msg", ""))},
            )
