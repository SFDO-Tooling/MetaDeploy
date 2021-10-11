from django.core.validators import RegexValidator
from django.db import models
from django.utils.translation import gettext_lazy as _
from parler.managers import TranslatableQuerySet
from parler.models import TranslatableModel, TranslatedFields

from metadeploy.api.models.util import HashIdMixin
from metadeploy.api.constants import VERSION_STRING
from metadeploy.api.models import Product, Plan


class VersionQuerySet(TranslatableQuerySet):
    def get_by_natural_key(self, *, product, label):
        return self.get(product=product, label=label)


class Version(HashIdMixin, TranslatableModel):
    objects = VersionQuerySet.as_manager()

    translations = TranslatedFields(description=models.TextField(blank=True))

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    label = models.CharField(
        max_length=1024, validators=[RegexValidator(regex=VERSION_STRING)]
    )
    created_at = models.DateTimeField(auto_now_add=True)
    is_production = models.BooleanField(default=True)
    commit_ish = models.CharField(
        max_length=256,
        default="master",
        help_text=_("This is usually a tag, sometimes a branch."),
    )
    is_listed = models.BooleanField(default=True)

    class Meta:
        unique_together = (("product", "label"),)

    def natural_key(self):
        return (self.product, self.label)

    def __str__(self):
        return "{}, Version {}".format(self.product, self.label)

    @property
    def primary_plan(self):
        return (
            self.plan_set.filter(tier=Plan.Tier.primary).order_by("-created_at").first()
        )

    @property
    def secondary_plan(self):
        return (
            self.plan_set.filter(tier=Plan.Tier.secondary)
            .order_by("-created_at")
            .first()
        )

    @property
    def additional_plans(self):
        # get the most recently created plan for each plan template
        return (
            self.plan_set.filter(tier=Plan.Tier.additional)
            .order_by("plan_template_id", "order_key", "-created_at")
            .distinct("plan_template_id")
        )

    def get_translation_strategy(self):
        return "fields", f"{self.product.slug}:version:{self.label}"

    def get_absolute_url(self):
        # See src/js/utils/routes.ts
        return f"/products/{self.product.slug}/{self.label}"
