from uuid import uuid4

import pytest

from ..models import ScratchOrg
from ..permissions import OnlyUserWithOrg


class AnonymousUser:
    is_authenticated = False


@pytest.mark.django_db
class TestOnlyUserWithOrg:
    def test_has_permission__valid_scratch_org(self, rf, scratch_org_factory):
        uuid = str(uuid4())
        permission = OnlyUserWithOrg()
        request = rf.get("/")
        request.user = AnonymousUser()
        request.session = {"scratch_org_id": uuid}
        scratch_org_factory(uuid=uuid, status=ScratchOrg.Status.complete)
        assert permission.has_permission(request, None)

    def test_has_permission__invalid_scratch_org(self, rf):
        uuid = str(uuid4())
        permission = OnlyUserWithOrg()
        request = rf.get("/")
        request.user = AnonymousUser()
        request.session = {"scratch_org_id": uuid}
        assert not permission.has_permission(request, None)
