from rest_framework import serializers

from .models import (
    Product,
    Version,
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


class VersionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Version
        fields = (
            'id',
            'product',
            'label',
            'description',
            'created_at',
        )


class ProductSerializer(serializers.ModelSerializer):
    category = serializers.CharField(source='get_category_display')
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
            'most_recent_version',
        )
