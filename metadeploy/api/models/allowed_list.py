

from django.db import models
from django.conf import settings
from django.contrib.postgres.fields import ArrayField

from metadeploy.api.belvedere_utils import convert_to_18
from metadeploy.api.models.util import MarkdownField
from metadeploy.api.constants import ORG_TYPES


class AllowedList(models.Model):
    title = models.CharField(max_length=128, unique=True)
    description = MarkdownField()
    org_type = ArrayField(
        models.CharField(max_length=64, choices=ORG_TYPES),
        blank=True,
        size=4,
        default=list,
        help_text="All orgs of these types will be automatically allowed.",
    )
    list_for_allowed_by_orgs = models.BooleanField(
        default=False,
        help_text=(
            "If a user is allowed only because they have the right Org Type, should "
            "this be listed for them? If not, they can still find it if they happen to "
            "know the address."
        ),
    )

    def __str__(self):
        return self.title


class AllowedListOrg(models.Model):
    allowed_list = models.ForeignKey(
        AllowedList, related_name="orgs", on_delete=models.CASCADE
    )
    org_id = models.CharField(max_length=18)
    description = models.TextField(
        help_text=("A description of the org for future reference",)
    )
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if len(self.org_id) == 15:
            self.org_id = convert_to_18(self.org_id)
        return super().save(*args, **kwargs)


class AllowedListAccessMixin(models.Model):
    class Meta:
        abstract = True

    visible_to = models.ForeignKey(
        AllowedList, on_delete=models.PROTECT, null=True, blank=True
    )

    def is_visible_to(self, user):
        return not self.visible_to or (
            user.is_authenticated
            and (
                user.is_superuser
                or user.full_org_type in self.visible_to.org_type
                or self.visible_to.orgs.filter(org_id=user.org_id).exists()
            )
        )

    def is_listed_by_org_only(self, user):
        """
        Are we only seeing this because we're in an allowed org type?
        """
        return self.visible_to and (
            user.is_authenticated
            and user.full_org_type in self.visible_to.org_type
            and not self.visible_to.list_for_allowed_by_orgs
        )