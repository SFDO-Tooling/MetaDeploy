import itertools
from datetime import timedelta
import logging

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.fields import JSONField
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Count
from django.utils import timezone
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

from allauth.socialaccount.models import SocialToken
from asgiref.sync import async_to_sync
from colorfield.fields import ColorField
from model_utils import Choices, FieldTracker
from hashid_field import HashidAutoField

from .push import (
    user_token_expired,
    preflight_completed,
    preflight_failed,
    preflight_invalidated,
    notify_post_task,
    notify_post_job,
)
from .constants import ERROR, OPTIONAL

from .constants import ORGANIZATION_DETAILS


logger = logging.getLogger(__name__)
VERSION_STRING = r'^[a-zA-Z0-9._+-]+$'


class HashIdMixin(models.Model):
    class Meta:
        abstract = True

    id = HashidAutoField(primary_key=True)


class UserQuerySet(models.QuerySet):
    def with_expired_tokens(self):
        token_lifetime_ago = timezone.now() - timedelta(
            minutes=settings.TOKEN_LIFETIME_MINUTES,
        )
        return self.filter(socialaccount__last_login__lte=token_lifetime_ago)


class User(HashIdMixin, AbstractUser):
    objects = UserQuerySet.as_manager()

    @property
    def org_name(self):
        if self.social_account:
            return self.social_account.extra_data.get(
                ORGANIZATION_DETAILS,
                {},
            ).get('Name')
        return None

    @property
    def org_type(self):
        if self.social_account:
            return self.social_account.extra_data.get(
                ORGANIZATION_DETAILS,
                {},
            ).get('OrganizationType')
        return None

    @property
    def instance_url(self):
        if self.social_account:
            return self.social_account.extra_data.get('instance_url', None)
        return None

    @property
    def token(self):
        account = self.social_account
        if account and account.socialtoken_set.exists():
            token = self.social_account.socialtoken_set.first()
            return (token.token, token.token_secret)
        return (None, None)

    @property
    def social_account(self):
        return self.socialaccount_set.first()

    @property
    def valid_token_for(self):
        if all(self.token) and self.instance_url:
            return self.instance_url
        return None

    def expire_token(self):
        count, _ = SocialToken.objects.filter(account__user=self).delete()
        if count:
            async_to_sync(user_token_expired)(self)


class SlugMixin:
    """
    Please provide:

        self.slug_class: the class that implements slugs for this model.
        self.slug_queryset: the name of the queryset for slugs for this
            model.
    """

    def _find_unique_slug(self, original):
        max_length = 50  # This from SlugField

        candidate = original
        for i in itertools.count(1):
            if not self.slug_class.objects.filter(slug=candidate).exists():
                return candidate

            suffix = f'-{i}'
            candidate = candidate[:max_length - len(suffix)] + suffix

    @property
    def slug(self):
        slug = self.slug_queryset.filter(is_active=True).first()
        if slug:
            return slug.slug
        return None

    def ensure_slug(self):
        if not self.slug_queryset.filter(is_active=True).exists():
            slug = slugify(self.title)
            slug = self._find_unique_slug(slug)
            self.slug_class.objects.create(
                parent=self,
                slug=slug,
                is_active=True,
            )


class ProductCategory(models.Model):
    title = models.CharField(max_length=256)

    class Meta:
        verbose_name_plural = "product categories"

    def __str__(self):
        return self.title


