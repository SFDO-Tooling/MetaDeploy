from django.contrib import admin

from .models import (
    Product,
    Version,
    Plan,
)


admin.site.register(Product)
admin.site.register(Version)
admin.site.register(Plan)
