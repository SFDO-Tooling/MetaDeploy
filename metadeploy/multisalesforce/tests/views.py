from ..views import SalesforceOAuth2CustomAdapter


def test_SalesforceOAuth2CustomAdapter_base_url(rf):
    adapter = SalesforceOAuth2CustomAdapter(rf.get('/?custom_domain=foo'))
    assert adapter.base_url == 'https://foo.my.salesforce.com'
