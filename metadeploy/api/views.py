from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.db.models import Q
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from .constants import REDIS_JOB_CANCEL_KEY
from .jobs import preflight_job
from .models import Job, Plan, PreflightResult, Product, Version
from .permissions import OnlyOwnerOrSuperuserCanDelete
from .serializers import (
    FullUserSerializer,
    JobSerializer,
    OrgSerializer,
    PlanSerializer,
    PreflightResultSerializer,
    ProductSerializer,
    VersionSerializer,
)

User = get_user_model()


class UserView(generics.RetrieveAPIView):
    model = User
    serializer_class = FullUserSerializer
    permission_classes = (IsAuthenticated,)

    def get_queryset(self):
        return self.model.objects.filter(id=self.request.user.id)

    def get_object(self):
        return self.get_queryset().get()


class JobViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    serializer_class = JobSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_fields = (
        "plan_id",
        "user_id",
        "status",
        "organization_url",
        "plan__plan_template__planslug__slug",
        "plan__version__label",
        "plan__version__product__productslug__slug",
    )
    permission_classes = (OnlyOwnerOrSuperuserCanDelete,)

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

    @action(detail=True, methods=["get"])
    def additional_plans(self, request, pk=None):
        version = self.get_object()
        serializer = PlanSerializer(
            version.additional_plans, many=True, context={"request": request}
        )
        return Response(serializer.data)


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
        # @@@ temporary hack to avoid actually running preflight
        # until we sort out how it is modeled
        if plan.preflight_flow_name:
            preflight_result = PreflightResult.objects.create(
                user=request.user, plan=plan, organization_url=request.user.instance_url
            )
            preflight_job.delay(preflight_result.pk)
        else:  # pragma: no cover
            preflight_result = PreflightResult.objects.create(
                user=request.user,
                plan=plan,
                organization_url=request.user.instance_url,
                status=PreflightResult.Status.complete,
            )
        serializer = PreflightResultSerializer(instance=preflight_result)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post", "get"])
    def preflight(self, request, pk=None):
        if request.method == "GET":
            return self.preflight_get(request)
        if request.method == "POST":
            return self.preflight_post(request)


class OrgViewSet(viewsets.ViewSet):
    def list(self, request):
        """
        This will return data on the user's current org. It is not a
        list endpoint, but does not take a pk, so we have to implement
        it this way.
        """
        current_job = Job.objects.filter(
            organization_url=request.user.instance_url, status=Job.Status.started
        ).first()
        current_preflight = PreflightResult.objects.filter(
            organization_url=request.user.instance_url,
            status=PreflightResult.Status.started,
        ).first()
        serializer = OrgSerializer(
            {"current_job": current_job, "current_preflight": current_preflight}
        )
        return Response(serializer.data)
