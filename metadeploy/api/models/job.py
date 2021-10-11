import logging
from django.db import models
from django.conf import settings
from django.db.models import JSONField
from model_utils import Choices, FieldTracker
from asgiref.sync import async_to_sync
from cumulusci.core.flowrunner import FlowCoordinator

from metadeploy.api.models.util import HashIdMixin
from metadeploy.api.models.plan import Plan
from metadeploy.api.models.step import Step
from metadeploy.api.models.cta import ClickThroughAgreement
from metadeploy.api.models.scratch_org import ScratchOrg
from metadeploy.api.models.preflight_result import PreflightResult

from metadeploy.api.push import (
    notify_org_result_changed,
    notify_post_job,
    notify_post_task,
)

from metadeploy.api.flows import JobFlowCallback

logger = logging.getLogger(__name__)


class Job(HashIdMixin, models.Model):
    Status = Choices("started", "complete", "failed", "canceled")
    tracker = FieldTracker(fields=("results", "status"))

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    steps = models.ManyToManyField(Step)
    # This should be a list of step names:
    results = JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(auto_now=True)
    enqueued_at = models.DateTimeField(null=True)
    job_id = models.UUIDField(null=True)
    status = models.CharField(choices=Status, max_length=64, default=Status.started)
    org_id = models.CharField(null=True, blank=True, max_length=18)
    org_type = models.CharField(blank=True, max_length=256)
    full_org_type = models.CharField(null=True, blank=True, max_length=256)
    is_public = models.BooleanField(default=False)
    success_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=("If the job completed successfully, the time of that success."),
    )
    canceled_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text=(
            "The time at which the Job canceled itself, likely just a bit after it was "
            "told to cancel itself."
        ),
    )
    exception = models.TextField(null=True, blank=True)
    log = models.TextField(blank=True)
    click_through_agreement = models.ForeignKey(
        ClickThroughAgreement, on_delete=models.PROTECT, null=True
    )
    is_release_test = models.BooleanField(default=False)

    @property
    def org_name(self):
        if self.user:
            return self.user.org_name

    @property
    def instance_url(self):
        if self.user:
            return self.user.instance_url

    def get_absolute_url(self):
        # See src/js/utils/routes.ts
        return (
            f"/products/{self.plan.version.product.slug}/{self.plan.version.label}/"
            f"{self.plan.slug}/jobs/{self.id}"
        )

    def subscribable_by(self, user, session):
        # Restrict this to public Jobs, staff users, Job owners, or users who have a
        # valid scratch_org `uuid` in their session (matching this Job):
        if self.is_public or user.is_staff or user == self.user:
            return True
        scratch_org = ScratchOrg.objects.get_from_session(session)
        return scratch_org and scratch_org.org_id == self.org_id

    def skip_steps(self):
        return [
            step.step_num for step in set(self.plan.steps.all()) - set(self.steps.all())
        ]

    def _push_if_condition(self, condition, fn):
        if condition:
            async_to_sync(fn)(self)

    def push_to_org_subscribers(self, is_new, changed):
        self._push_if_condition(
            is_new or "status" in changed, notify_org_result_changed
        )

    def push_if_results_changed(self, changed):
        results_has_changed = "results" in changed and self.results != {}
        self._push_if_condition(results_has_changed, notify_post_task)

    def push_if_has_stopped_running(self, changed):
        has_stopped_running = "status" in changed and self.status != Job.Status.started
        self._push_if_condition(has_stopped_running, notify_post_job)

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        changed = self.tracker.changed()

        if is_new:
            ctt, _ = ClickThroughAgreement.objects.get_or_create(
                text=self.plan.version.product.click_through_agreement
            )
            self.click_through_agreement = ctt

        ret = super().save(*args, **kwargs)

        try:
            self.push_to_org_subscribers(is_new, changed)
            self.push_if_results_changed(changed)
            self.push_if_has_stopped_running(changed)
        except RuntimeError as error:  # pragma: no cover
            logger.warn(f"RuntimeError: {error}")

        return ret

    @property
    def error_message(self):
        return (
            self.plan.plan_template.error_message_markdown
            or self.plan.version.product.error_message_markdown
        )

    def invalidate_related_preflight(self):
        # We expect this to be a list of 1 or 0, but we want to account
        # for the possibility of a larger set. We don't use .update
        # because we want to trigger the logic in the preflight's save
        # method.
        preflights = PreflightResult.objects.filter(
            org_id=self.org_id, user=self.user, plan=self.plan, is_valid=True
        )
        for preflight in preflights:
            preflight.is_valid = False
            preflight.save()

    def run(self, ctx, plan, steps, org):
        flow_coordinator = FlowCoordinator.from_steps(
            ctx.project_config, steps, name="default", callbacks=JobFlowCallback(self)
        )
        flow_coordinator.run(org)
