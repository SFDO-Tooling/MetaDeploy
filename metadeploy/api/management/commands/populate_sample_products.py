from django.core.management.base import BaseCommand
from django.utils.text import slugify

from ...models import (
    Product,
    ProductCategory,
    Version,
    Plan,
    PlanSlug,
)


class Command(BaseCommand):
    help = 'Add some sample Products/Versions/Plans to the database.'

    def create_product(self, **kwargs):
        title = kwargs.pop('title', 'Sample Product')
        description = kwargs.pop(
            'description',
            (
                f'Description for {title}: '
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit, '
                'sed do eiusmod tempor incididunt ut labore et dolore '
                'magna aliqua. Tellus elementum sagittis vitae et leo '
                'duis ut diam. Sem fringilla ut morbi tincidunt augue '
                'interdum velit euismod. Volutpat est velit egestas dui '
                'id ornare arcu. Viverra tellus in hac habitasse platea '
                'dictumst. Nulla facilisi etiam dignissim diam.'
            ),
        )
        product = Product.objects.create(
            title=title,
            description=description,
            **kwargs,
        )
        product.ensure_slug()
        return product

    def create_version(self, product, label='0.3.1'):
        return Version.objects.create(
            product=product,
            label=label,
            description='This is a description of the product version.',
        )

    def create_plan(self, version, title='Full Install', tier='primary'):
        plan = Plan.objects.create(
            version=version,
            title=title,
            tier=tier,
        )
        PlanSlug.objects.create(
            parent=plan,
            slug=slugify(title),
        )
        return plan

    def handle(self, *args, **options):
        sf_category = ProductCategory.objects.create(title='salesforce')
        co_category = ProductCategory.objects.create(title='community')
        product1 = self.create_product(
            title=f'Sample Salesforce Product',
            category=sf_category,
        )
        old_version = self.create_version(product1, '0.2.0')
        self.create_plan(old_version)
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

        product2 = self.create_product(
            title=f'Red Salesforce Product',
            description=f'This product should have a red icon.',
            category=sf_category,
            color='#c23934',
        )
        version2 = self.create_version(product2)
        self.create_plan(version2)

        product3 = self.create_product(
            title=f'Custom Icon Salesforce Product',
            description=f'This product should have a custom icon.',
            category=sf_category,
            icon_url=(
                    'https://lightningdesignsystem.com/assets/images'
                    '/avatar3.jpg'
            ),
        )
        version3 = self.create_version(product3)
        self.create_plan(version3)

        product4 = self.create_product(
            title=f'Custom SLDS Icon Salesforce Product',
            description=f'This product should have a custom SLDS icon.',
            category=sf_category,
            slds_icon_category='utility',
            slds_icon_name='world',
        )
        version4 = self.create_version(product4)
        self.create_plan(version4)

        for i in range(4):
            product = self.create_product(
                title=f'Sample Community Product {i}',
                category=co_category,
            )
            version = self.create_version(product)
            self.create_plan(version)
