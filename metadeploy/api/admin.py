from django.contrib import admin

from .models import (
    AllowedList,
    AllowedListOrg,
    Job,
    Plan,
    PlanSlug,
    PreflightResult,
    Product,
    ProductCategory,
    ProductSlug,
    Step,
    User,
    Version,
)


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
    autosuggest_fields = ("plan", "steps", "user")
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
    search_fields = ("user", "plan", "org_name")


@admin.register(Plan)
class PlanAdmin(admin.ModelAdmin):
    autosuggest_fields = ("version",)
    list_filter = ("version__product", "tier", "is_listed")
    list_display = ("title", "product", "version_label", "tier", "is_listed")
    list_select_related = ("version", "version__product")
    search_fields = ("title", "version", "version__product")

    def product(self, obj):
        return obj.version.product

    product.admin_order_field = "plan__version__product__title"

    def version_label(self, obj):
        return obj.version.label

    version_label.admin_order_field = "plan__version__label"
    version_label.short_description = "Version"


@admin.register(PlanSlug)
class PlanSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(PreflightResult)
class PreflightResult(admin.ModelAdmin, PlanMixin):
    autosuggest_fields = ("plan", "user")
    list_filter = ("status", "is_valid", "plan__version__product")
    list_display = ("user", "status", "is_valid", "plan_title", "product", "version")
    list_select_related = ("user", "plan", "plan__version", "plan__version__product")
    search_fields = ("user", "plan", "exception")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "order_key")
    search_fields = ("title", "description")


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ("title", "order_key")


@admin.register(ProductSlug)
class ProductSlugAdmin(admin.ModelAdmin):
    list_display = ("slug", "parent")


@admin.register(Step)
class StepAdmin(admin.ModelAdmin, PlanMixin):
    autosuggest_fields = ("plan",)
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


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ("username", "is_active", "is_staff", "is_superuser", "date_joined")


@admin.register(Version)
class VersionAdmin(admin.ModelAdmin):
    list_filter = ("product", "is_production", "is_listed")
    list_display = ("label", "product", "is_production", "is_listed", "commit_ish")
