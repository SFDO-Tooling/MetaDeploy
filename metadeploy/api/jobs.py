"""
A note on how jobs are scheduled and run:

Any job that has to touch the database should not be scheduled directly.
This is because of the issues laid out in
<https://brandur.org/job-drain>, but to summarize: if a job is triggered
in the same transaction as the data it relies on is written, it may try
to run before that data is actually visible in the database.

To get around this, we have a single periodic enqueuer job that picks up
instances of the Job model and triggers the run_flows_job.
"""

import contextlib
import itertools
import logging
import os
import shutil
import sys
import traceback
import zipfile
from datetime import timedelta
from glob import glob

import github3
from allauth.socialaccount.models import SocialToken
from asgiref.sync import async_to_sync
from cumulusci.core.config import OrgConfig, ServiceConfig
from cumulusci.utils import temporary_dir
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django_rq import job
from rq.exceptions import ShutDownImminentException
from rq.worker import StopRequested

from .cci_configs import MetaDeployCCI, extract_user_and_repo
from .flows import StopFlowException
from .models import Job, PreflightResult
from .push import report_error, user_token_expired

logger = logging.getLogger(__name__)
User = get_user_model()
sync_report_error = async_to_sync(report_error)


@contextlib.contextmanager
def finalize_result(result):
    try:
        yield
        result.status = result.Status.complete
        result.success_at = timezone.now()
    except (StopRequested, ShutDownImminentException):
        # When an RQ worker gets a SIGTERM, it will initiate a warm shutdown,
        # trying to wrap up existing tasks and then raising a
        # ShutDownImminentException or StopRequested exception.
        # So we want to mark any job that's not done by then as canceled
        # by catching that exception as it propagates back up.
        result.status = result.Status.canceled
        result.canceled_at = timezone.now()
        result.exception = (
            "The installation job was interrupted. Please retry the installation."
        )
        logger.error(
            f"{result._meta.model_name} {result.id} canceled due to dyno restart."
        )
        raise
    except StopFlowException as e:
        # User requested cancellation of job
        result.status = result.Status.canceled
        result.canceled_at = timezone.now()
        result.exception = str(e)
        logger.info(f"{result._meta.model_name} {result.id} canceled.")
    except Exception as e:
        # Other failures
        result.status = result.Status.failed
        result.exception = str(e)
        if hasattr(e, "response"):
            result.exception += "\n" + e.response.text
        logger.error(f"{result._meta.model_name} {result.id} failed.")
        raise
    finally:
        result.save()


@contextlib.contextmanager
def report_errors_to(user):
    try:
        yield
    except Exception:
        sync_report_error(user)
        tb = traceback.format_exc()
        logger.error(tb)
        raise


@contextlib.contextmanager
def prepend_python_path(path):
    prev_path = sys.path.copy()
    sys.path.insert(0, path)
    try:
        yield
    finally:
        sys.path = prev_path


def is_safe_path(path):
    return not os.path.isabs(path) and ".." not in path.split(os.path.sep)


def zip_file_is_safe(zip_file):
    return all(is_safe_path(info.filename) for info in zip_file.infolist())


