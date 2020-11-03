from rest_framework import permissions

from .models import ScratchOrg


class OnlyOwnerOrSuperuser(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser or (
            request.user.is_authenticated and request.user == obj.user
        ):
            return True
        scratch_org_id = request.session.get("scratch_org_id", None)
        if scratch_org_id:
            scratch_org = ScratchOrg.objects.filter(
                uuid=scratch_org_id, status=ScratchOrg.Status.complete
            ).first()
            return scratch_org and scratch_org.org_id == obj.org_id
        return False


class OnlyUserWithOrg(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.user.is_authenticated:
            return True
        scratch_org_id = request.session.get("scratch_org_id", None)
        if scratch_org_id:
            scratch_org = ScratchOrg.objects.filter(
                uuid=scratch_org_id, status=ScratchOrg.Status.complete
            ).first()
            if scratch_org:
                return True
        return False
