from django.db import models
from django.db.models import Count
from parler.models import TranslatedFields
from parler.managers import TranslatableQuerySet
from parler.models import TranslatableModel, TranslatedFields
from sfdo_template_helpers.slugs import AbstractSlug, SlugMixin
from colorfield.fields import ColorField
from django.utils.translation import gettext_lazy as _

from metadeploy.api.constants import PRODUCT_LAYOUTS
from metadeploy.api.models import AllowedListAccessMixin
from metadeploy.api.models.util import MarkdownField, HashIdMixin


class ProductCategory(TranslatableModel):
    class Meta:
        verbose_name_plural = "product categories"
        ordering = ("order_key",)

    order_key = models.PositiveIntegerField(default=0)
    is_listed = models.BooleanField(default=True)

    translations = TranslatedFields(
        title=models.CharField(max_length=256),
        description=MarkdownField(),
    )

    @property
    def description_markdown(self):
        return self._get_translated_model(use_fallback=True).description_markdown

    def __str__(self):
        return self.title

    def get_translation_strategy(self):
        return "fields", f"{self.title}:product_category"


class ProductSlug(AbstractSlug):
    parent = models.ForeignKey("Product", on_delete=models.CASCADE)


class ProductQuerySet(TranslatableQuerySet):
    def published(self):
        return (
            self.annotate(version__count=Count("version"))
            .filter(version__count__gte=1)
            .order_by("order_key")
        )


class Product(HashIdMixin, SlugMixin, AllowedListAccessMixin, TranslatableModel):
    SLDS_ICON_CHOICES = (
        ("", ""),
        ("action", "action"),
        ("custom", "custom"),
        ("doctype", "doctype"),
        ("standard", "standard"),
        ("utility", "utility"),
    )

    class Meta:
        ordering = ("category__order_key", "order_key")

    objects = ProductQuerySet.as_manager()

    translations = TranslatedFields(
        title=models.CharField(max_length=256),
        short_description=models.TextField(blank=True),
        description=MarkdownField(),
        click_through_agreement=MarkdownField(),
        error_message=MarkdownField(),
    )

    @property
    def description_markdown(self):
        return self._get_translated_model(use_fallback=True).description_markdown

    @property
    def click_through_agreement_markdown(self):
        return self._get_translated_model(
            use_fallback=True
        ).click_through_agreement_markdown

    @property
    def error_message_markdown(self):
        return self._get_translated_model(use_fallback=True).error_message_markdown

    category = models.ForeignKey(ProductCategory, on_delete=models.PROTECT)
    color = ColorField(blank=True)
    image = models.ImageField(blank=True)
    icon_url = models.URLField(
        blank=True,
        help_text=_("This will take precedence over Color and the SLDS Icons."),
    )
    slds_icon_category = models.CharField(
        choices=SLDS_ICON_CHOICES, default="", blank=True, max_length=32
    )
    slds_icon_name = models.CharField(max_length=64, blank=True)
    repo_url = models.URLField(blank=True)
    is_listed = models.BooleanField(default=True)
    order_key = models.PositiveIntegerField(default=0)
    layout = models.CharField(
        choices=PRODUCT_LAYOUTS, default=PRODUCT_LAYOUTS.Default, max_length=64
    )

    slug_class = ProductSlug
    slug_field_name = "title"

    @property
    def slug_queryset(self):
        return self.productslug_set

    def __str__(self):
        return self.title

    @property
    def most_recent_version(self):
        return self.version_set.exclude(is_listed=False).order_by("-created_at").first()

    @property
    def icon(self):
        if self.icon_url:
            return {"type": "url", "url": self.icon_url}
        if self.slds_icon_name and self.slds_icon_category:
            return {
                "type": "slds",
                "category": self.slds_icon_category,
                "name": self.slds_icon_name,
            }
        return None

    def get_translation_strategy(self):
        return "fields", f"{self.slug}:product"

    def get_absolute_url(self):
        # See src/js/utils/routes.ts
        return f"/products/{self.slug}"
