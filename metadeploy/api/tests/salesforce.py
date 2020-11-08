import pytest
from django.core.exceptions import ImproperlyConfigured

from ..salesforce import _get_devhub_api


def test_get_devhub_api(settings):
    settings.DEVHUB_USERNAME = None
    with pytest.raises(ImproperlyConfigured):
        _get_devhub_api()
