import pytest

from django.core.exceptions import (
    ObjectDoesNotExist,
    MultipleObjectsReturned,
)

from ..models import Version


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
def test_product_str(product_factory):
    product = product_factory(title='My Product')
    assert str(product) == 'My Product'


@pytest.mark.django_db
class TestProductSlug:
    def test_present(self, product_factory, product_slug_factory):
        product = product_factory(title='a product')
        product.productslug_set.all().delete()
        product_slug_factory(product=product, slug='a-slug-1', is_active=False)
        product_slug_factory(product=product, slug='a-slug-2', is_active=True)
        product_slug_factory(product=product, slug='a-slug-3', is_active=True)
        product_slug_factory(product=product, slug='a-slug-4', is_active=False)

        assert product.slug == 'a-slug-3'

    def test_absent(self, product_factory):
        product = product_factory(title='a product')
        product.productslug_set.all().delete()

        assert product.slug is None

    def test_ensure_slug(self, product_factory):
        product = product_factory(title='a product')
        product.productslug_set.all().delete()

        product.ensure_slug()

        assert product.slug == 'a-product'


@pytest.mark.django_db
def test_product_most_recent_version(product_factory, version_factory):
    product = product_factory()
    version_factory(label='v0.1.0', product=product)
    v2 = version_factory(label='v0.2.0', product=product)

    assert product.most_recent_version == v2


@pytest.mark.django_db
class TestPlanSlug:
    def test_present(self, plan_factory, plan_slug_factory):
        plan = plan_factory(title='a plan')
        plan.planslug_set.all().delete()
        plan_slug_factory(plan=plan, slug='a-slug-1', is_active=False)
        plan_slug_factory(plan=plan, slug='a-slug-2', is_active=True)
        plan_slug_factory(plan=plan, slug='a-slug-3', is_active=True)
        plan_slug_factory(plan=plan, slug='a-slug-4', is_active=False)

        assert plan.slug == 'a-slug-3'

    def test_absent(self, plan_factory):
        plan = plan_factory(title='a plan')
        plan.planslug_set.all().delete()

        assert plan.slug is None

    def test_ensure_slug(self, plan_factory):
        plan = plan_factory(title='a plan')
        plan.planslug_set.all().delete()

        plan.ensure_slug()

        assert plan.slug == 'a-plan'


@pytest.mark.django_db
def test_plan_natural_key(plan_factory):
    plan = plan_factory(title='My Plan')
    assert plan.natural_key() == (plan.version, 'My Plan')


@pytest.mark.django_db
def test_plan_str(product_factory, version_factory, plan_factory):
    product = product_factory(title='My Product')
    version = version_factory(label='v0.1.0', product=product)
    plan = plan_factory(title='My Plan', version=version)
    assert str(plan) == 'My Product, Version v0.1.0, Plan My Plan'


@pytest.mark.django_db
class TestVersionNaturalKey:
    def test_version_natural_key(self, version_factory):
        version = version_factory(label='v0.1.0')

        assert version.natural_key() == (version.product, 'v0.1.0')

    def test_version_get_by_natural_key(self, version_factory):
        v1 = version_factory(label='v0.1.0')
        version_factory(product=v1.product, label='v0.2.0')

        assert Version.objects.get_by_natural_key(
            product=v1.product,
            label='v0.1.0',
        ) == v1

    def test_version_str(self, product_factory, version_factory):
        product = product_factory(title='My Product')
        version = version_factory(label='v0.1.0', product=product)

        assert str(version) == 'My Product, Version v0.1.0'
