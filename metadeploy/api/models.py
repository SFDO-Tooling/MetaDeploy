import itertools

from django.db import models
from django.utils.text import slugify

from model_utils import Choices

from colorfield.fields import ColorField


def find_unique_slug(original, slug_class):
    max_length = 50  # This from SlugField

    candidate = original
    for i in itertools.count(1):
        if not slug_class.objects.filter(slug=candidate).exists():
            return candidate

        suffix = f'-{i}'
        candidate = candidate[:max_length - len(suffix)] + suffix


class Product(models.Model):
    CATEGORY_CHOICES = (
        ('salesforce', "Salesforce"),
        ('community', "Community"),
    )
    SLDS_ICON_CHOICES = (
        ('', ''),
        ('action', 'action'),
        ('custom', 'custom'),
        ('doctype', 'doctype'),
        ('standard', 'standard'),
        ('utility', 'utility'),
    )

    title = models.CharField(max_length=256)
    description = models.TextField()
    category = models.CharField(
        choices=CATEGORY_CHOICES,
        default='salesforce',
        max_length=256,
    )
    color = ColorField(blank=True)
    image = models.ImageField()
    icon_url = models.URLField(
        blank=True,
        help_text='This will take precedence over Color and the SLDS Icons.',
    )
    slds_icon_category = models.CharField(
        choices=SLDS_ICON_CHOICES,
        default='',
        blank=True,
        max_length=32,
    )
    slds_icon_name = models.CharField(max_length=64, blank=True)

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

    # TODO This should be extracted and abstracted:
    @property
    def slug(self):
        slug = self.productslug_set.filter(is_active=True).last()
        if slug:
            return slug.slug
        return None

    # TODO This should be extracted and abstracted:
    def ensure_slug(self):
        if not self.productslug_set.filter(is_active=True).exists():
            slug = slugify(self.title)
            slug = find_unique_slug(slug, ProductSlug)
            ProductSlug.objects.create(
                product=self,
                slug=slug,
                is_active=True,
            )


class ProductSlug(models.Model):
    """
    Rather than have a slugfield directly on the Product model, we have
    a related model. That way, we can have a bunch of slugs that pertain
    to a particular model, and even if the slug changes and someone uses
    an old slug, we can redirect them appropriately.
    """
    slug = models.SlugField(unique=True)
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    is_active = models.BooleanField(
        default=True,
        help_text=(
            'The most recently-created active slug for a Product is the '
            'default slug.'
        ),
    )


class VersionManager(models.Manager):
    def get_by_natural_key(self, *, product, label):
        return self.get(product=product, label=label)


class Version(models.Model):
    objects = VersionManager()

    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    label = models.CharField(max_length=1024)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_production = models.BooleanField(default=True)

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


class Plan(models.Model):
    Tier = Choices('primary', 'secondary', 'additional')

    title = models.CharField(max_length=128)
    version = models.ForeignKey(Version, on_delete=models.PROTECT)
    tier = models.CharField(
        choices=Tier,
        default=Tier.primary,
        max_length=64,
    )

    def natural_key(self):
        return (self.version, self.title)

    def __str__(self):
        return "{}, Plan {}".format(self.version, self.title)

    # TODO This should be extracted and abstracted:
    @property
    def slug(self):
        slug = self.planslug_set.filter(is_active=True).last()
        if slug:
            return slug.slug
        return None

    # TODO This should be extracted and abstracted:
    def ensure_slug(self):
        if not self.planslug_set.filter(is_active=True).exists():
            slug = slugify(self.title)
            slug = find_unique_slug(slug, PlanSlug)
            PlanSlug.objects.create(
                plan=self,
                slug=slug,
                is_active=True,
            )


class PlanSlug(models.Model):
    """
    Rather than have a slugfield directly on the Plan model, we have
    a related model. That way, we can have a bunch of slugs that pertain
    to a particular model, and even if the slug changes and someone uses
    an old slug, we can redirect them appropriately.
    """
    slug = models.SlugField(unique=True)
    plan = models.ForeignKey(Plan, on_delete=models.PROTECT)
    is_active = models.BooleanField(
        default=True,
        help_text=(
            'The most recently-created active slug for a Plan is the '
            'default slug.'
        ),
    )
