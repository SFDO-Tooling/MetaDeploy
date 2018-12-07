from django.apps import apps
from rest_framework import permissions, serializers, viewsets


class AdminAPISerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = None
        fields = "__all__"

    def build_url_field(self, field_name, model_class):
        view = f"{self.context['route_ns']}:{self.Meta.model._meta.object_name.lower()}-detail"  # noqa
        field_kwargs = {"view_name": view}  # override default view_name

        return self.serializer_url_field, field_kwargs

    def build_relational_field(self, field_name, relation_info):
        field_class, field_kwargs = super().build_relational_field(
            field_name, relation_info
        )
        model_field, related_model, to_many, to_field, has_through_model, reverse = (
            relation_info
        )
        view = f"{self.context['route_ns']}:{related_model._meta.object_name.lower()}-detail"  # noqa

        if "view_name" in field_kwargs:
            # we're in a hyperlinkedrelationshipfield, need to fix the view ref...
            field_kwargs["view_name"] = view
        return field_class, field_kwargs


class AdminAPIViewSet(viewsets.ModelViewSet):
    model_app_label = "api"
    model_name = None
    permission_classes = [permissions.IsAdminUser]
    serlializer_base = AdminAPISerializer
    route_ns = "admin_rest"

    @property
    def model(self):
        return apps.get_model(
            app_label=str(self.model_app_label), model_name=str(self.model_name)
        )

    def get_queryset(self):
        model = self.model
        return model.objects.all()

    def get_serializer_class(self):
        self.serlializer_base.Meta.model = self.model
        return self.serlializer_base

    def get_serializer_context(self,):
        ctx = super().get_serializer_context()
        ctx[
            "route_ns"
        ] = self.route_ns  # add the route namespace to the serializer context
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
