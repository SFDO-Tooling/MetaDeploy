from urllib.parse import urlparse

from cumulusci.core.config import BaseProjectConfig
from cumulusci.core.runtime import BaseCumulusCI


def extract_user_and_repo(gh_url):
    path = urlparse(gh_url).path
    _, user, repo, *_ = path.split("/")
    return user, repo


class MetadeployProjectConfig(BaseProjectConfig):
    def __init__(self, *args, repo_root=None, plan=None, **kwargs):
        self.plan = plan

        repo_info = kwargs.pop("repo_info", None)
        if repo_info is None:
            repo_url = plan.version.product.repo_url
            user, repo_name = extract_user_and_repo(repo_url)
            repo_info = {
                "root": repo_root,
                "url": repo_url,
                "name": repo_name,
                "owner": user,
                "commit": plan.commit_ish or plan.version.commit_ish,
            }

        super().__init__(*args, repo_info=repo_info, **kwargs)

    def construct_subproject_config(self, **kwargs):
        return MetadeployProjectConfig(
            self.global_config_obj,
            plan=self.plan,
            included_sources=self.included_sources,
            **kwargs
        )


class MetaDeployCCI(BaseCumulusCI):
    project_config_class = MetadeployProjectConfig
