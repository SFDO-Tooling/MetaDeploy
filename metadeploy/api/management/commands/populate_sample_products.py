from django.core.management.base import BaseCommand

from ...models import Product, Version, Plan


class Command(BaseCommand):
    help = 'Add some sample Products/Versions/Plans to the database.'

    def create_version_and_plan(self, product):
        version = Version.objects.create(
            product=product,
            label='0.3.1',
            description='This is a description of the product version.',
        )
        Plan.objects.create(
            version=version,
            title='Dashboard',
        )

    def handle(self, *args, **options):
        product1 = Product.objects.create(
            title=f'Sample Salesforce Product',
            description=(
                    f'Description for Sample Salesforce Product: '
                    'Lorem ipsum dolor sit amet, consectetur adipiscing elit, '
                    'sed do eiusmod tempor incididunt ut labore et dolore '
                    'magna aliqua. Tellus elementum sagittis vitae et leo '
                    'duis ut diam. Sem fringilla ut morbi tincidunt augue '
                    'interdum velit euismod. Volutpat est velit egestas dui '
                    'id ornare arcu. Viverra tellus in hac habitasse platea '
                    'dictumst. Nulla facilisi etiam dignissim diam.'
                ),
            category='salesforce',
            image_url='https://placekitten.com/g/300/150',
        )
        version1 = Version.objects.create(
            product=product1,
            label='0.3.1',
            description=f'This is the most recent production version.',
        )
        Plan.objects.create(
            version=version1,
            title='Dashboard',
        )
        Plan.objects.create(
            version=version1,
            title='Dashboard + Additional Things',
            tier='secondary',
        )
        Plan.objects.create(
            version=version1,
            title='This Other Thing',
            tier='additional',
        )
        Plan.objects.create(
            version=version1,
            title='Another Additional Thing',
            tier='additional',
        )
        product2 = Product.objects.create(
            title=f'Red Salesforce Product',
            description=f'This product should have a red icon.',
            category='salesforce',
            color='#c23934',
        )
        product3 = Product.objects.create(
            title=f'Custom Icon Salesforce Product',
            description=f'This product should have a custom icon.',
            category='salesforce',
            icon_url=(
                    'https://lightningdesignsystem.com/assets/images'
                    '/avatar3.jpg'
            ),
        )
        product4 = Product.objects.create(
            title=f'Custom SLDS Icon Salesforce Product',
            description=f'This product should have a custom SLDS icon.',
            category='salesforce',
            slds_icon_category='utility',
            slds_icon_name='world',
        )
        self.create_version_and_plan(product2)
        self.create_version_and_plan(product3)
        self.create_version_and_plan(product4)
        for i in range(4):
            product = Product.objects.create(
                title=f'Sample Community Product {i}',
                description=(
                        f'Description for Sample Community Product: '
                        'Lorem ipsum dolor sit amet, consectetur adipiscing '
                        'elit, sed do eiusmod tempor incididunt ut labore et '
                        'dolore magna aliqua. Tellus elementum sagittis vitae '
                        'et leo duis ut diam. Sem fringilla ut morbi '
                        'tincidunt augue interdum velit euismod. Volutpat est '
                        'velit egestas dui id ornare arcu. Viverra tellus in '
                        'hac habitasse platea dictumst. Nulla facilisi etiam '
                        'dignissim diam.'
                    ),
                category='community',
            )
            self.create_version_and_plan(product)
