"""
GitHub utilities
"""

import contextlib
import os
from pathlib import Path

from cumulusci.core.github import get_github_api_for_repo
from cumulusci.utils import download_extract_github, temporary_dir


@contextlib.contextmanager
def local_github_checkout(repo_owner, repo_name, commit_ish=None):
    with temporary_dir() as repo_root:
        # pretend it's a git clone to satisfy cci
        os.mkdir(".git")

        repo = get_github_api_for_repo(None, repo_owner, repo_name)
        if commit_ish is None:
            commit_ish = repo.repository(repo_owner, repo_name).default_branch

        zip_file = download_extract_github(repo, repo_owner, repo_name, ref=commit_ish)
        zip_file.extractall(repo_root)

        yield repo_root


def get_repo_zip(repo_owner, repo_name, commit_ish=None):
    repo = get_github_api_for_repo(None, repo_owner, repo_name)
    if commit_ish is None:
        commit_ish = repo.repository(repo_owner, repo_name).default_branch

    zip_file = download_extract_github(repo, repo_owner, repo_name, ref=commit_ish)
    return zip_file
