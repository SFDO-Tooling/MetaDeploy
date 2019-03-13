from ..permissions import ReadOnly


def test_read_only_safe(rf):
    permission = ReadOnly()

    request = rf.get("")
    assert permission.has_permission(request, None)

    request = rf.post("")
    assert not permission.has_permission(request, None)
