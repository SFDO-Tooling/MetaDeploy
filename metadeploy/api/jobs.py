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
import sys
import traceback
from datetime import timedelta

from allauth.socialaccount.models import SocialToken
from asgiref.sync import async_to_sync
from cumulusci.core.config import OrgConfig, ServiceConfig
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import transaction
from django.utils import timezone
from django_rq import job
from rq.exceptions import ShutDownImminentException
from rq.worker import StopRequested

from .cci_configs import MetaDeployCCI, extract_user_and_repo
from .flows import StopFlowException
from .github import local_github_checkout
from .models import ORG_TYPES, Job, Plan, PreflightResult, ScratchOrg
from .push import job_started, preflight_started, report_error, user_token_expired
from .salesforce import create_scratch_org as create_scratch_org_on_sf

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


def run_flows(*, plan, skip_steps, organization_url, result_class, result_id):
    """
    This operates with side effects; it changes things in a Salesforce
    org, and then records the results of those operations on to a
    `result`.

    Args:
        plan (Plan): The Plan instance for the flow you're running.
        skip_steps (List[str]): The strings in the list should be valid
            step_num values for steps in this flow.
        organization_url (str): The URL of the organization, required by
            the OrgConfig.
        result_class (Union[Type[Job], Type[PreflightResult]]): The type
            of the instance onto which to record the results of running
            steps in the flow. Either a PreflightResult or a Job, as
            appropriate.
        result_id (int): the PK of the result instance to get.
    """
    result = result_class.objects.get(pk=result_id)
    if result.user:
        token, token_secret = result.user.token
    else:
        # This means we're in a ScratchOrg.
        scratch_org = ScratchOrg.objects.get(org_id=result.org_id)
        token = scratch_org.config["access_token"]
        token_secret = scratch_org.config["refresh_token"]

    repo_url = plan.version.product.repo_url
    commit_ish = plan.commit_ish or plan.version.commit_ish

    with contextlib.ExitStack() as stack:
        stack.enter_context(finalize_result(result))
        if result.user:
            stack.enter_context(report_errors_to(result.user))

        # Let's clone the repo locally:
        repo_user, repo_name = extract_user_and_repo(repo_url)
        repo_root = stack.enter_context(
            local_github_checkout(repo_user, repo_name, commit_ish)
        )

        # Get cwd into Python path, so that the tasks below can import
        # from the checked-out repo:
        stack.enter_context(prepend_python_path(os.path.abspath(repo_root)))

        # There's a lot of setup to make configs and keychains, link
        # them properly, and then eventually pass them into a flow,
        # which we then run:
        ctx = MetaDeployCCI(repo_root=repo_root, plan=plan)

        current_org = "current_org"
        org_config = OrgConfig(
            {
                "access_token": token,
                "instance_url": organization_url,
                "refresh_token": token_secret,
            },
            current_org,
            keychain=ctx.keychain,
        )
        org_config.save()

        # Set up the connected_app:
        connected_app = ServiceConfig(
            {
                "client_secret": settings.CONNECTED_APP_CLIENT_SECRET,
                "callback_url": settings.CONNECTED_APP_CALLBACK_URL,
                "client_id": settings.CONNECTED_APP_CLIENT_ID,
            }
        )
        ctx.keychain.set_service("connected_app", connected_app, True)

        steps = [
            step.to_spec(
                project_config=ctx.project_config, skip=step.step_num in skip_steps
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
            plan=j.plan,
            skip_steps=j.skip_steps(),
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
        plan=preflight_result.plan,
        skip_steps=[],
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


def create_scratch_org(*, plan_id, org_name, result_id):
    plan = Plan.objects.get(id=plan_id)
    org = ScratchOrg.objects.get(id=result_id)
    email = org.email
    org.email = None
    org.save()
    repo_url = plan.version.product.repo_url
    repo_owner, repo_name = extract_user_and_repo(repo_url)
    commit_ish = plan.commit_ish
    try:
        with local_github_checkout(
            repo_owner, repo_name, commit_ish=commit_ish
        ) as repo_root:
            scratch_org_config, _, org_config = create_scratch_org_on_sf(
                repo_owner=repo_owner,
                repo_name=repo_name,
                repo_url=repo_url,
                repo_branch=commit_ish,
                email=email,
                project_path=repo_root,
                org_name=org_name,
            )
    except Exception as e:
        org.fail(e)
        return

    org.complete(scratch_org_config.config)

    if plan.requires_preflight:
        preflight_result = PreflightResult.objects.create(
            user=None,
            plan=plan,
            organization_url=org_config.instance_url,
            org_id=scratch_org_config.config["org_id"],
        )
        async_to_sync(preflight_started)(org, preflight_result)
        preflight(preflight_result.pk)
    elif plan.required_step_ids.count() == plan.steps.count():
        # Start installation job automatically if both:
        # - Plan has no preflight
        # - All plan steps are required
        with transaction.atomic():
            job = Job.objects.create(
                user=None,
                plan=plan,
                organization_url=org_config.instance_url,
                org_id=scratch_org_config.config["org_id"],
                full_org_type=ORG_TYPES.Scratch,
            )
            job.steps.set(plan.steps.all())
        # This is already called on `save()`, but the new Job isn't in the
        # database yet because it's in an atomic transaction.
        job.push_to_org_subscribers(is_new=True)
        async_to_sync(job_started)(org, job)


create_scratch_org_job = job(create_scratch_org)
