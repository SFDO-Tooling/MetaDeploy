import pytest

from django.core.exceptions import (
    ObjectDoesNotExist,
    MultipleObjectsReturned,
)


@pytest.mark.django_db
class TestIconProperty:
    def test_uses_icon_url(self, product_factory):
        product = product_factory(icon_url='https://example.com/example.png')
        assert product.icon == {
            'type': 'url',
            'url': 'https://example.com/example.png',
        }

    def test_uses_slds_attrs(self, product_factory):
        product = product_factory(
            slds_icon_category='action',
            slds_icon_name='test',
        )
        assert product.icon == {
            'type': 'slds',
            'category': 'action',
            'name': 'test',
        }

    def test_default(self, product_factory):
        product = product_factory()
        assert product.icon is None


@pytest.mark.django_db
class TestPlansProperties:
    def test_primary_plan__missing(self, version_factory):
        version = version_factory()
        with pytest.raises(ObjectDoesNotExist):
            version.primary_plan

    def test_primary_plan__too_many(self, version_factory, plan_factory):
        version = version_factory()
        plan_factory(version=version, tier='primary')
        plan_factory(version=version, tier='primary')
        with pytest.raises(MultipleObjectsReturned):
            version.primary_plan

    def test_primary_plan__good(self, version_factory, plan_factory):
        version = version_factory()
        plan = plan_factory(version=version, tier='primary')
        assert version.primary_plan == plan

    def test_secondary_plan__none(self, version_factory, plan_factory):
        version = version_factory()
        assert version.secondary_plan is None

    def test_secondary_plan__good(self, version_factory, plan_factory):
        version = version_factory()
        plan = plan_factory(version=version, tier='secondary')
        assert version.secondary_plan == plan

    def test_additional_plans(self, version_factory, plan_factory):
        version = version_factory()
        plan1 = plan_factory(version=version, tier='additional')
        plan2 = plan_factory(version=version, tier='additional')
        assert list(version.additional_plans) == [plan1, plan2]


@pytest.mark.django_db
def test_product_most_recent_version(product_factory, version_factory):
    product = product_factory()
    version_factory(label='v0.1.0', product=product)
    v2 = version_factory(label='v0.2.0', product=product)

    assert product.most_recent_version == v2


@pytest.mark.django_db
def test_version_natural_key(version_factory):
    version = version_factory(label='v0.1.0')
    assert version.natural_key() == (version.product, 'v0.1.0')
