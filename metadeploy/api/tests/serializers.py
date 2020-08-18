from datetime import timedelta

import pytest
from django.utils import timezone

from metadeploy.conftest import format_timestamp

from ..models import Job, PreflightResult
from ..serializers import (
    JobSerializer,
    JobSummarySerializer,
    PlanSerializer,
    PreflightResultSerializer,
    ProductCategorySerializer,
    ProductSerializer,
)


@pytest.mark.django_db
class TestPlanSerializer:
    def test_circumspect_description(
        self, rf, user_factory, plan_factory, allowed_list_factory, step_factory
    ):
        user = user_factory()
        allowed_list = allowed_list_factory()
        plan = plan_factory(
            visible_to=allowed_list, preflight_message_additional="test"
        )
        [step_factory(plan=plan) for _ in range(3)]

        request = rf.get("/")
        request.user = user
        context = {"request": request}

        serializer = PlanSerializer(plan, context=context)
        assert serializer.data["preflight_message"] is None
        assert serializer.data["steps"] is None

    def test_circumspect_product_description(
        self,
        rf,
        user_factory,
        plan_factory,
        allowed_list_factory,
        step_factory,
        product_factory,
        plan_template_factory,
    ):
        user = user_factory()
        allowed_list = allowed_list_factory(description="Test.")
        product = product_factory(visible_to=allowed_list)
        plan_template = plan_template_factory(preflight_message="test")
        plan = plan_factory(plan_template=plan_template, version__product=product)
        [step_factory(plan=plan) for _ in range(3)]

        request = rf.get("/")
        request.user = user
        context = {"request": request}

        serializer = PlanSerializer(plan, context=context)
        assert serializer.data["preflight_message"] is None
        assert serializer.data["steps"] is None
        assert serializer.data["not_allowed_instructions"] == "<p>Test.</p>"


@pytest.mark.django_db
class TestProductSerializer:
    def test_no_most_recent_version(
        self, rf, user_factory, product_factory, version_factory
    ):
        user = user_factory()
        product = product_factory()

        request = rf.get("/")
        request.user = user
        context = {"request": request}

        serializer = ProductSerializer(product, context=context)
        assert serializer.data["most_recent_version"] is None

    def test_circumspect_description(
        self, rf, user_factory, product_factory, allowed_list_factory
    ):
        user = user_factory()
        allowed_list = allowed_list_factory()
        product = product_factory(visible_to=allowed_list, description="Test")

        request = rf.get("/")
        request.user = user
        context = {"request": request}

        serializer = ProductSerializer(product, context=context)
        assert serializer.data["description"] is None


@pytest.mark.django_db
class TestPreflightSerializer:
    def test_preflight_error_count(
        self, user_factory, plan_factory, preflight_result_factory
    ):
        user = user_factory()
        plan = plan_factory()
        preflight = preflight_result_factory(
            user=user,
            organization_url=user.instance_url,
            org_id=user.org_id,
            plan=plan,
            results={0: {"status": "error"}},
            status=PreflightResult.Status.complete,
        )
        serializer = PreflightResultSerializer(instance=preflight).data
        assert serializer["error_count"] == 1
        assert serializer["warning_count"] == 0

    def test_preflight_warning_count(
        self, user_factory, plan_factory, preflight_result_factory
    ):
        user = user_factory()
        plan = plan_factory()
        preflight = preflight_result_factory(
            user=user,
            organization_url=user.instance_url,
            org_id=user.org_id,
            plan=plan,
            results={0: {"status": "warn"}},
            status=PreflightResult.Status.complete,
        )
        serializer = PreflightResultSerializer(instance=preflight).data
        assert serializer["error_count"] == 0
        assert serializer["warning_count"] == 1

    def test_preflight_is_ready(
        self, user_factory, plan_factory, preflight_result_factory
    ):
        user = user_factory()
        plan = plan_factory()
        preflight = preflight_result_factory(
            user=user,
            organization_url=user.instance_url,
            org_id=user.org_id,
            plan=plan,
            results={0: {"status": "warn"}},
            status=PreflightResult.Status.complete,
        )
        serializer = PreflightResultSerializer(instance=preflight).data
        assert serializer["is_ready"]

    def test_preflight_is_not_ready(
        self, user_factory, plan_factory, preflight_result_factory
    ):
        user = user_factory()
        plan = plan_factory()
        preflight = preflight_result_factory(
            user=user,
            organization_url=user.instance_url,
            org_id=user.org_id,
            plan=plan,
            results={0: {"status": "error"}},
            status=PreflightResult.Status.complete,
        )
        serializer = PreflightResultSerializer(instance=preflight).data
        assert not serializer["is_ready"]


