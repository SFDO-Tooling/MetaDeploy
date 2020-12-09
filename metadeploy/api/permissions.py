from rest_framework import permissions

from .models import ScratchOrg


class HasOrgOrReadOnly(permissions.BasePermission):
    """
    This limits non-readonly access to authenticated users,
    or anonymous users who have a `uuid`
    for a valid (complete) scratch org in their session.

    For object-level actions,
    the requesting user must be the owner/creator of the scratch org,
    or have the `uuid` for the particular scratch org in their session.
    """

    def has_permission(self, request, view):
        if (
            request.method in permissions.SAFE_METHODS
            or request.user
            and request.user.is_authenticated
        ):
            return True
        scratch_org = ScratchOrg.objects.get_from_session(request.session)
        return True if scratch_org else False

    def has_object_permission(self, request, view, obj):
        is_superuser = request.user and request.user.is_superuser
        is_owner = (
            request.user and request.user.is_authenticated and request.user == obj.user
        )
        if request.method in permissions.SAFE_METHODS or is_superuser or is_owner:
            return True
        scratch_org = ScratchOrg.objects.get_from_session(request.session)
        return scratch_org and scratch_org.org_id == obj.org_id
