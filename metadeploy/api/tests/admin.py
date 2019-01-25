import pytest
from django.contrib.admin.sites import AdminSite
from django.test import RequestFactory

from ..admin import AllowedListOrgAdmin
from ..models import AllowedListOrg


@pytest.mark.django_db
class TestAllowedListOrgAdmin:
    def test_save_model(
        self, user_factory, allowed_list_factory, allowed_list_org_factory
    ):
        user = user_factory()
        site = AdminSite()
        allowed_list = allowed_list_factory()
        allowed_list_org = AllowedListOrg(
            allowed_list=allowed_list, org_id="00DABCDEFGHIJKL", description="An org"
        )

        admin = AllowedListOrgAdmin(AllowedListOrg, site)
        factory = RequestFactory()
        request = factory.get("/admin")
        request.user = user
        admin.save_model(request, allowed_list_org, admin.get_form(request), False)
        assert allowed_list_org.created_by == user
