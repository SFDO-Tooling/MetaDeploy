from django.core.management.base import BaseCommand

from ...models import Product


class Command(BaseCommand):
    help = 'Add some sample Products to the database.'

    def handle(self, *args, **options):
        for i in range(3):
            Product.objects.create(
                title=f'Sample Product {i}',
                description=f'Description for sample product {i}',
                version='0.1.0',
            )
