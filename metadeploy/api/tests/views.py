import pytest
from django.urls import reverse

from metadeploy.conftest import format_timestamp

from ..models import Job, Plan, PreflightResult


@pytest.mark.django_db
def test_user_view(client):
    response = client.get(reverse("user"))

    assert response.status_code == 200
    assert response.json()["username"].endswith("@example.com")


@pytest.mark.django_db
class TestJobViewset:
    def test_job__cannot_see(self, client, job_factory):
        job = job_factory(org_id="00Dxxxxxxxxxxxxxxx")
        response = client.get(reverse("job-detail", kwargs={"pk": job.id}))

        assert response.status_code == 404
        assert response.json() == {"detail": "Not found."}

    def test_job__is_staff(self, client, user_factory, job_factory):
        user = user_factory(is_staff=True)
        client.force_login(user)
        job = job_factory(org_name="Secret Org", org_id="00Dxxxxxxxxxxxxxxx")
        response = client.get(reverse("job-detail", kwargs={"pk": job.id}))

        assert response.status_code == 200
        assert response.json() == {
            "id": str(job.id),
            "creator": {"username": job.user.username, "is_staff": False},
            "plan": str(job.plan.id),
            "steps": [],
            "organization_url": "",
            "org_id": "00Dxxxxxxxxxxxxxxx",
            "results": {},
            "created_at": format_timestamp(job.created_at),
            "enqueued_at": None,
            "job_id": None,
            "status": "started",
            "org_name": "Secret Org",
            "org_type": "",
            "is_production_org": False,
            "error_count": 0,
            "warning_count": 0,
            "is_public": False,
            "user_can_edit": False,
            "message": "",
            "error_message": "",
            "edited_at": format_timestamp(job.edited_at),
        }

    def test_job__your_own(self, client, job_factory):
        job = job_factory(
            user=client.user, org_name="Secret Org", org_id=client.user.org_id
        )
        response = client.get(reverse("job-detail", kwargs={"pk": job.id}))

        assert response.status_code == 200
        assert response.json() == {
            "id": str(job.id),
            "creator": {"username": job.user.username, "is_staff": False},
            "plan": str(job.plan.id),
            "steps": [],
            "organization_url": "",
            "org_id": "00Dxxxxxxxxxxxxxxx",
            "results": {},
            "created_at": format_timestamp(job.created_at),
            "enqueued_at": None,
            "job_id": None,
            "status": "started",
            "org_name": "Secret Org",
            "org_type": "",
            "is_production_org": False,
            "error_count": 0,
            "warning_count": 0,
            "is_public": False,
            "user_can_edit": True,
            "message": "",
            "error_message": "",
            "edited_at": format_timestamp(job.edited_at),
        }

    def test_job__is_public(self, client, job_factory):
        job = job_factory(
            is_public=True, org_name="Secret Org", org_id="00Dxxxxxxxxxxxxxxx"
        )
        response = client.get(reverse("job-detail", kwargs={"pk": job.id}))

        assert response.status_code == 200
        assert response.json() == {
            "id": str(job.id),
            "creator": None,
            "plan": str(job.plan.id),
            "organization_url": None,
            "org_id": None,
            "steps": [],
            "results": {},
            "created_at": format_timestamp(job.created_at),
            "enqueued_at": None,
            "job_id": None,
            "status": "started",
            "org_name": None,
            "org_type": "",
            "is_production_org": False,
            "error_count": 0,
            "warning_count": 0,
            "is_public": True,
            "user_can_edit": False,
            "message": "",
            "error_message": "",
            "edited_at": format_timestamp(job.edited_at),
        }

    def test_job__is_public_anon(self, anon_client, job_factory):
        job = job_factory(
            is_public=True, org_name="Secret Org", org_id="00Dxxxxxxxxxxxxxxx"
        )
        url = reverse("job-detail", kwargs={"pk": job.id})
        response = anon_client.get(url)

        assert response.status_code == 200
        assert response.json() == {
            "id": str(job.id),
            "creator": None,
            "plan": str(job.plan.id),
            "organization_url": None,
            "org_id": None,
            "steps": [],
            "results": {},
            "error_count": 0,
            "warning_count": 0,
            "created_at": format_timestamp(job.created_at),
            "enqueued_at": None,
            "job_id": None,
            "status": "started",
            "org_name": None,
            "org_type": "",
            "is_production_org": False,
            "is_public": True,
            "user_can_edit": False,
            "message": "",
            "error_message": "",
            "edited_at": format_timestamp(job.edited_at),
        }

    def test_create_job(self, client, plan_factory, preflight_result_factory):
        plan = plan_factory()
        preflight_result_factory(
            plan=plan,
            user=client.user,
            status=PreflightResult.Status.complete,
            org_id=client.user.org_id,
        )
        data = {"plan": str(plan.id), "steps": []}
        response = client.post(reverse("job-list"), data=data)

        assert response.status_code == 201
        assert response.json()["org_type"] == "Developer Edition"
        assert response.json()["org_name"] == "Sample Org"

    def test_destroy_job(self, client, job_factory):
        job = job_factory(user=client.user, org_id=client.user.org_id)
        response = client.delete(reverse("job-detail", kwargs={"pk": job.id}))

        assert response.status_code == 204
        assert Job.objects.filter(id=job.id).exists()

    def test_destroy_job__bad_user(self, client, job_factory):
        job = job_factory(is_public=True, org_id="00Dxxxxxxxxxxxxxxx")
        response = client.delete(reverse("job-detail", kwargs={"pk": job.id}))

        assert response.status_code == 403
        assert Job.objects.filter(id=job.id).exists()


