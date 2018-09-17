import pytest

from ..templatetags.api_bootstrap import serialize


@pytest.mark.django_db
def test_serialize(user_factory):
    user = user_factory(
        email='template_tags@example.com',
        username='template_tags@example.com',
    )
    actual = serialize(user)
    expected = "{&quot;username&quot;: &quot;template_tags@example.com&quot;, &quot;email&quot;: &quot;template_tags@example.com&quot;}"  # noqa
    assert actual == expected
