from django.core.management.base import BaseCommand
from django.utils.text import slugify
from django.utils import timezone

from scheduler.models import RepeatableJob

from ...models import (
    Product,
    ProductCategory,
    Version,
    Plan,
    PlanSlug,
    Step,
)


class Command(BaseCommand):
    help = 'Add some sample data to the database.'

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

    def create_version(self, product, label='0.3.1', **kwargs):
        return Version.objects.create(
            product=product,
            label=label,
            description='This is a description of the product version.',
            **kwargs,
        )

    def create_plan(
            self, version, title='Full Install', tier='primary', **kwargs):
        combined_kwargs = {
            'preflight_flow_name': 'static_preflight',
            'flow_name': 'static_preflight',
            'preflight_message': (
                'Preflight message consists of generic product message and '
                'step pre-check info — run in one operation before the '
                'install begins. Preflight includes the name of what is being '
                "installed. Lorem Ipsum has been the industry's standard "
                'dummy text ever since the 1500s.'
            ),
        }
        combined_kwargs.update(kwargs)
        plan = Plan.objects.create(
            version=version,
            title=title,
            tier=tier,
            **combined_kwargs,
        )
        PlanSlug.objects.create(
            parent=plan,
            slug=slugify(title),
        )
        return plan

    def create_step(self, **kwargs):
        task_name = kwargs.pop('task_name', 'main_task')
        return Step.objects.create(task_name=task_name, **kwargs)

    def add_steps(self, plan):
        self.create_step(
            plan=plan,
            name='Opportunity Record Types',
            description=(
                f'This is a description of the step. Could be any step, '
                'optional or required. The description wraps.'
            ),
            is_recommended=False,
        )
        self.create_step(
            plan=plan,
            name='Households',
            is_required=False,
            is_recommended=False,
            order_key=1,
        )
        self.create_step(
            plan=plan,
            name='Recurring Donations',
            description='This is a step description.',
            kind='onetime',
            is_recommended=False,
            order_key=2,
        )
        self.create_step(
            plan=plan,
            name='Relationships',
            kind='managed',
            is_required=False,
            is_recommended=False,
            order_key=3,
        )
        self.create_step(
            plan=plan,
            name='Affiliations',
            description='This is a step description.',
            kind='managed',
            is_required=False,
            order_key=4,
        )
        self.create_step(
            task_name='update_admin_profile',
            plan=plan,
            name='Account Record Types',
            kind='managed',
            is_recommended=False,
            order_key=5,
        )
        self.create_step(
            task_name='install_managed',
            plan=plan,
            name='Nonprofit Success Pack',
            kind='managed',
            is_recommended=False,
            order_key=6,
        )
        self.create_step(
            task_name='deploy_pre',
            plan=plan,
            name='NPSP Config for Salesforce1',
            description='This is a step description.',
            kind='data',
            is_recommended=False,
            order_key=7,
        )
        self.create_step(
            task_name='deploy_post',
            plan=plan,
            name='Contacts and Organizations',
            description='This is a step description.',
            kind='managed',
            is_recommended=False,
            order_key=8,
        )
        self.create_step(
            plan=plan,
            name='Another Ordered Step',
            description='This is a step description.',
            kind='managed',
            is_required=False,
            order_key=9,
        )

    def create_enqueuer_job(self):
        RepeatableJob.objects.get_or_create(
            callable='metadeploy.api.jobs.enqueuer_job',
            defaults=dict(
                name='Enqueuer',
                interval=1,
                interval_unit='minutes',
                queue='default',
                scheduled_time=timezone.now(),
            ),
        )

    def create_token_expiry_job(self):
        RepeatableJob.objects.get_or_create(
            callable='metadeploy.api.jobs.expire_user_tokens_job',
            defaults=dict(
                name='Expire User Tokens',
                interval=1,
                interval_unit='minutes',
                queue='default',
                scheduled_time=timezone.now(),
            ),
        )

    def create_preflight_expiry_job(self):
        RepeatableJob.objects.get_or_create(
            callable='metadeploy.api.jobs.expire_preflights_job',
            defaults=dict(
                name='Expire Preflight Results',
                interval=1,
                interval_unit='minutes',
                queue='default',
                scheduled_time=timezone.now(),
            ),
        )

    def handle(self, *args, **options):
        self.create_enqueuer_job()
        self.create_token_expiry_job()
        self.create_preflight_expiry_job()
        sf_category = ProductCategory.objects.create(title='salesforce')
        co_category = ProductCategory.objects.create(title='community')
        product1 = self.create_product(
            title='Product With Useful Data',
            repo_url='https://github.com/SFDO-Tooling/CumulusCI-Test',
            category=sf_category,
        )
        old_version = self.create_version(product1, '0.2.0')
        self.create_plan(old_version)

        version1 = self.create_version(
            product1,
            commit_ish='feature/preflight',
        )
        plan = self.create_plan(
            version1,
            preflight_flow_name='static_preflight',
        )
        self.add_steps(plan)

        plan2 = self.create_plan(
            version1,
            title='Failing Preflight',
            tier='secondary',
            preflight_flow_name='failing_preflight',
        )
        self.add_steps(plan2)

        plan3 = self.create_plan(
            version1,
            title='Messy Preflight',
            tier='additional',
            preflight_flow_name='messy_preflight',
        )
        self.add_steps(plan3)

        plan4 = self.create_plan(
            version1,
            title='Plan-Level Failing Preflight',
            tier='additional',
            preflight_flow_name='error_preflight',
        )
        self.add_steps(plan4)

        plan5 = self.create_plan(
            version1,
            title='Preflight With Warnings',
            tier='additional',
            preflight_flow_name='warn_preflight',
        )
        self.add_steps(plan5)

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
