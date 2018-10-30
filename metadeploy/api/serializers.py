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

from .constants import WARN, ERROR


User = get_user_model()


class FullUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'username',
            'email',
            'valid_token_for',
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

    class Meta:
        model = Job
        fields = (
            'user',
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


class PreflightResultSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault(),
    )
    error_count = serializers.SerializerMethodField()
    warning_count = serializers.SerializerMethodField()

    @staticmethod
    def _count_status_in_results(results, status_name):
        count = 0
        for val in results.values():
            for status in val:
                if status['status'] == status_name:
                    count += 1
        return count

    def get_error_count(self, obj):
        if obj.status == PreflightResult.Status.started:
            return 0
        return self._count_status_in_results(obj.results, ERROR)

    def get_warning_count(self, obj):
        if obj.status == PreflightResult.Status.started:
            return 0
        return self._count_status_in_results(obj.results, WARN)

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
            'error_count',
            'warning_count',
        )
        extra_kwargs = {
            'organization_url': {'read_only': True},
            'plan': {'read_only': True},
            'created_at': {'read_only': True},
            'is_valid': {'read_only': True},
            'status': {'read_only': True},
            'results': {'read_only': True},
        }
