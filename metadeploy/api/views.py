from django.db.models import Count

from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import (
    permissions,
    viewsets,
)

from .serializers import (
    JobSerializer,
    ProductSerializer,
    VersionSerializer,
)
from .models import (
    Job,
    Product,
    Version,
)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.annotate(
        version__count=Count('version'),
    ).filter(version__count__gte=1)


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    queryset = Job.objects.all()
    permission_classes = (permissions.IsAuthenticated,)


class VersionViewSet(viewsets.ModelViewSet):
    serializer_class = VersionSerializer
    queryset = Version.objects.all()
    filter_backends = (
        DjangoFilterBackend,
    )
    filterset_fields = (
        'product',
    )
