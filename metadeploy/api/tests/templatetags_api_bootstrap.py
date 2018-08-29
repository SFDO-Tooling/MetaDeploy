import pytest

from ..templatetags.api_bootstrap import serialize


@pytest.mark.django_db
def test_serialize(user):
    actual = serialize(user)
    expected = "{&quot;username&quot;: &quot;&quot;, &quot;email&quot;: &quot;user_1@example.com&quot;}"  # noqa
    assert actual == expected
