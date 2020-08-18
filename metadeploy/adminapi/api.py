from django_filters import rest_framework as filters
from rest_framework import serializers, viewsets
from rest_framework.response import Response
from sfdo_template_helpers.admin.permissions import IsAPIUser
from sfdo_template_helpers.admin.serializers import AdminAPISerializer
from sfdo_template_helpers.admin.views import AdminAPIViewSet

from metadeploy.adminapi.translations import update_all_translations
from metadeploy.api import models


class ProductSerializer(AdminAPISerializer):
    title = serializers.CharField()
    short_description = serializers.CharField()
    description = serializers.CharField()
    click_through_agreement = serializers.CharField()
    error_message = serializers.CharField()
    slug = serializers.CharField()

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


class PlanTemplateSerializer(AdminAPISerializer):
    preflight_message = serializers.CharField(required=False, allow_blank=True)
    post_install_message = serializers.CharField(required=False, allow_blank=True)
    error_message = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        fields = "__all__"


class PlanTemplateViewSet(AdminAPIViewSet):
    model_name = "PlanTemplate"
    serializer_base = PlanTemplateSerializer


class PlanFilter(filters.FilterSet):
    class Meta:
        model = models.Plan
        exclude = ("preflight_checks",)


class PlanViewSet(AdminAPIViewSet):
    model_name = "Plan"
    serializer_base = PlanSerializer
    filterset_class = PlanFilter


class PlanSlugViewSet(AdminAPIViewSet):
    model_name = "PlanSlug"


class VersionViewSet(AdminAPIViewSet):
    model_name = "Version"


class ProductCategoryViewSet(AdminAPIViewSet):
    model_name = "ProductCategory"


class AllowedListViewSet(AdminAPIViewSet):
    model_name = "AllowedList"


class AllowedListOrgSerializer(AdminAPISerializer):
    created_by = serializers.StringRelatedField()


class AllowedListOrgViewSet(AdminAPIViewSet):
    model_name = "AllowedListOrg"
    serializer_base = AllowedListOrgSerializer


class TranslationViewSet(viewsets.ViewSet):
    """Facilitates adding/updating translated text.

    PATCH /admin/rest/translations/es

    {
        "context": {
            "slug": {
                "message": "En español",
                "description": "Spanish translation for slug in this context"
            }
        }
    }
    """

    permission_classes = [IsAPIUser]
    model_name = "Translation"

    def partial_update(self, request, pk=None):
        # Add or update a Translation record for each message
        lang = pk
        for context, messages in request.data.items():
            for slug, message in messages.items():
                record, created = models.Translation.objects.get_or_create(
                    lang=lang, context=context, slug=slug,
                )
                record.text = message["message"]
                record.save()

        update_all_translations.delay(lang)
        return Response({})
