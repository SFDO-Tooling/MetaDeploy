from datetime import datetime, timezone

import factory
import factory.fuzzy
import pytest
from allauth.socialaccount.models import SocialAccount, SocialApp, SocialToken
from django.contrib.auth import get_user_model
from django.contrib.sites.models import Site
from django.core.cache import cache
from pytest_factoryboy import register
from rest_framework.test import APIClient
from sfdo_template_helpers.crypto import fernet_encrypt

from metadeploy.api.models import (
    AllowedList,
    AllowedListOrg,
    ClickThroughAgreement,
    Job,
    Plan,
    PlanSlug,
    PlanTemplate,
    PreflightResult,
    Product,
    ProductCategory,
    ProductSlug,
    ScratchOrg,
    SiteProfile,
    Step,
    Token,
    Translation,
    Version,
)

TEST_DOMAIN = "testserver"

User = get_user_model()


def format_timestamp(value):
    value = value.isoformat()
    if value.endswith("+00:00"):
        value = value[:-6] + "Z"
    return value


@register
class SiteFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Site
        django_get_or_create = ("domain",)

    domain = TEST_DOMAIN
    name = factory.SelfAttribute("domain")


@register
class SocialAppFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialApp
        django_get_or_create = ("provider",)

    name = "Salesforce"
    provider = "salesforce"
    key = "https://login.salesforce.com/"


@register
class SocialTokenFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialToken

    token = fernet_encrypt("0123456789abcdef")
    token_secret = fernet_encrypt("secret.0123456789abcdef")
    app = factory.SubFactory(SocialAppFactory)


@register
class SocialAccountFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SocialAccount

    provider = "salesforce"
    uid = factory.Sequence("https://example.com/{}".format)
    socialtoken_set = factory.RelatedFactory(SocialTokenFactory, "account")

    class Params:
        org_name = "Sample Org"
        sf_username = factory.Sequence("user_{}@example.com".format)

    @factory.lazy_attribute
    def extra_data(self):
        return {
            "preferred_username": self.sf_username,
            "organization_id": "00Dxxxxxxxxxxxxxxx",
            "instance_url": "https://example.com",
            "organization_details": {
                "Name": self.org_name,
                "OrganizationType": "Developer Edition",
                "IsSandbox": False,
            },
        }


@register
class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    email = factory.Sequence("user_{}@example.com".format)
    username = factory.Sequence("user{}".format)
    password = factory.PostGenerationMethodCall("set_password", "foobar")
    socialaccount_set = factory.RelatedFactory(
        SocialAccountFactory,
        "user",
        org_name=factory.SelfAttribute("..org_name"),
        sf_username=factory.SelfAttribute("..sf_username"),
    )

    class Params:
        sf_username = factory.Sequence("user_{}@example.com".format)
        org_name = "Sample Org"


@register
class TokenFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Token

    site = factory.SubFactory(SiteFactory)
    user = factory.SubFactory(UserFactory)


@register
class AllowedListFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AllowedList

    title = factory.Sequence("Allowed List {}".format)


@register
class AllowedListOrgFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = AllowedListOrg

    allowed_list = factory.SubFactory(AllowedListFactory)
    org_id = factory.fuzzy.FuzzyText(length=15, prefix="00D")
    description = factory.Sequence("Allowed List Org {}".format)
    created_by = factory.SubFactory(UserFactory)


@register
class ProductCategoryFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProductCategory

    title = "salesforce"


@register
class ProductFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Product

    title = factory.Sequence("Sample Product {}".format)
    description = "This is a sample product."
    category = factory.SubFactory(ProductCategoryFactory)
    color = "#FFFFFF"
    icon_url = ""
    slds_icon_category = ""
    slds_icon_name = ""
    _ensure_slug = factory.PostGenerationMethodCall("ensure_slug")
    repo_url = "https://github.com/SFDO-Tooling/CumulusCI-Test"


@register
class ProductSlugFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ProductSlug

    slug = factory.Sequence("this-is-a-slug-{}".format)
    parent = factory.SubFactory(ProductFactory)


@register
class VersionFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Version

    product = factory.SubFactory(ProductFactory)
    label = factory.Sequence("v0.{}.0".format)
    description = "A sample version."
    commit_ish = "feature/preflight"


@register
class PlanTemplateFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PlanTemplate

    name = "install"
    preflight_message = ""
    post_install_message = ""
    product = factory.SubFactory(ProductFactory)


@register
class PlanFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Plan

    title = "Sample plan"
    _ensure_slug = factory.PostGenerationMethodCall("ensure_slug")

    visible_to = None

    version = factory.SubFactory(VersionFactory)
    plan_template = factory.SubFactory(
        PlanTemplateFactory, product=factory.SelfAttribute("..version.product")
    )


