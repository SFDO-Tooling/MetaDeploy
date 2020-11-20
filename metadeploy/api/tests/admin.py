import pytest
from django.contrib.admin.sites import AdminSite
from django.test import RequestFactory

from ..admin import (
    AllowedListOrgAdmin,
    ArrayFieldCheckboxSelectMultiple,
    MetadeployTranslatableAdmin,
    PlanAdmin,
    PlanAdminForm,
    PlanMixin,
)
from ..models import SUPPORTED_ORG_TYPES, AllowedListOrg, Plan


class Dummy:
    pass


class TestArrayFieldCheckboxSelectMultiple:
    def test_format_value(self, mocker):
        csm = mocker.patch("metadeploy.api.admin.CheckboxSelectMultiple")
        csm.format_value = lambda x: x
        assert ArrayFieldCheckboxSelectMultiple().format_value("some,test") == [
            "some",
            "test",
        ]


class TestPlanMixin:
    def test_plan_title(self):
        obj = Dummy()
        obj.plan = Dummy()
        obj.plan.title = "A Plan"
        mixin = PlanMixin()
        assert mixin.plan_title(obj) == obj.plan.title

    def test_product(self):
        obj = Dummy()
        obj.plan = Dummy()
        obj.plan.version = Dummy()
        obj.plan.version.product = "A Product"
        mixin = PlanMixin()
        assert mixin.product(obj) == obj.plan.version.product

    def test_version(self):
        obj = Dummy()
        obj.plan = Dummy()
        obj.plan.version = Dummy()
        obj.plan.version.label = "A Version"
        mixin = PlanMixin()
        assert mixin.version(obj) == obj.plan.version.label


class TestMetadeployTranslatableAdmin:
    def test_get_language_tabs(self):
        admin = MetadeployTranslatableAdmin(Plan, None)
        tabs = admin.get_language_tabs(None, Plan(), ())
        assert len(tabs) == 0


@pytest.mark.django_db
class TestAllowedListOrgAdmin:
    def test_save_model(
        self, user_factory, allowed_list_factory, allowed_list_org_factory
    ):
        user = user_factory()
        site = AdminSite()
        allowed_list = allowed_list_factory()
        allowed_list_org = AllowedListOrg(
            allowed_list=allowed_list, org_id="00DABCDEFGHIJKL", description="An org"
        )

        admin = AllowedListOrgAdmin(AllowedListOrg, site)
        factory = RequestFactory()
        request = factory.get("/admin")
        request.user = user
        admin.save_model(request, allowed_list_org, admin.get_form(request), False)
        assert allowed_list_org.created_by == user


@pytest.mark.django_db
class TestPlanAdmin:
    def test_product_label(self):
        site = AdminSite()
        admin = PlanAdmin(Plan, site)
        obj = Dummy()
        obj.version = Dummy()
        obj.version.product = "A product"
        assert admin.product(obj) == obj.version.product

    def test_version_label(self):
        site = AdminSite()
        admin = PlanAdmin(Plan, site)
        obj = Dummy()
        obj.version = Dummy()
        obj.version.label = "A version"
        assert admin.version_label(obj) == obj.version.label

    def test_validation(
        self, allowed_list_factory, plan_template_factory, version_factory
    ):
        allowed_list = allowed_list_factory()
        plan_template = plan_template_factory()
        version = version_factory()
        valid_data = {
            "visible_to": str(allowed_list.pk),
            "supported_orgs": SUPPORTED_ORG_TYPES.Persistent,
            "plan_template": str(plan_template.pk),
            "version": str(version.pk),
            "order_key": 0,
            "tier": Plan.Tier.primary,
        }
        valid_form = PlanAdminForm(valid_data)
        assert valid_form.is_valid()

        invalid_data = {
            "visible_to": str(allowed_list.pk),
            "supported_orgs": SUPPORTED_ORG_TYPES.Scratch,
            "plan_template": str(plan_template.pk),
            "version": str(version.pk),
            "order_key": 0,
            "tier": Plan.Tier.primary,
        }
        invalid_form = PlanAdminForm(invalid_data)
        assert not invalid_form.is_valid()


@pytest.mark.django_db
class TestSocialTokenAdmin:
    def test_change_view(self, client, user_factory):
        user = user_factory(is_staff=True, is_superuser=True)
        social_token = user.social_account.socialtoken_set.first()

        client.force_login(user)
        response = client.get(
            f"/admin/socialaccount/socialtoken/{social_token.id}/change/"
        )
        # redirected back to model list
        assert response.status_code == 302
        assert response.url == "/admin/socialaccount/socialtoken/"
