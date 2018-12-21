from django.core.management.base import BaseCommand
from scheduler.models import RepeatableJob

from ...models import (
    AllowedList,
    Job,
    Plan,
    PlanSlug,
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
            RepeatableJob,
            PreflightResult,
            Step,
            PlanSlug,
            Plan,
            Version,
            ProductSlug,
            Product,
            ProductCategory,
            AllowedList,
        ]

        for model_class in ordered_models:
            model_class.objects.all().delete()
