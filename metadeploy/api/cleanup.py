from datetime import timedelta

from allauth.socialaccount.models import SocialToken
from asgiref.sync import async_to_sync
from django.conf import settings
from django.utils import timezone

from metadeploy.multitenancy import disable_site_filtering

from .models import Job, PreflightResult, User, Token
from .push import user_token_expired


def cleanup_user_data():
    """Remove old records with PII and other sensitive data"""
    # fix status of dead jobs that got left as started
    fix_dead_jobs_status()

    # remove oauth tokens after 10 minutes of inactivity
    expire_oauth_tokens()

    # remove users after 30 days
    delete_old_users()

    # remove job exceptions after 90 days
    clear_old_exceptions()

    # expire API access tokens after specified number of days
    expire_api_access_tokens_older_than_days(settings.API_TOKEN_EXPIRE_AFTER_DAYS)


def expire_oauth_tokens():
    """Expire (delete) any SocialTokens older than TOKEN_LIFETIME_MINUTES.

    Also clear the extra_data of the associated SocialAccount, unless it's a staff user.

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
            if not user.is_staff:
                token.account.extra_data = {}
                token.account.save()
            async_to_sync(user_token_expired)(user)


def delete_old_users():
    """Delete old users.

    Deletes users who have not logged in for 30 days, unless they have the is_staff flag.
    """
    month_ago = timezone.now() - timedelta(days=30)
    User.objects.filter(
        is_staff=False, last_login__lte=month_ago, is_persistent=False
    ).delete()


@disable_site_filtering()
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


@disable_site_filtering()
def fix_dead_jobs_status():
    """Fix the status of any jobs which were started but are past their timeout.

    Jobs are supposed to get their status updated if they die, but that can fail.
    """
    now = timezone.now()
    timeout_seconds = settings.RQ_QUEUES["default"]["DEFAULT_TIMEOUT"] + 120
    timeout_ago = now - timedelta(seconds=timeout_seconds)
    canceled_values = {
        "status": "canceled",
        "canceled_at": now,
        "exception": "The installation job was interrupted. Please retry the installation.",
    }
    Job.objects.filter(status="started", enqueued_at__lte=timeout_ago).update(
        **canceled_values
    )


@disable_site_filtering()
def expire_api_access_tokens_older_than_days(days: int):
    """Delete any Admin API access tokens older than days given.
    We use @disable_site_filtering to ensure we query for tokens
    across all tenants."""
    obsolete_date = timezone.now() - timedelta(days=days)
    expired_tokens = Token.objects.filter(created__lte=obsolete_date)
    if expired_tokens:
        expired_tokens.delete()
