import json
import os
from datetime import datetime
from unittest.mock import Mock

from cumulusci.core.config import OrgConfig, TaskConfig
from cumulusci.core.runtime import BaseCumulusCI
from cumulusci.oauth.salesforce import SalesforceOAuth2, jwt_session
from cumulusci.tasks.salesforce.org_settings import DeployOrgSettings
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from simple_salesforce import Salesforce as SimpleSalesforce

# Salesforce connected app
# Assign these locally, for brevity:
SF_CALLBACK_URL = settings.CONNECTED_APP_CALLBACK_URL
SF_CLIENT_KEY = settings.CONNECTED_APP_CLIENT_KEY
SF_CLIENT_ID = settings.CONNECTED_APP_CLIENT_ID
SF_CLIENT_SECRET = settings.CONNECTED_APP_CLIENT_SECRET
SF_SIGNUP_INSTANCE = settings.CONNECTED_APP_SIGNUP_INSTANCE

DURATION_DAYS = 30


def _get_devhub_api():
    """Get an access token.

    Get an access token (session) using the global dev hub username.
    """
    if not settings.DEVHUB_USERNAME:
        raise ImproperlyConfigured(
            "You must set the DEVHUB_USERNAME to connect to a Salesforce organization."
        )
    jwt = jwt_session(SF_CLIENT_ID, SF_CLIENT_KEY, settings.DEVHUB_USERNAME)
    return SimpleSalesforce(
        instance_url=jwt["instance_url"],
        session_id=jwt["access_token"],
        client_id="MetaDeploy",
        version="47.0",
    )


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


def _refresh_access_token(*, config, org_name, scratch_org, originating_user_id):
    """Refresh the JWT.

    Construct a new OrgConfig because ScratchOrgConfig tries to use sfdx
    which we don't want now -- this is a total hack which I'll try to
    smooth over with some improvements in CumulusCI
    """
    org_config = OrgConfig(config, org_name)
    org_config.refresh_oauth_token = Mock()
    info = jwt_session(
        SF_CLIENT_ID, SF_CLIENT_KEY, org_config.username, org_config.instance_url
    )
    org_config.config["access_token"] = info["access_token"]
    return org_config


def _deploy_org_settings(
    *, cci, org_name, scratch_org_config, scratch_org, originating_user_id
):
    """Deploy org settings via Metadata API.

    Do a Metadata API deployment to configure org settings as specified
    in the scratch org definition file.
    """
    org_config = _refresh_access_token(
        config=scratch_org_config.config,
        org_name=org_name,
        scratch_org=scratch_org,
        originating_user_id=originating_user_id,
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
        "DurationDays": DURATION_DAYS,
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
    if SF_SIGNUP_INSTANCE:
        create_args["Instance"] = SF_SIGNUP_INSTANCE
    response = devhub_api.ScratchOrgInfo.create(create_args)

    # Get details and update scratch org config
    return devhub_api.ScratchOrgInfo.get(response["id"])


def _mutate_scratch_org(*, scratch_org_config, org_result, email):
    """Set the scratch org config into a good state.

    Update the org config for a new scratch org with details from its
    ScratchOrgInfo.
    """
    scratch_org_config._scratch_info = {
        "instance_url": org_result["LoginUrl"],
        "org_id": org_result["ScratchOrg"],
        "username": org_result["SignupUsername"],
    }
    scratch_org_config.config.update(scratch_org_config._scratch_info)
    scratch_org_config.config.update(
        {
            "days": DURATION_DAYS,
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
    oauth = SalesforceOAuth2(
        SF_CLIENT_ID, SF_CLIENT_SECRET, SF_CALLBACK_URL, scratch_org_config.instance_url
    )
    auth_result = oauth.get_token(org_result["AuthCode"]).json()
    scratch_org_config.config["access_token"] = scratch_org_config._scratch_info[
        "access_token"
    ] = auth_result["access_token"]


def create_scratch_org(
    *,
    repo_owner,
    repo_name,
    repo_url,
    repo_branch,
    user,
    project_path,
    scratch_org,
    org_name,
    originating_user_id,
    sf_username=None,
):
    """Create a new scratch org"""
    email = user.email  # TODO: check that this is reliably right.

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
        scratch_org=scratch_org,
        originating_user_id=originating_user_id,
        # Created in create_scratch_org:
        cci=cci,
        # From _get_org_details:
        scratch_org_config=scratch_org_config,
    )

    return (
        # From _get_org_details:
        scratch_org_config,
        # Created in create_scratch_org:
        cci,
        # From _deploy_org_settings:
        org_config,
    )
