from django.apps import apps
from rest_framework import permissions, serializers, viewsets


class AdminAPISerializer(serializers.HyperlinkedModelSerializer):
    id = serializers.CharField(read_only=True)

    class Meta:
        model = None
        fields = "__all__"


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
