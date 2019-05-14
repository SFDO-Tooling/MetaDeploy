from django_filters import rest_framework as filters

from .models import Plan


class PlanFilter(filters.FilterSet):
    slug = filters.CharFilter(field_name="plan_template__planslug__slug")
    version_label = filters.CharFilter(field_name="version__label")
    product_slug = filters.CharFilter(field_name="version__product__productslug__slug")

    class Meta:
        model = Plan
        fields = ("slug", "version_label", "product_slug")