@pytest.mark.django_db
class TestBasicGetViews:
    def test_product(
        self, client, allowed_list_factory, product_factory, version_factory
    ):
        allowed_list = allowed_list_factory(org_type=["Developer"])
        product = product_factory(visible_to=allowed_list)
        version_factory(product=product)
        response = client.get(reverse("product-list"))

        assert response.status_code == 200
        assert response.json() == {
            "count": 0,
            "results": [],
            "previous": None,
            "next": None,
        }

    def test_version(self, client, version_factory):
        version = version_factory()
        response = client.get(reverse("version-detail", kwargs={"pk": version.id}))

        assert response.status_code == 200
        assert response.json() == {
            "id": str(version.id),
            "product": str(version.product.id),
            "label": version.label,
            "description": "A sample version.",
            "created_at": format_timestamp(version.created_at),
            "primary_plan": None,
            "secondary_plan": None,
            "is_listed": True,
        }

    def test_plan(self, client, plan_factory):
        plan = plan_factory()
        response = client.get(reverse("plan-detail", kwargs={"pk": plan.id}))

        assert response.status_code == 200
        assert response.json() == {
            "id": str(plan.id),
            "title": str(plan.title),
            "version": str(plan.version.id),
            "preflight_message": "",
            "requires_preflight": False,
            "tier": "primary",
            "slug": str(plan.slug),
            "old_slugs": [],
            "steps": [],
            "is_allowed": True,
            "is_listed": True,
            "not_allowed_instructions": None,
            "average_duration": None,
        }

    def test_plan__not_visible(self, client, allowed_list_factory, plan_factory):
        allowed_list = allowed_list_factory(description="Sample instructions.")
        plan = plan_factory(visible_to=allowed_list)
        response = client.get(reverse("plan-detail", kwargs={"pk": plan.id}))

        assert response.status_code == 200
        assert response.json() == {
            "id": str(plan.id),
            "title": str(plan.title),
            "version": str(plan.version.id),
            "preflight_message": None,
            "requires_preflight": False,
            "tier": "primary",
            "slug": str(plan.slug),
            "old_slugs": [],
            "steps": None,
            "is_allowed": False,
            "is_listed": True,
            "not_allowed_instructions": "<p>Sample instructions.</p>",
            "average_duration": None,
        }

    def test_plan__visible(
        self,
        client,
        allowed_list_factory,
        allowed_list_org_factory,
        plan_factory,
        user_factory,
    ):
        allowed_list = allowed_list_factory(description="Sample instructions.")
        allowed_list_org = allowed_list_org_factory(allowed_list=allowed_list)
        plan = plan_factory(visible_to=allowed_list)
        user = user_factory()
        social_account = user.socialaccount_set.all()[0]
        social_account.extra_data["organization_id"] = allowed_list_org.org_id
        social_account.save()
        client.force_login(user)
        response = client.get(reverse("plan-detail", kwargs={"pk": plan.id}))

        assert response.status_code == 200
        assert response.json() == {
            "id": str(plan.id),
            "title": str(plan.title),
            "version": str(plan.version.id),
            "preflight_message": "",
            "requires_preflight": False,
            "tier": "primary",
            "slug": str(plan.slug),
            "old_slugs": [],
            "steps": [],
            "is_allowed": True,
            "is_listed": True,
            "not_allowed_instructions": "<p>Sample instructions.</p>",
            "average_duration": None,
        }

    def test_plan__visible_superuser(
        self, client, allowed_list_factory, plan_factory, user_factory
    ):
        allowed_list = allowed_list_factory(description="Sample instructions.")
        plan = plan_factory(visible_to=allowed_list)
        user = user_factory(is_superuser=True)
        client.force_login(user)
        response = client.get(reverse("plan-detail", kwargs={"pk": plan.id}))

        assert response.status_code == 200
        assert response.json() == {
            "id": str(plan.id),
            "title": str(plan.title),
            "version": str(plan.version.id),
            "preflight_message": "",
            "requires_preflight": False,
            "tier": "primary",
            "slug": str(plan.slug),
            "old_slugs": [],
            "steps": [],
            "is_allowed": True,
            "is_listed": True,
            "not_allowed_instructions": "<p>Sample instructions.</p>",
            "average_duration": None,
        }


