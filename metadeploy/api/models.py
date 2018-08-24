from django.db import models


class Project(models.Model):
    title = models.CharField(max_length=256)
    description = models.TextField()
    version = models.CharField(max_length=256)
