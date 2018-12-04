from django.contrib import admin

from .models import (
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

admin.site.register(User)
admin.site.register(Product)
admin.site.register(ProductSlug)
admin.site.register(ProductCategory)
admin.site.register(Version)
admin.site.register(Plan)
admin.site.register(PlanSlug)
admin.site.register(Job)
admin.site.register(PreflightResult)


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
