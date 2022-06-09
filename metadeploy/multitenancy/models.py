from typing import Any, Optional

from django.db import models

from . import current_site_id, site_filtering_enabled


class CurrentSiteManager(models.Manager):
    """Limits objects to those associated with the current Site"""

    use_for_related_fields = True

    def __init__(self, site_field="site"):
        super().__init__()
        self._site_field = site_field

    def get_site_lookup(self) -> Optional[dict[str, Any]]:
        if not site_filtering_enabled():
            return None

        # The existence of `self.instance` tells us we are in a related field lookup.
        # This means `__init__` was called without arguments by Django to create an
        # on-the-fly related manager. We can't trust the value of `self._site_field`, so
        # we copy it from the default manager that was instantiated with the correct
        # `site_field` in the model definition
        if hasattr(self, "instance"):
            self._site_field = self.model._default_manager._site_field

        return {self._site_field + "__id": current_site_id()}

    def get_queryset(self):
        lookup = self.get_site_lookup()
        if lookup is None:
            return super().get_queryset()
        return super().get_queryset().filter(**lookup)


class SiteRelated(models.Model):
    class Meta:
        abstract = True

    site = models.ForeignKey("sites.Site", on_delete=models.CASCADE)

    objects = CurrentSiteManager()

    def save(self, update_site=False, *args, **kwargs):
        """
        Set the `site` to the current Site when the record is first created, or the
        `update_site` argument is explicitly set to `True`.
        """
        if update_site or (self.pk is None and self.site_id is None):
            self.site_id = current_site_id()
        super().save(*args, **kwargs)