def run_flows(*, user, plan, skip_tasks, organization_url, result_class, result_id):
    """
    This operates with side effects; it changes things in a Salesforce
    org, and then records the results of those operations on to a
    `result`.

    Args:
        user (User): The User requesting this flow be run.
        plan (Plan): The Plan instance for the flow you're running.
        skip_tasks (List[str]): The strings in the list should be valid
            task_name values for steps in this flow.
        organization_url (str): The URL of the organization, required by
            the OrgConfig.
        result_class (Union[Type[Job], Type[PreflightResult]]): The type
            of the instance onto which to record the results of running
            steps in the flow. Either a PreflightResult or a Job, as
            appropriate.
        result_id (int): the PK of the result instance to get.
    """
    result = result_class.objects.get(pk=result_id)
    token, token_secret = user.token
    repo_url = plan.version.product.repo_url
    commit_ish = plan.commit_ish or plan.version.commit_ish

    with contextlib.ExitStack() as stack:
        stack.enter_context(finalize_result(result))
        stack.enter_context(report_errors_to(user))
        tmpdirname = stack.enter_context(temporary_dir())

        # Get cwd into Python path, so that the tasks below can import
        # from the checked-out repo:
        stack.enter_context(prepend_python_path(os.path.abspath(tmpdirname)))

        # Let's clone the repo locally:
        gh = github3.login(token=settings.GITHUB_TOKEN)
        user, repo_name = extract_user_and_repo(repo_url)
        repo = gh.repository(user, repo_name)
        # Make sure we have the actual owner/repo name if we were redirected
        user = repo.owner.login
        repo_name = repo.name
        zip_file_name = "archive.zip"
        repo.archive("zipball", path=zip_file_name, ref=commit_ish)
        zip_file = zipfile.ZipFile(zip_file_name)
        if not zip_file_is_safe(zip_file):
            # This is very unlikely, as we get the zipfile from GitHub,
            # but must be considered:
            url = f"https://github.com/{user}/{repo_name}#{commit_ish}"
            logger.error(f"Malformed or malicious zip file from {url}.")
            return
        zip_file.extractall()
        # We know that the zipball contains a root directory named
        # something like this by GitHub's convention. If that ever
        # breaks, this will break:
        zipball_root = glob(f"{user}-{repo_name}-*")[0]
        # It's not unlikely that the zipball root contains a directory
        # with the same name, so we pre-emptively rename it to probably
        # avoid collisions:
        shutil.move(zipball_root, "zipball_root")
        for path in itertools.chain(glob("zipball_root/*"), glob("zipball_root/.*")):
            shutil.move(path, ".")
        shutil.rmtree("zipball_root")

        # There's a lot of setup to make configs and keychains, link
        # them properly, and then eventually pass them into a flow,
        # which we then run:
        current_org = "current_org"
        org_config = OrgConfig(
            {
                "access_token": token,
                "instance_url": organization_url,
                "refresh_token": token_secret,
            },
            current_org,
        )

        ctx = MetaDeployCCI(repo_root=tmpdirname, plan=plan)

        ctx.keychain.set_org(org_config)

        # Set up the connected_app:
        connected_app = ServiceConfig(
            {
                "client_secret": settings.CONNECTED_APP_CLIENT_SECRET,
                "callback_url": settings.CONNECTED_APP_CALLBACK_URL,
                "client_id": settings.CONNECTED_APP_CLIENT_ID,
            }
        )
        ctx.keychain.set_service("connected_app", connected_app, True)

        # Set up github:
        github_app = ServiceConfig(
            {
                # It would be nice to only need the token:
                "token": settings.GITHUB_TOKEN,
                # The following three values don't matter and aren't used,
                # but are required to validate the Service:
                "password": settings.GITHUB_TOKEN,
                "email": "test@example.com",
                "username": "not-a-username",
            }
        )
        ctx.keychain.set_service("github", github_app, True)

        steps = [
            step.to_spec(
                project_config=ctx.project_config, skip=step.path in skip_tasks
            )
            for step in plan.steps.all()
        ]
        org = ctx.keychain.get_org(current_org)
        result.run(ctx, plan, steps, org)


run_flows_job = job(run_flows)


def enqueuer():
    logger.debug("Enqueuer live", extra={"tag": "jobs.enqueuer"})
    for j in Job.objects.filter(enqueued_at=None):
        j.invalidate_related_preflight()
        rq_job = run_flows_job.delay(
            user=j.user,
            plan=j.plan,
            skip_tasks=j.skip_tasks(),
            organization_url=j.organization_url,
            result_class=Job,
            result_id=j.id,
        )
        j.job_id = rq_job.id
        j.enqueued_at = rq_job.enqueued_at
        j.save()


enqueuer_job = job(enqueuer)


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


expire_user_tokens_job = job(expire_user_tokens)


def preflight(preflight_result_id):
    # Because the FieldTracker interferes with transparently serializing models across
    # the Redis boundary, we have to pass a primitive value to this function,
    preflight_result = PreflightResult.objects.get(pk=preflight_result_id)
    run_flows(
        user=preflight_result.user,
        plan=preflight_result.plan,
        skip_tasks=[],
        organization_url=preflight_result.organization_url,
        result_class=PreflightResult,
        result_id=preflight_result.id,
    )


preflight_job = job(preflight)


def expire_preflights():
    now = timezone.now()
    preflight_lifetime_ago = now - timedelta(
        minutes=settings.PREFLIGHT_LIFETIME_MINUTES
    )
    preflights_to_invalidate = PreflightResult.objects.filter(
        status=PreflightResult.Status.complete,
        created_at__lte=preflight_lifetime_ago,
        is_valid=True,
    )
    for preflight in preflights_to_invalidate:
        preflight.is_valid = False
        preflight.save()


expire_preflights_job = job(expire_preflights)
