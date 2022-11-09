import pytest

from contextlib import ExitStack
from unittest.mock import patch

from ..github import local_github_checkout


@pytest.mark.django_db
def test_local_github_checkout(product_factory):
    """Ensure repos that have names which are substrings of another repo
    name do not cause conflicts with one another."""
    product_factory(repo_url="https://github.com/SalesforceFoundation/gem")
    product_factory(
        repo_url="https://github.com/SalesforceFoundation/Grants-Management"
    )
    product_factory(repo_url="https://github.com/SalesforceFoundation/gem-foo")

    with ExitStack() as stack:
        stack.enter_context(patch("metadeploy.api.github.os"))
        stack.enter_context(patch("metadeploy.api.github.get_github_api_for_repo"))
        stack.enter_context(patch("metadeploy.api.github.download_extract_github"))

        with local_github_checkout("SalesforceFoundation", "gem") as repo_root:
            assert isinstance(repo_root, str)
