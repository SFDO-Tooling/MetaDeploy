from django_filters import rest_framework as filters

from .models import Plan, Product, Version


class PlanFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="plan_template__planslug__slug")
    product = filters.CharFilter(field_name="plan_template__product")

    class Meta:
        model = Plan
        fields = ("slug", "version", "product")

    required_fields = {"slug", "version", "product"}


class VersionFilter(filters.FilterSet):
    class Meta:
        model = Version
        fields = ("label", "product")

    required_fields = {"label", "product"}


class ProductFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="productslug__slug")

    class Meta:
        model = Product
        fields = ("slug", "category")

    required_fields = {"slug"}
