from allauth.socialaccount.providers.salesforce.provider import (
    SalesforceProvider,
)


class SalesforceProductionProvider(SalesforceProvider):
    id = 'salesforce-production'
    name = 'Salesforce Production'
    package = 'multisalesforce'


class SalesforceTestProvider(SalesforceProvider):
    id = 'salesforce-test'
    name = 'Salesforce Test'
    package = 'multisalesforce'


provider_classes = [
    SalesforceProductionProvider,
    SalesforceTestProvider,
]
