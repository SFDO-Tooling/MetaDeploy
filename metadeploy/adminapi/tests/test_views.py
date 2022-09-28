import pytest
from enum import Enum

from django.contrib.auth.models import Permission
from django.contrib.contenttypes.models import ContentType
from django.urls import reverse

from metadeploy.api import models

BASE_TENANT_API_URL = "http://testserver/tenant/rest"


class Perm(Enum):
    """The various CRUD permissions"""

    ADD = "add"
    CHANGE = "change"
    VIEW = "view"
    DELETE = "delete"

    def __str__(self):
        return self.value


def add_perm_to_user(user, model_name, perm: Perm):
    """Add the specified permission to a user."""

    model_class = getattr(models, model_name)
    perm = Permission.objects.get(
        content_type=ContentType.objects.get_for_model(model_class),
        codename=f"{perm}_{model_class._meta.model_name}",
    )
    user.user_permissions.add(perm)


@pytest.fixture(name="assert_admin_api_multi_tenancy")
def _multi_tenancy(assert_multi_tenancy):
    assert_multi_tenancy.client.user.is_staff = False
    assert_multi_tenancy.client.user.is_superuser = False
    assert_multi_tenancy.client.user.save()
    return assert_multi_tenancy


@pytest.fixture(name="assert_permissions")
def _permissions(token_client):
    def _inner(model_class, url=None):
        model_name = model_class._meta.model_name
        if url is None:
            url = reverse(f"admin_rest:{model_name}-list")

        response = token_client.get(url)
        assert (
            response.status_code == 403
        ), f"Expected to get 403 when visiting {url} as a non-staff user with no CRUD permissions."

        add_perm_to_user(token_client.user, model_class.__name__, Perm.VIEW)
        response = token_client.get(url)
        assert (
            response.status_code == 200
        ), f"Expected to get 200 when visiting {url} as a staff user with permission 'view__{model_class.__name__}'"

    return _inner


@pytest.mark.django_db
class TestProductViewSet:
    def test_get__filter_by_repo_url(self, token_client, product_factory):
        product = product_factory()
        url = BASE_TENANT_API_URL

        add_perm_to_user(token_client.user, "Product", Perm.VIEW)
        response = token_client.get(
            f"{url}/products", params={"repo_url": product.repo_url}
        )

        assert response.status_code == 200
        assert response.json() == {
            "data": [
                {
                    "category": f"{url}/productcategory/{product.category.id}",
                    "click_through_agreement": "",
                    "color": "#FFFFFF",
                    "description": product.description,
                    "error_message": "",
                    "icon_url": "",
                    "id": product.id,
                    "image": None,
                    "is_listed": True,
                    "order_key": 0,
                    "repo_url": "https://github.com/SFDO-Tooling/CumulusCI-Test",
                    "short_description": "",
                    "slds_icon_category": "",
                    "slds_icon_name": "",
                    "slug": product.slug,
                    "title": product.title,
                    "tags": [],
                    "url": f"{url}/products/{product.id}",
                    "visible_to": None,
                    "layout": "Default",
                }
            ],
            "links": {"next": None, "previous": None},
            "meta": {"page": {"total": 1}},
        }

    def test_multi_tenancy(self, product, assert_admin_api_multi_tenancy):
        user = assert_admin_api_multi_tenancy.client.user
        add_perm_to_user(user, "Product", Perm.VIEW)
        assert_admin_api_multi_tenancy(
            reverse("admin_rest:product-detail", args=[product.pk])
        )

    def test_permissions(self, assert_permissions):
        assert_permissions(models.Product)


@pytest.mark.django_db
class TestProductSlugViewSet:
    def test_multi_tenancy(self, product, assert_admin_api_multi_tenancy):
        slug = models.ProductSlug.objects.get(parent=product)
        user = assert_admin_api_multi_tenancy.client.user
        add_perm_to_user(user, "ProductSlug", Perm.VIEW)
        assert_admin_api_multi_tenancy(
            reverse("admin_rest:productslug-detail", args=[slug.pk])
        )

    def test_permissions(self, assert_permissions):
        assert_permissions(models.ProductSlug)


