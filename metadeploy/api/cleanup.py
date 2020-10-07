from datetime import timedelta

from allauth.socialaccount.models import SocialToken
from asgiref.sync import async_to_sync
from django.conf import settings
from django.utils import timezone

from .models import Job, PreflightResult, User
from .push import user_token_expired


def cleanup_user_data():
    """Remove old records with PII and other sensitive data."""
    # remove oauth tokens after 10 minutes of inactivity
    expire_user_tokens()

    # remove users after 30 days
    delete_old_users()

    # remove job exceptions after 90 days
    clear_old_exceptions()


def expire_user_tokens():
    """Expire (delete) any SocialTokens older than TOKEN_LIFETIME_MINUTES.

    Exception: if there is a job or preflight that started in the last day.
    """
    token_lifetime_ago = timezone.now() - timedelta(
        minutes=settings.TOKEN_LIFETIME_MINUTES
    )
    day_ago = timezone.now() - timedelta(days=1)
    for token in SocialToken.objects.filter(
        account__last_login__lte=token_lifetime_ago
    ):
        user = token.account.user
        has_running_jobs = (
            user.job_set.filter(
                status=Job.Status.started, created_at__gt=day_ago
            ).exists()
            or user.preflightresult_set.filter(
                status=PreflightResult.Status.started, created_at__gt=day_ago
            ).exists()
        )
        if not has_running_jobs:
            token.delete()
            async_to_sync(user_token_expired)(user)


def delete_old_users():
    """Delete old users.

    Deletes users who have not logged in for 30 days, unless they have the is_staff flag.
    """
    month_ago = timezone.now() - timedelta(days=30)
    User.objects.filter(is_staff=False, last_login__lte=month_ago).delete()


def clear_old_exceptions():
    """Update Job and PreflightRecords over 90 days old to clear the exception field.

    (This field may contain customer metadata such as custom schema names from the org.)
    """
    ninety_days_ago = timezone.now() - timedelta(days=90)
    Job.objects.filter(created_at__lte=ninety_days_ago, exception__isnull=False).update(
        exception=None
    )
    PreflightResult.objects.filter(
        created_at__lte=ninety_days_ago, exception__isnull=False
    ).update(exception=None)
