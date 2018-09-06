from rest_framework import serializers

from .models import (
    Product,
    Job,
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


class ProductSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='get_category_display')

    class Meta:
        model = Product
        fields = (
            'id',
            'title',
            'description',
            'version',
            'category',
            'color',
            'icon',
        )


class JobSerializer(serializers.ModelSerializer):
    user = serializers.HiddenField(
        default=serializers.CurrentUserDefault()
    )

    class Meta:
        model = Job
        fields = (
            'token',
            'user',
            'instance_url',
            'package_url',
            'flow_name',
        )


class TriggerInstallSerializer(serializers.Serializer):
    instance_url = serializers.URLField()
    package_url = serializers.URLField()
    flow_name = serializers.CharField()
