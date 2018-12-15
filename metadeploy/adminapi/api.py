from django.apps import apps
from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework import pagination, permissions, serializers, viewsets
from rest_framework.response import Response


class AdminAPISerializer(serializers.HyperlinkedModelSerializer):
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
    default_limit = 10
    max_limit = 100

    def get_paginated_response(self, data):
        # the paginator is responsible for creating the Response() on ModelViewSet's
        # list() so we use this to dictate the list() response shape...

        return Response(
            {
                "data": data,
                "meta": {"total_count": self.count},
                "links": {
                    "next": self.get_next_link(),
                    "previous": self.get_previous_link(),
                },
            }
        )


# https://drf-schema-adapter.readthedocs.io/en/latest/drf_auto_endpoint/ inspiration?
@method_decorator(never_cache, name="list")
@method_decorator(never_cache, name="retrieve")
class AdminAPIViewSet(viewsets.ModelViewSet):
    model_app_label = "api"
    model_name = None
    serlializer_base = AdminAPISerializer
    serializer_class = None
    route_ns = "admin_rest"

    # TODO: Permission, lock to SFDC IPs? require HTTPS
    # TODO: Permission, force subclasses to append, not overwrite
    # TODO: API Key?
    # Admin Views require IsAdmin/IsStaff. Don't change this
    permission_classes = [permissions.IsAdminUser]

    # # Pagination
    pagination_class = AdminAPIPagination

    # TODO: Metadata, create an OPTIONS/metadata response. JSON HYPER SCHEMA.
    # TODO: Filter, idk figure something out,
    #   don't reinvent odata $filter and build an injection attack.
    # TODO: Versioning, require it in accept header
    # TODO: RFC7807 Error Documents, cuz!
    # TODO: Natural Keys, router support needed.

    # # Caching
    # AdminAPI does not support a caching scheme, so we apply a Cache-Control=Never
    # for HTTP GETs (list/retrieve).

    # # Response Shape
    # AdminAPI is inspired by, but noncompliant with JSON:API at this time.
    # The paginator provides a list response shape.
    # TODO: JSON:API-style serializer (type, id, attributes, links)

    @property
    def model(self):
        return apps.get_model(
            app_label=str(self.model_app_label), model_name=str(self.model_name)
        )

    def get_queryset(self):
        model = self.model
        return model.objects.all()

    def get_serializer_class(self):
        if self.serializer_class:
            return self.serializer_class

        class AdminSerializer(self.serlializer_base):
            class Meta(self.serlializer_base.Meta):
                model = self.model

        return AdminSerializer

    def get_serializer_context(self,):
        ctx = super().get_serializer_context()
        # add the route namespace to the serializer context
        ctx["route_ns"] = self.route_ns
        return ctx


class ProductViewSet(AdminAPIViewSet):
    model_name = "Product"


class ProductSlugViewSet(AdminAPIViewSet):
    model_name = "ProductSlug"


class PlanViewSet(AdminAPIViewSet):
    model_name = "Plan"


class PlanSlugViewSet(AdminAPIViewSet):
    model_name = "PlanSlug"


class VersionViewSet(AdminAPIViewSet):
    model_name = "Version"


class ProductCategoryViewSet(AdminAPIViewSet):
    model_name = "ProductCategory"
