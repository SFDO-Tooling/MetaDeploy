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

import os
import sys
import shutil
import contextlib
from datetime import timedelta
from itertools import chain
from glob import glob
from tempfile import TemporaryDirectory
import logging
from urllib.parse import urlparse
import zipfile
from asgiref.sync import async_to_sync

import github3

from cumulusci.core.keychain import BaseProjectKeychain
from cumulusci.core.config import (
    OrgConfig,
    ServiceConfig,
    YamlGlobalConfig,
)

from django_rq import job

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import (
    Job,
    PreflightResult,
)
from . import cci_configs
from .flows import (
    JobFlow,
    PreflightFlow,
)
from .push import report_error


logger = logging.getLogger(__name__)
User = get_user_model()
sync_report_error = async_to_sync(report_error)


def extract_user_and_repo(gh_url):
    path = urlparse(gh_url).path
    _, user, repo, *_ = path.split('/')
    return user, repo


@contextlib.contextmanager
def finalize_result(result):
    error_status = result.Status.failed
    success_status = result.Status.complete

    try:
        yield
        result.status = success_status
    except Exception:
        result.status = error_status
        logger.error(f"{result._meta.model_name} {result.id} failed.")
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
def cd(path):
    prev_cwd = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(prev_cwd)


@contextlib.contextmanager
def prepend_python_path(path):
    prev_path = sys.path.copy()
    sys.path.insert(0, path)
    try:
        yield
    finally:
        sys.path = prev_path


def is_safe_path(path):
    return (
        not os.path.isabs(path)
        and '..' not in path.split(os.path.sep)
    )


def zip_file_is_safe(zip_file):
    return all(
        is_safe_path(info.filename)
        for info
        in zip_file.infolist()
    )


def run_flows(
        user, plan, skip_tasks,
        *, flow_class, flow_name, result_class, result_id):
    """
    This operates with side effects; it changes things in a Salesforce
    org, and then records the results of those operations on to a
    `result`.

    Args:
        user (User): The User requesting this flow be run.
        plan (Plan): The Plan instance for the flow you're running.
        skip_tasks (List[str]): The strings in the list should be valid
            task_name values for steps in this flow.
        flow_class (Type[BasicFlow]): Either the class PreflightFlow or
            the class JobFlow. This is the flow that actually gets run
            inside this function.
        flow_name (str): The plan.preflight_flow_name or plan.flow_name,
            as appropriate.
        result_class (Union[Type[Job], Type[PreflightResult]]): The
            instance onto which to record the results of running steps
            in the flow. Either a PreflightResult or a Job, as
            appropriate.
        result_id (int): the PK of the result instance to get.
    """
    result = result_class.objects.get(pk=result_id)
    token, token_secret = user.token
    instance_url = user.instance_url
    repo_url = plan.version.product.repo_url
    commit_ish = plan.version.commit_ish

    with contextlib.ExitStack() as stack:
        stack.enter_context(finalize_result(result))
        stack.enter_context(report_errors_to(user))
        tmpdirname = stack.enter_context(TemporaryDirectory())
        stack.enter_context(cd(tmpdirname))

        # Get cwd into Python path, so that the tasks below can import
        # from the checked-out repo:
        stack.enter_context(prepend_python_path(os.path.abspath(tmpdirname)))

        # Let's clone the repo locally:
        gh = github3.login(token=settings.GITHUB_TOKEN)
        user, repo_name = extract_user_and_repo(repo_url)
        repo = gh.repository(user, repo_name)
        zip_file_name = 'archive.zip'
        repo.archive('zipball', path=zip_file_name, ref=commit_ish)
        zip_file = zipfile.ZipFile(zip_file_name)
        if not zip_file_is_safe(zip_file):
            # This is very unlikely, as we get the zipfile from GitHub,
            # but must be considered:
            url = f'https://github.com/{user}/{repo_name}#{commit_ish}'
            logger.error(f'Malformed or malicious zip file from {url}.')
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
        current_org = 'current_org'
        org_config = OrgConfig({
            'access_token': token,
            'instance_url': instance_url,
            'refresh_token': token_secret,
        }, current_org)
        proj_config = cci_configs.MetadeployProjectConfig(
            YamlGlobalConfig(),
            repo_root=tmpdirname,
        )
        proj_keychain = BaseProjectKeychain(proj_config, None)
        proj_keychain.set_org(org_config)
        proj_config.set_keychain(proj_keychain)

        # Set up the connected_app:
        connected_app = ServiceConfig({
            'client_secret': settings.CONNECTED_APP_CLIENT_SECRET,
            'callback_url': settings.CONNECTED_APP_CALLBACK_URL,
            'client_id': settings.CONNECTED_APP_CLIENT_ID,
        })
        proj_config.keychain.set_service(
            'connected_app',
            connected_app,
            True,
        )

        # Set up github:
        github_app = ServiceConfig({
            # It would be nice to only need the token:
            'token': settings.GITHUB_TOKEN,
            # The following three values don't matter and aren't used,
            # but are required to validate the Service:
            'password': settings.GITHUB_TOKEN,
            'email': 'test@example.com',
            'username': 'not-a-username',
        })
        proj_config.keychain.set_service('github', github_app, True)

        # Make and run the flow:
        flow_config = proj_config.get_flow(flow_name)

        args = (
            proj_config,
            flow_config,
            proj_keychain.get_org(current_org),
        )
        kwargs = dict(
            options={},
            skip=skip_tasks,
            name=flow_name,
            result=result,
        )

        flowinstance = flow_class(*args, **kwargs)
        flowinstance()


run_flows_job = job(run_flows)


def enqueuer():
    logger.debug('Enqueuer live', extra={'tag': 'jobs.enqueuer'})
    for j in Job.objects.filter(enqueued_at=None):
        rq_job = run_flows_job.delay(
            j.user,
            j.plan,
            j.skip_tasks(),
            flow_class=JobFlow,
            flow_name=j.plan.flow_name,
            result_class=Job,
            result_id=j.id,
        )
        j.job_id = rq_job.id
        j.enqueued_at = rq_job.enqueued_at
        j.save()


enqueuer_job = job(enqueuer)


# TODO: Make sure this doesn't pull a token out from under a pending or
# running job, when we get to that bit of implementation:
def expire_user_tokens():
    for user in User.objects.with_expired_tokens():
        user.expire_token()


expire_user_tokens_job = job(expire_user_tokens)


def preflight(user, plan):
    preflight_result = PreflightResult.objects.create(
        user=user,
        plan=plan,
        organization_url=user.instance_url,
    )
    run_flows(
        user,
        plan,
        [],
        flow_class=PreflightFlow,
        flow_name=plan.preflight_flow_name,
        result_class=PreflightResult,
        result_id=preflight_result.id,
    )


preflight_job = job(preflight)


def expire_preflights():
    now = timezone.now()
    preflight_lifetime_ago = now - timedelta(
        minutes=settings.PREFLIGHT_LIFETIME_MINUTES,
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
