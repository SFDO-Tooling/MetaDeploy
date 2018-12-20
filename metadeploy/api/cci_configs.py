from cumulusci.core.config import BaseProjectConfig
from cumulusci.core.runtime import BaseCumulusCI


class MetadeployProjectConfig(BaseProjectConfig):
    def __init__(self, *args, repo_root=None, **kwargs):  # pragma: nocover
        self._repo_root = repo_root
        super().__init__(*args, **kwargs)

    @property
    def repo_root(self):  # pragma: nocover
        return self._repo_root

    @property
    def config_project_local_path(self):  # pragma: nocover
        return

    @property
    def repo_name(self):  # pragma: nocover
        return

    @property
    def repo_url(self):  # pragma: nocover
        return

    @property
    def repo_owner(self):  # pragma: nocover
        return

    @property
    def repo_branch(self):  # pragma: nocover
        return

    @property
    def repo_commit(self):  # pragma: nocover
        return


class MetaDeployCCI(BaseCumulusCI):
    project_config_class = MetadeployProjectConfig
