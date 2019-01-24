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
import logging
import os
import shutil
import sys
import zipfile
from datetime import timedelta
from glob import glob
from itertools import chain

import github3
from asgiref.sync import async_to_sync
from cumulusci.core.config import OrgConfig, ServiceConfig
from cumulusci.utils import temporary_dir
from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone
from django_rq import job
from rq.worker import StopRequested

from .cci_configs import MetaDeployCCI, extract_user_and_repo
from .flows import StopFlowException
from .models import Job, PreflightResult
from .push import report_error

logger = logging.getLogger(__name__)
User = get_user_model()
sync_report_error = async_to_sync(report_error)


@contextlib.contextmanager
def finalize_result(result):
    error_status = result.Status.failed
    success_status = result.Status.complete

    try:
        yield
        result.status = success_status
    except Exception as e:
        if not isinstance(e, (StopRequested, StopFlowException)):
            result.status = error_status
        result.exception = str(e)
        logger.error(f"{result._meta.model_name} {result.id} failed.")
        raise
    finally:
        result.save()


@contextlib.contextmanager
def report_errors_to(user):
    try:
        yield
    except Exception as e:
        sync_report_error(user)
        logger.error(e)
        raise


@contextlib.contextmanager
def prepend_python_path(path):
    prev_path = sys.path.copy()
    sys.path.insert(0, path)
    try:
        yield
    finally:
        sys.path = prev_path


@contextlib.contextmanager
def mark_canceled(result):
    """
    When an RQ worker gets a SIGTERM, it will initiate a warm shutdown, trying to wrap
    up existing tasks and then raising a StopRequested exception. So we want to mark any
    job that's not done by then as canceled by catching that exception as it propagates
    back up.
    """
    try:
        yield
    except (StopRequested, StopFlowException):
        result.status = result.Status.canceled
        result.canceled_at = timezone.now()
        result.save()
        raise


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
        result_class (Union[Type[Job], Type[PreflightResult]]): The
            instance onto which to record the results of running steps
            in the flow. Either a PreflightResult or a Job, as
            appropriate.
        result_id (int): the PK of the result instance to get.
    """
    result = result_class.objects.get(pk=result_id)
    token, token_secret = user.token
    repo_url = plan.version.product.repo_url
    commit_ish = plan.version.commit_ish

    with contextlib.ExitStack() as stack:
        stack.enter_context(finalize_result(result))
        stack.enter_context(mark_canceled(result))
        stack.enter_context(report_errors_to(user))
        tmpdirname = stack.enter_context(temporary_dir())

        # Get cwd into Python path, so that the tasks below can import
        # from the checked-out repo:
        stack.enter_context(prepend_python_path(os.path.abspath(tmpdirname)))

        # Let's clone the repo locally:
        gh = github3.login(token=settings.GITHUB_TOKEN)
        user, repo_name = extract_user_and_repo(repo_url)
        repo = gh.repository(user, repo_name)
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
        for path in chain(glob("zipball_root/*"), glob("zipball_root/.*")):
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

        flow_coordinator = ctx.get_flow_from_plan(plan, result, skip=skip_tasks)
        flow_coordinator.run(ctx.keychain.get_org(current_org))


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
    for user in User.objects.with_expired_tokens():
        user.expire_token()


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
