import pytest
from rest_framework.test import APIClient


@pytest.mark.django_db
class TestPlanViewSet:
    def test_list(self, admin_api_client, plan_factory):
        plan = plan_factory()

        url = "http://testserver/admin/rest/plans"
        response = admin_api_client.get(url)

        assert response.status_code == 200
        version_url = f"http://testserver/admin/rest/versions/{plan.version.id}"
        assert response.json() == {
            "data": [
                {
                    "id": f"{plan.id}",
                    "is_listed": True,
                    "post_install_message": "",
                    "preflight_flow_name": "slow_steps_preflight_good",
                    "preflight_message": "",
                    "steps": [],
                    "tier": "primary",
                    "title": "Sample plan",
                    "url": f"http://testserver/admin/rest/plans/{plan.id}",
                    "version": version_url,
                    "visible_to": None,
                }
            ],
            "links": {"next": None, "previous": None},
            "meta": {"page": {"total": 1}},
        }

    def test_retrieve(self, admin_api_client, step_factory):
        step = step_factory()
        plan = step.plan
        url = f"http://testserver/admin/rest/plans/{plan.id}"
        response = admin_api_client.get(url)

        assert response.status_code == 200
        assert response.json() == {
            "id": str(plan.id),
            "is_listed": True,
            "post_install_message": "",
            "preflight_flow_name": "slow_steps_preflight_good",
            "preflight_message": "",
            "steps": [
                {
                    "description": "",
                    "is_recommended": True,
                    "is_required": True,
                    "kind": "metadata",
                    "name": "Sample step",
                    "task_name": "main_task",
                    "step_num": "1.0",
                    "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    "task_config": {},
                }
            ],
            "tier": "primary",
            "title": "Sample plan",
            "url": url,
            "version": f"http://testserver/admin/rest/versions/{plan.version.id}",
            "visible_to": None,
        }

    def test_create(self, admin_api_client, version_factory):
        version = version_factory()
        url = "http://testserver/admin/rest/plans"
        response = admin_api_client.post(
            url,
            {
                "title": "Sample plan",
                "steps": [
                    {
                        "task_name": "task1",
                        "name": "Task 1",
                        "step_num": "1.0",
                        "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    },
                    {
                        "task_name": "task2",
                        "name": "Task 2",
                        "step_num": "1.3",
                        "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    },
                ],
                "version": f"http://testserver/admin/rest/versions/{version.id}",
            },
            format="json",
        )

        assert response.status_code == 201
        json = response.json()
        plan_id = json["id"]
        assert response.json() == {
            "id": plan_id,
            "is_listed": True,
            "post_install_message": "",
            "preflight_flow_name": "",
            "preflight_message": "",
            "steps": [
                {
                    "description": "",
                    "is_recommended": True,
                    "is_required": True,
                    "kind": "metadata",
                    "name": "Task 1",
                    "task_name": "task1",
                    "step_num": "1.0",
                    "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    "task_config": {},
                },
                {
                    "description": "",
                    "is_recommended": True,
                    "is_required": True,
                    "kind": "metadata",
                    "name": "Task 2",
                    "task_name": "task2",
                    "step_num": "1.3",
                    "task_class": "cumulusci.core.tests.test_tasks._TaskHasResult",
                    "task_config": {},
                },
            ],
            "tier": "primary",
            "title": "Sample plan",
            "url": f"http://testserver/admin/rest/plans/{plan_id}",
            "version": f"http://testserver/admin/rest/versions/{version.id}",
            "visible_to": None,
        }

    def test_update(self, admin_api_client, plan_factory):
        plan = plan_factory()

        response = admin_api_client.put(
            f"http://testserver/admin/rest/plans/{plan.id}",
            {
                "title": "Sample plan",
                "version": f"http://testserver/admin/rest/versions/{plan.version.id}",
            },
            format="json",
        )
        assert response.status_code == 200

        response = admin_api_client.put(
            f"http://testserver/admin/rest/plans/{plan.id}",
            {
                "title": "Sample plan",
                "steps": [],
                "version": f"http://testserver/admin/rest/versions/{plan.version.id}",
            },
            format="json",
        )
        assert response.status_code == 400

    def test_ipaddress_restriction(self, user_factory, plan_factory):
        client = APIClient(REMOTE_ADDR="8.8.8.8")
        user = user_factory(is_staff=True)
        client.force_login(user)
        client.user = user

        plan = plan_factory()
        response = client.get(f"http://testserver/admin/rest/plans/{plan.id}")

        assert response.status_code == 400
