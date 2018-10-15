from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import (
    permissions,
    viewsets,
    status,
)
from rest_framework.decorators import action
from rest_framework.response import Response

from .serializers import (
    JobSerializer,
    ProductSerializer,
    VersionSerializer,
    PlanSerializer,
)
from .models import (
    Job,
    Product,
    Version,
    Plan,
)
from .jobs import preflight_job


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    queryset = Job.objects.all()
    permission_classes = (permissions.IsAuthenticated,)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.published()


class VersionViewSet(viewsets.ModelViewSet):
    serializer_class = VersionSerializer
    queryset = Version.objects.all()
    filter_backends = (
        DjangoFilterBackend,
    )
    filterset_fields = (
        'product',
        'label',
    )


class PlanViewSet(viewsets.ModelViewSet):
    serializer_class = PlanSerializer
    queryset = Plan.objects.all()

    @action(detail=True, methods=['post'])
    def preflight(self, request, pk=None):
        plan = self.get_object()
        preflight_job.delay(
            request.user,
            plan,
        )
        return Response('', status=status.HTTP_202_ACCEPTED)
