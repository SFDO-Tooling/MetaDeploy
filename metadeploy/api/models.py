from django.conf import settings
from django.db import models

from colorfield.fields import ColorField


def get_token_off_user(user):
    token = user.socialaccount_set.first().socialtoken_set.first()
    return token.token, token.token_secret


class ProductCategory(models.Model):
    title = models.CharField(max_length=256)


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
    version = models.CharField(max_length=256)
    category = models.ForeignKey(
        ProductCategory,
        null=True,
        on_delete=models.PROTECT,
    )
    color = ColorField(blank=True)
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


class Job(models.Model):
    token = models.CharField(max_length=256)
    token_secret = models.CharField(max_length=256)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
    )
    instance_url = models.URLField()
    package_url = models.URLField()
    flow_name = models.CharField(max_length=64)
    enqueued_at = models.DateTimeField(null=True)
    job_id = models.UUIDField(null=True)

    def save(self, *args, **kwargs):
        # TODO: I don't like this, we shouldn't munge the data on every
        # save like this:
        self.token, self.token_secret = get_token_off_user(self.user)
        instance = super().save(*args, **kwargs)
        return instance