@pytest.mark.django_db
class TestPlanTemplateViewSet:
    def test_multi_tenancy(self, plan_template, assert_admin_api_multi_tenancy):
        user = assert_admin_api_multi_tenancy.client.user
        add_perm_to_user(user, "PlanTemplate", Perm.VIEW)
        assert_admin_api_multi_tenancy(
            reverse("admin_rest:plantemplate-detail", args=[plan_template.pk])
        )

    def test_permissions(self, assert_permissions):
        assert_permissions(models.PlanTemplate)


@pytest.mark.django_db
class TestPlanViewSet:
    def test_multi_tenancy(self, plan, assert_admin_api_multi_tenancy):
        user = assert_admin_api_multi_tenancy.client.user
        add_perm_to_user(user, "Plan", Perm.VIEW)
        assert_admin_api_multi_tenancy(
            reverse("admin_rest:plan-detail", args=[plan.pk])
        )

    def test_permissions(self, assert_permissions):
        assert_permissions(models.Plan)

    def test_list(self, token_client, plan_factory):
        plan = plan_factory()
        url = f"{BASE_TENANT_API_URL}/plans"
        add_perm_to_user(token_client.user, "Plan", Perm.VIEW)
        response = token_client.get(url)

        assert response.status_code == 200
        version_url = f"{BASE_TENANT_API_URL}/versions/{plan.version.id}"
        json = response.json()
        # Remove timestamp for easy comparison
        del json["data"][0]["created_at"]
        assert json == {
            "data": [
                {
                    "commit_ish": None,
                    "id": f"{plan.id}",
                    "is_listed": True,
                    "order_key": 0,
                    "preflight_checks": [],
                    "preflight_message_additional": "",
                    "plan_template": (
                        f"{BASE_TENANT_API_URL}/plantemplates/"
                        f"{plan.plan_template.id}"
                    ),
                    "post_install_message_additional": "",
                    "steps": [],
                    "tier": "primary",
                    "title": str(plan.title),
                    "url": f"{BASE_TENANT_API_URL}/plans/{plan.id}",
                    "version": version_url,
                    "visible_to": None,
                    "supported_orgs": "Persistent",
                    "org_config_name": "release",
                    "scratch_org_duration_override": None,
                }
            ],
            "links": {"next": None, "previous": None},
            "meta": {"page": {"total": 1}},
        }

    def test_retrieve(self, token_client, step_factory):
        step = step_factory()
        plan = step.plan
        url = f"{BASE_TENANT_API_URL}/plans/{plan.id}"
        add_perm_to_user(token_client.user, "Plan", Perm.VIEW)
        response = token_client.get(url)

        assert response.status_code == 200
        json = response.json()
        # Remove timestamp for easy comparison
        del json["created_at"]
        assert json == {
            "commit_ish": None,
            "id": str(plan.id),
            "is_listed": True,
            "order_key": 0,
            "preflight_checks": [],
            "preflight_message_additional": "",
            "plan_template": (
                f"{BASE_TENANT_API_URL}/plantemplates/{plan.plan_template.id}"
            ),
            "post_install_message_additional": "",
            "steps": [
                {
                    "description": "",
                    "is_recommended": True,
                    "is_required": True,
                    "kind": "metadata",
                    "name": "Sample step",
                    "path": "main_task",
                    "step_num": step.step_num,
                    "source": None,
                    "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    "task_config": {},
                }
            ],
            "tier": "primary",
            "title": str(plan.title),
            "url": url,
            "version": f"{BASE_TENANT_API_URL}/versions/{plan.version.id}",
            "visible_to": None,
            "supported_orgs": "Persistent",
            "org_config_name": "release",
            "scratch_org_duration_override": None,
        }

    def test_create(self, token_client, version_factory, plan_template_factory):
        plan_template = plan_template_factory()
        version = version_factory()
        url = f"{BASE_TENANT_API_URL}/plans"
        add_perm_to_user(token_client.user, "Plan", Perm.ADD)
        response = token_client.post(
            url,
            {
                "title": "Sample plan",
                "order_key": 0,
                "plan_template": (
                    f"{BASE_TENANT_API_URL}/plantemplates/{plan_template.id}"
                ),
                "preflight_message_additional": "",
                "post_install_message_additional": "",
                "steps": [
                    {
                        "path": "task1",
                        "name": "Task 1",
                        "step_num": "1.0",
                        "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    },
                    {
                        "path": "task2",
                        "name": "Task 2",
                        "step_num": "1.3",
                        "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    },
                ],
                "version": f"{BASE_TENANT_API_URL}/versions/{version.id}",
                "supported_orgs": "Persistent",
                "org_config_name": "release",
                "scratch_org_duration_override": None,
            },
            format="json",
        )

        assert response.status_code == 201, response.json()
        json = response.json()
        # Remove timestamp for easy comparison
        del json["created_at"]
        plan_id = json["id"]
        expected = {
            "commit_ish": None,
            "id": plan_id,
            "is_listed": True,
            "order_key": 0,
            "preflight_checks": [],
            "preflight_message_additional": "",
            "plan_template": (
                f"{BASE_TENANT_API_URL}/plantemplates/{plan_template.id}"
            ),
            "post_install_message_additional": "",
            "steps": [
                {
                    "description": "",
                    "is_recommended": True,
                    "is_required": True,
                    "kind": "metadata",
                    "name": "Task 1",
                    "path": "task1",
                    "step_num": "1.0",
                    "source": None,
                    "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    "task_config": {},
                },
                {
                    "description": "",
                    "is_recommended": True,
                    "is_required": True,
                    "kind": "metadata",
                    "name": "Task 2",
                    "path": "task2",
                    "step_num": "1.3",
                    "source": None,
                    "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    "task_config": {},
                },
            ],
            "tier": "primary",
            "title": "Sample plan",
            "url": f"{BASE_TENANT_API_URL}/plans/{plan_id}",
            "version": f"{BASE_TENANT_API_URL}/versions/{version.id}",
            "visible_to": None,
            "supported_orgs": "Persistent",
            "org_config_name": "release",
            "scratch_org_duration_override": None,
        }
        assert response.json() == expected

    def test_update_no_steps_error(self, token_client, plan_factory):
        plan = plan_factory()

        add_perm_to_user(token_client.user, "Plan", Perm.CHANGE)
        response = token_client.put(
            f"{BASE_TENANT_API_URL}/plans/{plan.id}",
            {
                "title": "Sample plan",
                "version": f"{BASE_TENANT_API_URL}/versions/{plan.version.id}",
            },
            format="json",
        )
        assert response.status_code == 200, response.json()

        response = token_client.put(
            f"{BASE_TENANT_API_URL}/plans/{plan.id}",
            {
                "title": "Sample plan",
                "steps": [],
                "version": f"{BASE_TENANT_API_URL}/versions/{plan.version.id}",
            },
            format="json",
        )
        assert response.status_code == 400
        assert response.json() == ["Updating steps not supported."]

    def test_update_primary(self, token_client, plan_factory):
        plan = plan_factory()
        assert plan.tier == models.Plan.Tier.primary

        add_perm_to_user(token_client.user, "Plan", Perm.CHANGE)
        response = token_client.put(
            f"{BASE_TENANT_API_URL}/plans/{plan.id}",
            {
                "title": "Sample plan",
                "version": f"{BASE_TENANT_API_URL}/versions/{plan.version.id}",
            },
            format="json",
        )
        assert response.status_code == 200, response.json()

    def test_create_another_primary(self, token_client, plan_factory):
        plan = plan_factory()
        assert plan.tier == models.Plan.Tier.primary

        add_perm_to_user(token_client.user, "Plan", Perm.ADD)
        response = token_client.post(
            f"{BASE_TENANT_API_URL}/plans",
            {
                "title": "Sample plan",
                "order_key": 0,
                "plan_template": (
                    f"{BASE_TENANT_API_URL}/plantemplates/{plan.plan_template.id}"
                ),
                "preflight_message_additional": "",
                "post_install_message_additional": "",
                "steps": [
                    {
                        "path": "task1",
                        "name": "Task 1",
                        "step_num": "1.0",
                        "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    },
                    {
                        "path": "task2",
                        "name": "Task 2",
                        "step_num": "1.3",
                        "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    },
                ],
                "version": f"{BASE_TENANT_API_URL}/versions/{plan.version.id}",
                "supported_orgs": "Persistent",
                "org_config_name": "release",
                "scratch_org_duration_override": None,
            },
            format="json",
        )
        assert response.status_code == 400
        assert response.json() == {
            "version": ["You must not have more than one primary plan per version"]
        }

    def test_update_secondary(self, token_client, plan_factory):
        plan = plan_factory(tier=models.Plan.Tier.secondary)
        assert plan.tier == models.Plan.Tier.secondary

        add_perm_to_user(token_client.user, "Plan", Perm.CHANGE)
        response = token_client.put(
            f"{BASE_TENANT_API_URL}/plans/{plan.id}",
            {
                "title": "Sample plan",
                "version": f"{BASE_TENANT_API_URL}/versions/{plan.version.id}",
            },
            format="json",
        )
        assert response.status_code == 200, response.json()

    def test_create_another_secondary(self, token_client, plan_factory):
        plan = plan_factory(tier=models.Plan.Tier.secondary)
        assert plan.tier == models.Plan.Tier.secondary

        add_perm_to_user(token_client.user, "Plan", Perm.ADD)
        # plan default tier is primary utilizing planfactory settings.
        response = token_client.post(
            f"{BASE_TENANT_API_URL}/plans",
            {
                "title": "Sample plan",
                "order_key": 0,
                "plan_template": (
                    f"{BASE_TENANT_API_URL}/plantemplates/{plan.plan_template.id}"
                ),
                "preflight_message_additional": "",
                "post_install_message_additional": "",
                "steps": [
                    {
                        "path": "task1",
                        "name": "Task 1",
                        "step_num": "1.0",
                        "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    },
                    {
                        "path": "task2",
                        "name": "Task 2",
                        "step_num": "1.3",
                        "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    },
                ],
                "version": f"{BASE_TENANT_API_URL}/versions/{plan.version.id}",
                "supported_orgs": "Persistent",
                "org_config_name": "release",
                "scratch_org_duration_override": None,
                "tier": "secondary",
            },
            format="json",
        )
        assert response.status_code == 400
        assert response.json() == {
            "version": ["You must not have more than one secondary plan per version"]
        }

    def test_ipaddress_restriction(self, token_client__outside_ip, plan_factory):
        client = token_client__outside_ip
        plan = plan_factory()
        add_perm_to_user(client.user, "Plan", Perm.VIEW)

        response = client.get(f"{BASE_TENANT_API_URL}/plans/{plan.id}")
        assert response.status_code == 400

    def test_update_bad(self, token_client, allowed_list_factory, plan_factory):
        allowed_list = allowed_list_factory()
        plan = plan_factory(
            visible_to=allowed_list,
            supported_orgs=models.SUPPORTED_ORG_TYPES.Persistent,
        )
        add_perm_to_user(token_client.user, "Plan", Perm.CHANGE)

        response = token_client.put(
            f"{BASE_TENANT_API_URL}/plans/{plan.id}",
            {
                "title": "Sample plan",
                "version": f"{BASE_TENANT_API_URL}/versions/{plan.version.id}",
            },
            format="json",
        )
        assert response.status_code == 200, response.json()

        response = token_client.put(
            f"{BASE_TENANT_API_URL}/plans/{plan.id}",
            {
                "title": "Sample plan",
                "version": f"{BASE_TENANT_API_URL}/versions/{plan.version.id}",
                "supported_orgs": models.SUPPORTED_ORG_TYPES.Scratch,
            },
            format="json",
        )
        assert response.status_code == 400


@pytest.mark.django_db
class TestPlanSlugViewSet:
    def test_multi_tenancy(self, plan_slug, assert_admin_api_multi_tenancy):
        user = assert_admin_api_multi_tenancy.client.user
        add_perm_to_user(user, "PlanSlug", Perm.VIEW)
        assert_admin_api_multi_tenancy(
            reverse("admin_rest:planslug-detail", args=[plan_slug.pk])
        )

    def test_permissions(self, assert_permissions):
        assert_permissions(models.PlanSlug)


@pytest.mark.django_db
class TestVersionViewSet:
    def test_multi_tenancy(self, version, assert_admin_api_multi_tenancy):
        user = assert_admin_api_multi_tenancy.client.user
        add_perm_to_user(user, "Version", Perm.VIEW)
        assert_admin_api_multi_tenancy(
            reverse("admin_rest:version-detail", args=[version.pk])
        )

    def test_permissions(self, assert_permissions):
        assert_permissions(models.Version)


@pytest.mark.django_db
class TestProductCategoryViewSet:
    def test_multi_tenancy(self, product_category, assert_admin_api_multi_tenancy):
        user = assert_admin_api_multi_tenancy.client.user
        add_perm_to_user(user, "ProductCategory", Perm.VIEW)
        assert_admin_api_multi_tenancy(
            reverse("admin_rest:productcategory-detail", args=[product_category.pk])
        )

    def test_permissions(self, assert_permissions):
        assert_permissions(models.ProductCategory)


@pytest.mark.django_db
class TestAllowedListViewSet:
    def test_multi_tenancy(self, allowed_list, assert_admin_api_multi_tenancy):
        user = assert_admin_api_multi_tenancy.client.user
        add_perm_to_user(user, "AllowedList", Perm.VIEW)
        assert_admin_api_multi_tenancy(
            reverse("admin_rest:allowedlist-detail", args=[allowed_list.pk])
        )

    def test_permissions(self, assert_permissions):
        assert_permissions(models.AllowedList)


@pytest.mark.django_db
class TestAllowedListOrgViewSet:
    def test_multi_tenancy(
        self, allowed_list_org_factory, assert_admin_api_multi_tenancy
    ):
        org = allowed_list_org_factory()
        user = assert_admin_api_multi_tenancy.client.user
        add_perm_to_user(user, "AllowedListOrg", Perm.VIEW)
        assert_admin_api_multi_tenancy(
            reverse("admin_rest:allowedlistorg-detail", args=[org.pk])
        )

    def test_permissions(self, assert_permissions):
        assert_permissions(models.AllowedListOrg)

    def test_get(self, token_client, allowed_list_org_factory):
        allowed_list_org_factory()
        add_perm_to_user(token_client.user, "AllowedListOrg", Perm.VIEW)

        url = f"{BASE_TENANT_API_URL}/allowedlistorgs"
        response = token_client.get(url)
        assert response.status_code == 200
        assert len(response.json()["data"]) == 1


@pytest.mark.django_db
class TestSiteProfileView:
    def test_multi_tenancy(self, site_profile_factory, assert_admin_api_multi_tenancy):
        site_profile_factory()
        user = assert_admin_api_multi_tenancy.client.user
        add_perm_to_user(user, "SiteProfile", Perm.VIEW)
        assert_admin_api_multi_tenancy(reverse("admin_rest:siteprofile"))

    def test_permissions(self, site_profile_factory, assert_permissions):
        profile = site_profile_factory()
        assert_permissions(profile.__class__, url=reverse("admin_rest:siteprofile"))


@pytest.mark.django_db
class TestTranslationViewSet:
    def test_ok(self, mocker, token_client, plan_factory, step_factory):
        plan = plan_factory(version__product__title="Example")
        step_factory(name="Foo", plan=plan)
        step_factory(name="Install Example 1.0", plan=plan)
        update_job = mocker.patch(
            "metadeploy.adminapi.views.update_all_translations", autospec=True
        )

        add_perm_to_user(token_client.user, "Translation", Perm.CHANGE)
        response = token_client.patch(
            reverse("admin_rest:translation-detail", args=["es"]),
            {
                "example:product": {"title": {"message": "Ejemplo"}},
                "example:steps": {
                    "Install {product} {version}": {
                        "message": "Instalar {product} {version}"
                    },
                    "Foo": {"message": "Fú"},
                },
            },
            format="json",
        )

        assert response.status_code == 200
        update_job.delay.assert_called_once_with("es", 1)

    def test_invalid_lang(self, token_client):
        add_perm_to_user(token_client.user, "Translation", Perm.CHANGE)
        response = token_client.patch(
            reverse("admin_rest:translation-detail", args=["es-bogus"]), {}
        )
        assert response.status_code == 404

    def test_multi_tenancy(self, mocker, token_client, extra_site):
        """A tenant admin attempting to update translations on a different
        tenant should receive a 401 error."""
        add_perm_to_user(token_client.user, "Translation", Perm.CHANGE)
        response = token_client.patch(
            reverse("admin_rest:translation-detail", args=["es"]),
            {},
            SERVER_NAME=extra_site.domain,
        )
        assert response.status_code == 401

    def test_permissions(self, token_client):
        url = reverse("admin_rest:translation-detail", args=["es"])
        response = token_client.patch(url, data={})
        assert (
            response.status_code == 403
        ), f"Expected to get 403 when PATCHing {url} with no permissions"

        add_perm_to_user(token_client.user, "Translation", Perm.CHANGE)

        response = token_client.patch(url, data={})
        assert (
            response.status_code == 200
        ), f"Expected to get 200 when PATCHing {url} as a staff user with permission '{Perm.CHANGE}__Translation'"
