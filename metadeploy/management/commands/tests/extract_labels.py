import json
import pytest
from io import StringIO

from metadeploy.api.models import Product, ProductCategory

from django.core.management import call_command


@pytest.mark.django_db
def test_extract_labels():
    """ Test extract labels command."""
    category = ProductCategory.objects.create(title="Test Category", order_key=10)

    title = "Test Product Title"
    short_description = "Keep it short."
    description = "This is slightly more descriptive."
    click_through_agreement = "# Please check the box below"
    error_message = "# This is an error message"
    product = Product.objects.create(
        title=title,
        short_description=short_description,
        description=description,
        click_through_agreement=click_through_agreement,
        error_message=error_message,
        category=category,
    )

    out = StringIO()
    call_command("extract_labels", stdout=out)

    expected = {
        "Product": {
            str(product.id): {
                "title": {
                    "message": product.title,
                    "description": "The name of the product",
                },
                "short_description": {
                    "message": product.short_description,
                    "description": "Short description of the product",
                },
                "description": {
                    "message": product.description,
                    "description": "Description of the product",
                },
                "click_through_agreement": {
                    "message": product.click_through_agreement,
                    "description": "Users must check a box to agree to this legal text before running the installer",
                },
                "error_message": {
                    "message": product.error_message,
                    "description": "Message regarding what to do if an error occurs during installation",
                },
            }
        }
    }
    actual = out.getvalue()
    expected = json.dumps(expected) + "\n"
    assert actual == expected