@pytest.mark.django_db
class TestJob:
    def test_create_good(
        self, rf, user_factory, plan_factory, step_factory, preflight_result_factory
    ):
        plan = plan_factory()
        user = user_factory()
        step1 = step_factory(plan=plan)
        step2 = step_factory(plan=plan)
        step3 = step_factory(plan=plan)
        request = rf.get("/")
        request.user = user
        preflight_result_factory(
            plan=plan,
            user=user,
            status=PreflightResult.Status.complete,
            results={str(step2.id): [{"status": "error", "message": ""}]},
            org_id=user.org_id,
        )
        preflight_result_factory(
            plan=plan,
            user=user,
            status=PreflightResult.Status.complete,
            results={
                str(step1.id): {"status": "warn", "message": ""},
                str(step2.id): {"status": "skip", "message": ""},
                str(step3.id): {"status": "optional", "message": ""},
            },
            org_id=user.org_id,
        )
        data = {
            "plan": str(plan.id),
            "steps": [str(step1.id), str(step2.id), str(step3.id)],
        }
        serializer = JobSerializer(data=data, context=dict(request=request))

        assert serializer.is_valid(), serializer.errors

    def test_create_good_no_preflight(
        self, rf, user_factory, plan_factory, step_factory
    ):
        plan = plan_factory()
        user = user_factory()
        step1 = step_factory(plan=plan)
        step2 = step_factory(plan=plan)
        step3 = step_factory(plan=plan)
        request = rf.get("/")
        request.user = user
        data = {
            "plan": str(plan.id),
            "steps": [str(step1.id), str(step2.id), str(step3.id)],
        }
        serializer = JobSerializer(data=data, context=dict(request=request))

        assert serializer.is_valid(), serializer.errors

    def test_create_bad_preflight(
        self, rf, user_factory, plan_factory, step_factory, preflight_result_factory
    ):
        plan = plan_factory()
        user = user_factory()
        step1 = step_factory(plan=plan)
        step2 = step_factory(
            plan=plan, task_config={"checks": [{"when": "True", "action": "error"}]}
        )
        step3 = step_factory(plan=plan)
        request = rf.get("/")
        request.user = user
        preflight_result_factory(
            plan=plan,
            user=user,
            status=PreflightResult.Status.complete,
            results={str(step2.id): {"status": "error", "message": ""}},
            org_id=user.org_id,
        )
        data = {
            "plan": str(plan.id),
            "steps": [str(step1.id), str(step2.id), str(step3.id)],
        }
        serializer = JobSerializer(data=data, context=dict(request=request))

        assert not serializer.is_valid(), serializer.errors

    def test_create_bad_no_preflight(self, rf, user_factory, plan_factory):
        plan = plan_factory(preflight_checks=[{"when": "True", "action": "error"}])
        user = user_factory()
        request = rf.get("/")
        request.user = user
        data = {"plan": str(plan.id), "steps": []}
        serializer = JobSerializer(data=data, context=dict(request=request))

        assert not serializer.is_valid(), serializer.errors

    def test_invalid_steps(
        self, rf, plan_factory, user_factory, step_factory, preflight_result_factory
    ):
        plan = plan_factory()
        user = user_factory()
        step_factory(is_required=True, plan=plan)
        step2 = step_factory(is_required=False, plan=plan)

        request = rf.get("/")
        request.user = user
        preflight_result_factory(
            plan=plan,
            user=user,
            status=PreflightResult.Status.complete,
            results={},
            org_id=user.org_id,
        )
        data = {"plan": str(plan.id), "steps": [str(step2.id)]}
        serializer = JobSerializer(data=data, context=dict(request=request))

        assert not serializer.is_valid(), serializer.errors

    def test_invalid_steps_made_valid_by_preflight(
        self, rf, plan_factory, user_factory, step_factory, preflight_result_factory
    ):
        plan = plan_factory()
        user = user_factory()
        step1 = step_factory(is_required=True, plan=plan)
        step2 = step_factory(is_required=False, plan=plan)

        request = rf.get("/")
        request.user = user
        preflight_result_factory(
            plan=plan,
            user=user,
            status=PreflightResult.Status.complete,
            results={str(step1.id): {"status": "optional", "message": ""}},
            org_id=user.org_id,
        )
        data = {"plan": str(plan.id), "steps": [str(step2.id)]}
        serializer = JobSerializer(data=data, context=dict(request=request))

        assert serializer.is_valid(), serializer.errors

    def test_no_context(self, job_factory):
        job = job_factory(
            status=Job.Status.complete,
            results={"logs": "===="},
            org_id="00Dxxxxxxxxxxxxxxx",
        )
        serializer = JobSerializer(instance=job)

        assert serializer.data["error_count"] == 0
        assert serializer.data["org_name"] is None
        assert serializer.data["organization_url"] is None

    def test_patch(self, rf, job_factory, plan_factory, user_factory):
        plan = plan_factory()
        user = user_factory()
        request = rf.get("/")
        request.user = user
        job = job_factory(user=user, plan=plan, org_id=user.org_id)
        serializer = JobSerializer(
            job, data={"is_public": False}, partial=True, context=dict(request=request)
        )

        assert serializer.is_valid(), serializer.errors

    def test_invalid_with_pending_job(
        self,
        rf,
        user_factory,
        plan_factory,
        step_factory,
        preflight_result_factory,
        job_factory,
    ):
        plan = plan_factory()
        user = user_factory()
        step1 = step_factory(plan=plan)
        step2 = step_factory(plan=plan)
        step3 = step_factory(plan=plan)
        request = rf.get("/")
        request.user = user
        preflight_result_factory(
            plan=plan,
            user=user,
            status=PreflightResult.Status.complete,
            results={str(step2.id): {"status": "error", "message": ""}},
            org_id=user.org_id,
        )
        preflight_result_factory(
            plan=plan,
            user=user,
            status=PreflightResult.Status.complete,
            results={
                str(step1.id): {"status": "warn", "message": ""},
                str(step2.id): {"status": "skip", "message": ""},
                str(step3.id): {"status": "optional", "message": ""},
            },
            org_id=user.org_id,
        )
        data = {
            "plan": str(plan.id),
            "steps": [str(step1.id), str(step2.id), str(step3.id)],
        }
        job = job_factory(organization_url=user.instance_url, org_id=user.org_id)
        serializer = JobSerializer(data=data, context=dict(request=request))

        assert not serializer.is_valid()
        non_field_errors = [
            str(error) for error in serializer.errors["non_field_errors"]
        ]
        assert (
            f"Pending job {job.id} exists. Please try again later, or cancel that job."
            in non_field_errors
        )

    def test_disallowed_plan(
        self,
        rf,
        user_factory,
        plan_factory,
        allowed_list_factory,
        preflight_result_factory,
    ):
        user = user_factory()
        request = rf.get("/")
        request.user = user
        allowed_list = allowed_list_factory()
        plan = plan_factory(visible_to=allowed_list)
        preflight_result_factory(
            plan=plan,
            user=user,
            status=PreflightResult.Status.complete,
            results={},
            org_id=user.org_id,
        )
        preflight_result_factory(
            plan=plan,
            user=user,
            status=PreflightResult.Status.complete,
            results={},
            org_id=user.org_id,
        )
        data = {"plan": str(plan.id), "steps": []}

        serializer = JobSerializer(data=data, context=dict(request=request))

        assert not serializer.is_valid()

    def test_disallowed_product(
        self,
        rf,
        user_factory,
        product_factory,
        plan_factory,
        allowed_list_factory,
        preflight_result_factory,
    ):
        user = user_factory()
        request = rf.get("/")
        request.user = user
        allowed_list = allowed_list_factory()
        product = product_factory(visible_to=allowed_list)
        plan = plan_factory(version__product=product)
        preflight_result_factory(
            plan=plan,
            user=user,
            status=PreflightResult.Status.complete,
            results={},
            org_id=user.org_id,
        )
        preflight_result_factory(
            plan=plan,
            user=user,
            status=PreflightResult.Status.complete,
            results={},
            org_id=user.org_id,
        )
        data = {"plan": str(plan.id), "steps": []}

        serializer = JobSerializer(data=data, context=dict(request=request))

        assert not serializer.is_valid()

    def test_expired_token(self, rf, user_factory, plan_factory, step_factory):
        plan = plan_factory()
        user = user_factory()
        for token in user.socialaccount_set.get().socialtoken_set.all():
            token.delete()
        step1 = step_factory(plan=plan)
        request = rf.get("/")
        request.user = user
        data = {"plan": str(plan.id), "steps": [str(step1.id)]}
        serializer = JobSerializer(data=data, context=dict(request=request))

        assert not serializer.is_valid()
        non_field_errors = [
            str(error) for error in serializer.errors["non_field_errors"]
        ]
        assert (
            "The connection to your org has been lost. Please log in again."
            in non_field_errors
        )

    def test_invalid_results(self, rf, user_factory, plan_factory, step_factory):
        plan = plan_factory()
        user = user_factory()
        step1 = step_factory(plan=plan)
        request = rf.get("/")
        request.user = user
        data = {
            "plan": str(plan.id),
            "steps": [str(step1.id)],
            "results": {str(step1.id): {"status": "ok"}},
        }
        serializer = JobSerializer(data=data, context=dict(request=request))

        assert not serializer.is_valid(), serializer.errors

    def test_results_readonly_on_update(self, rf, user_factory, job_factory):
        user = user_factory()
        request = rf.get("/")
        request.user = user
        job = job_factory(org_id=user.org_id)
        serializer = JobSerializer(
            job,
            data={"results": {"foo": "bar"}},
            context=dict(request=request),
            partial=True,
        )

        assert serializer.is_valid(), serializer.errors
        assert serializer.data["results"] == {}


