from metadeploy.multitenancy.iprestrict_middleware import IPRestrictMiddleware
from django.contrib.sites.models import Site
from metadeploy.api.models import SiteProfile
from django.test import RequestFactory, TestCase
from unittest.mock import patch
import json


class IPRestrictionMiddlewaretest(TestCase):
    def setUp(self):
        self.factory = RequestFactory()

    @patch('metadeploy.multitenancy.iprestrict_middleware.IPRestrictMiddleware.getSiteProfile')
    def test_ip_restrict_middleware_with_matching_allowed_client_ip(self, mock_site_profile_get):
        request = self.factory.get('/test')
        request.META["REMOTE_ADDR"] = "127.0.0.1"

        allowed_ips = '["127.0.0.2","127.0.0.1"]'
        allowed_ip_list = json.loads(allowed_ips)

        site = Site.objects.create(name="Test")
        mock_site_profile = SiteProfile()
        mock_site_profile.site = site
        mock_site_profile.name = site.name
        mock_site_profile.allowed_ip_addresses = allowed_ip_list
        mock_site_profile_get.return_value = mock_site_profile

        response = IPRestrictMiddleware(lambda x: x)(request)
        assert response == request

    @patch('metadeploy.multitenancy.iprestrict_middleware.IPRestrictMiddleware.getSiteProfile')
    def test_ip_restrict_middleware_with_value_error_client_ip(self, mock_site_profile_get):
        request = self.factory.get('/test')
        request.META["REMOTE_ADDR"] = "127.0.0.1"

        allowed_ips = '["127.0.0.2/35", "127.0.0.1"]'
        allowed_ip_list = json.loads(allowed_ips)

        site = Site.objects.create(name="Test")
        mock_site_profile = SiteProfile()
        mock_site_profile.site = site
        mock_site_profile.name = site.name
        mock_site_profile.allowed_ip_addresses = allowed_ip_list
        mock_site_profile_get.return_value = mock_site_profile

        response = IPRestrictMiddleware(lambda x: x)(request)
        assert response == request

    @patch('metadeploy.multitenancy.iprestrict_middleware.IPRestrictMiddleware.getSiteProfile')
    def test_ip_restrict_middleware_with_matching_allowed_client_ip_cidr_format(self, mock_site_profile_get):
        request = self.factory.get('/test')
        request.META["REMOTE_ADDR"] = "127.0.0.1"

        allowed_ips = '["127.0.0.3","127.0.0.2/30"]'
        allowed_ip_list = json.loads(allowed_ips)

        site = Site.objects.create(name="Test")
        mock_site_profile = SiteProfile()
        mock_site_profile.site = site
        mock_site_profile.name = site.name
        mock_site_profile.allowed_ip_addresses = allowed_ip_list
        mock_site_profile_get.return_value = mock_site_profile

        response = IPRestrictMiddleware(lambda x: x)(request)
        assert response == request

    @patch('metadeploy.multitenancy.iprestrict_middleware.IPRestrictMiddleware.getSiteProfile')
    def test_ip_restrict_middleware_without_matching_allowed_client_ip(self, mock_site_profile_get):
        request = self.factory.get('/test')
        request.META["REMOTE_ADDR"] = "127.0.0.2"

        allowed_ips = '["127.0.0.1"]'
        allowed_ip_list = json.loads(allowed_ips)

        site = Site.objects.create(name="Test")
        mock_site_profile = SiteProfile()
        mock_site_profile.site = site
        mock_site_profile.name = site.name
        mock_site_profile.allowed_ip_addresses = allowed_ip_list
        mock_site_profile_get.return_value = mock_site_profile

        response = IPRestrictMiddleware(lambda x: x)(request)
        assert response.status_code == 403

    @patch('metadeploy.multitenancy.iprestrict_middleware.IPRestrictMiddleware.getSiteProfile')
    def test_ip_restrict_middleware_without_allowed_list(self, mock_site_profile_get):
        request = self.factory.get('/test')
        request.META["REMOTE_ADDR"] = "127.0.0.1"

        site = Site.objects.create(name="Test")
        mock_site_profile = SiteProfile()
        mock_site_profile.site = site
        mock_site_profile.name = site.name
        mock_site_profile_get.return_value = mock_site_profile

        response = IPRestrictMiddleware(lambda x: x)(request)
        assert response == request

    @patch('metadeploy.multitenancy.iprestrict_middleware.IPRestrictMiddleware.getSiteProfile')
    def test_ip_restrict_middleware_with_allowed_list_none(self, mock_site_profile_get):
        request = self.factory.get('/test')
        request.META["REMOTE_ADDR"] = "127.0.0.1"

        site = Site.objects.create(name="Test")
        mock_site_profile = SiteProfile()
        mock_site_profile.site = site
        mock_site_profile.name = site.name
        mock_site_profile.allowed_ip_addresses = None
        mock_site_profile_get.return_value = mock_site_profile

        response = IPRestrictMiddleware(lambda x: x)(request)
        assert response == request

    @patch('metadeploy.multitenancy.iprestrict_middleware.IPRestrictMiddleware.getSiteProfile')
    def test_ip_restrict_middleware_without_matching_allowed_client_ip_admin_page(self, mock_site_profile_get):
        request = self.factory.get('/admin/sites/site/1/change/')
        request.META["REMOTE_ADDR"] = "127.0.0.2"

        site = Site.objects.create(name="Test")
        mock_site_profile = SiteProfile()
        mock_site_profile.site = site
        mock_site_profile.name = site.name
        mock_site_profile.allowed_ip_addresses = '["127.0.0.1"]'
        mock_site_profile_get.return_value = mock_site_profile

        response = IPRestrictMiddleware(lambda x: x)(request)
        assert response == request
