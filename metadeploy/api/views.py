from django.db.models import Count

from rest_framework import viewsets
from django_filters.rest_framework import DjangoFilterBackend

from .serializers import (
    ProductSerializer,
    VersionSerializer,
)
from .models import (
    Product,
    Version,
)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.annotate(
        version__count=Count('version'),
    ).filter(version__count__gte=1)


class VersionViewSet(viewsets.ModelViewSet):
    serializer_class = VersionSerializer
    queryset = Version.objects.all()
    filter_backends = (
        DjangoFilterBackend,
    )
    filterset_fields = (
        'product',
    )
