import pytest
from django.core.management import call_command

from ....models import Product


@pytest.mark.django_db
def test_populate_sample_products():
    assert Product.objects.count() == 0

    call_command('populate_sample_products')

    assert Product.objects.count() == 8
