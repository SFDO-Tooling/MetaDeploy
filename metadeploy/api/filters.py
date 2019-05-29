from django_filters import rest_framework as filters

from .models import Plan, Product, Version


class PlanFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="plan_template__planslug__slug")
    version = filters.CharFilter(field_name="version__label")
    product = filters.CharFilter(field_name="version__product__productslug__slug")

    class Meta:
        model = Plan
        fields = ("slug", "version", "product")


class VersionFilter(filters.FilterSet):
    product = filters.CharFilter(field_name="product__productslug__slug")

    class Meta:
        model = Version
        fields = ("label", "product")


class ProductFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="productslug__slug")

    class Meta:
        model = Product
        fields = ("slug",)
