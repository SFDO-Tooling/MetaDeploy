from rest_framework import (
    permissions,
    viewsets,
)

from .serializers import (
    JobSerializer,
    ProductSerializer,
)
from .models import (
    Job,
    Product,
)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.all()


class JobViewSet(viewsets.ModelViewSet):
    serializers_class = JobSerializer
    queryset = Job.objects.all()
    permission_classes = (permissions.IsAuthenticated,)
