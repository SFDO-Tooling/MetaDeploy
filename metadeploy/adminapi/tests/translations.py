from unittest import mock

import pytest

from metadeploy.adminapi.translations import update_all_translations


@pytest.mark.django_db
class TestTranslationViewSet:
    def test_partial_update(self, admin_api_client, plan_factory, step_factory):
        plan = plan_factory(version__product__title="Example")
        product = plan.version.product
        step1 = step_factory(name="Foo", plan=plan)
        step2 = step_factory(name="Install Example 1.0", plan=plan)

        url = "http://testserver/admin/rest"
        with mock.patch(
            "metadeploy.adminapi.api.update_all_translations"
        ) as update_job:
            response = admin_api_client.patch(
                f"{url}/translations/es",
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
        update_job.delay.assert_called_once()

        # Synchronously run the job that would normally be run as an rq job
        update_all_translations("es")

        product.set_current_language("es")
        assert product.title == "Ejemplo"

        step1.set_current_language("es")
        assert step1.name == "Fú"

        step2.set_current_language("es")
        assert step2.name == "Instalar Example 1.0"
