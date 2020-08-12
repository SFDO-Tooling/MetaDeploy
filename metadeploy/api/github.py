"""
GitHub utilities
"""


import contextlib
import itertools
import logging
import os
import pathlib
import shutil
import zipfile
from glob import glob

from cumulusci.core.github import get_github_api_for_repo
from cumulusci.utils import temporary_dir
from github3.exceptions import NotFoundError

logger = logging.getLogger(__name__)


ZIP_FILE_NAME = "archive.zip"


class UnsafeZipfileError(Exception):
    pass


def _is_safe_path(path):
    return not os.path.isabs(path) and ".." not in path.split(os.path.sep)


def _zip_file_is_safe(zip_file):
    return all(_is_safe_path(info.filename) for info in zip_file.infolist())


def _get_zip_file(repo, commit_ish):
    repo.archive("zipball", path=ZIP_FILE_NAME, ref=commit_ish)
    return zipfile.ZipFile(ZIP_FILE_NAME)


def _log_unsafe_zipfile_error(repo_url, commit_ish):
    """
    It is very unlikely that we will get an unsafe zipfile, as we get it
    from GitHub, but must be considered.
    """
    url = f"{repo_url}#{commit_ish}"
    logger.error(f"Malformed or malicious zip file from {url}.")


def _extract_zip_file(zip_file, owner, repo_name):
    zip_file.extractall()
    # We know that the zipball contains a root directory named something
    # like this by GitHub's convention. If that ever breaks, this will
    # break:
    zipball_root = glob(f"{owner}-{repo_name}-*")[0]
    # It's not unlikely that the zipball root contains a directory with
    # the same name, so we pre-emptively rename it to probably avoid
    # collisions:
    shutil.move(zipball_root, "zipball_root")
    for path in itertools.chain(glob("zipball_root/*"), glob("zipball_root/.*")):
        shutil.move(path, ".")
    shutil.rmtree("zipball_root")
    os.remove(ZIP_FILE_NAME)


def _validate_cumulusci_yml_unchanged(repo):
    """Confirm cumulusci.yml is unchanged between default_branch and the cwd."""
    try:
        cci_config_default_branch = repo.file_contents(
            "cumulusci.yml", ref=repo.default_branch
        ).decoded.decode("utf-8")
    except NotFoundError:
        cci_config_default_branch = ""
    try:
        cci_config_branch = pathlib.Path("cumulusci.yml").read_text()
    except IOError:
        cci_config_branch = ""
    if cci_config_default_branch != cci_config_branch:
        raise Exception("cumulusci.yml contains unreviewed changes.")


@contextlib.contextmanager
def local_github_checkout(repo_owner, repo_name, commit_ish=None):
    with temporary_dir() as repo_root:
        # pretend it's a git clone to satisfy cci
        os.mkdir(".git")

        repo = get_github_api_for_repo(None, repo_owner, repo_name)
        if commit_ish is None:
            commit_ish = repo.default_branch
        zip_file = _get_zip_file(repo, commit_ish)

        if not _zip_file_is_safe(zip_file):
            _log_unsafe_zipfile_error(repo.html_url, commit_ish)
            raise UnsafeZipfileError
        else:
            # Because subsequent operations require certain things to be
            # present in the filesystem at cwd, things that are in the
            # repo (we hope):
            _extract_zip_file(zip_file, repo.owner.login, repo.name)

            # validate that cumulusci.yml is the same as default_branch
            # @@@ Do we need to do this in Metadeploy?
            _validate_cumulusci_yml_unchanged(repo)

            yield repo_root
