from django_filters import rest_framework as filters

from .models import Plan, Product


class PlanFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="plan_template__planslug__slug")
    product = filters.CharFilter(field_name="version__product")

    class Meta:
        model = Plan
        fields = ("slug", "version", "product")


class ProductFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="productslug__slug")

    class Meta:
        model = Product
        fields = ("slug",)
