import logging
import uuid
from statistics import median
from typing import Union

from asgiref.sync import async_to_sync
from colorfield.fields import ColorField
from cumulusci.core.config import FlowConfig
from cumulusci.core.flowrunner import (
    FlowCoordinator,
    PreflightFlowCoordinator,
    StepSpec,
)
from cumulusci.core.tasks import BaseTask
from cumulusci.core.utils import import_class
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as BaseUserManager
from django.contrib.postgres.fields import ArrayField
from django.contrib.sites.models import Site
from django.core.exceptions import ValidationError
from django.core.serializers.json import DjangoJSONEncoder
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.db.models import Count, F, Func, JSONField, Q
from django.utils.translation import gettext_lazy as _
from hashid_field import HashidAutoField
from model_utils import Choices, FieldTracker
from parler.managers import TranslatableQuerySet
from parler.models import TranslatableModel, TranslatedFields
from sfdo_template_helpers.crypto import fernet_decrypt
from sfdo_template_helpers.fields import MarkdownField as BaseMarkdownField
from sfdo_template_helpers.slugs import AbstractSlug, SlugMixin

from .belvedere_utils import convert_to_18
from .constants import ERROR, HIDE, OPTIONAL, ORGANIZATION_DETAILS, SKIP
from .flows import JobFlowCallback, PreflightFlowCallback
from .push import (
    notify_org_changed,
    notify_org_result_changed,
    notify_post_job,
    notify_post_task,
    preflight_canceled,
    preflight_completed,
    preflight_failed,
    preflight_invalidated,
)
from .salesforce import refresh_access_token

logger = logging.getLogger(__name__)
VERSION_STRING = r"^[a-zA-Z0-9._+-]+$"
STEP_NUM = r"^[\d\./]+$"
WorkableModel = Union["Job", "PreflightResult"]
ORG_TYPES = Choices("Production", "Scratch", "Sandbox", "Developer")
SUPPORTED_ORG_TYPES = Choices("Persistent", "Scratch", "Both")
PRODUCT_LAYOUTS = Choices("Default", "Card")


class HashIdMixin(models.Model):
    class Meta:
        abstract = True

    id = HashidAutoField(primary_key=True)


class MarkdownField(BaseMarkdownField):
    def __init__(self, *args, **kwargs):
        kwargs["property_suffix"] = kwargs.get("property_suffix", "_markdown")
        kwargs["blank"] = kwargs.get("blank", True)
        kwargs["help_text"] = kwargs.get("help_text", "Markdown is supported")
        super().__init__(*args, **kwargs)


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


class UserManager(BaseUserManager):
    pass


class User(HashIdMixin, AbstractUser):
    objects = UserManager()

    def subscribable_by(self, user, session):
        return self == user

    @property
    def sf_username(self):
        if self.social_account:
            return self.social_account.extra_data.get("preferred_username")

    def _get_org_property(self, key):
        try:
            return self.social_account.extra_data[ORGANIZATION_DETAILS][key]
        except (AttributeError, KeyError):
            return None

    @property
    def org_id(self):
        if self.social_account:
            return self.social_account.extra_data.get("organization_id")

    @property
    def oauth_id(self):
        if self.social_account:
            return self.social_account.extra_data.get("id")

    @property
    def org_name(self):
        return self._get_org_property("Name")

    @property
    def org_type(self):
        return self._get_org_property("OrganizationType")

    @property
    def full_org_type(self):
        org_type = self._get_org_property("OrganizationType")
        is_sandbox = self._get_org_property("IsSandbox")
        has_expiration = self._get_org_property("TrialExpirationDate") is not None
        if org_type is None or is_sandbox is None:
            return None
        if org_type == "Developer Edition" and not is_sandbox:
            return ORG_TYPES.Developer
        if org_type != "Developer Edition" and not is_sandbox:
            return ORG_TYPES.Production
        if is_sandbox and not has_expiration:
            return ORG_TYPES.Sandbox
        if is_sandbox and has_expiration:
            return ORG_TYPES.Scratch

    @property
    def instance_url(self):
        try:
            return self.social_account.extra_data["instance_url"]
        except (AttributeError, KeyError):
            return None

    @property
    def token(self):
        account = self.social_account
        if account and account.socialtoken_set.exists():
            token = self.social_account.socialtoken_set.first()
            return (fernet_decrypt(token.token), fernet_decrypt(token.token_secret))
        return (None, None)

    @property
    def social_account(self):
        return self.socialaccount_set.first()

    @property
    def valid_token_for(self):
        if all(self.token) and self.org_id:
            return self.org_id
        return None


