from ..views import SalesforceOAuth2CustomAdapter


def test_SalesforceOAuth2CustomAdapter_base_url(rf):
    request = rf.get('/?custom_domain=foo')
    request.session = {}
    adapter = SalesforceOAuth2CustomAdapter(request)
    assert adapter.base_url == 'https://foo.my.salesforce.com'
