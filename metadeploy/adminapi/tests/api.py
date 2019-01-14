import pytest


@pytest.mark.django_db
class TestPlanViewSet:
    def test_list(self, staff_client, plan_factory):
        plan = plan_factory()

        url = "http://testserver/admin/rest/plans"
        response = staff_client.get(url)

        assert response.status_code == 200
        version_url = f"http://testserver/admin/rest/versions/{plan.version.id}"
        assert response.json() == {
            "data": [
                {
                    "flow_name": "slow_steps_flow",
                    "id": f"{plan.id}",
                    "is_listed": True,
                    "post_install_message": "",
                    "preflight_flow_name": "slow_steps_preflight_good",
                    "preflight_message": "",
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

    def test_retrieve(self, staff_client, plan_factory):
        plan = plan_factory()
        url = f"http://testserver/admin/rest/plans/{plan.id}"
        response = staff_client.get(url)

        assert response.status_code == 200
        assert response.json() == {
            "flow_name": "slow_steps_flow",
            "id": str(plan.id),
            "is_listed": True,
            "post_install_message": "",
            "preflight_flow_name": "slow_steps_preflight_good",
            "preflight_message": "",
            "tier": "primary",
            "title": "Sample plan",
            "url": url,
            "version": f"http://testserver/admin/rest/versions/{plan.version.id}",
            "visible_to": None,
        }
