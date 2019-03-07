from django_filters import rest_framework as filters
from rest_framework import serializers
from sfdo_template_helpers.admin.serializers import AdminAPISerializer
from sfdo_template_helpers.admin.views import AdminAPIViewSet

from metadeploy.api import models


class ProductSerializer(AdminAPISerializer):
    title = serializers.CharField()
    short_description = serializers.CharField()
    description = serializers.CharField()
    click_through_agreement = serializers.CharField()

    class Meta:
        fields = "__all__"


class ProductFilter(filters.FilterSet):
    class Meta:
        model = models.Product
        exclude = ("image",)


class ProductViewSet(AdminAPIViewSet):
    model_name = "Product"
    serializer_base = ProductSerializer
    filterset_class = ProductFilter


class ProductSlugViewSet(AdminAPIViewSet):
    model_name = "ProductSlug"


class PlanStepSerializer(serializers.ModelSerializer):
    name = serializers.CharField()
    description = serializers.CharField(required=False)

    class Meta:
        model = models.Step
        exclude = ("id", "plan")


class PlanSerializer(AdminAPISerializer):
    steps = PlanStepSerializer(many=True, required=False)
    title = serializers.CharField()
    preflight_message_additional = serializers.CharField(
        required=False, allow_blank=True
    )
    post_install_message_additional = serializers.CharField(
        required=False, allow_blank=True
    )

    class Meta:
        fields = "__all__"
        extra_kwargs = {"plan_template": {"required": False}}

    def create(self, validated_data):
        steps = validated_data.pop("steps") or []
        plan = self.Meta.model.objects.create(**validated_data)
        for step_data in steps:
            plan.steps.create(**step_data)
        return plan

    def update(self, instance, validated_data):
        if "steps" in validated_data:
            raise serializers.ValidationError(detail="Updating steps not supported.")
        validated_data.pop("steps", None)
        return super().update(instance, validated_data)


class PlanTemplateViewSet(AdminAPIViewSet):
    model_name = "PlanTemplate"


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


class AllowedListOrgViewSet(AdminAPIViewSet):
    model_name = "AllowedListOrg"
