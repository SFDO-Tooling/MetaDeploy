from datetime import timedelta
from unittest import mock

import pytest
from cumulusci.core.flowrunner import StepSpec
from django.contrib.sites.models import Site
from django.core.exceptions import ValidationError
from django.utils import timezone

from ..models import Job, SiteProfile, Step, Version


@pytest.mark.django_db
class TestAllowedList:
    def test_str(self, allowed_list_factory):
        allowed_list = allowed_list_factory(title="A title")
        assert str(allowed_list) == "A title"


@pytest.mark.django_db
class TestAllowedListOrg:
    def test_save(self, allowed_list_factory, allowed_list_org_factory):
        allowed_list = allowed_list_factory(title="A title")
        org_id = "00D1F0000009GpnUAE"
        allowed_list_org = allowed_list_org_factory(
            allowed_list=allowed_list, org_id=org_id
        )
        assert allowed_list_org.org_id == org_id

    def test_save_15char(self, allowed_list_factory, allowed_list_org_factory):
        allowed_list = allowed_list_factory(title="A title")
        org_id = "00D1F0000009Gpn"
        expected_org_id = "00D1F0000009GpnUAE"
        allowed_list_org = allowed_list_org_factory(
            allowed_list=allowed_list, org_id=org_id
        )
        assert allowed_list_org.org_id == expected_org_id

    def test_is_listed_by_org_only__list_true(
        self, allowed_list_factory, plan_factory, user_factory
    ):
        allowed_list = allowed_list_factory(
            org_type=["Scratch"], list_for_allowed_by_orgs=True
        )
        plan = plan_factory(visible_to=allowed_list)
        scratch_user = user_factory(
            socialaccount_set__extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Scratch",
                    "IsSandbox": True,
                    "TrialExpirationDate": 1,
                },
            }
        )
        devorg_user = user_factory()
        assert scratch_user.full_org_type == "Scratch"
        assert devorg_user.full_org_type == "Developer"

        assert not plan.is_listed_by_org_only(scratch_user)
        assert not plan.is_listed_by_org_only(devorg_user)

    def test_is_listed_by_org_only__list_false(
        self, allowed_list_factory, plan_factory, user_factory
    ):
        allowed_list = allowed_list_factory(
            org_type=["Scratch"], list_for_allowed_by_orgs=False
        )
        plan = plan_factory(visible_to=allowed_list)
        scratch_user = user_factory(
            socialaccount_set__extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Scratch",
                    "IsSandbox": True,
                    "TrialExpirationDate": 1,
                },
            }
        )
        devorg_user = user_factory()
        assert scratch_user.full_org_type == "Scratch"
        assert devorg_user.full_org_type == "Developer"

        assert plan.is_listed_by_org_only(scratch_user)
        assert not plan.is_listed_by_org_only(devorg_user)

    def test_is_listed_by_org_only__no_allowed_list(self, plan_factory, user_factory):
        plan = plan_factory()
        scratch_user = user_factory(
            socialaccount_set__extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Scratch",
                    "IsSandbox": True,
                    "TrialExpirationDate": 1,
                },
            }
        )
        devorg_user = user_factory()
        assert scratch_user.full_org_type == "Scratch"
        assert devorg_user.full_org_type == "Developer"

        assert not plan.is_listed_by_org_only(scratch_user)
        assert not plan.is_listed_by_org_only(devorg_user)