class ProductSlug(models.Model):
    """
    Rather than have a slugfield directly on the Product model, we have
    a related model. That way, we can have a bunch of slugs that pertain
    to a particular model, and even if the slug changes and someone uses
    an old slug, we can redirect them appropriately.
    """
    slug = models.SlugField(unique=True)
    parent = models.ForeignKey('Product', on_delete=models.PROTECT)
    is_active = models.BooleanField(
        default=True,
        help_text=(
            'If multiple slugs are active, we will default to the most '
            'recent.'
        ),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return self.slug


class ProductQuerySet(models.QuerySet):
    def published(self):
        return self.annotate(
            version__count=Count('version'),
        ).filter(version__count__gte=1)


class Product(HashIdMixin, SlugMixin, models.Model):
    SLDS_ICON_CHOICES = (
        ('', ''),
        ('action', 'action'),
        ('custom', 'custom'),
        ('doctype', 'doctype'),
        ('standard', 'standard'),
        ('utility', 'utility'),
    )

    objects = ProductQuerySet.as_manager()

    title = models.CharField(max_length=256)
    description = models.TextField()
    category = models.ForeignKey(
        ProductCategory,
        on_delete=models.PROTECT,
    )
    color = ColorField(blank=True)
    image = models.ImageField(blank=True)
    icon_url = models.URLField(
        blank=True,
        help_text=(
            'This will take precedence over Color and the SLDS Icons.'
        ),
    )
    slds_icon_category = models.CharField(
        choices=SLDS_ICON_CHOICES,
        default='',
        blank=True,
        max_length=32,
    )
    slds_icon_name = models.CharField(max_length=64, blank=True)
    repo_url = models.URLField(blank=True)

    slug_class = ProductSlug

    @property
    def slug_queryset(self):
        return self.productslug_set

    def __str__(self):
        return self.title

    @property
    def most_recent_version(self):
        return self.version_set.order_by('-created_at').first()

    @property
    def icon(self):
        if self.icon_url:
            return {
                'type': 'url',
                'url': self.icon_url,
            }
        if self.slds_icon_name and self.slds_icon_category:
            return {
                'type': 'slds',
                'category': self.slds_icon_category,
                'name': self.slds_icon_name,
            }
        return None


class VersionManager(models.Manager):
    def get_by_natural_key(self, *, product, label):
        return self.get(product=product, label=label)


class Version(HashIdMixin, models.Model):
    objects = VersionManager()

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    label = models.CharField(
        max_length=1024,
        validators=[RegexValidator(regex=VERSION_STRING)],
    )
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_production = models.BooleanField(default=True)
    commit_ish = models.CharField(
        max_length=256,
        default='master',
        help_text='This is usually a tag, sometimes a branch.',
    )

    class Meta:
        unique_together = (
            ('product', 'label'),
        )

    def natural_key(self):
        return (self.product, self.label)

    def __str__(self):
        return "{}, Version {}".format(self.product, self.label)

    @property
    def primary_plan(self):
        # This will raise an error if the number of primary plans != 1:
        return self.plan_set.filter(tier=Plan.Tier.primary).get()

    @property
    def secondary_plan(self):
        return self.plan_set.filter(tier=Plan.Tier.secondary).first()

    @property
    def additional_plans(self):
        return self.plan_set.filter(tier=Plan.Tier.additional).order_by('id')


class PlanSlug(models.Model):
    """
    Rather than have a slugfield directly on the Plan model, we have
    a related model. That way, we can have a bunch of slugs that pertain
    to a particular model, and even if the slug changes and someone uses
    an old slug, we can redirect them appropriately.
    """
    slug = models.SlugField()
    parent = models.ForeignKey('Plan', on_delete=models.PROTECT)
    is_active = models.BooleanField(
        default=True,
        help_text=(
            'If multiple slugs are active, we will default to the most '
            'recent.'
        ),
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def validate_unique(self, *args, **kwargs):
        super().validate_unique(*args, **kwargs)
        qs = PlanSlug.objects.filter(
            parent__version=self.parent.version,
            slug=self.slug,
        )
        if qs.exists():
            raise ValidationError({
                'slug': ["This must be unique for the Plan's Version."],
            })

    class Meta:
        ordering = ('-created_at',)

    def __str__(self):
        return self.slug


class Plan(HashIdMixin, SlugMixin, models.Model):
    Tier = Choices('primary', 'secondary', 'additional')

    title = models.CharField(max_length=128)
    version = models.ForeignKey(Version, on_delete=models.PROTECT)
    preflight_message = models.TextField(blank=True)
    preflight_flow_name = models.CharField(max_length=256, blank=True)
    flow_name = models.CharField(max_length=64)
    tier = models.CharField(
        choices=Tier,
        default=Tier.primary,
        max_length=64,
    )

    slug_class = PlanSlug

    @property
    def required_step_ids(self):
        return self.step_set.filter(
            is_required=True,
        ).values_list("id", flat=True)

    @property
    def slug_queryset(self):
        return self.planslug_set

    def natural_key(self):
        return (self.version, self.title)

    def __str__(self):
        return "{}, Plan {}".format(self.version, self.title)


class Step(HashIdMixin, models.Model):
    Kind = Choices(
        ('metadata', _('Metadata')),
        ('onetime', _('One Time Apex')),
        ('managed', _('Managed Package')),
        ('data', _('Data')),
    )

    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    name = models.CharField(max_length=1024)
    description = models.TextField(blank=True)
    is_required = models.BooleanField(default=True)
    is_recommended = models.BooleanField(default=True)
    kind = models.CharField(choices=Kind, default=Kind.metadata, max_length=64)
    order_key = models.PositiveIntegerField(default=0)
    task_name = models.CharField(max_length=64)

    class Meta:
        ordering = (
            'order_key',
            'name',
        )

    @property
    def kind_icon(self):
        if self.kind == self.Kind.metadata:
            return 'package'
        if self.kind == self.Kind.onetime:
            return 'apex'
        if self.kind == self.Kind.managed:
            return 'archive'
        if self.kind == self.Kind.data:
            return 'paste'
        return None

    def __str__(self):
        return f'Step {self.name} of {self.plan.title} ({self.order_key})'


class JobQuerySet(models.QuerySet):
    def all_completed_step_ids(self, *, user, plan):
        step_names = itertools.chain(*self.filter(
            user=user,
            plan=plan,
        ).order_by("-created_at").values_list("completed_steps", flat=True))
        return Step.objects.filter(
            name__in=step_names,
        ).values_list("id", flat=True)


class Job(HashIdMixin, models.Model):
    Status = Choices("started", "complete", "failed")
    tracker = FieldTracker(fields=("completed_steps", "status"))

    objects = JobQuerySet.as_manager()

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    steps = models.ManyToManyField(Step)
    organization_url = models.URLField(blank=True)
    # This should be a list of step names:
    completed_steps = JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    enqueued_at = models.DateTimeField(null=True)
    job_id = models.UUIDField(null=True)
    status = models.CharField(
        choices=Status,
        max_length=64,
        default=Status.started,
    )
    org_name = models.CharField(blank=True, max_length=256)
    org_type = models.CharField(blank=True, max_length=256)
    is_public = models.BooleanField(default=False)

    def visible_to(self, user):
        return self.is_public or user.is_staff or user == self.user

    def skip_tasks(self):
        return [
            step.task_name
            for step
            in set(self.plan.step_set.all()) - set(self.steps.all())
        ]

    def save(self, *args, **kwargs):
        ret = super().save(*args, **kwargs)
        try:
            steps_has_changed = self.tracker.has_changed("completed_steps")
            if steps_has_changed:
                async_to_sync(notify_post_task)(self)
            status_has_changed = self.tracker.has_changed("status")
            if status_has_changed:
                async_to_sync(notify_post_job)(self)
        except RuntimeError as error:
            logger.warn(f"RuntimeError: {error}")
        return ret


class PreflightResultQuerySet(models.QuerySet):
    def most_recent(self, *, user, plan, is_valid_and_complete=True):
        kwargs = {
            "plan": plan,
            "user": user,
        }
        if is_valid_and_complete:
            kwargs.update({
                "is_valid": True,
                "status": PreflightResult.Status.complete,
            })
        return self.filter(**kwargs).order_by(
            '-created_at',
        ).first()


class PreflightResult(models.Model):
    Status = Choices("started", "complete", "failed")

    tracker = FieldTracker(fields=("status", "is_valid"))

    objects = PreflightResultQuerySet.as_manager()

    organization_url = models.URLField()
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    created_at = models.DateTimeField(auto_now_add=True)
    is_valid = models.BooleanField(default=True)
    status = models.CharField(
        choices=Status,
        max_length=64,
        default=Status.started,
    )
    # Maybe we don't use foreign keys here because we want the result to
    # remain static even if steps are subsequently changed:
    results = JSONField(default=dict, blank=True)
    # It should take the shape of:
    # {
    #   <definitive name>: [... errors],
    #   ...
    # }

    def has_any_errors(self):
        return any((
            val
            for val
            in itertools.chain(*self.results.values())
            if val.get("status", None) == ERROR
        ))

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
        return [
            str(k)
            for k, v
            in self.results.items()
            if any([
                status["status"] == OPTIONAL
                for status
                in v
            ])
        ]

    def _push_if_condition(self, condition, fn):
        if condition:
            async_to_sync(fn)(self)

    def push_if_completed(self):
        has_completed = (
            self.tracker.has_changed("status")
            and self.status == PreflightResult.Status.complete
        )
        self._push_if_condition(has_completed, preflight_completed)

    def push_if_failed(self):
        has_failed = (
            self.tracker.has_changed("status")
            and self.status == PreflightResult.Status.failed
        )
        self._push_if_condition(has_failed, preflight_failed)

    def push_if_invalidated(self):
        is_invalidated = (
            self.tracker.has_changed("is_valid")
            and not self.is_valid
        )
        self._push_if_condition(is_invalidated, preflight_invalidated)

    def save(self, *args, **kwargs):
        ret = super().save(*args, **kwargs)

        self.push_if_completed()
        self.push_if_failed()
        self.push_if_invalidated()

        return ret
