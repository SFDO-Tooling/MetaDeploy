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
            'id',
            'user',
            'creator',
            'plan',
            'steps',
            'completed_steps',
            'created_at',
            'enqueued_at',
            'job_id',
        )
        extra_kwargs = {
            'created_at': {'read_only': True},
            'enqueued_at': {'read_only': True},
            'completed_steps': {'read_only': True},
            'job_id': {'read_only': True},
        }

    @staticmethod
    def has_valid_preflight(most_recent_preflight):
        if not most_recent_preflight:
            return False

        return not most_recent_preflight.has_any_errors()

    @staticmethod
    def has_valid_steps(*, user, plan, steps, preflight):
        preflight_optional_steps = set(preflight.optional_steps())
        job_completed_steps = set(Job.objects.completed_steps(
            user=user,
            plan=plan,
        ))
        required_steps = (
            set(plan.required_step_ids)
            - preflight_optional_steps
            - job_completed_steps
        )
        return not set(required_steps) - set([s.id for s in steps])

    def validate(self, data):
        most_recent_preflight = PreflightResult.objects.most_recent(
            user=data["user"],
            plan=data["plan"],
        )
        if not self.has_valid_preflight(most_recent_preflight):
            raise serializers.ValidationError("No valid preflight.")
        has_valid_steps = self.has_valid_steps(
            user=data["user"],
            plan=data["plan"],
            steps=data["steps"],
            preflight=most_recent_preflight,
        )
        if not has_valid_steps:
            raise serializers.ValidationError("Invalid steps for plan.")
        return data


class PreflightResultSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault(),
    )
    error_count = serializers.SerializerMethodField()
    warning_count = serializers.SerializerMethodField()
    is_ready = serializers.SerializerMethodField()

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

    def get_is_ready(self, obj):
        return (
            obj.is_valid
            and obj.status == PreflightResult.Status.complete
            and self._count_status_in_results(obj.results, ERROR) == 0
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
            'error_count',
            'warning_count',
            'is_ready',
        )
        extra_kwargs = {
            'organization_url': {'read_only': True},
            'plan': {'read_only': True},
            'created_at': {'read_only': True},
            'is_valid': {'read_only': True},
            'status': {'read_only': True},
            'results': {'read_only': True},
        }
