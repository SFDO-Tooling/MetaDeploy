"""
Salesforce utilities
"""


import json
import os
from datetime import datetime

from cumulusci.core.config import OrgConfig, TaskConfig
from cumulusci.core.runtime import BaseCumulusCI
from cumulusci.oauth.client import OAuth2Client, OAuth2ClientConfig
from cumulusci.oauth.salesforce import jwt_session
from cumulusci.tasks.salesforce.org_settings import DeployOrgSettings
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.utils.translation import gettext_lazy as _
from requests.exceptions import HTTPError
from rq import get_current_job
from simple_salesforce import Salesforce as SimpleSalesforce

# Salesforce connected app
# Assign these locally, for brevity:
SF_CALLBACK_URL = settings.SFDX_CLIENT_CALLBACK_URL
SF_CLIENT_KEY = settings.SFDX_HUB_KEY
SF_CLIENT_ID = settings.SFDX_CLIENT_ID
SF_CLIENT_SECRET = settings.SFDX_CLIENT_SECRET
SFDX_SIGNUP_INSTANCE = settings.SFDX_SIGNUP_INSTANCE


class ScratchOrgError(Exception):
    pass


def _handle_sf_error(err, scratch_org=None):
    if get_current_job():
        job_id = get_current_job().id
        # This error is user-facing, and so for makemessages to
        # pick it up correctly, we need it to be a single,
        # unbroken, string literal (even though adjacent string
        # literals should be parsed by the AST into a single
        # string literal and picked up by makemessages, but
        # that's a gripe for another day). We have relatively
        # few errors that propagate directly from the backend
        # like this, but when we do, this is the pattern we
        # should use.
        #
        # This is also why we repeat the first sentence.
        error_msg = _(
            f"Are you certain that the org still exists? If you need support, your job ID is {job_id}."  # noqa: B950
        )
    else:
        error_msg = _(f"Are you certain that the org still exists? {err.args[0]}")

    error = ScratchOrgError(error_msg)
    if scratch_org:
        scratch_org.delete(error=error, should_delete_on_sf=False)
    raise error


def _get_devhub_api(scratch_org=None):
    """Get an access token.

    Get an access token (session) using the global dev hub username.
    """
    if not settings.DEVHUB_USERNAME:
        raise ImproperlyConfigured(
            "You must set the DEVHUB_USERNAME to connect to a Salesforce organization."
        )
    try:
        jwt = jwt_session(SF_CLIENT_ID, SF_CLIENT_KEY, settings.DEVHUB_USERNAME)
        return SimpleSalesforce(
            instance_url=jwt["instance_url"],
            session_id=jwt["access_token"],
            client_id="MetaDeploy",
            version="49.0",
        )
    except HTTPError as err:
        _handle_sf_error(err, scratch_org=scratch_org)


def _get_org_details(*, cci, org_name, project_path):
    """Get details needed to create a scratch org.

    Returns scratch_org_config (from the project's cumulusci.yml) and
    scratch_org_definition (the sfdx *.org file with JSON specifying
    what kind of org to create)
    """
    scratch_org_config = cci.keychain.get_org(org_name)
    scratch_org_definition_path = os.path.join(
        project_path, scratch_org_config.config_file
    )
    with open(scratch_org_definition_path, "r") as f:
        scratch_org_definition = json.load(f)

    return (scratch_org_config, scratch_org_definition)


def refresh_access_token(*, scratch_org, config, org_name, keychain=None):
    """Refresh the JWT.

    Construct a new OrgConfig because ScratchOrgConfig tries to use sfdx
    which we don't want now -- this is a total hack which I'll try to
    smooth over with some improvements in CumulusCI
    """
    try:
        org_config = OrgConfig(config, org_name, keychain=keychain)
        org_config.refresh_oauth_token(keychain)
        return org_config
    except HTTPError as err:
        _handle_sf_error(err, scratch_org=scratch_org)


def _deploy_org_settings(*, cci, org_name, scratch_org_config, scratch_org):
    """Deploy org settings via Metadata API.

    Do a Metadata API deployment to configure org settings as specified
    in the scratch org definition file.
    """
    org_config = refresh_access_token(
        scratch_org=scratch_org,
        config=scratch_org_config.config,
        org_name=org_name,
        keychain=cci.keychain,
    )
    path = os.path.join(cci.project_config.repo_root, scratch_org_config.config_file)
    task_config = TaskConfig({"options": {"definition_file": path}})
    task = DeployOrgSettings(cci.project_config, task_config, org_config)
    task()
    return org_config


