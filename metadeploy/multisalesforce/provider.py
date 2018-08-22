from allauth.accounts.models import EmailAddress

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


class CleanUpEmailAddressesMixin:
    def cleanup_email_addresses(self, email, addresses):
        # Move user.email over to EmailAddress
        if email and email.lower() not in [a.email.lower() for a in addresses]:
            existing_email = EmailAddress.objects.filter(email=email).first()
            if existing_email:
                addresses.append(existing_email)
            else:
                addresses.append(EmailAddress(
                    email=email,
                    verified=False,
                    primary=True,
                ))
        # Force verified emails
        settings = self.get_settings()
        verified_email = settings.get('VERIFIED_EMAIL', False)
        if verified_email:
            for address in addresses:
                address.verified = True


class SalesforceProductionProvider(
        PromptLoginMixin, CleanUpEmailAddressesMixin, SalesforceProvider):
    id = 'salesforce-production'
    name = 'Salesforce Production'
    package = 'metadeploy.multisalesforce'


class SalesforceTestProvider(
        PromptLoginMixin, CleanUpEmailAddressesMixin, SalesforceProvider):
    id = 'salesforce-test'
    name = 'Salesforce Test'
    package = 'metadeploy.multisalesforce'


provider_classes = [
    SalesforceProductionProvider,
    SalesforceTestProvider,
]
