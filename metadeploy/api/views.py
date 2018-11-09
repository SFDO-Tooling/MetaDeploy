from django.db.models import Q

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
    PreflightResultSerializer,
)
from .models import (
    Job,
    Product,
    Version,
    Plan,
    PreflightResult,
)
from .jobs import preflight_job


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    permission_classes = (permissions.IsAuthenticated,)
    filter_backends = (
        DjangoFilterBackend,
    )
    filterset_fields = (
        'plan',
        'user',
    )

    def get_queryset(self):
        if self.request.user.is_staff:
            return Job.objects.all()
        return Job.objects.filter(
            Q(is_public=True) | Q(user=self.request.user),
        )


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

    def preflight_get(self, request):
        plan = self.get_object()
        preflight = PreflightResult.objects.most_recent(
            user=request.user,
            plan=plan,
            is_valid_and_complete=False,
        )
        if preflight is None:
            return Response('', status=status.HTTP_404_NOT_FOUND)
        serializer = PreflightResultSerializer(instance=preflight)
        return Response(serializer.data)

    def preflight_post(self, request):
        plan = self.get_object()
        preflight_job.delay(request.user, plan)
        return Response('', status=status.HTTP_202_ACCEPTED)

    @action(detail=True, methods=['post', 'get'])
    def preflight(self, request, pk=None):
        if request.method == 'GET':
            return self.preflight_get(request)
        if request.method == 'POST':
            return self.preflight_post(request)
