from django.apps import apps
from rest_framework import permissions, serializers, viewsets


class AdminAPISerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = None
        fields = "__all__"

    def build_url_field(self, field_name, model_class):
        field_kwargs = {
            "view_name": f"admin_rest:{self.Meta.model.__name__.lower()}-detail"
        }  # override default view_name

        return self.serializer_url_field, field_kwargs

    def build_relational_field(self, field_name, relation_info):
        field_class, field_kwargs = super().build_relational_field(
            field_name, relation_info
        )
        model_field, related_model, to_many, to_field, has_through_model, reverse = (
            relation_info
        )
        if "view_name" in field_kwargs:
            # we're in a hyperlinkedrelationshipfield, need to fix the view ref...
            field_kwargs[
                "view_name"
            ] = f"admin_rest:{related_model.__name__.lower()}-detail"
        return field_class, field_kwargs


class AdminAPIViewSet(viewsets.ModelViewSet):
    app_label = "api"
    model_name = None
    permission_classes = [permissions.IsAdminUser]
    serlializer_base = AdminAPISerializer

    @property
    def model(self):
        return apps.get_model(
            app_label=str(self.app_label), model_name=str(self.model_name)
        )

    def get_queryset(self):
        model = self.model
        return model.objects.all()

    def get_serializer_class(self):
        self.serlializer_base.Meta.model = self.model
        return self.serlializer_base


class ProductViewSet(AdminAPIViewSet):
    model_name = "Product"


class PlanViewSet(AdminAPIViewSet):
    model_name = "Plan"


class VersionViewSet(AdminAPIViewSet):
    model_name = "Version"


class ProductCategoryViewSet(AdminAPIViewSet):
    model_name = "ProductCategory"
