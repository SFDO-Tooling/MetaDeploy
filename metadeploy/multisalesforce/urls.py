from django.conf.urls import include, url

from allauth.utils import import_attribute

from .provider import (
    SalesforceProductionProvider,
    SalesforceTestProvider,
)


def default_urlpatterns(provider, version):
    login_view = import_attribute(
        provider.get_package() + f'.views.{version}_oauth2_login')
    callback_view = import_attribute(
        provider.get_package() + f'.views.{version}_oauth2_callback')

    urlpatterns = [
        url(r'^login/$',
            login_view, name=provider.id + "_login"),
        url(r'^login/callback/$',
            callback_view, name=provider.id + "_callback"),
    ]

    return [url('^' + provider.get_slug() + '/', include(urlpatterns))]


urlpatterns = default_urlpatterns(SalesforceProductionProvider, 'prod')
urlpatterns += default_urlpatterns(SalesforceTestProvider, 'test')
