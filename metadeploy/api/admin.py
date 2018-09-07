from django.contrib import admin

from .models import (
    Product,
    Version,
)


admin.site.register(Product)
admin.site.register(Version)
