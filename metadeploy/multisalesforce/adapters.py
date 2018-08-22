from allauth.account.models import EmailAddress
from allauth.socialaccount.adapter import DefaultSocialAccountAdapter


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
