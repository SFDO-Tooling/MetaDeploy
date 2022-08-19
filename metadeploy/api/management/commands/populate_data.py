import time

from cumulusci.core.tasks import BaseTask
from django.conf import settings
from django.contrib.sites.models import Site
from django.core.management.base import BaseCommand
from django.utils.text import slugify

from ....multitenancy import current_site_id
from ...models import (
    AllowedList,
    Plan,
    PlanSlug,
    PlanTemplate,
    Product,
    ProductCategory,
    ProductSlug,
    SiteProfile,
    Step,
    Version,
)


class Sleep(BaseTask):
    name = "Sleep"
    task_options = {
        "seconds": {"description": "The number of seconds to sleep", "required": True}
    }

    def _run_task(self):  # pragma: nocover
        seconds = int(self.options["seconds"])
        self.logger.info(f"Sleeping for {seconds} seconds")
        for t in range(seconds):
            time.sleep(1)
            self.logger.info(str(t + 1))
            self.logger.info(" ".join(["la"] * 40))
        self.logger.info("Done")


class Fail(BaseTask):
    name = "Fail"


class Command(BaseCommand):
    help = "Add some sample data to the database."

    def adjust_site_domain(self):
        """
        During local development, adjust the example Site record to match what the
        documentation recommends so `CurrentSiteMiddleware` doesn't raise 404
        """
        if not settings.DEBUG:
            return
        site = Site.objects.filter(domain="example.com").first()
        if site is not None:
            site.domain = "localhost:8080"
            site.save()

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
                "Lorem ipsum dolor sit amet, consectetur adipiscing elit, "
                "sed do eiusmod tempor incididunt ut labore et dolore "
                "magna aliqua. Tellus elementum sagittis vitae et leo "
                "duis ut diam. Sem fringilla ut morbi tincidunt augue "
                "interdum velit euismod. Volutpat est velit egestas dui "
                "id ornare arcu. Viverra tellus in hac habitasse platea "
                "dictumst. Nulla facilisi etiam dignissim diam."
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
        plan_template = PlanTemplate.objects.create(
            name=f"{title} for {version}",
            preflight_message=(
                "Preflight message consists of generic product message and "
                "step pre-check info — run in one operation before the "
                "install begins. Preflight includes the name of what is being "
                "installed. Lorem Ipsum has been the industry's standard "
                "dummy text ever since the 1500s."
            ),
            post_install_message="Success! You installed it.",
            product=version.product,
        )
        plan = Plan.objects.create(
            version=version,
            title=title,
            tier=tier,
            plan_template=plan_template,
            **kwargs,
        )
        PlanSlug.objects.create(parent=plan.plan_template, slug=slugify(title))
        return plan

    def create_step(self, fail=False, **kwargs):
        path = kwargs.pop("path", "quick_task")
        if fail:
            kwargs.setdefault(
                "task_class", "metadeploy.api.management.commands.populate_data.Fail"
            )
        else:
            kwargs.setdefault(
                "task_class", "metadeploy.api.management.commands.populate_data.Sleep"
            )
            kwargs.setdefault("task_config", {"options": {"seconds": 3}})
        return Step.objects.create(path=path, **kwargs)

    def add_steps(self, plan, fail=False):
        self.create_step(
            plan=plan,
            name="Quick step",
            description=(
                "This is a description of the step. Could be any step, "
                "optional or required. The description wraps."
            ),
            is_recommended=False,
            path="quick_task",
            step_num="0/9",
        )
        self.create_step(
            plan=plan,
            name="Slow step",
            is_required=False,
            is_recommended=False,
            step_num="1",
            path="slow_task",
            task_config={"options": {"seconds": 7}},
        )
        self.create_step(
            plan=plan,
            name="Medium step",
            description="This is a step description.",
            kind="onetime",
            is_recommended=False,
            step_num="2",
            path="medium_task",
            task_config={"options": {"seconds": 5}},
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
            name=(
                "Affiliations Has A Really Really Really Long Name "
                "To Be Sure The Table Layout Does Not Break"
            ),
            description="This is a step description.",
            kind="managed",
            is_required=False,
            step_num="4",
        )
        self.create_step(
            path="update_admin_profile",
            plan=plan,
            name=(
                "Account Record Types Also Has A Really Really Really Long Name "
                "To Be Sure The Table Layout Does Not Break"
            ),
            kind="managed",
            is_recommended=False,
            step_num="5",
            fail=fail,
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

    def create_eda(self, category):
        product = Product.objects.create(
            title="Education Data Architecture (EDA)",
            description="## Welcome to the EDA installer!",
            short_description="The Foundation for the Connected Campus",
            click_through_agreement=(
                "The Education Data Architecture technology (“EDA”) is an open-source "
                "package licensed by Salesforce.org (“SFDO”) under the BSD-3 Clause "
                "License, found at "
                "[https://opensource.org/licenses/BSD-3-Clause]"
                "(https://opensource.org/licenses/BSD-3-Clause). "
                "ANY MASTER SUBSCRIPTION AGREEMENT YOU OR YOUR ENTITY MAY HAVE WITH "
                "SFDO DOES NOT APPLY TO YOUR USE OF EDA. EDA is provided “AS IS” AND "
                "AS AVAILABLE, AND SFDO MAKES NO WARRANTY OF ANY KIND REGARDING EDA, "
                "WHETHER EXPRESS, IMPLIED, STATUTORY OR OTHERWISE, INCLUDING BUT NOT "
                "LIMITED TO ANY IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A "
                "PARTICULAR PURPOSE, FREEDOM FROM DEFECTS OR NON-INFRINGEMENT, TO THE "
                "MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW.\n\n"
                "SFDO WILL HAVE NO LIABILITY ARISING OUT OF OR RELATED TO YOUR USE OF "
                "EDA FOR ANY DIRECT DAMAGES OR FOR ANY LOST PROFITS, REVENUES, "
                "GOODWILL OR INDIRECT, SPECIAL, INCIDENTAL, CONSEQUENTIAL, EXEMPLARY, "
                "COVER, BUSINESS INTERRUPTION OR PUNITIVE DAMAGES, WHETHER AN ACTION "
                "IS IN CONTRACT OR TORT AND REGARDLESS OF THE THEORY OF LIABILITY, "
                "EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES OR IF A REMEDY "
                "OTHERWISE FAILS OF ITS ESSENTIAL PURPOSE. THE FOREGOING DISCLAIMER "
                "WILL NOT APPLY TO THE EXTENT PROHIBITED BY LAW. SFDO DISCLAIMS ALL "
                "LIABILITY AND INDEMNIFICATION OBLIGATIONS FOR ANY HARM OR DAMAGES "
                "CAUSED BY ANY THIRD-PARTY HOSTING PROVIDERS."
            ),
            category=category,
            color="#0088FF",
            slds_icon_category="custom",
            slds_icon_name="custom51",
            image=None,
            repo_url="https://github.com/SalesforceFoundation/EDA",
        )
        ProductSlug.objects.create(parent=product, slug="eda")
        version = Version.objects.create(product=product, label="1.75")
        plan_template = PlanTemplate.objects.create(
            product=product, preflight_message="# Welcome to the EDA installer!"
        )
        plan = Plan.objects.create(
            version=version,
            plan_template=plan_template,
            title="Install",
            tier=Plan.Tier.primary,
            commit_ish="e785195d07a3ac9e395f27829866005dbdcd5bd0",
        )
        PlanSlug.objects.create(parent=plan_template, slug="install")
        steps = [
            {
                "name": "EDA - Account Record Types",
                "description": "",
                "kind": Step.Kind.metadata,
                "path": "dependencies.deploy_pre.acc_record_types",
                "step_num": "1/2/1",
                "task_class": "cumulusci.tasks.salesforce.UpdateDependencies",
                "task_config": {
                    "options": {
                        "dependencies": [
                            {
                                "repo_owner": "SalesforceFoundation",
                                "repo_name": "EDA",
                                "ref": "e785195d07a3ac9e395f27829866005dbdcd5bd0",
                                "subfolder": "unpackaged/pre/acc_record_types",
                            }
                        ]
                    }
                },
            },
            {
                "name": "EDA - Contact Key Affiliation Fields",
                "description": "",
                "kind": Step.Kind.metadata,
                "path": "dependencies.deploy_pre.contact_key_affl_fields",
                "step_num": "1/2/2",
                "task_class": "cumulusci.tasks.salesforce.UpdateDependencies",
                "task_config": {
                    "options": {
                        "dependencies": [
                            {
                                "repo_owner": "SalesforceFoundation",
                                "repo_name": "EDA",
                                "ref": "e785195d07a3ac9e395f27829866005dbdcd5bd0",
                                "subfolder": "unpackaged/pre/contact_key_affl_fields",
                            }
                        ]
                    }
                },
            },
            {
                "name": "Install EDA 1.75",
                "description": "",
                "kind": Step.Kind.managed,
                "path": "install_managed",
                "step_num": "2",
                "task_class": "cumulusci.tasks.salesforce.InstallPackageVersion",
                "task_config": {
                    "options": {
                        "version": "1.75",
                        "activateRSS": True,
                        "namespace": "hed",
                        "retries": 5,
                        "retry_interval": 5,
                        "retry_interval_add": 30,
                    }
                },
            },
            {
                "name": "Course Connection Record Types for EDA",
                "description": "",
                "kind": Step.Kind.metadata,
                "path": "deploy_post.course_connection_record_types",
                "step_num": "3/1",
                "task_class": "cumulusci.tasks.salesforce.UpdateDependencies",
                "task_config": {
                    "options": {
                        "dependencies": [
                            {
                                "unmanaged": False,
                                "namespace_inject": "hed",
                                "repo_owner": "SalesforceFoundation",
                                "repo_name": "EDA",
                                "ref": "e785195d07a3ac9e395f27829866005dbdcd5bd0",
                                "subfolder": (
                                    "unpackaged/post/course_connection_record_types"
                                ),
                            }
                        ]
                    }
                },
            },
            {
                "name": "Facility Display Name Formula Field",
                "description": "",
                "kind": Step.Kind.metadata,
                "path": "deploy_post.facility_display_name",
                "step_num": "3/2",
                "task_class": "cumulusci.tasks.salesforce.UpdateDependencies",
                "task_config": {
                    "options": {
                        "dependencies": [
                            {
                                "unmanaged": False,
                                "namespace_inject": "hed",
                                "repo_owner": "SalesforceFoundation",
                                "repo_name": "EDA",
                                "ref": "e785195d07a3ac9e395f27829866005dbdcd5bd0",
                                "subfolder": "unpackaged/post/facility_display_name",
                            }
                        ]
                    }
                },
            },
        ]

        for step in steps:
            Step.objects.create(plan=plan, **step)

    def handle(self, *args, **options):
        self.adjust_site_domain()
        SiteProfile.objects.get_or_create(
            site_id=current_site_id(), defaults={"name": "Example"}
        )

        sf_category = ProductCategory.objects.create(
            title="Salesforce.org Products",
            order_key=0,
            description="Sample products from Salesforce.org. "
            "**Descriptions support Markdown**.",
        )
        co_category = ProductCategory.objects.create(
            title="Community Products", order_key=1
        )
        product1 = self.create_product(
            title="Product With Useful Data",
            tags=["Demo Product"],
            repo_url="https://github.com/SFDO-Tooling/CumulusCI-Test",
            category=sf_category,
            order_key=0,
        )
        old_version = self.create_version(product1, "0.2.0")
        self.create_plan(old_version)

        version1 = self.create_version(product1, commit_ish="feature/preflight")
        plan = self.create_plan(version1)
        self.add_steps(plan)

        plan2 = self.create_plan(
            version1, title="Reports and Dashboards", tier="secondary"
        )
        self.add_steps(plan2, fail=True)

        plan3 = self.create_plan(
            version1, title="Account Record Types", tier="additional"
        )
        self.add_steps(plan3)
        step = plan3.steps.get(path="deploy_pre")
        step.task_config["checks"] = [
            {
                "when": "True",
                "action": "warn",
                "message": "You may see an error with the next task.",
            }
        ]
        step.save()
        step = plan3.steps.get(path="install_managed")
        step.task_config["checks"] = [
            {
                "when": "True",
                "action": "error",
                "message": "You cannot install CumulusCI-Test into "
                "the CumulusCI-Test Packaging org, you goof!",
            }
        ]
        step.save()
        step = plan3.steps.get(path="deploy_post")
        step.task_config["checks"] = [{"when": "True", "action": "optional"}]
        step.save()
        step = plan3.steps.get(path="update_admin_profile")
        step.task_config["checks"] = [{"when": "True", "action": "skip"}]
        step.save()

        plan4 = self.create_plan(
            version1,
            title="Plan-Level Failing Preflight",
            tier="additional",
            preflight_checks=[
                {"when": "True", "action": "error", "message": "This plan is verboten."}
            ],
        )
        self.add_steps(plan4)

        plan5 = self.create_plan(
            version1, title="Preflight With Warnings", tier="additional"
        )
        self.add_steps(plan5)
        step = plan5.steps.get(path="slow_task")
        step.task_config["checks"] = [
            {
                "when": "True",
                "action": "warn",
                "message": "This might cause headache and eyestrain.",
            }
        ]
        step.save()

        product2 = self.create_product(
            title="Red Salesforce Product",
            tags=["Salesforce", "Demo Product"],
            description="This product should have a red icon.",
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
            title="Custom Icon Salesforce Product",
            tags=["Salesforce", "Demo Product"],
            description="This product should have a custom icon.",
            category=sf_category,
            icon_url=("https://lightningdesignsystem.com/assets/images" "/avatar3.jpg"),
            order_key=2,
        )
        version3 = self.create_version(product3)
        self.create_plan(version3, title="Restricted Plan", visible_to=allowed_list)
        self.create_plan(version3, title="Unrestricted Plan", tier="secondary")

        product4 = self.create_product(
            title="Custom SLDS Icon Salesforce Product",
            description="This product should have a custom SLDS icon.",
            category=sf_category,
            slds_icon_category="utility",
            slds_icon_name="world",
            order_key=3,
            visible_to=allowed_list,
        )
        version4 = self.create_version(product4)
        self.create_plan(version4)

        for i in range(30):
            product = self.create_product(
                title=f"Sample Community Product {i}", category=co_category, order_key=i
            )
            version = self.create_version(product)
            self.create_plan(version)

        self.create_eda(category=sf_category)
