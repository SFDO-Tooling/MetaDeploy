from rest_framework import viewsets

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
    queryset = Product.objects.all()


class VersionViewSet(viewsets.ModelViewSet):
    serializer_class = VersionSerializer
    queryset = Version.objects.all()
