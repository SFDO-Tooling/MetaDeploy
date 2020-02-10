import logging

from allauth.socialaccount.adapter import DefaultSocialAccountAdapter

logger = logging.getLogger(__name__)


class CustomSocialAccountAdapter(DefaultSocialAccountAdapter):
    def authentication_error(self, *args, **kwargs):
        logger.error(f"Social Account authentication error: {args}, {kwargs}")
        raise kwargs["exception"]
