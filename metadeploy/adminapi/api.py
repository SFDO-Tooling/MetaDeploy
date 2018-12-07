from django.apps import apps
from rest_framework import permissions, serializers, viewsets


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


class AdminAPIViewSet(viewsets.ModelViewSet):
    model_app_label = "api"
    model_name = None
    serlializer_base = AdminAPISerializer
    route_ns = "admin_rest"

    # Admin Views require IsAdmin/IsStaff. Don't change this
    permission_classes = [permissions.IsAdminUser]

    @property
    def model(self):
        return apps.get_model(
            app_label=str(self.model_app_label), model_name=str(self.model_name)
        )

    def get_queryset(self):
        model = self.model
        return model.objects.all()

    def get_serializer_class(self):
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
