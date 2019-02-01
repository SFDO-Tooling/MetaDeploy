from unittest.mock import MagicMock

from ..utils import get_remote_ip


def test_get_remote_ip():
    request = MagicMock()
    request.META = {"HTTP_X_FORWARDED_FOR": "4.4.4.4, 8.8.8.8"}
    assert get_remote_ip(request) == "8.8.8.8"