class ProductCategory(TranslatableModel):
    class Meta:
        verbose_name_plural = "product categories"
        ordering = ("order_key",)

    order_key = models.PositiveIntegerField(default=0)
    is_listed = models.BooleanField(default=True)

    translations = TranslatedFields(
        title=models.CharField(max_length=256),
        description=MarkdownField(),
    )

    @property
    def description_markdown(self):
        return self._get_translated_model(use_fallback=True).description_markdown

    def __str__(self):
        return self.title

    def get_translation_strategy(self):
        return "fields", f"{self.title}:product_category"


class ProductSlug(AbstractSlug):
    parent = models.ForeignKey("Product", on_delete=models.CASCADE)


class ProductQuerySet(TranslatableQuerySet):
    def published(self):
        return (
            self.annotate(version__count=Count("version"))
            .filter(version__count__gte=1)
            .order_by("order_key")
        )


class Product(HashIdMixin, SlugMixin, AllowedListAccessMixin, TranslatableModel):
    SLDS_ICON_CHOICES = (
        ("", ""),
        ("action", "action"),
        ("custom", "custom"),
        ("doctype", "doctype"),
        ("standard", "standard"),
        ("utility", "utility"),
    )

    class Meta:
        ordering = ("category__order_key", "order_key")

    objects = ProductQuerySet.as_manager()

    translations = TranslatedFields(
        title=models.CharField(max_length=256),
        short_description=models.TextField(blank=True),
        description=MarkdownField(),
        click_through_agreement=MarkdownField(),
        error_message=MarkdownField(),
    )

    @property
    def description_markdown(self):
        return self._get_translated_model(use_fallback=True).description_markdown

    @property
    def click_through_agreement_markdown(self):
        return self._get_translated_model(
            use_fallback=True
        ).click_through_agreement_markdown

    @property
    def error_message_markdown(self):
        return self._get_translated_model(use_fallback=True).error_message_markdown

    category = models.ForeignKey(ProductCategory, on_delete=models.PROTECT)
    color = ColorField(blank=True)
    image = models.ImageField(blank=True)
    icon_url = models.URLField(
        blank=True,
        help_text=_("This will take precedence over Color and the SLDS Icons."),
    )
    slds_icon_category = models.CharField(
        choices=SLDS_ICON_CHOICES, default="", blank=True, max_length=32
    )
    slds_icon_name = models.CharField(max_length=64, blank=True)
    repo_url = models.URLField(blank=True)
    is_listed = models.BooleanField(default=True)
    order_key = models.PositiveIntegerField(default=0)
    layout = models.CharField(
        choices=PRODUCT_LAYOUTS, default=PRODUCT_LAYOUTS.Default, max_length=64
    )

    slug_class = ProductSlug
    slug_field_name = "title"

    @property
    def slug_queryset(self):
        return self.productslug_set

    def __str__(self):
        return self.title

    @property
    def most_recent_version(self):
        return self.version_set.exclude(is_listed=False).order_by("-created_at").first()

    @property
    def icon(self):
        if self.icon_url:
            return {"type": "url", "url": self.icon_url}
        if self.slds_icon_name and self.slds_icon_category:
            return {
                "type": "slds",
                "category": self.slds_icon_category,
                "name": self.slds_icon_name,
            }
        return None

    def get_translation_strategy(self):
        return "fields", f"{self.slug}:product"

    def get_absolute_url(self):
        # See src/js/utils/routes.ts
        return f"/products/{self.slug}"


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
    publish_date = models.DateTimeField(blank=True, null=True)
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
    # When true, the latest version of the associated product Plan
    # will be run against a scratch org in a one-off dyno after
    # a production release on Heroku.
    regression_test_opt_out = models.BooleanField(default=False)

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

        from ..adminapi.translations import update_translations

        update_translations(self.plan_template.product)
        update_translations(self.plan_template)
        update_translations(self)


