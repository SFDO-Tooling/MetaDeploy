from contextlib import ExitStack
from unittest.mock import patch
from cumulusci.core.config import OrgConfig
import pytest

from django.core.management import call_command

from metadeploy.api.models import Job, PreflightResult, ScratchOrg


@pytest.mark.django_db(transaction=True)
def test_run_plan(plan_factory):
    plan = plan_factory(preflight_checks=[{"when": "False", "action": "error"}])

    org_config = OrgConfig(
        {
            "instance_url": "https://sample.salesforce.org/",
            "access_token": "abc123",
            "refresh_token": "abc123",
            "org_id": "00Dxxxxxxxxxxxxxxx",
        },
        "Release",
    )

    with ExitStack() as stack:
        stack.enter_context(patch("metadeploy.api.jobs.local_github_checkout"))
        stack.enter_context(
            patch("metadeploy.api.salesforce.OrgConfig.refresh_oauth_token")
        )
        stack.enter_context(
            patch("cumulusci.core.flowrunner.PreflightFlowCoordinator.run")
        )
        stack.enter_context(patch("cumulusci.core.flowrunner.FlowCoordinator.run"))
        stack.enter_context(
            patch(
                "metadeploy.api.jobs.create_scratch_org_on_sf",
                return_value=(org_config, None, None),
            )
        )

        call_command("run_plan", str(plan.id))

    # We can't query the scratch org since it's been deleted
    job = Job.objects.filter()[0]
    preflight_result = PreflightResult.objects.filter()[0]

    assert job.status == "complete"
    assert job.is_release_test
    assert preflight_result.is_release_test

    with pytest.raises(ScratchOrg.DoesNotExist):
        ScratchOrg.objects.get(plan=plan)
