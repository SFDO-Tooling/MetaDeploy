import factory
from pytest_factoryboy import register

from django.contrib.auth import get_user_model

from allauth.socialaccount.models import (
    SocialApp,
    SocialAccount,
    SocialToken,
)

from .api.models import Job, Product, ProductCategory

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


@register
class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence("user_{}@example.com".format)
    username = factory.Sequence("user_{}@example.com".format)
    password = factory.PostGenerationMethodCall('set_password', 'foobar')
    socialaccount_set = factory.RelatedFactory(SocialAccountFactory, 'user')


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
    description = 'A sample description.'
    version = ''
    category = factory.SubFactory(ProductCategoryFactory)


@register
class JobFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Job

    user = factory.SubFactory(UserFactory)
    instance_url = 'https://example.com/'
    package_url = 'https://example.com/'
    flow_name = 'sample_flow'
    enqueued_at = None
    job_id = None


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
