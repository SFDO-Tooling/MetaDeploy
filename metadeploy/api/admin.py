from django.contrib import admin

from .models import (
    User,
    Product,
    ProductSlug,
    ProductCategory,
    Version,
    Plan,
    PlanSlug,
    Step,
    Job,
)


admin.site.register(User)
admin.site.register(Product)
admin.site.register(ProductSlug)
admin.site.register(ProductCategory)
admin.site.register(Version)
admin.site.register(Plan)
admin.site.register(PlanSlug)
admin.site.register(Step)
admin.site.register(Job)
