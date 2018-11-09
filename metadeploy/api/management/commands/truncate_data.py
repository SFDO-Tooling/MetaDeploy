from django.core.management.base import BaseCommand

from scheduler.models import RepeatableJob

from ...models import (
    ProductCategory,
    ProductSlug,
    Product,
    Job,
    Version,
    PlanSlug,
    Plan,
    Step,
    PreflightResult,
)


class Command(BaseCommand):
    help = 'Delete all API data, without touching users or social apps'

    def handle(self, *args, **options):
        ordered_models = [
            Job,
            RepeatableJob,
            PreflightResult,
            Step,
            PlanSlug,
            Plan,
            Version,
            ProductSlug,
            Product,
            ProductCategory,
        ]

        for model_class in ordered_models:
            model_class.objects.all().delete()
