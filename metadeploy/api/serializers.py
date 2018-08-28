from rest_framework import serializers

from .models import Product

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
        )
