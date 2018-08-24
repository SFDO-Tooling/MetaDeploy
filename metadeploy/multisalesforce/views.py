from allauth.socialaccount.providers.oauth2.views import (
    OAuth2CallbackView,
    OAuth2LoginView,
)
from allauth.socialaccount.providers.salesforce.views import (
    SalesforceOAuth2Adapter as SalesforceOAuth2BaseAdapter
)

from .provider import (
    SalesforceProductionProvider,
    SalesforceTestProvider,
)


class SalesforceOAuth2ProductionAdapter(SalesforceOAuth2BaseAdapter):
    provider_id = SalesforceProductionProvider.id


class SalesforceOAuth2SandboxAdapter(SalesforceOAuth2BaseAdapter):
    provider_id = SalesforceTestProvider.id


prod_oauth2_login = OAuth2LoginView.adapter_view(
    SalesforceOAuth2ProductionAdapter,
)
prod_oauth2_callback = OAuth2CallbackView.adapter_view(
    SalesforceOAuth2ProductionAdapter,
)
sandbox_oauth2_login = OAuth2LoginView.adapter_view(
    SalesforceOAuth2SandboxAdapter,
)
sandbox_oauth2_callback = OAuth2CallbackView.adapter_view(
    SalesforceOAuth2SandboxAdapter,
)
