import factory
from pytest_factoryboy import register

from django.contrib.auth import get_user_model

from metadeploy.api.models import (
    Product,
    ProductSlug,
    Version,
    Plan,
)

User = get_user_model()


class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence('user_{}@example.com'.format)
    password = factory.PostGenerationMethodCall('set_password', 'foobar')


@register
class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Product

    title = factory.Sequence('Sample Product {}'.format)
    description = 'This is a sample product.'
    category = 'salesforce'
    color = '#FFFFFF'
    icon_url = ''
    slds_icon_category = ''
    slds_icon_name = ''


@register
class ProductSlugFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProductSlug

    slug = factory.Sequence('this-is-a-slug-{}'.format)
    product = factory.SubFactory(ProductFactory)


@register
class VersionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Version

    product = factory.SubFactory(ProductFactory)
    label = 'v0.1.0'
    description = 'A sample version.'


@register
class PlanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Plan

    title = 'Sample plan'
    version = factory.SubFactory(VersionFactory)


register(UserFactory)
