from itertools import chain

from rest_framework import serializers

from .models import (
    Product,
    Job,
    Version,
    Plan,
    Step,
    PreflightResult,
)

from django.contrib.auth import get_user_model


User = get_user_model()


class FullUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'username',
            'email',
            'valid_token_for',
            'is_staff',
        )


class LimitedUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'username',
            'is_staff',
        )


class StepSerializer(serializers.ModelSerializer):
    kind = serializers.CharField(source='get_kind_display')

    class Meta:
        model = Step
        fields = (
            'id',
            'name',
            'description',
            'is_required',
            'is_recommended',
            'kind',
            'kind_icon',
        )


class PlanSerializer(serializers.ModelSerializer):
    steps = StepSerializer(many=True, source='step_set')

    class Meta:
        model = Plan
        fields = (
            'id',
            'title',
            'version',
            'preflight_message',
            'tier',
            'slug',
            'steps',
        )


class VersionSerializer(serializers.ModelSerializer):
    primary_plan = PlanSerializer()
    secondary_plan = PlanSerializer()
    additional_plans = PlanSerializer(many=True)

    class Meta:
        model = Version
        fields = (
            'id',
            'product',
            'label',
            'description',
            'created_at',
            'primary_plan',
            'secondary_plan',
            'additional_plans',
        )


class ProductSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='category.title')
    most_recent_version = VersionSerializer()

    class Meta:
        model = Product
        fields = (
            'id',
            'title',
            'description',
            'category',
            'color',
            'icon',
            'image',
            'most_recent_version',
            'slug',
        )


class JobSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault(),
    )
    plan = serializers.PrimaryKeyRelatedField(
        queryset=Plan.objects.all(),
    )
    steps = serializers.PrimaryKeyRelatedField(
        queryset=Step.objects.all(),
        many=True,
    )
    creator = LimitedUserSerializer(
        read_only=True,
        source='user',
    )

    class Meta:
        model = Job
        fields = (
            'user',
            'creator',
            'plan',
            'steps',
            'created_at',
            'enqueued_at',
            'job_id',
        )
        extra_kwargs = {
            'created_at': {'read_only': True},
            'enqueued_at': {'read_only': True},
            'job_id': {'read_only': True},
        }

    @staticmethod
    def has_valid_preflight(plan, user):
        potential_preflights = PreflightResult.objects.filter(
            plan=plan,
            user=user,
            is_valid=True,
            status=PreflightResult.Status.complete,
        ).values_list("results", flat=True)
        preflights_with_errors = [
            val
            for val
            in chain(*chain(*[pre.values() for pre in potential_preflights]))
            if val.get("status", None) == "error"
        ]
        return not any(preflights_with_errors) and potential_preflights

    def validate(self, data):
        if not self.has_valid_preflight(data["plan"], data["user"]):
            raise serializers.ValidationError("No valid preflight.")
        return data


class PreflightResultSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault(),
    )
    has_errors = serializers.SerializerMethodField()

    def get_has_errors(self, obj):
        return (
            obj.status == PreflightResult.Status.complete
            and obj.results != {}
        )

    class Meta:
        model = PreflightResult
        fields = (
            'organization_url',
            'user',
            'plan',
            'created_at',
            'is_valid',
            'status',
            'results',
            'has_errors',
        )
        extra_kwargs = {
            'organization_url': {'read_only': True},
            'plan': {'read_only': True},
            'created_at': {'read_only': True},
            'is_valid': {'read_only': True},
            'status': {'read_only': True},
            'results': {'read_only': True},
        }
