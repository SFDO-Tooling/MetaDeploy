from django.db import models


class Product(models.Model):
    CATEGORY_CHOICES = (
        ('sfdo', "SFDO"),
        ('community', "Community"),
    )

    title = models.CharField(max_length=256)
    description = models.TextField()
    version = models.CharField(max_length=256)
    category = models.CharField(
        choices=CATEGORY_CHOICES,
        default='sfdo',
        max_length=256,
    )
