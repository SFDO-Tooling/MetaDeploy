from urllib.parse import urlparse

from cumulusci.core.config import BaseProjectConfig
from cumulusci.core.flowrunner import FlowCallback, FlowCoordinator
from cumulusci.core.runtime import BaseCumulusCI


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


class MetaDeployCallback(FlowCallback):
    pass


class MetaDeployCCI(BaseCumulusCI):
    project_config_class = MetadeployProjectConfig
    callback_class = FlowCallback

    def get_flow_from_plan(self, plan, ctx):
        # ctx is either a PreflightResult or a Job, and that will change what we do...
        config = plan.steps  # FIXME
        callbacks = self.callback_cls(ctx)
        coordinator = FlowCoordinator(
            self.project_config,
            config,
            name=plan.name,
            options={},
            skip=None,
            callbacks=callbacks,
        )
        return coordinator