def _get_org_result(
    *,
    email,
    repo_owner,
    repo_name,
    repo_branch,
    duration,
    scratch_org_config,
    scratch_org_definition,
    cci,
    devhub_api,
):
    """Create a new scratch org and return info about it.

    Create a new scratch org using the ScratchOrgInfo object in the Dev
    Hub org, and get the result.
    """
    # Schema for ScratchOrgInfo object:
    # https://developer.salesforce.com/docs/atlas.en-us.api.meta/api/sforce_api_objects_scratchorginfo.htm  # noqa: B950
    features = scratch_org_definition.get("features", [])
    create_args = {
        "AdminEmail": email,
        "ConnectedAppConsumerKey": SF_CLIENT_ID,
        "ConnectedAppCallbackUrl": SF_CALLBACK_URL,
        "Description": f"{repo_owner}/{repo_name} {repo_branch}",
        # Override whatever is in scratch_org_config.days:
        "DurationDays": duration,
        "Edition": scratch_org_definition["edition"],
        "Features": ";".join(features) if isinstance(features, list) else features,
        "HasSampleData": scratch_org_definition.get("hasSampleData", False),
        "Namespace": (
            cci.project_config.project__package__namespace
            if scratch_org_config.namespaced
            else None
        ),
        "OrgName": scratch_org_definition.get("orgName", "Metecho Task Org"),
        # should really flesh this out to pass the other
        # optional fields from the scratch org definition file,
        # but this will work for a start
    }
    if SFDX_SIGNUP_INSTANCE:  # pragma: nocover
        create_args["Instance"] = SFDX_SIGNUP_INSTANCE
    response = devhub_api.ScratchOrgInfo.create(create_args)

    # Get details and update scratch org config
    return devhub_api.ScratchOrgInfo.get(response["id"])


def _mutate_scratch_org(*, scratch_org_config, org_result, email, duration):
    """Set the scratch org config into a good state.

    Update the org config for a new scratch org with details from its
    ScratchOrgInfo.
    """
    scratch_org_config._sfdx_info = {
        "instance_url": org_result["LoginUrl"],
        "org_id": org_result["ScratchOrg"],
        "username": org_result["SignupUsername"],
    }
    scratch_org_config.config.update(scratch_org_config._sfdx_info)
    scratch_org_config.config.update(
        {
            "days": duration,
            "date_created": datetime.now(),
            "created": True,
            "email": email,
            "scratch": True,
            "is_sandbox": True,
        }
    )


def _get_access_token(*, org_result, scratch_org_config):
    """Trade the ScratchOrgInfo AuthCode for an org access token.

    The AuthCode is short-lived so this is only useful immediately after
    the scratch org is created. This must be completed once in order for
    future access tokens to be obtained using the JWT token flow.
    """
    oauth2_config = OAuth2ClientConfig(
        client_id=SF_CLIENT_ID,
        client_secret=SF_CLIENT_SECRET,
        redirect_uri=SF_CALLBACK_URL,
        auth_uri=f"{scratch_org_config.instance_url}/services/oauth2/authorize",
        token_uri=f"{scratch_org_config.instance_url}/services/oauth2/token",
        scope="web full refresh_token",
    )
    oauth2_client = OAuth2Client(oauth2_config)
    auth_result = oauth2_client.auth_code_grant(org_result["AuthCode"]).json()
    scratch_org_config.config["access_token"] = scratch_org_config._sfdx_info[
        "access_token"
    ] = auth_result["access_token"]
    scratch_org_config.config["refresh_token"] = auth_result["refresh_token"]


def create_scratch_org(
    *,
    repo_owner,
    repo_name,
    repo_url,
    repo_branch,
    email,
    project_path,
    scratch_org,
    org_name,
    duration,
):
    """Create a new scratch org

    Expects to be called inside a project checkout, so that it has
    access to the cumulusci.yml.
    """
    cci = BaseCumulusCI(
        repo_info={
            "root": project_path,
            "url": repo_url,
            "name": repo_name,
            "owner": repo_owner,
            "commit": repo_branch,
        }
    )
    devhub_api = _get_devhub_api()
    scratch_org_config, scratch_org_definition = _get_org_details(
        cci=cci, org_name=org_name, project_path=project_path
    )
    org_result = _get_org_result(
        # Passed in to create_scratch_org:
        email=email,
        repo_owner=repo_owner,
        repo_name=repo_name,
        repo_branch=repo_branch,
        duration=duration,
        # Created in create_scratch_org:
        cci=cci,
        # From _get_devhub_api:
        devhub_api=devhub_api,
        # From _get_org_details:
        scratch_org_config=scratch_org_config,
        scratch_org_definition=scratch_org_definition,
    )
    _mutate_scratch_org(
        # Passed in to create_scratch_org:
        email=email,
        duration=duration,
        # From _get_org_details:
        scratch_org_config=scratch_org_config,
        # From _get_org_result:
        org_result=org_result,
    )
    _get_access_token(
        # From _get_org_details:
        scratch_org_config=scratch_org_config,
        # From _get_org_result:
        org_result=org_result,
    )
    org_config = _deploy_org_settings(
        # Passed in to create_scratch_org:
        org_name=org_name,
        # Created in create_scratch_org:
        cci=cci,
        # From _get_org_details:
        scratch_org_config=scratch_org_config,
        scratch_org=scratch_org,
    )

    return (
        # From _get_org_details:
        scratch_org_config,
        # Created in create_scratch_org:
        cci,
        # From _deploy_org_settings:
        org_config,
    )


def delete_scratch_org(scratch_org):
    """Delete a scratch org by deleting its ActiveScratchOrg record
    in the Dev Hub org."""
    devhub_api = _get_devhub_api(scratch_org=scratch_org)
    org_id = scratch_org.org_id

    results = devhub_api.query(
        f"SELECT Id FROM ActiveScratchOrg WHERE ScratchOrg='{org_id}'"
    )
    if results["records"]:
        active_scratch_org_id = results["records"][0]["Id"]
        devhub_api.ActiveScratchOrg.delete(active_scratch_org_id)
