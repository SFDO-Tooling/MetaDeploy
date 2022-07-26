from django.db.models import Q
from django.utils.translation import get_language
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
    search = filters.CharFilter(label="Search", method="search_products")

    class Meta:
        model = Product
        fields = ("slug", "category")

    required_fields = {"slug"}

    def search_products(self, queryset, name, value):
        """Search the product title and tags in the user's language"""
        # Can't use `queryset.translated()` because it only accepts `kwargs` and `Q`
        # objects must be passed as `args`
        return queryset.filter(
            Q(translations__title__icontains=value)
            | Q(translations__tags__icontains=value),
            translations__language_code=get_language(),
        )
