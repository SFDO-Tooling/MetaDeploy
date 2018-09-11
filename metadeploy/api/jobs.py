"""
A note on how jobs are scheduled and run:

Any job that has to touch the database should not be scheduled directly.
This is because of the issues laid out in
<https://brandur.org/job-drain>, but to summarize: if a job is triggered
in the same transaction as the data it relies on is written, it may try
to run before that data is actually visible in the database.

To get around this, we have a single periodic enqueuer job that picks up
instances of the Job model and triggers the run_flow_job.
"""

import os
import sys
import contextlib
from tempfile import TemporaryDirectory

import git

from cumulusci.core import (
    config,
    flows,
    keychain,
)

from django_rq import job

from django.conf import settings
from django.contrib.auth import get_user_model
from django.utils import timezone

from .models import Job


User = get_user_model()


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


def run_flow(token, token_secret, instance_url, package_url, flow_name):
    # TODO:
    #
    # We'll want to subclass BaseFlow and add logic in the progress
    # callbacks to record and possibly push progress:
    # pre_flow, post_flow, pre_task, post_task, pre_subflow,
    # post_subflow
    #
    # Can we do anything meaningful with a return value from a @job,
    # too?
    with contextlib.ExitStack() as stack:
        tmpdirname = stack.enter_context(TemporaryDirectory())
        stack.enter_context(cd(tmpdirname))

        # Get cwd into Python path, so that the tasks below can import
        # from the checked-out repo:
        stack.enter_context(prepend_python_path(os.path.abspath(tmpdirname)))

        # Let's clone the repo locally:
        git.Repo.clone_from(package_url, tmpdirname)

        # There's a lot of setup to make configs and keychains, link
        # them properly, and then eventually pass them into a flow,
        # which we then run:
        current_org = 'current_org'
        org_config = config.OrgConfig({
            'access_token': token,
            'instance_url': instance_url,
            'refresh_token': token_secret,
        }, current_org)
        proj_config = config.YamlProjectConfig(config.YamlGlobalConfig())
        proj_keychain = keychain.BaseProjectKeychain(proj_config, None)
        proj_keychain.set_org(org_config)
        proj_config.set_keychain(proj_keychain)

        # Set up the connected_app:
        connected_app = config.ServiceConfig({
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
        github_app = config.ServiceConfig({
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
        flowinstance = flows.BaseFlow(
            proj_config,
            flow_config,
            proj_keychain.get_org(current_org),
            options={},
            skip=[],
            name=flow_name,
        )
        flowinstance()


run_flow_job = job(run_flow)


def enqueuer():
    for j in Job.objects.filter(enqueued_at=None):
        run_flow_job.delay(
            j.token,
            j.token_secret,
            j.instance_url,
            j.package_url,
            j.flow_name,
        )
        j.enqueued_at = timezone.now()
        j.save()


run_enqueuer = job(enqueuer)
