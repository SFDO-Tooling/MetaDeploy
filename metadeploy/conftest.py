from pytest_factoryboy import register
from rest_framework.test import APIClient
import factory
import pytest

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
    Step,
)

User = get_user_model()


@register
class SocialAppFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialApp
        django_get_or_create = ('provider',)

    name = 'Salesforce Production'
    provider = 'salesforce-production'
    key = 'https://login.salesforce.com/'


@register
class SocialTokenFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialToken

    token = '0123456789abcdef'
    token_secret = 'secret.0123456789abcdef'
    app = factory.SubFactory(SocialAppFactory)


@register
class SocialAccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialAccount

    provider = 'salesforce-production'
    uid = factory.Sequence('https://example.com/{}'.format)
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
    repo_url = 'https://github.com/some/repo.git'


@register
class ProductSlugFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProductSlug

    slug = factory.Sequence('this-is-a-slug-{}'.format)
    parent = factory.SubFactory(ProductFactory)


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
    preflight_flow_name = 'preflight_flow'
    flow_name = 'main_flow'


@register
class StepFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Step

    name = 'Sample step'
    plan = factory.SubFactory(PlanFactory)
    task_name = 'main_task'


@register
class PlanSlugFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PlanSlug

    slug = factory.Sequence('this-is-a-slug-{}'.format)
    parent = factory.SubFactory(PlanFactory)


@register
class JobFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Job

    user = factory.SubFactory(UserFactory)
    plan = factory.SubFactory(PlanFactory)
    enqueued_at = None
    job_id = None

    @factory.post_generation
    def steps(self, create, extracted, **kwargs):  # pragma: nocover
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of steps was passed in, use it
            for step in extracted:
                self.steps.add(step)


@pytest.fixture
def client(user_factory):
    user = user_factory()
    client = APIClient()
    client.force_login(user)
    return client


# TODO: We will need these eventually, but not yet:
#
# @pytest.fixture
# def anon_client():
#     return APIClient()
