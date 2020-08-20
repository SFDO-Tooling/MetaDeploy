from contextlib import ExitStack
from unittest.mock import MagicMock, patch

from ..github import (
    _extract_zip_file,
    _get_zip_file,
    _is_safe_path,
    _log_unsafe_zipfile_error,
    _zip_file_is_safe,
    local_github_checkout,
)


def test_is_safe_path():
    assert _is_safe_path("foo/bar")
    assert not _is_safe_path("/foo/bar")


def test_zip_file_is_safe():
    zip_file = MagicMock(
        **{
            "info_list.return_values": [
                MagicMock(filename="foo/bar"),
                MagicMock(filename="baz/qux"),
            ]
        }
    )
    assert _zip_file_is_safe(zip_file)


def test_get_zip_file():
    repo = MagicMock()
    with patch("metadeploy.api.github.zipfile.ZipFile"):
        assert _get_zip_file(repo, None)


def test_log_unsafe_zipfile_error():
    with patch("metadeploy.api.github.logger") as logger:
        _log_unsafe_zipfile_error("url", "commit")
        assert logger.error.calledWith(
            "Malformed or malicious zip file from url#commit"
        )


def test_extract_zip_file():
    with ExitStack() as stack:
        glob = stack.enter_context(patch("metadeploy.api.github.glob"))
        glob.return_value = ["path"]
        stack.enter_context(patch("metadeploy.api.github.shutil"))
        stack.enter_context(patch("metadeploy.api.github.os"))

        zip_file = MagicMock()

        _extract_zip_file(zip_file, None, None)


def test_local_github_checkout():
    with ExitStack() as stack:
        stack.enter_context(patch("metadeploy.api.github.os"))
        stack.enter_context(patch("metadeploy.api.github.get_github_api_for_repo"))
        stack.enter_context(patch("metadeploy.api.github.download_extract_github"))

        with local_github_checkout("owner", "name") as repo_root:
            assert isinstance(repo_root, str)
