import factory
from pytest_factoryboy import register

from django.contrib.auth import get_user_model

from allauth.socialaccount.models import (
    SocialApp,
    SocialAccount,
    SocialToken,
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
class SocialAccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialAccount

    provider = 'salesforce-production'


@register
class SocialTokenFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialToken

    token = factory.Sequence('0123456789abcdef{}'.format)
    token_secret = factory.Sequence('secret.0123456789abcdef{}'.format)
    app = factory.SubFactory(SocialAppFactory)
    account = factory.SubFactory(SocialAccountFactory)


@register
class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence("user_{}@example.com".format)
    username = factory.Sequence("user_{}@example.com".format)
    password = factory.PostGenerationMethodCall('set_password', 'foobar')
    socialaccount_set = factory.RelatedFactory(SocialAccountFactory, 'user')


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
