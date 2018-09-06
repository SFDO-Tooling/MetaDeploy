from django.urls import include, path

from allauth.utils import import_attribute

from .provider import (
    SalesforceProductionProvider,
    SalesforceTestProvider,
    SalesforceCustomProvider,
)


def default_urlpatterns(provider, version):
    login_view = import_attribute(
        provider.get_package() + f'.views.{version}_oauth2_login')
    callback_view = import_attribute(
        provider.get_package() + f'.views.{version}_oauth2_callback')

    urlpatterns = [
        path(
            'login/',
            login_view,
            name=f'{provider.id}_login',
        ),
        path(
            'login/callback/',
            callback_view,
            name=f'{provider.id}_callback',
        ),
    ]

    return [path(f'{provider.get_slug()}/', include(urlpatterns))]


urlpatterns = default_urlpatterns(SalesforceProductionProvider, 'prod')
urlpatterns += default_urlpatterns(SalesforceTestProvider, 'sandbox')
urlpatterns += default_urlpatterns(SalesforceCustomProvider, 'custom')
