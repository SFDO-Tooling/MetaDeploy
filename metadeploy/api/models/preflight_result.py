import logging
from django.db import models
from django.db.models import Choices, JSONField
from django.conf import settings
from metadeploy.api.push import (
    notify_org_result_changed,
    preflight_canceled,
    preflight_completed,
    preflight_failed,
    preflight_invalidated,
)
from cumulusci.core.config import FlowConfig
from cumulusci.core.flowrunner import PreflightFlowCoordinator
from model_utils import FieldTracker
from asgiref.sync import async_to_sync

from metadeploy.api.models import Plan, ScratchOrg
from metadeploy.api.flows import PreflightFlowCallback
from metadeploy.api.constants import OPTIONAL, HIDE, SKIP, ERROR


logger = logging.getLogger(__name__)


class PreflightResultQuerySet(models.QuerySet):
    def most_recent(self, *, org_id, plan, is_valid_and_complete=True):
        kwargs = {"org_id": org_id, "plan": plan}
        if is_valid_and_complete:
            kwargs.update({"is_valid": True, "status": PreflightResult.Status.complete})
        return self.filter(**kwargs).order_by("-created_at").first()


class PreflightResult(models.Model):
    Status = Choices("started", "complete", "failed", "canceled")

    tracker = FieldTracker(fields=("status", "is_valid"))

    objects = PreflightResultQuerySet.as_manager()

    org_id = models.CharField(null=True, blank=True, max_length=18)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(auto_now=True)
    is_valid = models.BooleanField(default=True)
    status = models.CharField(choices=Status, max_length=64, default=Status.started)
    canceled_at = models.DateTimeField(
        null=True,
        help_text=(
            "The time at which the Job canceled itself, likely just a bit after it was "
            "told to cancel itself."
        ),
    )
    log = models.TextField(blank=True)

    # Maybe we don't use foreign keys here because we want the result to
    # remain static even if steps are subsequently changed:
    results = JSONField(default=dict, blank=True)
    # It should take the shape of:
    # {
    #   <definitive name>: [... errors],
    #   ...
    # }

    exception = models.TextField(null=True)
    is_release_test = models.BooleanField(default=False)

    @property
    def instance_url(self):
        if self.user:
            return self.user.instance_url

    def subscribable_by(self, user, session):
        # Restrict this to staff users, Preflight owners and users who have a valid
        # scratch_org `uuid` in their session (matching this Preflight):
        if user.is_staff or self.user == user:
            return True
        scratch_org = ScratchOrg.objects.get_from_session(session)
        return scratch_org and scratch_org.org_id == self.org_id

    def has_any_errors(self):
        for results in self.results.values():
            if any(
                (result for result in results if result.get("status", None) == ERROR)
            ):
                return True
        return False

    @property
    def optional_step_ids(self):
        """
        self.results is a dict mapping a unique identifier for a step to
        a list of errors, warnings, and other outcomes of preflighting
        that step. Right now, the unique identifier is the step's PK in
        the Metadeploy database, but we may change that if we reconsider
        it. However, currently, this is most convenient for the
        frontend. This key is set by PreflightFlow._get_step_id.

        So this will return a list of step PKs, for now.
        """
        optional_step_pks = []
        for step_id, results in self.results.items():
            for result in results:
                if result["status"] in (OPTIONAL, HIDE, SKIP):
                    optional_step_pks.append(step_id)

        return optional_step_pks

    def _push_if_condition(self, condition, fn):
        if condition:
            async_to_sync(fn)(self)

    def push_to_org_subscribers(self, is_new, changed):
        self._push_if_condition(
            is_new or "status" in changed, notify_org_result_changed
        )

    def push_if_completed(self, changed):
        has_completed = (
            "status" in changed and self.status == PreflightResult.Status.complete
        )
        self._push_if_condition(has_completed, preflight_completed)

    def push_if_failed(self, changed):
        has_failed = (
            "status" in changed and self.status == PreflightResult.Status.failed
        )
        self._push_if_condition(has_failed, preflight_failed)

    def push_if_canceled(self, changed):
        has_canceled = (
            "status" in changed and self.status == PreflightResult.Status.canceled
        )
        self._push_if_condition(has_canceled, preflight_canceled)

    def push_if_invalidated(self, changed):
        is_invalidated = "is_valid" in changed and not self.is_valid
        self._push_if_condition(is_invalidated, preflight_invalidated)

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        changed = self.tracker.changed()

        ret = super().save(*args, **kwargs)

        try:
            self.push_to_org_subscribers(is_new, changed)
            self.push_if_completed(changed)
            self.push_if_failed(changed)
            self.push_if_canceled(changed)
            self.push_if_invalidated(changed)
        except RuntimeError as error:  # pragma: nocover
            logger.warn(f"RuntimeError: {error}")

        return ret

    def run(self, ctx, plan, steps, org):
        flow_config = FlowConfig({"checks": plan.preflight_checks, "steps": {}})
        flow_coordinator = PreflightFlowCoordinator(
            ctx.project_config,
            flow_config,
            name="preflight",
            callbacks=PreflightFlowCallback(self),
        )
        flow_coordinator.steps = steps
        flow_coordinator.run(org)