@pytest.mark.django_db
class TestJobSummarySerializer:
    def test_average_duration(self, plan_factory, job_factory):
        start = timezone.now()
        end = start + timedelta(seconds=30)
        plan = plan_factory()

        job = job_factory(
            plan=plan,
            status=Job.Status.complete,
            success_at=end,
            enqueued_at=start,
            org_id="00Dxxxxxxxxxxxxxxx",
        )
        assert JobSummarySerializer(job).data["plan_average_duration"] is None

        for _ in range(4):
            job_factory(
                plan=plan,
                status=Job.Status.complete,
                success_at=end,
                enqueued_at=start,
                org_id="00Dxxxxxxxxxxxxxxx",
            )
        assert JobSummarySerializer(job).data["plan_average_duration"] == "30.0"


@pytest.mark.django_db
class TestProductCategorySerializer:
    def test_get_first_page(self, rf, product_factory, version_factory, user_factory):
        request = rf.get("")
        request.query_params = {}
        request.user = user_factory()
        product = product_factory(is_listed=True)
        version = version_factory(product=product)
        category = product.category
        serializer = ProductCategorySerializer(category, context={"request": request})
        results = serializer.data["first_page"].pop("results")
        assert serializer.data["first_page"] == {
            "count": 1,
            "previous": None,
            "next": None,
        }
        expected = [
            {
                "id": str(product.id),
                "title": product.title,
                "description": "<p>This is a sample product.</p>",
                "short_description": "",
                "click_through_agreement": "",
                "category": "salesforce",
                "color": "#FFFFFF",
                "icon": None,
                "image": None,
                "most_recent_version": {
                    "id": str(version.id),
                    "product": str(product.id),
                    "label": str(version.label),
                    "description": "A sample version.",
                    "created_at": format_timestamp(version.created_at),
                    "primary_plan": None,
                    "secondary_plan": None,
                    "is_listed": True,
                },
                "slug": product.slug,
                "old_slugs": [],
                "is_allowed": True,
                "is_listed": True,
                "order_key": 0,
                "not_allowed_instructions": None,
            }
        ]
        assert results == expected

    def test_get_first_page__paginated(
        self, rf, product_factory, version_factory, user_factory
    ):
        request = rf.get("")
        request.query_params = {}
        request.user = user_factory()
        product = product_factory()
        version_factory(product=product)
        category = product.category
        for _ in range(30):
            product = product_factory(category=category)
            version_factory(product=product)
        serializer = ProductCategorySerializer(category, context={"request": request})
        # Too much trouble to compare this key:
        serializer.data["first_page"].pop("results")
        assert serializer.data["first_page"] == {
            "count": 31,
            "previous": None,
            "next": f"http://testserver/api/products/?category={category.id}&page=2",
        }
