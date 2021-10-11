from django.contrib.sites.models import Site
from django.db import models
from django.utils.translation import gettext_lazy as _
from parler.models import TranslatableModel, TranslatedFields

from metadeploy.api.models.util import MarkdownField


class SiteProfile(TranslatableModel):
    site = models.OneToOneField(Site, on_delete=models.CASCADE)

    translations = TranslatedFields(
        name=models.CharField(max_length=64),
        company_name=models.CharField(max_length=64, blank=True),
        welcome_text=MarkdownField(),
        copyright_notice=MarkdownField(),
    )

    show_metadeploy_wordmark = models.BooleanField(default=True)
    company_logo = models.ImageField(blank=True)
    favicon = models.ImageField(blank=True)

    @property
    def welcome_text_markdown(self):
        return self._get_translated_model(use_fallback=True).welcome_text_markdown

    @property
    def copyright_notice_markdown(self):
        return self._get_translated_model(use_fallback=True).copyright_notice_markdown

    def __str__(self):
        return self.name

    def get_translation_strategy(self):  # pragma: no cover
        return "fields", "siteprofile"
