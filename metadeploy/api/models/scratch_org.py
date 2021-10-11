import uuid

from asgiref.sync import async_to_sync
from django.core.exceptions import ValidationError
from django.core.serializers.json import DjangoJSONEncoder
from django.db import models
from django.db.models import JSONField
from django.utils.translation import gettext_lazy as _
from model_utils import Choices

from metadeploy.api.belvedere_utils import convert_to_18
from metadeploy.api.salesforce import refresh_access_token
from metadeploy.api.push import notify_org_changed

from metadeploy.api.models.util import HashIdMixin
from metadeploy.api.models import Plan


class ScratchOrgQuerySet(models.QuerySet):
    def get_from_session(self, session):
        """
        Retrieve a ScratchOrg from the session by its UUID.

        The UUID is placed in the session when the org is created
        (`scratch_org_post` method on `PlanViewSet`),
        or from a URL query string (`GetScratchOrgIdFromQueryStringMiddleware`).
        """
        uuid = session.get("scratch_org_id")
        try:
            return self.get(uuid=uuid)
        except (ValidationError, ScratchOrg.DoesNotExist):
            return None

    def delete(self):
        for scratch_org in self:
            scratch_org.delete()


class ScratchOrg(HashIdMixin, models.Model):
    Status = Choices("started", "complete", "failed", "canceled")

    plan = models.ForeignKey(Plan, on_delete=models.CASCADE)
    email = models.EmailField(null=True)

    enqueued_at = models.DateTimeField(null=True)
    job_id = models.UUIDField(null=True)
    # This is set in a user's session to let them continue to access
    # this job, without being otherwise auth'd:
    uuid = models.UUIDField(default=uuid.uuid4)
    created_at = models.DateTimeField(auto_now_add=True)
    edited_at = models.DateTimeField(auto_now=True)
    status = models.CharField(choices=Status, max_length=64, default=Status.started)
    config = JSONField(null=True, blank=True, encoder=DjangoJSONEncoder)
    org_id = models.CharField(null=True, blank=True, max_length=18)
    expires_at = models.DateTimeField(null=True, blank=True)

    objects = ScratchOrgQuerySet.as_manager()

    def clean_config(self):
        banned_keys = {"email", "access_token", "refresh_token"}
        if self.config:
            self.config = {
                k: v for (k, v) in self.config.items() if k not in banned_keys
            }

    def save(self, *args, **kwargs):
        self.clean_config()
        ret = super().save(*args, **kwargs)
        if not self.enqueued_at:
            from metadeploy.api.jobs import create_scratch_org_job

            job = create_scratch_org_job.delay(self.id)
            self.job_id = job.id
            self.enqueued_at = job.enqueued_at
            # Yes, this bounces two saves:
            super().save()
        return ret

    def subscribable_by(self, user, session):
        # Restrict this to staff users or users who have a valid scratch_org `uuid` in
        # their session for this org:
        if user.is_staff:
            return True
        scratch_org_id = session.get("scratch_org_id", None)
        return scratch_org_id and scratch_org_id == str(self.uuid)

    def queue_delete(self, should_delete_locally=True):
        from metadeploy.api.jobs import delete_scratch_org_job

        delete_scratch_org_job.delay(self, should_delete_locally=should_delete_locally)

    def delete(
        self, *args, error=None, should_delete_on_sf=True, should_notify=True, **kwargs
    ):
        if should_notify:
            async_to_sync(notify_org_changed)(
                self, error=error, _type="SCRATCH_ORG_DELETED"
            )
        if should_delete_on_sf and self.org_id:
            self.queue_delete()
        else:
            super().delete(*args, **kwargs)

    def fail(self, error):
        # This is not really necessary, since we're going to delete the org soon...
        self.status = ScratchOrg.Status.failed
        self.save()
        async_to_sync(notify_org_changed)(self, error=error)
        self.delete(should_notify=False)

    def fail_job(self):
        self.status = ScratchOrg.Status.failed
        self.save()
        async_to_sync(notify_org_changed)(self)
        self.queue_delete(should_delete_locally=False)

    def complete(self, org_config):
        self.status = ScratchOrg.Status.complete
        self.config = org_config.config
        self.org_id = convert_to_18(org_config.org_id)
        self.expires_at = org_config.expires
        self.save()
        async_to_sync(notify_org_changed)(self, _type="SCRATCH_ORG_CREATED")

    def get_refreshed_org_config(self, org_name=None, keychain=None):
        org_config = refresh_access_token(
            scratch_org=self,
            config=self.config,
            org_name=org_name or self.plan.org_config_name,
            keychain=keychain,
        )
        return org_config

    def get_login_url(self):
        org_config = self.get_refreshed_org_config()
        return org_config.start_url