@pytest.mark.django_db
class TestUser:
    def test_org_name(self, user_factory):
        user = user_factory()
        assert user.org_name == "Sample Org"

        user.socialaccount_set.all().delete()
        assert user.org_name is None

    def test_org_type(self, user_factory):
        user = user_factory()
        assert user.org_type == "Developer Edition"

        user.socialaccount_set.all().delete()
        assert user.org_type is None

    def test_social_account(self, user_factory):
        user = user_factory()
        assert user.social_account is not None
        assert user.social_account == user.socialaccount_set.first()

        user.socialaccount_set.all().delete()
        assert user.social_account is None

    def test_instance_url(self, user_factory):
        user = user_factory()
        assert user.instance_url == "https://example.com"

        user.socialaccount_set.all().delete()
        assert user.instance_url is None

    def test_token(self, user_factory):
        user = user_factory()
        assert user.token == ("0123456789abcdef", "secret.0123456789abcdef")

        user.socialaccount_set.all().delete()
        assert user.token == (None, None)

    def test_valid_token_for(self, user_factory):
        user = user_factory()
        assert user.valid_token_for == "00Dxxxxxxxxxxxxxxx"

        user.socialaccount_set.first().socialtoken_set.all().delete()
        assert user.valid_token_for is None

    def test_full_org_type(self, user_factory, social_account_factory):
        user = user_factory(socialaccount_set=[])
        social_account_factory(
            user=user,
            extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Developer Edition",
                    "IsSandbox": False,
                    "TrialExpirationDate": None,
                },
            },
        )
        assert user.full_org_type == "Developer"

        user = user_factory(socialaccount_set=[])
        social_account_factory(
            user=user,
            extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Production",
                    "IsSandbox": False,
                    "TrialExpirationDate": None,
                },
            },
        )
        assert user.full_org_type == "Production"

        user = user_factory(socialaccount_set=[])
        social_account_factory(
            user=user,
            extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Something",
                    "IsSandbox": True,
                    "TrialExpirationDate": None,
                },
            },
        )
        assert user.full_org_type == "Sandbox"

        user = user_factory(socialaccount_set=[])
        social_account_factory(
            user=user,
            extra_data={
                "instance_url": "https://example.com",
                "organization_details": {
                    "Name": "Sample Org",
                    "OrganizationType": "Something",
                    "IsSandbox": True,
                    "TrialExpirationDate": "Some date",
                },
            },
        )
        assert user.full_org_type == "Scratch"

        user = user_factory(socialaccount_set=[])
        assert user.full_org_type is None


@pytest.mark.django_db
class TestIconProperty:
    def test_uses_icon_url(self, product_factory):
        product = product_factory(icon_url="https://example.com/example.png")
        assert product.icon == {"type": "url", "url": "https://example.com/example.png"}

    def test_uses_slds_attrs(self, product_factory):
        product = product_factory(slds_icon_category="action", slds_icon_name="test")
        assert product.icon == {"type": "slds", "category": "action", "name": "test"}

    def test_default(self, product_factory):
        product = product_factory()
        assert product.icon is None


@pytest.mark.django_db
class TestVersion:
    def test_primary_plan__none(self, version_factory):
        version = version_factory()
        assert version.primary_plan is None

    def test_primary_plan__multiple(self, version_factory, plan_factory):
        version = version_factory()
        plan_factory(version=version, tier="primary")
        plan2 = plan_factory(version=version, tier="primary")
        assert version.primary_plan == plan2

    def test_secondary_plan__none(self, version_factory, plan_factory):
        version = version_factory()
        assert version.secondary_plan is None

    def test_secondary_plan__multiple(self, version_factory, plan_factory):
        version = version_factory()
        plan_factory(version=version, tier="secondary")
        plan2 = plan_factory(version=version, tier="secondary")
        assert version.secondary_plan == plan2

    def test_additional_plans(self, version_factory, plan_factory):
        version = version_factory()
        plan1 = plan_factory(version=version, tier="additional")
        plan2 = plan_factory(version=version, tier="additional")
        assert list(version.additional_plans) == [plan1, plan2]

    def test_additional_plans__one_per_plan_template(
        self, version_factory, plan_factory
    ):
        version = version_factory()
        plan1 = plan_factory(version=version, tier="additional")
        plan2 = plan_factory(
            version=version, plan_template=plan1.plan_template, tier="additional"
        )
        assert list(version.additional_plans) == [plan2]


@pytest.mark.django_db
def test_product_category_str(product_category_factory):
    product_category = product_category_factory(title="My Category")
    assert str(product_category) == "My Category"


@pytest.mark.django_db
def test_product_str(product_factory):
    product = product_factory(title="My Product")
    assert str(product) == "My Product"


@pytest.mark.django_db
class TestProductSlug:
    def test_present(self, product_factory, product_slug_factory):
        product = product_factory(title="a product")
        product.productslug_set.all().delete()
        product_slug_factory(parent=product, slug="a-slug-1", is_active=False)
        product_slug_factory(parent=product, slug="a-slug-2", is_active=True)
        product_slug_factory(parent=product, slug="a-slug-3", is_active=True)
        product_slug_factory(parent=product, slug="a-slug-4", is_active=False)

        assert product.slug == "a-slug-3"

    def test_absent(self, product_factory):
        product = product_factory(title="a product")
        product.productslug_set.all().delete()

        assert product.slug is None

    def test_ensure_slug(self, product_factory):
        product = product_factory(title="a product")
        product.productslug_set.all().delete()

        product.ensure_slug()

        assert product.slug == "a-product"

    def test_str(self, product_slug_factory):
        product_slug = product_slug_factory(slug="a-slug")
        assert str(product_slug) == "a-slug"


