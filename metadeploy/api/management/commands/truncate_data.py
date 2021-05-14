from django.core.management.base import BaseCommand

from ...models import (
    AllowedList,
    AllowedListOrg,
    Job,
    Plan,
    PlanSlug,
    PlanTemplate,
    PreflightResult,
    Product,
    ProductCategory,
    ProductSlug,
    Step,
    Version,
)


class Command(BaseCommand):
    help = "Delete all API data, without touching users or social apps"

    def handle(self, *args, **options):
        ordered_models = [
            Job,
            PreflightResult,
            Step,
            PlanSlug,
            Plan,
            PlanTemplate,
            Version,
            ProductSlug,
            Product,
            ProductCategory,
            AllowedListOrg,
            AllowedList,
        ]

        for model_class in ordered_models:
            model_class.objects.all().delete()
