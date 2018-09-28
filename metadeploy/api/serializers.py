from rest_framework import serializers

from .models import (
    Product,
    Job,
    Version,
    Plan,
    Step,
)

from django.contrib.auth import get_user_model


User = get_user_model()


class FullUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'username',
            'email',
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


class InstanceUrl:
    def set_context(self, serializer_field):
        self.url = serializer_field.context['request'].user.instance_url

    def __call__(self):
        return self.url


class JobSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault(),
    )
    instance_url = serializers.HiddenField(
        default=InstanceUrl(),
    )
    plan = serializers.PrimaryKeyRelatedField(
        queryset=Plan.objects.all(),
    )
    steps = serializers.PrimaryKeyRelatedField(
        queryset=Step.objects.all(),
        many=True,
    )

    def create(self, validated_data):
        plan = validated_data.pop('plan')
        repo_url = f'{plan.version.product.repo_url}#{plan.version.commit_ish}'
        validated_data['repo_url'] = repo_url
        flow_names = [step.flow_name for step in validated_data.pop('steps')]
        validated_data['flow_names'] = flow_names
        return super().create(validated_data)

    class Meta:
        model = Job
        fields = (
            'user',
            'instance_url',
            'repo_url',
            'steps',
            'flow_names',
            'plan',
        )
        extra_kwargs = {
            'repo_url': {
                'read_only': True,
            },
            'flow_names': {
                'read_only': True,
            },
        }
