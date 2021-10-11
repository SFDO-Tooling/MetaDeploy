from django.db import models

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