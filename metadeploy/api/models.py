from django.db import models

from colorfield.fields import ColorField


class Product(models.Model):
    CATEGORY_CHOICES = (
        ('salesforce', "Salesforce"),
        ('community', "Community"),
    )

    title = models.CharField(max_length=256)
    description = models.TextField()
    version = models.CharField(max_length=256)
    category = models.CharField(
        choices=CATEGORY_CHOICES,
        default='salesforce',
        max_length=256,
    )
    color = ColorField(default='#ffffff')
