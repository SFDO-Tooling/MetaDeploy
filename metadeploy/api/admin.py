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

admin.site.register(AllowedList)
admin.site.register(Job)
admin.site.register(Plan)
admin.site.register(PlanSlug)
admin.site.register(PreflightResult)
admin.site.register(ProductSlug)
admin.site.register(User)
admin.site.register(Version)


@admin.register(AllowedListOrg)
class AllowedListOrgAdmin(admin.ModelAdmin):
    list_filter = ("allowed_list", "created_by")

    def save_model(self, request, obj, form, change):
        if obj._state.adding:
            obj.created_by = request.user
        super().save_model(request, obj, form, change)


@admin.register(Step)
class StepAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "plan",
        "order_key",
        "is_required",
        "is_recommended",
        "kind",
        "task_name",
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("title", "category", "order_key")


@admin.register(ProductCategory)
class ProductCategoryAdmin(admin.ModelAdmin):
    list_display = ("title", "order_key")
