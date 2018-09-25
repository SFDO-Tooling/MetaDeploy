from django.core.management.base import BaseCommand

from ...models import (
    ProductCategory,
    ProductSlug,
    Product,
    Job,
    Version,
    PlanSlug,
    Plan,
)


class Command(BaseCommand):
    help = 'Delete all API data, without touching users or social apps'

    def handle(self, *args, **options):
        ordered_models = [
            PlanSlug,
            Plan,
            Version,
            ProductSlug,
            Product,
            ProductCategory,
            Job,
        ]

        for model_class in ordered_models:
            model_class.objects.all().delete()
