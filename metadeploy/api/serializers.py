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


class IdOnlyField(serializers.CharField):
    def to_representation(self, value):
        return str(value.id)


class FullUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'username',
            'email',
            'valid_token_for',
            'org_name',
            'org_type',
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
    id = serializers.CharField(read_only=True)
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
    id = serializers.CharField(read_only=True)
    steps = StepSerializer(many=True, source='step_set')
    version = serializers.PrimaryKeyRelatedField(
        read_only=True,
        pk_field=serializers.CharField(),
    )
    preflight_message = serializers.CharField(
        source='preflight_message_markdown',
    )

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
    id = serializers.CharField(read_only=True)
    product = serializers.PrimaryKeyRelatedField(
        read_only=True,
        pk_field=serializers.CharField(),
    )
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
    id = serializers.CharField(read_only=True)
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
    id = serializers.CharField(read_only=True)
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault(),
    )
    org_name = serializers.SerializerMethodField()
    organization_url = serializers.SerializerMethodField()

    plan = serializers.PrimaryKeyRelatedField(
        queryset=Plan.objects.all(),
        pk_field=serializers.CharField(),
    )
    steps = serializers.PrimaryKeyRelatedField(
        queryset=Step.objects.all(),
        many=True,
        pk_field=serializers.CharField(),
    )

    # Emitted fields:
    creator = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = (
            'id',
            'user',
            'creator',
            'plan',
            'steps',
            'organization_url',
            'completed_steps',
            'created_at',
            'enqueued_at',
            'job_id',
            'status',
            'org_name',
            'org_type',
        )
        extra_kwargs = {
            'created_at': {'read_only': True},
            'enqueued_at': {'read_only': True},
            'completed_steps': {'read_only': True},
            'job_id': {'read_only': True},
            'status': {'read_only': True},
            'org_type': {'read_only': True},
        }

    def requesting_user_has_rights(self):
        """
        Does the user making the request have rights to see this object?

        The user is derived from the serializer context.
        """
        try:
            user = self.context['request'].user
            return user.is_staff or user == self.instance.user
        except (AttributeError, KeyError):
            return False

    def get_creator(self, obj):
        if self.requesting_user_has_rights():
            return LimitedUserSerializer(instance=obj.user).data
        return None

    def get_org_name(self, obj):
        if self.requesting_user_has_rights():
            return obj.org_name
        return None

    def get_organization_url(self, obj):
        if self.requesting_user_has_rights():
            return obj.organization_url
        return None

    @staticmethod
    def _has_valid_preflight(most_recent_preflight):
        if not most_recent_preflight:
            return False

        return not most_recent_preflight.has_any_errors()

    @staticmethod
    def _has_valid_steps(*, user, plan, steps, preflight):
        """
        Every set in this method is a set of numeric Step PKs, from the
        local database.
        """
        job_completed_steps = set(Job.objects.all_completed_step_ids(
            user=user,
            plan=plan,
        ))
        required_steps = (
            set(plan.required_step_ids)
            - set(preflight.optional_step_ids)
            - job_completed_steps
        )
        return not set(required_steps) - set(s.id for s in steps)

    def validate(self, data):
        most_recent_preflight = PreflightResult.objects.most_recent(
            user=data["user"],
            plan=data["plan"],
        )
        if not self._has_valid_preflight(most_recent_preflight):
            raise serializers.ValidationError("No valid preflight.")
        has_valid_steps = self._has_valid_steps(
            user=data["user"],
            plan=data["plan"],
            steps=data["steps"],
            preflight=most_recent_preflight,
        )
        if not has_valid_steps:
            raise serializers.ValidationError("Invalid steps for plan.")
        data["org_name"] = data["user"].org_name
        data["org_type"] = data["user"].org_type
        data["organization_url"] = data["user"].instance_url
        return data


class PreflightResultSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault(),
    )
    plan = IdOnlyField(read_only=True)
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
            'created_at': {'read_only': True},
            'is_valid': {'read_only': True},
            'status': {'read_only': True},
            'results': {'read_only': True},
        }