@pytest.mark.django_db
class TestPreflight:
    def test_post(self, client, plan_factory):
        plan = plan_factory()
        response = client.post(reverse("plan-preflight", kwargs={"pk": plan.id}))

        assert response.status_code == 201

    def test_get__good(self, client, plan_factory, preflight_result_factory):
        plan = plan_factory()
        preflight = preflight_result_factory(
            plan=plan,
            user=client.user,
            organization_url=client.user.instance_url,
            org_id=client.user.org_id,
        )
        response = client.get(reverse("plan-preflight", kwargs={"pk": plan.id}))

        assert response.status_code == 200
        assert response.json() == {
            "id": str(preflight.id),
            "organization_url": client.user.instance_url,
            "org_id": "00Dxxxxxxxxxxxxxxx",
            "plan": str(plan.id),
            "created_at": format_timestamp(preflight.created_at),
            "is_valid": True,
            "status": "started",
            "results": {},
            "error_count": 0,
            "warning_count": 0,
            "is_ready": False,
            "user": str(client.user.id),
            "edited_at": format_timestamp(preflight.edited_at),
        }

    def test_get__bad(self, client, plan_factory):
        plan = plan_factory()
        response = client.get(reverse("plan-preflight", kwargs={"pk": plan.id}))

        assert response.status_code == 404

    def test_post__unallowed(self, client, plan_factory, allowed_list_factory):
        allowed_list = allowed_list_factory()
        plan = plan_factory(visible_to=allowed_list)
        response = client.post(reverse("plan-preflight", kwargs={"pk": plan.id}))

        assert response.status_code == 403

    def test_preflight_where_plan_not_listed(
        self, client, plan_factory, preflight_result_factory
    ):
        plan = plan_factory()
        plan.is_listed = False
        plan.save()

        preflight_result_factory(
            plan=plan,
            user=client.user,
            organization_url=client.user.instance_url,
            org_id=client.user.org_id,
        )

        get_response = client.get(reverse("plan-preflight", kwargs={"pk": plan.id}))
        assert get_response.status_code == 200

        post_response = client.post(reverse("plan-preflight", kwargs={"pk": plan.id}))
        assert post_response.status_code == 201


