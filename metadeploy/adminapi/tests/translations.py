from unittest import mock

import pytest

from metadeploy.adminapi.translations import update_all_translations
from metadeploy.multitenancy import override_current_site_id


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
        update_job.delay.assert_called_once_with("es", 1)

        # Synchronously run the job that would normally be run as an rq job
        update_all_translations("es", site_id=1)

        product.set_current_language("es")
        assert product.title == "Ejemplo"

        step1.set_current_language("es")
        assert step1.name == "Fú"

        step2.set_current_language("es")
        assert step2.name == "Instalar Example 1.0"

    def test_partial_update__invalid_lang(self, admin_api_client):
        response = admin_api_client.patch(
            "http://testserver/admin/rest/translations/es-bogus", {}
        )
        assert response.status_code == 404

    def test_multi_tenancy(self, mocker, plan_factory, admin_api_client, extra_site):
        update_job = mocker.patch("metadeploy.adminapi.api.update_all_translations")
        default_site_plan = plan_factory(version__product__title="Example")
        default_site_product = default_site_plan.version.product
        with override_current_site_id(extra_site.id):
            plan = plan_factory(version__product__title="Example")
            product = plan.version.product

        admin_api_client.patch(
            "/admin/rest/translations/es",
            {"example:product": {"title": {"message": "Ejemplo"}}},
            format="json",
            SERVER_NAME=extra_site.domain,
        )
        update_job.delay.assert_called_once_with("es", extra_site.id)

        # Synchronously run the job that would normally be run as an rq job
        update_all_translations("es", site_id=extra_site.id)

        product.set_current_language("es")
        assert product.title == "Ejemplo"

        default_site_product.set_current_language("es")
        assert (
            default_site_product.title == "Example"
        ), "Expected translations on the extra Site to not affect the default Site"
