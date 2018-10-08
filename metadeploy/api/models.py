import itertools

from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.core.validators import RegexValidator
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Count
from django.utils.text import slugify
from django.utils.translation import gettext_lazy as _

from model_utils import Choices

from colorfield.fields import ColorField


VERSION_STRING = r'^[a-zA-Z0-9._+-]+$'


class User(AbstractUser):
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


class Product(SlugMixin, models.Model):
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
    image = models.ImageField()
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


class Version(models.Model):
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


class Plan(SlugMixin, models.Model):
    Tier = Choices('primary', 'secondary', 'additional')

    title = models.CharField(max_length=128)
    version = models.ForeignKey(Version, on_delete=models.PROTECT)
    preflight_message = models.TextField(blank=True)
    tier = models.CharField(
        choices=Tier,
        default=Tier.primary,
        max_length=64,
    )

    slug_class = PlanSlug

    @property
    def slug_queryset(self):
        return self.planslug_set

    def natural_key(self):
        return (self.version, self.title)

    def __str__(self):
        return "{}, Plan {}".format(self.version, self.title)


class Step(models.Model):
    Kind = Choices(
        ('metadata', _('Metadata')),
        ('onetime', _('One Time Apex')),
        ('managed', _('Managed Package')),
        ('data', _('Data')),
    )

    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    name = models.CharField(max_length=1024)
    description = models.TextField()
    is_required = models.BooleanField(default=True)
    is_recommended = models.BooleanField(default=True)
    kind = models.CharField(choices=Kind, default=Kind.metadata, max_length=64)
    order_key = models.PositiveIntegerField(default=0)
    flow_name = models.CharField(max_length=64)

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


class Job(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
    )
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    steps = models.ManyToManyField(Step)
    created_at = models.DateTimeField(auto_now_add=True)
    enqueued_at = models.DateTimeField(null=True)
    job_id = models.UUIDField(null=True)
