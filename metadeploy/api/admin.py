from allauth.socialaccount.admin import SocialTokenAdmin
from allauth.socialaccount.models import SocialToken
from django.conf import settings
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.postgres.fields import ArrayField
from django.contrib.sites.admin import SiteAdmin as BaseSiteAdmin
from django.contrib.sites.models import Site
from django.forms.widgets import CheckboxSelectMultiple
from django.shortcuts import redirect
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from parler.admin import TranslatableAdmin, TranslatableStackedInline
from parler.utils.views import TabsList

from .models import (
    ORG_TYPES,
    AllowedList,
    AllowedListOrg,
    ClickThroughAgreement,
    Job,
    Plan,
    PlanSlug,
    PlanTemplate,
    PreflightResult,
    Product,
    ProductCategory,
    ProductSlug,
    ScratchOrg,
    SiteProfile,
    Step,
    Token,
    Translation,
    User,
    Version,
)


class ArrayFieldCheckboxSelectMultiple(CheckboxSelectMultiple):
    def format_value(self, value):
        if isinstance(value, str):
            value = value.split(",")
        return super().format_value(value)


class PlanMixin:
    def plan_title(self, obj):
        return obj.plan.title

    plan_title.admin_order_field = "plan__title"
    plan_title.short_description = "Plan"

    def product(self, obj):
        return obj.plan.version.product

    product.admin_order_field = "plan__version__product__title"

    def version(self, obj):
        return obj.plan.version.label

    version.admin_order_field = "plan__version__label"


class AdminHelpTextMixin:
    """Renders help text at the top of the list and edit views."""

    help_text = None

    def render_change_form(self, request, context, **kw):  # pragma: no cover
        context["help_text"] = self.help_text
        return super().render_change_form(request, context, **kw)

    def changelist_view(self, request, extra_context=None):  # pragma: no cover
        if extra_context is None:
            extra_context = {}
        extra_context["help_text"] = self.help_text
        return super().changelist_view(request, extra_context)


class SingleTabMixin:
    def get_language_tabs(self, request, obj, available_languages, css_class=None):
        """Prevent showing other language tabs"""
        tabs = TabsList(css_class=css_class)
        current_language = self.get_form_language(request, obj)
        tabs.current_is_translated = current_language in available_languages
        tabs.allow_deletion = False
        return tabs


class MetadeployTranslatableAdmin(SingleTabMixin, TranslatableAdmin):
    pass


class MetadeployTranslatableInlineAdmin(SingleTabMixin, TranslatableStackedInline):
    pass


@admin.register(AllowedList)
class AllowedListAdmin(admin.ModelAdmin):
    exclude = ("site",)
    list_display = ("title", "description")
    formfield_overrides = {
        ArrayField: {"widget": ArrayFieldCheckboxSelectMultiple(choices=ORG_TYPES)}
    }


@admin.register(AllowedListOrg)
class AllowedListOrgAdmin(admin.ModelAdmin):
    fields = ("allowed_list", "org_id", "description")
    list_display = ("org_id", "description", "allowed_list", "created_by")
    list_filter = ("allowed_list",)
    search_fields = ("org_id", "description")

    def save_model(self, request, obj, form, change):
        if obj._state.adding:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Job)
class JobAdmin(AdminHelpTextMixin, admin.ModelAdmin, PlanMixin):
    help_text = _(
        "GDPR reminder: Any information in the log or exception which came from the org "
        "must be used for support/debugging purposes only, and not exported from this system."
    )

    autocomplete_fields = ("plan", "steps", "user")
    list_filter = ("status", "plan__version__product")
    list_display = (
        "id",
        "org_id",
        "plan_title",
        "product",
        "version",
        "status",
        "org_type",
        "enqueued_at",
    )
    list_select_related = ("user", "plan", "plan__version", "plan__version__product")
    search_fields = ("job_id", "org_id", "exception")
    exclude = ("site",)


@admin.register(ScratchOrg)
class ScratchOrgAdmin(admin.ModelAdmin, PlanMixin):
    autocomplete_fields = ("plan",)
    list_filter = ("status", "plan__version__product")
    list_display = (
        "org_id",
        "plan_title",
        "product",
        "version",
        "status",
        "enqueued_at",
    )
    list_select_related = ("plan", "plan__version", "plan__version__product")
    search_fields = ("org_id",)
    fields = (
        "plan",
        "enqueued_at",
        "job_id",
        "status",
        "config",
        "org_id",
        "expires_at",
    )


@admin.register(PlanTemplate)
class PlanTemplateAdmin(MetadeployTranslatableAdmin):
    pass