class DottedArray(Func):
    """Turns a step number into an array of ints for sorting.

    The step number must be a string including positive integers separated by / and .

    / will be encoded as |-2|
    . will be encoded as |-1|
    Then we can split on | to get an array of ints
    """

    function = "string_to_array"
    template = (
        "%(function)s(replace(replace(%(expressions)s, '.', '|-2|')"
        ", '/', '|-1|'), '|')::int[]"
    )


class Step(HashIdMixin, TranslatableModel):
    Kind = Choices(
        ("metadata", _("Metadata")),
        ("onetime", _("One Time Apex")),
        # This is used for package installation steps regardless of package type,
        # but the internal value is "managed" for backwards-compatibility
        ("managed", _("Package")),
        ("data", _("Data")),
        ("other", _("Other")),
    )

    translations = TranslatedFields(
        name=models.CharField(max_length=1024, help_text="Customer facing label"),
        description=models.TextField(blank=True),
    )

    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="steps")
    is_required = models.BooleanField(default=True)
    is_recommended = models.BooleanField(default=True)
    kind = models.CharField(choices=Kind, default=Kind.metadata, max_length=64)
    path = models.CharField(
        max_length=2048, help_text="dotted path e.g. flow1.flow2.task_name"
    )
    step_num = models.CharField(
        max_length=64,
        help_text="dotted step number for CCI task",
        validators=[RegexValidator(regex=STEP_NUM)],
    )
    task_class = models.CharField(
        max_length=2048, help_text="dotted module path to BaseTask implementation"
    )
    task_config = JSONField(default=dict, blank=True)
    source = JSONField(blank=True, null=True)

    class Meta:
        ordering = (DottedArray(F("step_num")),)

    @property
    def kind_icon(self):
        if self.kind == self.Kind.metadata:
            return "package"
        if self.kind == self.Kind.onetime:
            return "apex"
        if self.kind == self.Kind.managed:
            return "archive"
        if self.kind == self.Kind.data:
            return "paste"
        return None

    def to_spec(self, project_config, skip: bool = False):
        if self.source:
            project_config = project_config.include_source(self.source)
        task_class = import_class(self.task_class)
        assert issubclass(task_class, BaseTask)
        return StepSpec(
            step_num=self.step_num,
            task_name=self.path,  # skip from_flow path construction in StepSpec ctr
            task_config=self.task_config or {"options": {}},
            task_class=task_class,
            skip=skip,
            project_config=project_config,
        )

    def __str__(self):
        return f"Step {self.name} of {self.plan.title} ({self.step_num})"

    def get_translation_strategy(self):
        return "text", f"{self.plan.plan_template.product.slug}:steps"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        from ..adminapi.translations import update_translations

        update_translations(self)


class ClickThroughAgreement(models.Model):
    text = models.TextField()


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
            from .jobs import create_scratch_org_job

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
        from .jobs import delete_scratch_org_job

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


class SiteProfile(TranslatableModel):
    site = models.OneToOneField(Site, on_delete=models.CASCADE)

    translations = TranslatedFields(
        name=models.CharField(max_length=64),
        company_name=models.CharField(max_length=64, blank=True),
        welcome_text=MarkdownField(),
        copyright_notice=MarkdownField(),
    )

    show_metadeploy_wordmark = models.BooleanField(default=True)
    company_logo = models.ImageField(blank=True)
    favicon = models.ImageField(blank=True)

    @property
    def welcome_text_markdown(self):
        return self._get_translated_model(use_fallback=True).welcome_text_markdown

    @property
    def copyright_notice_markdown(self):
        return self._get_translated_model(use_fallback=True).copyright_notice_markdown

    def __str__(self):
        return self.name

    def get_translation_strategy(self):  # pragma: no cover
        return "fields", "siteprofile"


class Translation(models.Model):
    """Holds a generic catalog of translated text.

    Used when a new Plan is published to populate the django-parler translation tables.
    This way translations can be reused.
    """

    context = models.TextField()
    slug = models.TextField()
    text = models.TextField()
    lang = models.CharField(max_length=5)

    class Meta:
        unique_together = (("context", "slug", "lang"),)
