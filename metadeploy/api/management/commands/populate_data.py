from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify
from scheduler.models import RepeatableJob

from ...models import (
    AllowedList,
    Plan,
    PlanSlug,
    PlanTemplate,
    Product,
    ProductCategory,
    Step,
    Version,
)


class Command(BaseCommand):
    help = "Add some sample data to the database."

    def create_product(self, **kwargs):
        title = kwargs.pop("title", "Sample Product")
        description = kwargs.pop(
            "description",
            (
                f"Description for {title}: "
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, "
                "sed do eiusmod tempor incididunt ut labore et dolore "
                "magna aliqua. Tellus elementum sagittis vitae et leo "
                "duis ut diam. Sem fringilla ut morbi tincidunt augue "
                "interdum velit euismod. Volutpat est velit egestas dui "
                "id ornare arcu. Viverra tellus in hac habitasse platea "
                "dictumst. Nulla facilisi etiam dignissim diam."
            ),
        )
        click_through_agreement = kwargs.pop(
            "click_through_agreement",
            (
                f"Lorem ipsum dolor sit amet, consectetur adipiscing elit, "
                "sed do eiusmod tempor incididunt ut labore et dolore "
                "magna aliqua. Tellus elementum sagittis vitae et leo "
                "duis ut diam. Sem fringilla ut morbi tincidunt augue "
                "interdum velit euismod. Volutpat est velit egestas dui "
                "id ornare arcu. Viverra tellus in hac habitasse platea "
                "dictumst. Nulla facilisi etiam dignissim diam.\n\n"
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, "
                "sed do eiusmod tempor incididunt ut labore et dolore "
                "magna aliqua. Tellus elementum sagittis vitae et leo "
                "duis ut diam. Sem fringilla ut morbi tincidunt augue "
                "interdum velit euismod. Volutpat est velit egestas dui "
                "id ornare arcu. Viverra tellus in hac habitasse platea "
                "dictumst. Nulla facilisi etiam dignissim diam.\n\n"
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, "
                "sed do eiusmod tempor incididunt ut labore et dolore "
                "magna aliqua. Tellus elementum sagittis vitae et leo "
                "duis ut diam. Sem fringilla ut morbi tincidunt augue "
                "interdum velit euismod. Volutpat est velit egestas dui "
                "id ornare arcu. Viverra tellus in hac habitasse platea "
                "dictumst. Nulla facilisi etiam dignissim diam.\n\n"
            ),
        )
        product = Product.objects.create(
            title=title,
            description=description,
            click_through_agreement=click_through_agreement,
            **kwargs,
        )
        product.ensure_slug()
        return product

    def create_version(self, product, label="0.3.1", **kwargs):
        return Version.objects.create(
            product=product,
            label=label,
            description="This is a description of the product version.",
            **kwargs,
        )

    def create_plan(self, version, title="Full Install", tier="primary", **kwargs):
        combined_kwargs = {"preflight_flow_name": "static_preflight"}
        combined_kwargs.update(kwargs)
        plan_template = PlanTemplate.objects.create(
            name="{} for {}".format(title, version),
            preflight_message=(
                "Preflight message consists of generic product message and "
                "step pre-check info — run in one operation before the "
                "install begins. Preflight includes the name of what is being "
                "installed. Lorem Ipsum has been the industry's standard "
                "dummy text ever since the 1500s."
            ),
            post_install_message="Success! You installed it.",
        )
        plan = Plan.objects.create(
            version=version,
            title=title,
            tier=tier,
            plan_template=plan_template,
            **combined_kwargs,
        )
        PlanSlug.objects.create(parent=plan, slug=slugify(title))
        return plan

    def create_step(self, **kwargs):
        path = kwargs.pop("path", "quick_task")
        kwargs.setdefault(
            "task_class", "cumulusci.core.tests.test_flowrunner._SfdcTask"
        )
        kwargs.setdefault("task_config", {"options": {}})
        return Step.objects.create(path=path, **kwargs)

    def add_steps(self, plan):
        self.create_step(
            plan=plan,
            name="Quick step",
            description=(
                f"This is a description of the step. Could be any step, "
                "optional or required. The description wraps."
            ),
            is_recommended=False,
            path="quick_task",
            step_num="0.9",
        )
        self.create_step(
            plan=plan,
            name="Slow step",
            is_required=False,
            is_recommended=False,
            step_num="1",
            path="slow_task",
        )
        self.create_step(
            plan=plan,
            name="Medium step",
            description="This is a step description.",
            kind="onetime",
            is_recommended=False,
            step_num="2",
            path="medium_task",
        )
        self.create_step(
            path="relationships",
            plan=plan,
            name="Relationships",
            kind="managed",
            is_required=False,
            is_recommended=False,
            step_num="3",
        )
        self.create_step(
            path="affiliations",
            plan=plan,
            name="Affiliations",
            description="This is a step description.",
            kind="managed",
            is_required=False,
            step_num="4",
        )
        self.create_step(
            path="update_admin_profile",
            plan=plan,
            name="Account Record Types",
            kind="managed",
            is_recommended=False,
            step_num="5",
        )
        self.create_step(
            path="install_managed",
            plan=plan,
            name="Nonprofit Success Pack",
            kind="managed",
            is_recommended=False,
            step_num="6",
        )
        self.create_step(
            path="deploy_pre",
            plan=plan,
            name="NPSP Config for Salesforce1",
            description="This is a step description.",
            kind="data",
            is_recommended=False,
            step_num="7",
        )
        self.create_step(
            path="deploy_post",
            plan=plan,
            name="Contacts and Organizations",
            description="This is a step description.",
            kind="managed",
            is_recommended=False,
            step_num="8",
        )
        self.create_step(
            path="ordered_step",
            plan=plan,
            name="Another Ordered Step",
            description="This is a step description.",
            kind="managed",
            is_required=False,
            step_num="9",
        )

    def create_enqueuer_job(self):
        RepeatableJob.objects.get_or_create(
            callable="metadeploy.api.jobs.enqueuer_job",
            defaults=dict(
                name="Enqueuer",
                interval=1,
                interval_unit="minutes",
                queue="default",
                scheduled_time=timezone.now(),
            ),
        )

    def create_token_expiry_job(self):
        RepeatableJob.objects.get_or_create(
            callable="metadeploy.api.jobs.expire_user_tokens_job",
            defaults=dict(
                name="Expire User Tokens",
                interval=1,
                interval_unit="minutes",
                queue="default",
                scheduled_time=timezone.now(),
            ),
        )

    def create_preflight_expiry_job(self):
        RepeatableJob.objects.get_or_create(
            callable="metadeploy.api.jobs.expire_preflights_job",
            defaults=dict(
                name="Expire Preflight Results",
                interval=1,
                interval_unit="minutes",
                queue="default",
                scheduled_time=timezone.now(),
            ),
        )

    def handle(self, *args, **options):
        self.create_enqueuer_job()
        self.create_token_expiry_job()
        self.create_preflight_expiry_job()
        sf_category = ProductCategory.objects.create(title="salesforce", order_key=0)
        co_category = ProductCategory.objects.create(title="community", order_key=1)
        product1 = self.create_product(
            title="Product With Useful Data",
            repo_url="https://github.com/SFDO-Tooling/CumulusCI-Test",
            category=sf_category,
            order_key=0,
        )
        old_version = self.create_version(product1, "0.2.0")
        self.create_plan(old_version)

        version1 = self.create_version(product1, commit_ish="feature/preflight")
        plan = self.create_plan(
            version1, preflight_flow_name="slow_steps_preflight_good"
        )
        self.add_steps(plan)

        plan2 = self.create_plan(
            version1,
            title="Reports and Dashboards",
            tier="secondary",
            preflight_flow_name="slow_steps_preflight_good",
        )
        self.add_steps(plan2)

        plan3 = self.create_plan(
            version1,
            title="Account Record Types",
            tier="additional",
            preflight_flow_name="messy_preflight",
        )
        self.add_steps(plan3)

        plan4 = self.create_plan(
            version1,
            title="Plan-Level Failing Preflight",
            tier="additional",
            preflight_flow_name="error_preflight",
        )
        self.add_steps(plan4)

        plan5 = self.create_plan(
            version1,
            title="Preflight With Warnings",
            tier="additional",
            preflight_flow_name="slow_steps_preflight_warn",
        )
        self.add_steps(plan5)

        product2 = self.create_product(
            title=f"Red Salesforce Product",
            description=f"This product should have a red icon.",
            category=sf_category,
            color="#c23934",
            order_key=1,
        )
        version2 = self.create_version(product2)
        self.create_plan(version2)

        allowed_list = AllowedList.objects.create(
            title="restricted",
            description=(
                "This item is restricted. "
                "No [OddBirds](http://www.oddbird.net/birds) allowed!"
            ),
        )

        product3 = self.create_product(
            title=f"Custom Icon Salesforce Product",
            description=f"This product should have a custom icon.",
            category=sf_category,
            icon_url=("https://lightningdesignsystem.com/assets/images" "/avatar3.jpg"),
            order_key=2,
        )
        version3 = self.create_version(product3)
        self.create_plan(version3, title="Restricted Plan", visible_to=allowed_list)
        self.create_plan(version3, title="Unrestricted Plan", tier="secondary")

        product4 = self.create_product(
            title=f"Custom SLDS Icon Salesforce Product",
            description=f"This product should have a custom SLDS icon.",
            category=sf_category,
            slds_icon_category="utility",
            slds_icon_name="world",
            order_key=3,
            visible_to=allowed_list,
        )
        version4 = self.create_version(product4)
        self.create_plan(version4)

        for i in range(4):
            product = self.create_product(
                title=f"Sample Community Product {i}", category=co_category, order_key=i
            )
            version = self.create_version(product)
            self.create_plan(version)
