from typing import List
from urllib.parse import urlparse

from cumulusci.core.config import BaseProjectConfig
from cumulusci.core.flowrunner import FlowCoordinator
from cumulusci.core.runtime import BaseCumulusCI

from metadeploy.api.flows import JobFlow, PreflightFlow
from metadeploy.api.models import Job, Plan, PreflightResult, WorkableModel


def extract_user_and_repo(gh_url):
    path = urlparse(gh_url).path
    _, user, repo, *_ = path.split("/")
    return user, repo


class MetadeployProjectConfig(BaseProjectConfig):
    def __init__(self, *args, repo_root=None, plan=None, **kwargs):  # pragma: nocover

        self.plan = plan
        repo_url = plan.version.product.repo_url
        user, repo_name = extract_user_and_repo(repo_url)

        repo_info = {
            "root": repo_root,
            "url": repo_url,
            "name": repo_name,
            "owner": user,
            "commit": plan.version.commit_ish,
        }

        super().__init__(*args, repo_info=repo_info, **kwargs)


class MetaDeployCCI(BaseCumulusCI):
    project_config_class = MetadeployProjectConfig

    def get_flow_from_plan(
        self, plan: Plan, ctx: WorkableModel, skip: List[str] = None
    ):

        steps = [
            step.to_spec(skip=True) if step.path in skip else step.to_spec(skip=False)
            for step in plan.steps
        ]

        # TODO: either use the dynamic stuff i put into baseruntime, or scrap it.
        # ctx is either a PreflightResult or a Job, and that will change what we do...
        if isinstance(ctx, PreflightResult):
            callbacks = PreflightFlow(ctx)
        elif isinstance(ctx, Job):
            callbacks = JobFlow(ctx)
        else:
            raise AttributeError(
                "Cannot get a flow from non preflight or job ctxs."
            )  # FIXME: bad error...

        return FlowCoordinator.from_steps(
            self.project_config, steps, name="default", callbacks=callbacks
        )
