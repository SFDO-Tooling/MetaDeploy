from django.contrib import admin

from .models import (
    Product,
    ProductSlug,
    ProductCategory,
    Version,
    Plan,
)


admin.site.register(Product)
admin.site.register(ProductSlug)
admin.site.register(ProductCategory)
admin.site.register(Version)
admin.site.register(Plan)
