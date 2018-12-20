from urllib.parse import urlparse

from cumulusci.core.config import BaseProjectConfig
from cumulusci.core.runtime import BaseCumulusCI


def extract_user_and_repo(gh_url):
    path = urlparse(gh_url).path
    _, user, repo, *_ = path.split("/")
    return user, repo


class MetadeployProjectConfig(BaseProjectConfig):
    def __init__(
        self, *args, repo_root=None, plan=None, result=None, **kwargs
    ):  # pragma: nocover

        self.plan = plan
        self.result = result
        user, repo_name = extract_user_and_repo(plan.version.product.repo_url)

        repo_info = {
            "root": repo_root,
            "url": plan.version.product.repo_url,
            "name": repo_name,
            "owner": user,
        }

        super().__init__(*args, repo_info=repo_info, **kwargs)


class MetaDeployCCI(BaseCumulusCI):
    project_config_class = MetadeployProjectConfig
