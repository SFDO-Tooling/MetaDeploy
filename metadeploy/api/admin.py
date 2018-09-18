from django.contrib import admin

from .models import (
    Product,
    ProductCategory,
    Version,
    Plan,
)


admin.site.register(Product)
admin.site.register(ProductCategory)
admin.site.register(Version)
admin.site.register(Plan)
