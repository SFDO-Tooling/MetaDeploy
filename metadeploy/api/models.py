from django.db import models


class Product(models.Model):
    title = models.CharField(max_length=256)
    description = models.TextField()
    version = models.CharField(max_length=256)
