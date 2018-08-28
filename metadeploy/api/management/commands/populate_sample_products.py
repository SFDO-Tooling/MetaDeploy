from django.core.management.base import BaseCommand

from ...models import Product


class Command(BaseCommand):
    help = 'Add some sample Products to the database.'

    def handle(self, *args, **options):
        for i in range(6):
            Product.objects.create(
                title=f'Sample Salesforce Product {i}',
                description=f'Description for sample Salesforce product {i}: '
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed '
                'do eiusmod tempor incididunt ut labore et dolore magna '
                'aliqua. Tellus elementum sagittis vitae et leo duis ut diam. '
                'Sem fringilla ut morbi tincidunt augue interdum velit '
                'euismod. Volutpat est velit egestas dui id ornare arcu. '
                'Viverra tellus in hac habitasse platea dictumst. Nulla '
                'facilisi etiam dignissim diam.',
                version='0.1.0',
                category='salesforce',
            )
        for i in range(6):
            Product.objects.create(
                title=f'Sample Community Product {i}',
                description=f'Description for sample community product {i}: '
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed '
                'do eiusmod tempor incididunt ut labore et dolore magna '
                'aliqua. Tellus elementum sagittis vitae et leo duis ut diam. '
                'Sem fringilla ut morbi tincidunt augue interdum velit '
                'euismod. Volutpat est velit egestas dui id ornare arcu. '
                'Viverra tellus in hac habitasse platea dictumst. Nulla '
                'facilisi etiam dignissim diam.',
                version='0.1.0',
                category='community',
            )
