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
