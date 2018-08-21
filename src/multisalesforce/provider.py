from allauth.socialaccount.providers.salesforce.provider import (
    SalesforceProvider,
)


class PromptLoginMixin:
    def get_auth_params(self, request, action):
        ret = super().get_auth_params(request, action)
        # This will ensure that even if you're logged in to Salesforce,
        # you'll be prompted to choose an identity to auth as:
        ret['prompt'] = 'login'
        return ret


class SalesforceProductionProvider(PromptLoginMixin, SalesforceProvider):
    id = 'salesforce-production'
    name = 'Salesforce Production'
    package = 'multisalesforce'


class SalesforceTestProvider(PromptLoginMixin, SalesforceProvider):
    id = 'salesforce-test'
    name = 'Salesforce Test'
    package = 'multisalesforce'


class SalesforceCustomProvider(PromptLoginMixin, SalesforceProvider):
    id = 'salesforce-custom'
    name = 'Salesforce Custom'
    package = 'multisalesforce'


provider_classes = [
    SalesforceProductionProvider,
    SalesforceTestProvider,
    SalesforceCustomProvider,
]
