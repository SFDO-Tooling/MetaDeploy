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

from .constants import WARN, ERROR, OPTIONAL


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
    def get_most_recent_preflight(user, plan):
        return PreflightResult.objects.filter(
            plan=plan,
            user=user,
            is_valid=True,
            status=PreflightResult.Status.complete,
        ).order_by(
            '-created_at',
        ).first()

    @staticmethod
    def has_valid_preflight(most_recent_preflight):
        if not most_recent_preflight:
            return False

        preflight_errors = [
            val
            for val
            in chain(*most_recent_preflight.results.values())
            if val.get("status", None) == "error"
        ]
        return not any(preflight_errors)

    @staticmethod
    def has_valid_steps(user, plan, steps, preflight):
        preflight_optional_steps = set(
            int(k)  # Why is this a string? Accident of pytest-django?
            for k, v
            in preflight.results.items()
            if any([
                status["status"] == OPTIONAL
                for status
                in v
            ])
        )
        job_completed_steps = set(chain(*Job.objects.filter(
            user=user,
            plan=plan,
        ).order_by('-created_at').values_list('completed_steps', flat=True)))
        required_steps = set(
            plan.step_set.filter(is_required=True).values_list("id", flat=True)
        ) - preflight_optional_steps - job_completed_steps
        return not set(required_steps) - set([s.id for s in steps])

    def validate(self, data):
        most_recent_preflight = self.get_most_recent_preflight(
            data["user"],
            data["plan"],
        )
        if not self.has_valid_preflight(most_recent_preflight):
            raise serializers.ValidationError("No valid preflight.")
        has_valid_steps = self.has_valid_steps(
            data["user"],
            data["plan"],
            data["steps"],
            most_recent_preflight,
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
