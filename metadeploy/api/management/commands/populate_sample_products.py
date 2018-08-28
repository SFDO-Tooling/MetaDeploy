from django.core.management.base import BaseCommand

from ...models import Product


class Command(BaseCommand):
    help = 'Add some sample Products to the database.'

    def handle(self, *args, **options):
        Product.objects.create(
            title=f'Sample Salesforce Product',
            description=f'Description for Sample Salesforce Product: '
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
        Product.objects.create(
            title=f'Red Salesforce Product',
            description=f'This product should have a red icon.',
            version='0.1.0',
            category='salesforce',
            color='#c23934',
        )
        Product.objects.create(
            title=f'Custom Icon Salesforce Product',
            description=f'This product should have a custom icon.',
            version='0.1.0',
            category='salesforce',
            icon_url='https://lightningdesignsystem.com/assets/images/'
            'avatar3.jpg',
        )
        Product.objects.create(
            title=f'Custom SLDS Icon Salesforce Product',
            description=f'This product should have a custom SLDS icon.',
            version='0.1.0',
            category='salesforce',
            slds_icon_category='utility',
            slds_icon_name='world',
        )
        for i in range(4):
            Product.objects.create(
                title=f'Sample Community Product {i}',
                description=f'Description for Sample Community Product {i}: '
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