@admin.register(Plan)
class PlanAdmin(MetadeployTranslatableAdmin):
    autocomplete_fields = ("version",)
    list_filter = ("version__product", "tier", "is_listed")
    list_editable = ("is_listed", "order_key")
    list_display = (
        "title",
        "product",
        "version_label",
        "tier",
        "order_key",
        "is_listed",
        "created_at",
    )
    list_select_related = ("version", "version__product")
    search_fields = (
        "translations__title",
        "version__label",
        "version__product__translations__title",
    )
    readonly_fields = ("created_at",)

    def product(self, obj):
        return obj.version.product

    product.admin_order_field = "version__product__title"

    def version_label(self, obj):
        return obj.version.label

    version_label.admin_order_field = "version__label"
    version_label.short_description = "Version"


@admin.register(PlanSlug)
class PlanSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(PreflightResult)
class PreflightResult(AdminHelpTextMixin, admin.ModelAdmin, PlanMixin):
    help_text = _(
        "GDPR reminder: Any information in the log or exception which came from the org "
        "must be used for support/debugging purposes only, and not exported from this system."
    )
    autocomplete_fields = ("plan", "user")
    list_filter = ("status", "is_valid", "plan__version__product")
    list_display = (
        "id",
        "org_id",
        "status",
        "is_valid",
        "plan_title",
        "product",
        "version",
        "created_at",
    )
    list_select_related = ("plan", "plan__version", "plan__version__product")
    search_fields = ("id", "org_id", "exception")


@admin.register(Product)
class ProductAdmin(MetadeployTranslatableAdmin):
    list_display = ("title", "category", "order_key", "is_listed")
    list_editable = ("is_listed", "order_key")
    list_filter = ("is_listed", "category")
    search_fields = ("translations__title", "translations__description")


@admin.register(ProductCategory)
class ProductCategoryAdmin(MetadeployTranslatableAdmin):
    list_display = ("title", "order_key", "is_listed")
    list_editable = ("is_listed", "order_key")
    list_filter = ("is_listed",)
    search_fields = ("translations__title", "translations__description")
    exclude = ("site",)


@admin.register(ProductSlug)
class ProductSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(Step)
class StepAdmin(MetadeployTranslatableAdmin, PlanMixin):
    autocomplete_fields = ("plan",)
    list_display = (
        "name",
        "plan_title",
        "product",
        "version",
        "is_required",
        "is_recommended",
        "kind",
        "path",
    )
    list_filter = ("plan__version__product",)
    search_fields = (
        "translations__name",
        "plan__translations__title",
        "plan__version__label",
        "plan__version__product__translations__title",
        "step_num",
        "path",
    )


@admin.register(User)
class UserAdmin(AdminHelpTextMixin, BaseUserAdmin):
    help_text = _(
        "GDPR reminder: The username, name, and email are personally identifiable information. "
        "They must be used for support/debugging purposes only, and not exported from this system."
    )
    list_display = ("username", "is_active", "is_staff", "is_superuser", "date_joined")


@admin.register(Token)
class TokenAdmin(admin.ModelAdmin):
    list_display = ("key", "user", "created")
    fields = ("user",)
    ordering = ("-created",)


@admin.register(Version)
class VersionAdmin(admin.ModelAdmin):
    list_filter = ("product", "is_production", "is_listed")
    list_editable = ("is_production", "is_listed")
    list_display = ("label", "product", "is_production", "is_listed", "commit_ish")
    search_fields = ("label", "product__translations__title")


@admin.register(ClickThroughAgreement)
class ClickThroughAgreementAdmin(admin.ModelAdmin):
    exclude = ("site",)


@admin.register(Translation)
class TranslationAdmin(admin.ModelAdmin):
    list_display = ("lang", "context", "slug", "text")
    list_filter = ("lang",)
    search_fields = ("context", "slug")
    exclude = ("site",)


# Inline the SiteProfile with Site instances (they are 1-on-1 anyways)
class SiteProfileInlineAdmin(MetadeployTranslatableInlineAdmin):
    model = SiteProfile
    min_num = 1
    max_num = 1

    def has_delete_permission(self, *args, **kwargs):  # pragma: nocover
        """Disable deleting profile inlines, we always want one per Site"""
        return False


admin.site.unregister(Site)


@admin.register(Site)
class SiteAdmin(BaseSiteAdmin):
    inlines = (SiteProfileInlineAdmin,)


# Disable editing SocialTokens
admin.site.unregister(SocialToken)


@admin.register(SocialToken)
class CustomSocialTokenAdmin(SocialTokenAdmin):
    list_display_links = None

    def change_view(self, *args, **kwargs):
        return redirect(reverse("admin:socialaccount_socialtoken_changelist"))


if "binary_database_files" in settings.INSTALLED_APPS:  # pragma: no cover
    from binary_database_files.models import File

    admin.site.register(File)
