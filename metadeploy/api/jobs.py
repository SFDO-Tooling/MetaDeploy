import os
import sys
import contextlib
from tempfile import TemporaryDirectory

from git import Repo

from cumulusci.core import (
    config,
    flows,
    keychain,
)

from django_rq import job

from django.contrib.auth import get_user_model
User = get_user_model()


@contextlib.contextmanager
def cd(path):
    prev_cwd = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(prev_cwd)


@job
def run_flow_job(*args, **kwargs):  # pragma: nocover
    return run_flow(*args, **kwargs)


def run_flow(token, instance_url, package_url, flow_name):
    with TemporaryDirectory() as tmpdirname:
        with cd(tmpdirname):
            # Get cwd into Python path, so that the tasks below can
            # import from the checked-out repo:
            sys.path.insert(0, '')

            # Let's clone the repo locally:
            Repo.clone_from(package_url, tmpdirname)

            # There's a lot of setup to make configs and keychains, link
            # them properly, and then eventually pass them into a flow,
            # which we then run:
            org_config = config.OrgConfig({
                'access_token': token.token,
                'instance_url': instance_url,
                'refresh_token': token.token_secret,
            }, 'test')
            proj_config = config.YamlProjectConfig(config.YamlGlobalConfig())
            proj_keychain = keychain.BaseProjectKeychain(proj_config, None)
            proj_keychain.set_org(org_config)
            proj_config.set_keychain(proj_keychain)

            # Set up the connected_app:
            connected_app = config.ServiceConfig({
                'client_secret': os.environ['CONNECTED_APP_CLIENT_SECRET'],
                'callback_url': os.environ['CONNECTED_APP_CALLBACK_URL'],
                'client_id': os.environ['CONNECTED_APP_CLIENT_ID'],
            })
            proj_config.keychain.set_service(
                'connected_app',
                connected_app,
                True,
            )

            # Set up github:
            github_app = config.ServiceConfig({
                # It would be nice to only need the token:
                'token': os.environ['GITHUB_TOKEN'],
                'password': os.environ['GITHUB_TOKEN'],
                'email': 'test@example.com',
                'username': 'not-a-username',
            })
            proj_config.keychain.set_service('github', github_app, True)

            # Make and run the flow:
            flow_config = proj_config.get_flow(flow_name)
            flowinstance = flows.BaseFlow(
                proj_config,
                flow_config,
                proj_keychain.get_org('test'),
                options={},
                skip=[],
                name=flow_name,
            )
            flowinstance()
