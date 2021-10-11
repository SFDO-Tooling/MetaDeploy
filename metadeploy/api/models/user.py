
from django.contrib.auth.base_user import BaseUserManager
from django.contrib.auth.models import AbstractUser
from model_utils.choices import Choices
from sfdo_template_helpers.crypto import fernet_decrypt

from metadeploy.api.constants import ORGANIZATION_DETAILS, ORG_TYPES
from metadeploy.api.models.models import HashIdMixin

class UserManager(BaseUserManager):
    pass


class User(HashIdMixin, AbstractUser):
    objects = UserManager()

    def subscribable_by(self, user, session):
        return self == user

    @property
    def sf_username(self):
        if self.social_account:
            return self.social_account.extra_data.get("preferred_username")

    def _get_org_property(self, key):
        try:
            return self.social_account.extra_data[ORGANIZATION_DETAILS][key]
        except (AttributeError, KeyError):
            return None

    @property
    def org_id(self):
        if self.social_account:
            return self.social_account.extra_data.get("organization_id")

    @property
    def oauth_id(self):
        if self.social_account:
            return self.social_account.extra_data.get("id")

    @property
    def org_name(self):
        return self._get_org_property("Name")

    @property
    def org_type(self):
        return self._get_org_property("OrganizationType")

    @property
    def full_org_type(self):
        org_type = self._get_org_property("OrganizationType")
        is_sandbox = self._get_org_property("IsSandbox")
        has_expiration = self._get_org_property("TrialExpirationDate") is not None
        if org_type is None or is_sandbox is None:
            return None
        if org_type == "Developer Edition" and not is_sandbox:
            return ORG_TYPES.Developer
        if org_type != "Developer Edition" and not is_sandbox:
            return ORG_TYPES.Production
        if is_sandbox and not has_expiration:
            return ORG_TYPES.Sandbox
        if is_sandbox and has_expiration:
            return ORG_TYPES.Scratch

    @property
    def instance_url(self):
        try:
            return self.social_account.extra_data["instance_url"]
        except (AttributeError, KeyError):
            return None

    @property
    def token(self):
        account = self.social_account
        if account and account.socialtoken_set.exists():
            token = self.social_account.socialtoken_set.first()
            return (fernet_decrypt(token.token), fernet_decrypt(token.token_secret))
        return (None, None)

    @property
    def social_account(self):
        return self.socialaccount_set.first()

    @property
    def valid_token_for(self):
        if all(self.token) and self.org_id:
            return self.org_id
        return None