import logging
from io import StringIO

import bleach
import coloredlogs
from cumulusci.core.flowrunner import FlowCallback
from django.core.cache import cache

from .belvedere_utils import obscure_salesforce_log
from .constants import ERROR, OK, REDIS_JOB_CANCEL_KEY
from .result_spool_logger import ResultSpoolLogger

logger = logging.getLogger(__name__)


class StopFlowException(Exception):
    pass


class BasicFlowCallback(FlowCallback):
    def __init__(self, ctx):
        self.context = ctx  # will be either a preflight or a job...

    def _get_step_id(self, **filters):
        try:
            return str(self.context.plan.steps.filter(**filters).first().id)
        except AttributeError:
            logger.error(f"Unknown task {filters} for {self.context}")
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
        self.result_handler.setFormatter(
            coloredlogs.ColoredFormatter(fmt="%(asctime)s %(message)s")
        )
        logger.addHandler(self.result_handler)

        logger.setLevel(logging.DEBUG)
        self.logger = logger
        return self.logger

    def post_flow(self, coordinator):
        """
        Send a password reset email when completing a Job on ScratchOrgs
        """
        from .models import ScratchOrg

        config = coordinator.org_config
        is_scratch = ScratchOrg.objects.filter(org_id=config.org_id).exists()
        if is_scratch:
            config.salesforce_client.restful(
                f"sobjects/User/{config.user_id}/password", method="DELETE"
            )  # Deleting the password forces a password reset email

        self.logger.removeHandler(self.handler)
        self.logger.removeHandler(self.result_handler)

    def pre_task(self, step):
        super().pre_task(step)
        self.set_current_key_by_step(step)

    def post_task(self, step, result):
        job_id = self._get_step_id(step_num=step.step_num)
        if job_id:
            if job_id not in self.context.results:
                self.context.results[job_id] = [{}]
                print(f">>> initialized {self.context.results[job_id]}")

            if result.exception:
                self.context.results[job_id][0].update(
                    {"status": ERROR, "message": bleach.clean(str(result.exception))}
                )
            else:
                self.context.results[job_id][0].update({"status": OK})
            self.context.log = obscure_salesforce_log(self.string_buffer.getvalue())
            self.context.save()
        self.set_current_key_by_step(None)

    def set_current_key_by_step(self, step):
        if step is not None:
            self.result_handler.current_key = self._get_step_id(step_num=step.step_num)
        else:
            self.result_handler.current_key = None


class PreflightFlowCallback(BasicFlowCallback):
    def pre_flow(self, coordinator):
        # capture cumulusci logs into buffer
        self.logger = logging.getLogger("cumulusci")
        self.string_buffer = StringIO()
        self.handler = logging.StreamHandler(stream=self.string_buffer)
        self.logger.addHandler(self.handler)
        self.logger.setLevel(logging.DEBUG)

    def post_flow(self, coordinator):
        """
        Save check results to the result object in the database.

        Also sanitize them for display on the frontend.
        """
        # stop capturing logs and store in the PreflightResult
        self.logger.removeHandler(self.handler)
        self.context.log = obscure_salesforce_log(self.string_buffer.getvalue())

        results = coordinator.preflight_results
        sanitized_results = {}
        for step_num, step_results in results.items():
            step_id = self._get_step_id(step_num=step_num) if step_num else "plan"
            for step_result in step_results:
                if step_result["message"]:
                    step_result["message"] = bleach.clean(step_result["message"])
                if step_id not in sanitized_results:
                    sanitized_results[step_id] = []
                sanitized_results[step_id].append(step_result)

        self.context.results = sanitized_results
        self.context.save()

    def post_task(self, step, result):
        """Report exception evaluating a preflight task."""
        if result.exception:
            error_result = {
                "plan": {
                    "status": ERROR,
                    "message": bleach.clean(str(result.exception)),
                }
            }
            self.context.results.update(error_result)
            self.context.save()
