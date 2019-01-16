from rest_framework import permissions


class OnlyOwnerCanDelete(permissions.IsAuthenticatedOrReadOnly):
    def has_object_permission(self, request, view, obj):
        if request.method == "DELETE":
            return request.user.is_authenticated and request.user == obj.user
        return super().has_object_permission(request, view, obj)
