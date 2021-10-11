from django.db import models
from django.conf import settings
from django.core.exceptions import ValidationError
from django.db.models import JSONField, Q
from django.core.validators import MaxValueValidator, MinValueValidator
from sfdo_template_helpers.slugs import AbstractSlug, SlugMixin
from parler.models import TranslatableModel, TranslatedFields
from model_utils import Choices
from statistics import median

from django.utils.translation import gettext_lazy as _
from metadeploy.api.models.util import HashIdMixin, MarkdownField
from metadeploy.api.models.product import Product
from metadeploy.api.models.job import Job
from metadeploy.api.models.version import Version
from metadeploy.api.models.allowed_list import AllowedListAccessMixin
from metadeploy.api.constants import SUPPORTED_ORG_TYPES


class PlanSlug(AbstractSlug):
    slug = models.SlugField()
    parent = models.ForeignKey("PlanTemplate", on_delete=models.CASCADE)

    def validate_unique(self, *args, **kwargs):
        super().validate_unique(*args, **kwargs)
        qs = PlanSlug.objects.filter(
            parent__product__in=self.get_associated_products(), slug=self.slug
        )
        if qs.exists():
            raise ValidationError(
                {"slug": [_("This must be unique for the Plan's Version.")]}
            )

    def get_associated_products(self):
        return Product.objects.filter(version__plan__plan_template=self.parent)


class PlanTemplate(SlugMixin, TranslatableModel):
    name = models.CharField(max_length=100, blank=True)
    translations = TranslatedFields(
        preflight_message=MarkdownField(),
        post_install_message=MarkdownField(),
        error_message=MarkdownField(),
    )
    product = models.ForeignKey(Product, on_delete=models.PROTECT)

    slug_class = PlanSlug

    @property
    def preflight_message_markdown(self):
        return self._get_translated_model(use_fallback=True).preflight_message_markdown

    @property
    def post_install_message_markdown(self):
        return self._get_translated_model(
            use_fallback=True
        ).post_install_message_markdown

    @property
    def error_message_markdown(self):
        return self._get_translated_model(use_fallback=True).error_message_markdown

    def __str__(self):
        return f"{self.product.title}: {self.name}"

    def get_translation_strategy(self):
        return "fields", f"{self.product.slug}:plan:{self.name}"


class Plan(HashIdMixin, SlugMixin, AllowedListAccessMixin, TranslatableModel):
    Tier = Choices("primary", "secondary", "additional")

    translations = TranslatedFields(
        title=models.CharField(max_length=128),
        preflight_message_additional=MarkdownField(),
        post_install_message_additional=MarkdownField(),
    )

    plan_template = models.ForeignKey(PlanTemplate, on_delete=models.PROTECT)
    version = models.ForeignKey(Version, on_delete=models.PROTECT)
    commit_ish = models.CharField(
        max_length=256,
        null=True,
        blank=True,
        help_text=_(
            "This is usually a tag, sometimes a branch. "
            "Use this to optionally override the Version's commit_ish."
        ),
    )
    order_key = models.PositiveIntegerField(default=0)

    tier = models.CharField(choices=Tier, default=Tier.primary, max_length=64)
    is_listed = models.BooleanField(default=True)
    preflight_checks = JSONField(default=list, blank=True)
    supported_orgs = models.CharField(
        max_length=32,
        choices=SUPPORTED_ORG_TYPES,
        default=SUPPORTED_ORG_TYPES.Persistent,
    )
    org_config_name = models.CharField(max_length=64, default="release", blank=True)
    scratch_org_duration_override = models.IntegerField(
        "Scratch Org duration (days)",
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(30)],
        help_text="Lifetime of Scratch Orgs created for this plan. Will inherit the "
        "global default value if left blank.",
    )
    calculated_average_duration = models.IntegerField(
        "Average duration of a plan (seconds)",
        null=True,
        blank=True,
        validators=[MinValueValidator(0)],
        help_text="The duration between the enqueueing of a job and its successful completion.",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    slug_class = PlanSlug
    slug_field_name = "title"

    @property
    def preflight_message_additional_markdown(self):
        return self._get_translated_model(
            use_fallback=True
        ).preflight_message_additional_markdown

    @property
    def post_install_message_additional_markdown(self):
        return self._get_translated_model(
            use_fallback=True
        ).post_install_message_additional_markdown

    @property
    def required_step_ids(self):
        return self.steps.filter(is_required=True).values_list("id", flat=True)

    @property
    def slug_parent(self):
        return self.plan_template

    @property
    def slug_queryset(self):
        return self.plan_template.planslug_set

    @property
    def average_duration(self):
        durations = [
            (job.success_at - job.enqueued_at)
            for job in Job.objects.filter(plan=self, status=Job.Status.complete)
            .exclude(Q(success_at__isnull=True) | Q(enqueued_at__isnull=True))
            .order_by("-created_at")[: settings.AVERAGE_JOB_WINDOW]
        ]
        if len(durations) < settings.MINIMUM_JOBS_FOR_AVERAGE:
            return None
        return median(durations).total_seconds()

    @property
    def scratch_org_duration(self):
        return self.scratch_org_duration_override or settings.SCRATCH_ORG_DURATION_DAYS

    def natural_key(self):
        return (self.version, self.title)

    def __str__(self):
        return "{}, Plan {}".format(self.version, self.title)

    @property
    def requires_preflight(self):
        has_plan_checks = bool(self.preflight_checks)
        has_step_checks = any(
            step.task_config.get("checks") for step in self.steps.iterator()
        )
        return has_plan_checks or has_step_checks

    def get_translation_strategy(self):
        return (
            "fields",
            f"{self.plan_template.product.slug}:plan:{self.plan_template.name}",
        )

    def get_absolute_url(self):
        # See src/js/utils/routes.ts
        return f"/products/{self.version.product.slug}/{self.version.label}/{self.slug}"

    def is_visible_to(self, *args, **kwargs):
        if self.supported_orgs != SUPPORTED_ORG_TYPES.Persistent:
            return True
        return super().is_visible_to(*args, **kwargs)

    def clean(self):
        if self.visible_to and self.supported_orgs != SUPPORTED_ORG_TYPES.Persistent:
            raise ValidationError(
                {
                    "supported_orgs": _(
                        'Restricted plans (with a "visible to" AllowedList) can only support persistent org types.'
                    )
                }
            )

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        from metadeploy.adminapi.translations import update_translations

        update_translations(self.plan_template.product)
        update_translations(self.plan_template)
        update_translations(self)