@register
class SiteProfileFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = SiteProfile

    name = "MetaDeploy"
    company_name = "Mao-Kwikowski Mercantile"
    welcome_text = "Welcome to MetaDeploy"
    master_agreement = "MSA"
    copyright_notice = "(c) 2022"

    site = factory.SubFactory(SiteFactory)


@register
class StepFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Step

    name = "Sample step"
    plan = factory.SubFactory(PlanFactory)
    path = "main_task"
    task_class = "cumulusci.core.tests.test_tasks._TaskHasResult"
    step_num = factory.Sequence("1.{}".format)


@register
class PlanSlugFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PlanSlug

    slug = factory.Sequence("this-is-a-slug-{}".format)
    parent = factory.SubFactory(PlanTemplateFactory)


@register
class ClickTroughAgreementFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ClickThroughAgreement

    text = factory.Sequence("Text for Agreement {}".format)


@register
class JobFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Job

    user = factory.SubFactory(UserFactory)
    plan = factory.SubFactory(PlanFactory)
    enqueued_at = None
    job_id = None
    org_id = factory.fuzzy.FuzzyText(length=15, prefix="00D")

    @factory.post_generation
    def steps(self, create, extracted, **kwargs):  # pragma: nocover
        if not create:
            # Simple build, do nothing.
            return

        if extracted:
            # A list of steps was passed in, use it
            for step in extracted:
                self.steps.add(step)


@register
class ScratchOrgFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = ScratchOrg

    enqueued_at = datetime.now(tz=timezone.utc)
    email = "test@example.com"
    plan = factory.SubFactory(PlanFactory)


@register
class PreflightResultFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = PreflightResult

    plan = factory.SubFactory(PlanFactory)
    user = factory.SubFactory(UserFactory)
    org_id = factory.SelfAttribute("user.org_id")


@register
class TranslationFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Translation

    slug = factory.Sequence("translation-{}".format)


def adjust_site_domain():
    """
    Adjust the default Site instance to match the test Client host. Required by
    CurrentSiteMiddleware to detect the default Site as expected.
    """
    Site.objects.filter(domain="example.com").update(domain=TEST_DOMAIN)


@pytest.fixture
def extra_site(settings, site_factory):
    site = site_factory(domain="extra-site.test")
    settings.ALLOWED_HOSTS += ["extra-site.test"]
    # Ensure CurrentSiteMiddleware doesn't get a stale ID for the site with this domain
    cache.delete(f"SITE_ID:{site.domain}")
    return site


@pytest.fixture
def client(user_factory):
    adjust_site_domain()
    user = user_factory()
    client = APIClient()
    client.force_login(user)
    client.user = user
    return client


@pytest.fixture
def token_client(user_factory):
    """A client passes a valid auth token associated with the user"""
    adjust_site_domain()
    user = user_factory()
    site = Site.objects.get(domain=TEST_DOMAIN)
    token = TokenFactory(user=user, site=site)

    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"token {token.key}")
    client.user = user
    return client


@pytest.fixture
def token_client__outside_ip(user_factory):
    """A client passes a valid auth token associated with the user"""
    adjust_site_domain()
    user = user_factory()
    site = Site.objects.get(domain=TEST_DOMAIN)
    token = TokenFactory(user=user, site=site)

    client = APIClient(REMOTE_ADDR="8.8.8.8")
    client.credentials(HTTP_AUTHORIZATION=f"token {token.key}")
    client.user = user
    return client


@pytest.fixture
def anon_client():
    adjust_site_domain()
    return APIClient()


@pytest.fixture
def assert_multi_tenancy(token_client, extra_site):
    """Uses token authentication"""

    def _do_assert(url):
        response = token_client.get(url)
        assert response.status_code == 200, (
            f"Expected to get 200 when visiting {url} on the default Site. "
            "This request should succeed to establish a baseline for the multi-tenancy test."
        )

        response = token_client.get(url, SERVER_NAME=extra_site.domain)
        assert response.status_code == 401, (
            f"Expected to get 401 when visiting {url} on the non-default Site. "
            "This probably means per-site filtering is not working on that endpoint."
        )

    _do_assert.client = token_client
    return _do_assert


@pytest.fixture
def assert_multi_tenancy_session(client, extra_site):
    """Uses session authentication."""

    def _do_assert(url):
        response = client.get(url)
        assert response.status_code == 200, (
            f"Expected to get 200 when visiting {url} on the default Site. "
            "This request should succeed to establish a baseline for the multi-tenancy test."
        )

        response = client.get(url, SERVER_NAME=extra_site.domain)
        # This url (which likely includes a pk) should not exist on another domain.
        assert response.status_code == 404, (
            f"Expected to get 404 when visiting {url} on the non-default Site. "
            "This probably means per-site filtering is not working on that endpoint."
        )

    _do_assert.client = client
    return _do_assert
