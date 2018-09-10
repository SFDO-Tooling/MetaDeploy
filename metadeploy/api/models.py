from django.db import models

from colorfield.fields import ColorField


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
    image_url = models.URLField(blank=True)
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


class Version(models.Model):
    product = models.ForeignKey(Product, on_delete=models.PROTECT)
    label = models.CharField(max_length=64)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    is_production = models.BooleanField(default=True)

    def natural_key(self):
        return (self.product, self.label)

    def __str__(self):
        return "{}, Version {}".format(self.product, self.label)

    @property
    def primary_plan(self):
        # This will raise an error if the number of primary plans != 1:
        return self.plan_set.filter(tier=Plan.Tier.Primary).get()

    @property
    def secondary_plan(self):
        return self.plan_set.filter(tier=Plan.Tier.Secondary).first()

    @property
    def additional_plans(self):
        return self.plan_set.filter(tier=Plan.Tier.Additional).order_by('id')


class Plan(models.Model):
    class Tier:
        Primary = 'primary'
        Secondary = 'secondary'
        Additional = 'additional'

    PLAN_TIERS = (
        (Tier.Primary, 'Primary'),
        (Tier.Secondary, 'Secondary'),
        (Tier.Additional, 'Additional'),
    )

    title = models.CharField(max_length=128)
    version = models.ForeignKey(Version, on_delete=models.PROTECT)
    tier = models.CharField(
        choices=PLAN_TIERS,
        default=Tier.Primary,
        max_length=64,
    )

    def natural_key(self):
        return (self.version, self.title)

    def __str__(self):
        return "{}, Plan {}".format(self.version, self.title)
