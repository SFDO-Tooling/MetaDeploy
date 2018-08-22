from allauth.socialaccount.providers.salesforce.provider import (
    SalesforceProvider,
)


class SalesforceProductionProvider(SalesforceProvider):
    id = 'salesforce-production'
    name = 'Salesforce Production'
    package = 'metadeploy.multisalesforce'

    def get_auth_params(self, request, action):
        ret = super().get_auth_params(request, action)
        # This will ensure that even if you're logged in to Salesforce,
        # you'll be prompted to choose an identity to auth as:
        ret['prompt'] = 'login'
        return ret


class SalesforceTestProvider(SalesforceProvider):
    id = 'salesforce-test'
    name = 'Salesforce Test'
    package = 'metadeploy.multisalesforce'

    def get_auth_params(self, request, action):
        ret = super().get_auth_params(request, action)
        # This will ensure that even if you're logged in to Salesforce,
        # you'll be prompted to choose an identity to auth as:
        ret['prompt'] = 'login'
        return ret


provider_classes = [
    SalesforceProductionProvider,
    SalesforceTestProvider,
]
