from django.core.cache import cache
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response

from .constants import REDIS_JOB_CANCEL_KEY
from .jobs import preflight_job
from .models import Job, Plan, PreflightResult, Product, Version
from .permissions import OnlyOwnerCanDelete
from .serializers import (
    JobSerializer,
    PlanSerializer,
    PreflightResultSerializer,
    ProductSerializer,
    VersionSerializer,
)


class JobViewSet(viewsets.ModelViewSet):
    serializer_class = JobSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("plan", "user", "status", "organization_url")
    permission_classes = (OnlyOwnerCanDelete,)

    def get_queryset(self):
        if self.request.user.is_staff:
            return Job.objects.all()
        if self.request.user.is_anonymous:
            filters = Q(is_public=True)
        else:
            filters = Q(is_public=True) | Q(user=self.request.user)
        return Job.objects.filter(filters)

    def perform_destroy(self, instance):
        cache.set(REDIS_JOB_CANCEL_KEY.format(id=instance.id), True)


class ProductViewSet(viewsets.ModelViewSet):
    serializer_class = ProductSerializer
    queryset = Product.objects.published()


class VersionViewSet(viewsets.ModelViewSet):
    serializer_class = VersionSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = ("product", "label")
    queryset = Version.objects.all()


class PlanViewSet(viewsets.ModelViewSet):
    serializer_class = PlanSerializer
    queryset = Plan.objects.all()

    def preflight_get(self, request):
        plan = self.get_object()
        preflight = PreflightResult.objects.most_recent(
            user=request.user, plan=plan, is_valid_and_complete=False
        )
        if preflight is None:
            return Response("", status=status.HTTP_404_NOT_FOUND)
        serializer = PreflightResultSerializer(instance=preflight)
        return Response(serializer.data)

    def preflight_post(self, request):
        plan = self.get_object()
        is_visible_to = plan.is_visible_to(
            request.user
        ) and plan.version.product.is_visible_to(request.user)
        if not is_visible_to:
            return Response("", status=status.HTTP_403_FORBIDDEN)
        preflight_result = PreflightResult.objects.create(
            user=request.user, plan=plan, organization_url=request.user.instance_url
        )
        preflight_job.delay(preflight_result.pk)
        serializer = PreflightResultSerializer(instance=preflight_result)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post", "get"])
    def preflight(self, request, pk=None):
        if request.method == "GET":
            return self.preflight_get(request)
        if request.method == "POST":
            return self.preflight_post(request)
