from typing import List
from urllib.parse import urlparse

from cumulusci.core.config import BaseProjectConfig
from cumulusci.core.flowrunner import FlowCoordinator
from cumulusci.core.runtime import BaseCumulusCI

from metadeploy.api.flows import JobFlowCallback, PreflightFlowCallback
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
        steps = [step.to_spec(skip=step.path in skip) for step in plan.steps.all()]

        if isinstance(ctx, PreflightResult):  # pragma: no cover
            callbacks = PreflightFlowCallback(ctx)
        elif isinstance(ctx, Job):
            callbacks = JobFlowCallback(ctx)
        else:  # pragma: no cover
            raise AttributeError(
                f"ctx must be either a PreflightResult "
                f"or Job, but was passed {type(ctx)}."
            )

        return FlowCoordinator.from_steps(
            self.project_config, steps, name="default", callbacks=callbacks
        )
