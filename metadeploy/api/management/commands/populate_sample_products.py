from django.core.management.base import BaseCommand

from ...models import Product, Version, Plan


class Command(BaseCommand):
    help = 'Add some sample Products/Versions/Plans to the database.'

    def create_version(self, product):
        return Version.objects.create(
            product=product,
            label='0.3.1',
            description='This is a description of the product version.',
        )

    def create_plan(self, version, title='Full Install', tier='primary'):
        return Plan.objects.create(
            version=version,
            title=title,
            tier=tier,
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
        )
        version1 = self.create_version(product1)
        self.create_plan(version1)
        self.create_plan(
            version1,
            title='Reports and Dashboards',
            tier='secondary',
        )
        self.create_plan(
            version1,
            title='Account Record Types',
            tier='additional',
        )
        self.create_plan(
            version1,
            title='Mobile Configuration',
            tier='additional',
        )

        product2 = Product.objects.create(
            title=f'Red Salesforce Product',
            description=f'This product should have a red icon.',
            category='salesforce',
            color='#c23934',
        )
        version2 = self.create_version(product2)
        self.create_plan(version2)

        product3 = Product.objects.create(
            title=f'Custom Icon Salesforce Product',
            description=f'This product should have a custom icon.',
            category='salesforce',
            icon_url=(
                    'https://lightningdesignsystem.com/assets/images'
                    '/avatar3.jpg'
            ),
        )
        version3 = self.create_version(product3)
        self.create_plan(version3)

        product4 = Product.objects.create(
            title=f'Custom SLDS Icon Salesforce Product',
            description=f'This product should have a custom SLDS icon.',
            category='salesforce',
            slds_icon_category='utility',
            slds_icon_name='world',
        )
        version4 = self.create_version(product4)
        self.create_plan(version4)

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
            version = self.create_version(product)
            self.create_plan(version)