@pytest.mark.django_db
class TestOrgViewset:
    def test_get_job(self, client, job_factory, plan_factory):
        plan = plan_factory()
        job = job_factory(
            organization_url=client.user.instance_url,
            user=client.user,
            plan=plan,
            org_id=client.user.org_id,
        )
        response = client.get(reverse("org-list"))

        assert response.json()["current_job"]["id"] == str(job.id)
        assert response.json()["current_preflight"] is None

    def test_get_preflight(self, client, preflight_result_factory, plan_factory):
        plan = plan_factory()
        preflight = preflight_result_factory(
            organization_url=client.user.instance_url,
            user=client.user,
            plan=plan,
            org_id=client.user.org_id,
        )
        response = client.get(reverse("org-list"))

        assert response.json()["current_job"] is None
        assert response.json()["current_preflight"] == str(preflight.id)

    def test_get_none(self, client):
        response = client.get(reverse("org-list"))

        assert response.json() == {"current_job": None, "current_preflight": None}


@pytest.mark.django_db
class TestVersionAdditionalPlans:
    def test_get__good(self, client, plan_factory):
        plan = plan_factory(tier=Plan.Tier.additional)
        response = client.get(
            reverse("version-additional-plans", kwargs={"pk": plan.version.id})
        )

        assert response.status_code == 200
        assert response.json() == [
            {
                "id": str(plan.id),
                "title": str(plan.title),
                "version": str(plan.version.id),
                "preflight_message": "",
                "tier": "additional",
                "slug": str(plan.slug),
                "old_slugs": [],
                "steps": [],
                "is_allowed": True,
                "is_listed": True,
                "not_allowed_instructions": None,
                "requires_preflight": False,
                "average_duration": None,
            }
        ]


@pytest.mark.django_db
class TestUnlisted:
    def test_product(self, client, product_factory, version_factory):
        product1 = product_factory()
        version_factory(product=product1)
        product2 = product_factory(is_listed=False)
        version_factory(product=product2)

        response = client.get(reverse("product-get-one"), {"slug": product2.slug})

        assert response.status_code == 200
        assert response.json()["id"] == product2.id

    def test_version(self, client, product_factory, version_factory):
        product = product_factory()
        version_factory(product=product)
        version = version_factory(product=product, is_listed=False)

        response = client.get(
            reverse("version-get-one"),
            {"label": version.label, "product": product.slug},
        )

        assert response.status_code == 200
        assert response.json()["id"] == version.id

    def test_plan(
        self,
        client,
        product_factory,
        version_factory,
        plan_template_factory,
        plan_factory,
    ):
        product = product_factory()
        version = version_factory(product=product)
        plan_template1 = plan_template_factory(product=product)
        plan_template2 = plan_template_factory(product=product)
        plan_factory(version=version, plan_template=plan_template1)
        plan = plan_factory(
            version=version,
            plan_template=plan_template2,
            is_listed=False,
            tier="additional",
        )

        response = client.get(
            reverse("plan-get-one"),
            {"slug": plan.slug, "version": str(version.id), "product": str(product.id)},
        )

        assert response.status_code == 200
        assert response.json()["id"] == plan.id

    def test_plan__missing_param(
        self,
        client,
        product_factory,
        version_factory,
        plan_template_factory,
        plan_factory,
    ):
        product = product_factory()
        version = version_factory(product=product)
        plan_template1 = plan_template_factory(product=product)
        plan_template2 = plan_template_factory(product=product)
        plan_factory(version=version, plan_template=plan_template1)
        plan = plan_factory(
            version=version,
            plan_template=plan_template2,
            is_listed=False,
            tier="additional",
        )

        response = client.get(
            reverse("plan-get-one"), {"slug": plan.slug, "product": str(product.id)}
        )

        assert response.status_code == 404

    def test_plan__multiple(
        self,
        client,
        product_factory,
        version_factory,
        plan_template_factory,
        plan_factory,
    ):
        # If there are multiple plans for the same version/plan template,
        # we expect to get the most recently created one.
        product = product_factory()
        version = version_factory(product=product)
        plan_template = plan_template_factory(product=product)
        plan_factory(
            version=version,
            plan_template=plan_template,
            is_listed=False,
            tier="additional",
        )
        plan = plan_factory(
            version=version,
            plan_template=plan_template,
            is_listed=False,
            tier="additional",
        )

        response = client.get(
            reverse("plan-get-one"),
            {"slug": plan.slug, "version": str(version.id), "product": str(product.id)},
        )

        assert response.status_code == 200
        assert response.json()["id"] == plan.id
