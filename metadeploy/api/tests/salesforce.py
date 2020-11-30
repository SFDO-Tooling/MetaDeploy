import pytest
from django.core.exceptions import ImproperlyConfigured
from django.test import override_settings

from ..salesforce import _get_devhub_api


@override_settings(DEVHUB_USERNAME=None)
def test_get_devhub_api(settings):
    with pytest.raises(ImproperlyConfigured):
        _get_devhub_api()