@pytest.mark.django_db
def test_product_most_recent_version(product_factory, version_factory):
    product = product_factory()
    version_factory(label="v0.1.0", product=product)
    v2 = version_factory(label="v0.2.0", product=product)

    assert product.most_recent_version == v2


@pytest.mark.django_db
def test_product_most_recent_version__delisted(product_factory, version_factory):
    product = product_factory()
    v1 = version_factory(label="v0.1.0", product=product)
    version_factory(label="v0.2.0", product=product, is_listed=False)

    assert product.most_recent_version == v1


@pytest.mark.django_db
class TestPlanTemplate:
    def test_str(self, plan_template_factory):
        plan_template = plan_template_factory()
        assert str(plan_template) == f"{plan_template.product.title}: install"


@pytest.mark.django_db
class TestPlanSlug:
    def test_present(self, plan_factory, plan_slug_factory):
        plan = plan_factory(title="a plan")
        plan.plan_template.planslug_set.all().delete()
        plan_slug_factory(parent=plan.plan_template, slug="a-slug-1", is_active=False)
        plan_slug_factory(parent=plan.plan_template, slug="a-slug-2", is_active=True)
        plan_slug_factory(parent=plan.plan_template, slug="a-slug-3", is_active=True)
        plan_slug_factory(parent=plan.plan_template, slug="a-slug-4", is_active=False)

        assert plan.slug == "a-slug-3"

    def test_absent(self, plan_factory):
        plan = plan_factory(title="a plan")
        plan.plan_template.planslug_set.all().delete()

        assert plan.slug is None

    def test_ensure_slug(self, plan_factory):
        plan = plan_factory(title="a plan")
        plan.plan_template.planslug_set.all().delete()

        plan.ensure_slug()

        assert plan.slug == "a-plan"

    def test_str(self, plan_slug_factory):
        plan_slug = plan_slug_factory(slug="a-slug")
        assert str(plan_slug) == "a-slug"

    def test_unique_per_product(
        self, plan_slug_factory, plan_template_factory, product_factory, plan_factory
    ):
        product1 = product_factory()
        product2 = product_factory()

        plan_template1 = plan_template_factory(product=product1)
        plan_template2 = plan_template_factory(product=product2)

        plan_factory(version__product=product1, plan_template=plan_template1)
        plan_factory(version__product=product2, plan_template=plan_template2)

        plan_slug_factory(slug="test", parent=plan_template1)
        plan_slug_factory(slug="test", parent=plan_template2)

        pslug = plan_slug_factory(slug="test", parent=plan_template1)

        with pytest.raises(ValidationError):
            pslug.validate_unique()


@pytest.mark.django_db
class TestPlan:
    def test_natural_key(self, plan_factory):
        plan = plan_factory(title="My Plan")
        assert plan.natural_key() == (plan.version, "My Plan")

    def test_str(self, product_factory, version_factory, plan_factory):
        product = product_factory(title="My Product")
        version = version_factory(label="v0.1.0", product=product)
        plan = plan_factory(title="My Plan", version=version)
        assert str(plan) == "My Product, Version v0.1.0, Plan My Plan"

    def test_plan_post_install_markdown(self, plan_factory):
        msg = "This is a *sample* with some<script src='bad.js'></script> bad tags."
        plan = plan_factory(post_install_message_additional=msg)
        expected = (
            "<p>This is a <em>sample</em> with some&lt;script src='bad.js'&gt;"
            "&lt;/script&gt; bad tags.</p>"
        )

        assert plan.post_install_message_additional_markdown == expected

    def test_average_duration(self, plan_factory, job_factory):
        start = timezone.now()
        end = start + timedelta(seconds=30)
        plan = plan_factory()

        assert plan.average_duration is None

        job_factory(
            plan=plan,
            status=Job.Status.complete,
            success_at=end,
            enqueued_at=start,
            org_id="00Dxxxxxxxxxxxxxxx",
        )

        assert plan.average_duration is None

        for _ in range(4):
            job_factory(
                plan=plan,
                status=Job.Status.complete,
                success_at=end,
                enqueued_at=start,
                org_id="00Dxxxxxxxxxxxxxxx",
            )

        assert plan.average_duration == timedelta(seconds=30)


