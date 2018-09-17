import factory
from pytest_factoryboy import register

from django.contrib.auth import get_user_model

from allauth.socialaccount.models import (
    SocialApp,
    SocialAccount,
    SocialToken,
)

from metadeploy.api.models import (
    Product,
    ProductSlug,
    ProductCategory,
    Job,
    Version,
    Plan,
    PlanSlug,
)

User = get_user_model()


@register
class SocialAppFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialApp

    name = 'Salesforce Production'
    provider = 'salesforce-production'
    key = 'https://login.salesforce.com/'


@register
class SocialTokenFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialToken

    token = factory.Sequence('0123456789abcdef{}'.format)
    token_secret = factory.Sequence('secret.0123456789abcdef{}'.format)
    app = factory.SubFactory(SocialAppFactory)


@register
class SocialAccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialAccount

    provider = 'salesforce-production'
    socialtoken_set = factory.RelatedFactory(SocialTokenFactory, 'account')
    extra_data = {
        'instance_url': 'https://example.com',
    }


@register
class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence("user_{}@example.com".format)
    username = factory.Sequence("user_{}@example.com".format)
    password = factory.PostGenerationMethodCall('set_password', 'foobar')
    socialaccount_set = factory.RelatedFactory(SocialAccountFactory, 'user')


@register
class JobFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Job

    user = factory.SubFactory(UserFactory)
    repo_url = 'https://example.com/'
    flow_name = 'sample_flow'
    enqueued_at = None
    job_id = None


@register
class ProductCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProductCategory

    title = 'salesforce'


@register
class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Product

    title = factory.Sequence('Sample Product {}'.format)
    description = 'This is a sample product.'
    category = factory.SubFactory(ProductCategoryFactory)
    color = '#FFFFFF'
    icon_url = ''
    slds_icon_category = ''
    slds_icon_name = ''
    _ensure_slug = factory.PostGenerationMethodCall('ensure_slug')


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
    _ensure_slug = factory.PostGenerationMethodCall('ensure_slug')


@register
class PlanSlugFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PlanSlug

    slug = factory.Sequence('this-is-a-slug-{}'.format)
    plan = factory.SubFactory(PlanFactory)


# TODO: We will need these eventually, but not yet:
#
# import pytest
# from rest_framework.test import APIClient
#
# @pytest.fixture
# def client(user_factory):
#     user = user_factory()
#     client = APIClient()
#     client.force_login(user)
#     return client
#
# @pytest.fixture
# def anon_client():
#     return APIClient()
