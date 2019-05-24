from allauth.socialaccount.providers.salesforce.provider import SalesforceProvider


class MetaDeployProviderMixin:
    def get_auth_params(self, request, action):
        ret = super().get_auth_params(request, action)
        # This will ensure that even if you're logged in to Salesforce,
        # you'll be prompted to choose an identity to auth as:
        ret["prompt"] = "login"
        return ret

    def extract_uid(self, data):
        # The SalesforceProvider in allauth assumes that user_id is unique,
        # but it can be the same between multiple sandboxes that were
        # copied from the same production org. So we need to add the org id
        # too to disambiguate.
        return "{}/{}".format(data["organization_id"], data["user_id"])


class SalesforceProductionProvider(MetaDeployProviderMixin, SalesforceProvider):
    id = "salesforce-production"
    name = "Salesforce Production"
    package = "metadeploy.multisalesforce"


class SalesforceTestProvider(MetaDeployProviderMixin, SalesforceProvider):
    id = "salesforce-test"
    name = "Salesforce Test"
    package = "metadeploy.multisalesforce"


class SalesforceCustomProvider(MetaDeployProviderMixin, SalesforceProvider):
    id = "salesforce-custom"
    name = "Salesforce Custom"
    package = "metadeploy.multisalesforce"


provider_classes = [
    SalesforceProductionProvider,
    SalesforceTestProvider,
    SalesforceCustomProvider,
]
