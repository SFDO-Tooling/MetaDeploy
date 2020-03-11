import pytest


@pytest.mark.django_db
class TestTranslationViewSet:
    def test_partial_update(self, admin_api_client, product_factory, step_factory):
        product = product_factory(title="Example")
        step1 = step_factory(name="Foo")
        step2 = step_factory(name="Install Example 1.0")

        url = "http://testserver/admin/rest"
        response = admin_api_client.patch(
            f"{url}/translations/es",
            {
                "example:product": {"title": {"message": "Ejemplo"}},
                "steps": {
                    "Install {product} {version}": {
                        "message": "Instalar {product} {version}"
                    },
                    "Foo": {"message": "Fú"},
                },
            },
            format="json",
        )

        assert response.status_code == 200

        product.set_current_language("es")
        assert product.title == "Ejemplo"

        step1.set_current_language("es")
        assert step1.name == "Fú"

        step2.set_current_language("es")
        assert step2.name == "Instalar Example 1.0"
