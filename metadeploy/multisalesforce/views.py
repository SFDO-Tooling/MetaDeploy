from allauth.account.models import EmailAddress
from allauth.socialaccount.providers.oauth2.views import (
    OAuth2CallbackView,
    OAuth2LoginView,
)
from allauth.socialaccount.providers.salesforce.views import (
    SalesforceOAuth2Adapter as SalesforceOAuth2BaseAdapter
)
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

from .provider import (
    SalesforceProductionProvider,
    SalesforceTestProvider,
)


class SalesforceOAuth2ProductionAdapter(SalesforceOAuth2BaseAdapter):
    provider_id = SalesforceProductionProvider.id


class SalesforceOAuth2TestAdapter(SalesforceOAuth2BaseAdapter):
    provider_id = SalesforceTestProvider.id


prod_oauth2_login = OAuth2LoginView.adapter_view(
    SalesforceOAuth2ProductionAdapter,
)
prod_oauth2_callback = OAuth2CallbackView.adapter_view(
    SalesforceOAuth2ProductionAdapter,
)
test_oauth2_login = OAuth2LoginView.adapter_view(
    SalesforceOAuth2TestAdapter,
)
test_oauth2_callback = OAuth2CallbackView.adapter_view(
    SalesforceOAuth2TestAdapter,
)


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def new_user(self, request, sociallogin):
        # We can assume we get one email in sociallogin.email_addresses,
        # and so we'll get-or-create a user based on that email:
        try:
            email = sociallogin.email_addresses[0].email
            existing_email = EmailAddress.objects.filter(email=email).first()
            if existing_email:
                return existing_email.user
            return super().new_user(request, sociallogin)
        except IndexError:
            return super().new_user(request, sociallogin)
