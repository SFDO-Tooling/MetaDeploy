from typing import List, Type
from ipaddress import IPv4Address

from django.apps import apps
from django.conf import settings
from django.core import exceptions
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework import pagination, permissions, serializers, viewsets
from rest_framework.response import Response
from rest_framework.authentication import TokenAuthentication, SessionAuthentication

from metadeploy.api import models



class IsAllowedIPAddress(permissions.BasePermission):
    """Permission check for allowed IP networks.
    """
    ip_ranges: List[IPv4Network]

    def has_permission(self, request, view):
        ip_addr = IPv4Address(request.META["REMOTE_ADDR"])
        if not any(ip_addr in subnet for subnet in ip_ranges):
            raise exceptions.SuspiciousOperation(f"Disallowed IP address: {ip_addr}")
        return True

def AllowedIPRange(ip_ranges: List[IPv4Network], cls_prefix: str = "") -> Type[permissions.BasePermission]:
    """Factory that returns an IsAllowedIpAddress permission based on a given list of ip_ranges.
    """
    return type(f"{cls_prefix}AllowedIPRange", (IsAllowedIPAddress, ), {"ip_ranges": ip_ranges})

class IsAPIUser(permissions.BasePermission):
    """Permission check for API permission.

    (Currently just checks if user is a superuser.)
    """

    def has_permission(self, request, view):
        return request.user.is_superuser


class AdminAPISerializer(serializers.HyperlinkedModelSerializer):
    """Custom serializer to make sure we link to /admin/rest/ routes
    rather than the public /api/
    """

    id = serializers.CharField(read_only=True)

    class Meta:
        model = None
        fields = "__all__"

    def build_url_field(self, field_name, model_class):
        view = (
            f"{self.context['route_ns']}:"
            f"{self.Meta.model._meta.object_name.lower()}-detail"
        )
        field_kwargs = {"view_name": view}  # override default view_name

        return self.serializer_url_field, field_kwargs

    def build_relational_field(self, field_name, relation_info):
        field_class, field_kwargs = super().build_relational_field(
            field_name, relation_info
        )
        related_model = relation_info.related_model
        view = (
            f"{self.context['route_ns']}:"
            f"{related_model._meta.object_name.lower()}-detail"
        )

        if "view_name" in field_kwargs:
            # we're in a hyperlinkedrelationshipfield, need to fix the view ref...
            field_kwargs["view_name"] = view
        return field_class, field_kwargs


class AdminAPIPagination(pagination.LimitOffsetPagination):
    """Custom pagination to keep links separate from data"""

    default_limit = 10
    max_limit = 100

    def get_paginated_response(self, data):
        # the paginator is responsible for creating the Response() on ModelViewSet's
        # list() so we use this to dictate the list() response shape...

        return Response(
            {
                "data": data,
                "meta": {"page": {"total": self.count}},
                "links": {
                    "next": self.get_next_link(),
                    "previous": self.get_previous_link(),
                },
            }
        )


@method_decorator(never_cache, name="list")
@method_decorator(never_cache, name="retrieve")
class AdminAPIViewSet(viewsets.ModelViewSet):
    model_app_label = "api"
    model_name = None
    serializer_base = AdminAPISerializer
    serializer_class = None
    route_ns = "admin_rest"

    # TODO: I believe we need to add SessionAuthentication as the DEFAULT_AUTHETICATION_CLASSES setting for rest framework, see https://www.django-rest-framework.org/api-guide/authentication/, it ensures that we're CSRF checked
    # TODO: add 'rest_framework.tokenauth.apps.TokenAuthAppConfig' to INSTALLED_APPS
    authentication_classes = (TokenAuthentication, SessionAuthentication, )
    permission_classes = [AllowedIPRange(settings.ADMIN_API_ALLOWED_SUBNETS, cls_prefix='VPN'), IsAPIUser]

    # Pagination
    pagination_class = AdminAPIPagination

    # TODO: Filter, idk figure something out,
    #   don't reinvent odata $filter and build an injection attack.
    # TODO: Natural Keys, router support needed.

    # Caching
    # AdminAPI does not support a caching scheme, so we apply a Cache-Control=Never
    # for HTTP GETs (list/retrieve).

    # Response Shape
    # AdminAPI is inspired by, but noncompliant with JSON:API at this time.
    # The paginator provides the top level list response shape.

    @property
    def model(self):
        return apps.get_model(
            app_label=str(self.model_app_label), model_name=str(self.model_name)
        )

    def get_queryset(self):
        model = self.model
        return model.objects.all()

    def get_serializer_class(self):
        if self.serializer_class is None:

            class AdminSerializer(self.serializer_base):
                class Meta(self.serializer_base.Meta):
                    model = self.model

            self.serializer_class = AdminSerializer
        return self.serializer_class

    def get_serializer_context(self,):
        ctx = super().get_serializer_context()
        # add the route namespace to the serializer context
        ctx["route_ns"] = self.route_ns
        return ctx


class ProductViewSet(AdminAPIViewSet):
    model_name = "Product"


class ProductSlugViewSet(AdminAPIViewSet):
    model_name = "ProductSlug"


class PlanStepSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.Step
        exclude = ("id", "plan", "order_key")


class PlanSerializer(AdminAPISerializer):
    steps = PlanStepSerializer(source="step_set", many=True, required=False)

    class Meta:
        fields = "__all__"

    def create(self, validated_data):
        steps = validated_data.pop("step_set") or []
        plan = self.Meta.model.objects.create(**validated_data)
        for i, step_data in enumerate(steps):
            plan.step_set.create(order_key=i, **step_data)
        return plan

    def update(self, instance, validated_data):
        if "step_set" in validated_data:
            raise serializers.ValidationError(detail="Updating steps not supported.")
        validated_data.pop("step_set", None)
        return super().update(instance, validated_data)


class PlanViewSet(AdminAPIViewSet):
    model_name = "Plan"
    serializer_base = PlanSerializer


class PlanSlugViewSet(AdminAPIViewSet):
    model_name = "PlanSlug"


class VersionViewSet(AdminAPIViewSet):
    model_name = "Version"


class ProductCategoryViewSet(AdminAPIViewSet):
    model_name = "ProductCategory"


class AllowedListViewSet(AdminAPIViewSet):
    model_name = "AllowedList"
