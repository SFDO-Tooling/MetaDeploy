import requests

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
    SalesforceCustomProvider,
)


class SalesforcePermissionsError(Exception):
    pass


class SaveInstanceUrlMixin:
    def get_org_details(self, extra_data, token):
        headers = {
            "Authorization": "Bearer {}".format(token),
        }

        # Confirm canModifyAllData:
        org_info_url = (
            extra_data["urls"]["rest"] + "connect/organization"
        ).format(version="44.0")
        resp = requests.get(org_info_url, headers=headers)
        resp.raise_for_status()

        # Also contains resp.json()["name"], but not ["type"], so it's
        # insufficient to just call this endpoint.
        if not resp.json()["userSettings"]["canModifyAllData"]:
            raise SalesforcePermissionsError

        # Get org name and type:
        org_url = (
            extra_data["urls"]["sobjects"] + "Organization/{org_id}"
        ).format(
            version="44.0",
            org_id=extra_data["organization_id"],
        )
        resp = requests.get(org_url, headers=headers)
        resp.raise_for_status()
        return resp.json()

    def complete_login(self, request, app, token, **kwargs):
        resp = requests.get(self.userinfo_url, params={"oauth_token": token})
        resp.raise_for_status()
        extra_data = resp.json()
        instance_url = kwargs.get("response", {}).get("instance_url", None)
        ret = self.get_provider().sociallogin_from_response(
            request,
            extra_data,
        )
        ret.account.extra_data["instance_url"] = instance_url
        try:
            org_details = self.get_org_details(extra_data, token)
        except (requests.HTTPError, KeyError, SalesforcePermissionsError):
            org_details = None

        ret.account.extra_data["organization_details"] = org_details
        return ret


class SalesforceOAuth2ProductionAdapter(
        SaveInstanceUrlMixin, SalesforceOAuth2BaseAdapter):
    provider_id = SalesforceProductionProvider.id


class SalesforceOAuth2SandboxAdapter(
        SaveInstanceUrlMixin, SalesforceOAuth2BaseAdapter):
    provider_id = SalesforceTestProvider.id


class SalesforceOAuth2CustomAdapter(
        SaveInstanceUrlMixin, SalesforceOAuth2BaseAdapter):
    provider_id = SalesforceCustomProvider.id

    @property
    def base_url(self):
        custom_domain = self.request.GET.get(
            'custom_domain',
            self.request.session.get('custom_domain'),
        )
        self.request.session['custom_domain'] = custom_domain
        return 'https://{}.my.salesforce.com'.format(custom_domain)


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
custom_oauth2_login = OAuth2LoginView.adapter_view(
    SalesforceOAuth2CustomAdapter,
)
custom_oauth2_callback = OAuth2CallbackView.adapter_view(
    SalesforceOAuth2CustomAdapter,
)
