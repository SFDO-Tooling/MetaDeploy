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
            PreflightResult,
            Step,
            PlanSlug,
            Plan,
            Version,
            ProductSlug,
            Product,
            ProductCategory,
            Job,
            RepeatableJob,
        ]

        for model_class in ordered_models:
            model_class.objects.all().delete()