@pytest.mark.django_db
class TestStep:
    def test_str(self, step_factory):
        step = step_factory(name="Test step", step_num="3.1", plan__title="The Plan")
        assert str(step) == "Step Test step of The Plan (3.1)"

    def test_ordering(self, step_factory):
        step_factory(step_num="1/1/1")
        step_factory(step_num="1/1.1")
        step_factory(step_num="1/1")
        step_nums = [step.step_num for step in Step.objects.all()]
        assert step_nums == ["1/1", "1/1.1", "1/1/1"]

    def test_step_num_validator(self, step_factory):
        step = step_factory(step_num="a")
        with pytest.raises(ValidationError):
            step.full_clean()

    def test_to_spec(self, step_factory):
        step = step_factory(source={"github": "foo"})
        project_config = mock.Mock()
        spec = step.to_spec(project_config)
        project_config.include_source.assert_called_once()
        assert isinstance(spec, StepSpec)


@pytest.mark.django_db
class TestStepKindIcon:
    def test_metadata(self, step_factory):
        step = step_factory(kind="metadata")
        assert step.kind_icon == "package"

    def test_onetime(self, step_factory):
        step = step_factory(kind="onetime")
        assert step.kind_icon == "apex"

    def test_managed(self, step_factory):
        step = step_factory(kind="managed")
        assert step.kind_icon == "archive"

    def test_data(self, step_factory):
        step = step_factory(kind="data")
        assert step.kind_icon == "paste"

    def test_unknown(self, step_factory):
        step = step_factory(kind="unknown")
        assert step.kind_icon is None


@pytest.mark.django_db
class TestVersionNaturalKey:
    def test_version_natural_key(self, version_factory):
        version = version_factory(label="v0.1.0")

        assert version.natural_key() == (version.product, "v0.1.0")

    def test_version_get_by_natural_key(self, version_factory):
        v1 = version_factory(label="v0.1.0")
        version_factory(product=v1.product, label="v0.2.0")

        assert (
            Version.objects.get_by_natural_key(product=v1.product, label="v0.1.0") == v1
        )

    def test_version_str(self, product_factory, version_factory):
        product = product_factory(title="My Product")
        version = version_factory(label="v0.1.0", product=product)

        assert str(version) == "My Product, Version v0.1.0"


@pytest.mark.django_db
class TestJob:
    def test_job_saves_click_through_text(self, plan_factory, job_factory):
        plan = plan_factory(version__product__click_through_agreement="Test")
        job = job_factory(plan=plan, org_id="00Dxxxxxxxxxxxxxxx")

        job.refresh_from_db()

        assert job.click_through_agreement.text == "Test"

    def test_skip_steps(self, plan_factory, step_factory, job_factory):
        plan = plan_factory()
        step1 = step_factory(plan=plan, path="task1")
        step2 = step_factory(plan=plan, path="task2")
        step3 = step_factory(plan=plan, path="task3")
        job = job_factory(plan=plan, steps=[step1, step3], org_id="00Dxxxxxxxxxxxxxxx")

        assert job.skip_steps() == [step2.step_num]

    def test_invalidate_related_preflight(self, job_factory, preflight_result_factory):
        job = job_factory(org_id="00Dxxxxxxxxxxxxxxx")
        preflight = preflight_result_factory(
            plan=job.plan, user=job.user, org_id="00Dxxxxxxxxxxxxxxx"
        )
        assert preflight.is_valid
        job.invalidate_related_preflight()

        preflight.refresh_from_db()
        assert not preflight.is_valid


@pytest.mark.django_db
class TestSiteProfile:
    def test_markdown(self):
        site = Site.objects.create(name="Test")
        site_profile = SiteProfile.objects.create(
            site=site,
            name=site.name,
            welcome_text="Welcome one and all.",
            copyright_notice="This is the copyright.",
        )

        assert site_profile.welcome_text_markdown == "<p>Welcome one and all.</p>"
        assert site_profile.copyright_notice_markdown == "<p>This is the copyright.</p>"

    def test_str(self):
        site = Site.objects.create(name="Test")
        site_profile = SiteProfile.objects.create(site=site, name="A name")
        assert str(site_profile) == "A name"
