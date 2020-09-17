from allauth.socialaccount.admin import SocialTokenAdmin
from allauth.socialaccount.models import SocialToken
from binary_database_files.models import File
from django.conf import settings
from django.contrib import admin
from django.contrib.postgres.fields import ArrayField
from django.forms.widgets import CheckboxSelectMultiple
from django.shortcuts import redirect
from django.urls import reverse
from parler.admin import TranslatableAdmin

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
    SiteProfile,
    Step,
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


@admin.register(AllowedList)
class AllowedListAdmin(admin.ModelAdmin):
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
class JobAdmin(admin.ModelAdmin, PlanMixin):
    autocomplete_fields = ("plan", "steps", "user")
    list_filter = ("status", "plan__version__product")
    list_display = (
        "user",
        "plan_title",
        "product",
        "version",
        "status",
        "org_type",
        "org_name",
        "enqueued_at",
    )
    list_select_related = ("user", "plan", "plan__version", "plan__version__product")
    search_fields = ("user__username", "org_name", "org_id", "exception")


@admin.register(PlanTemplate)
class PlanTemplateAdmin(TranslatableAdmin):
    pass


@admin.register(Plan)
class PlanAdmin(TranslatableAdmin):
    autocomplete_fields = ("version",)
    list_filter = ("version__product", "tier", "is_listed")
    list_display = (
        "title",
        "product",
        "version_label",
        "tier",
        "is_listed",
        "created_at",
    )
    list_select_related = ("version", "version__product")
    search_fields = ("translations__title", "version", "version__product")
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
class PreflightResult(admin.ModelAdmin, PlanMixin):
    autocomplete_fields = ("plan", "user")
    list_filter = ("status", "is_valid", "plan__version__product")
    list_display = (
        "user",
        "status",
        "is_valid",
        "plan_title",
        "product",
        "version",
        "created_at",
    )
    list_select_related = ("user", "plan", "plan__version", "plan__version__product")
    search_fields = ("user", "plan", "exception")


@admin.register(Product)
class ProductAdmin(TranslatableAdmin):
    list_display = ("title", "category", "order_key")
    search_fields = ("translations__title", "translations__description")


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ("title", "order_key")


@admin.register(ProductSlug)
class ProductSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(Step)
class StepAdmin(TranslatableAdmin, PlanMixin):
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
        "plan__title",
        "plan__version__label",
        "plan__version__product",
        "step_num",
        "path",
    )


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "is_active", "is_staff", "is_superuser", "date_joined")
    search_fields = ("username",)


@admin.register(Version)
class VersionAdmin(admin.ModelAdmin):
    list_filter = ("product", "is_production", "is_listed")
    list_display = ("label", "product", "is_production", "is_listed", "commit_ish")
    search_fields = ("label", "product")


@admin.register(ClickThroughAgreement)
class ClickThroughAgreementAdmin(admin.ModelAdmin):
    pass


@admin.register(SiteProfile)
class SiteProfileAdmin(TranslatableAdmin):
    list_display = ("name", "site")


@admin.register(Translation)
class TranslationAdmin(admin.ModelAdmin):
    list_display = ("lang", "context", "slug", "text")
    list_filter = ("lang",)


# Disable editing SocialTokens
admin.site.unregister(SocialToken)


@admin.register(SocialToken)
class CustomSocialTokenAdmin(SocialTokenAdmin):
    list_display_links = None

    def change_view(self, *args, **kwargs):
        return redirect(reverse("admin:socialaccount_socialtoken_changelist"))


if "binary_database_files" in settings.INSTALLED_APPS:  # pragma: no cover
    admin.site.register(File)
