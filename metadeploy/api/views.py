from functools import reduce
from logging import getLogger

import django_rq
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import exceptions
from django.core.cache import cache
from django.db.models import Q
from django.http import Http404, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics, mixins, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from .constants import REDIS_JOB_CANCEL_KEY
from .filters import PlanFilter, ProductFilter, VersionFilter
from .jobs import preflight_job
from .models import (
    SUPPORTED_ORG_TYPES,
    Job,
    Plan,
    PreflightResult,
    Product,
    ProductCategory,
    ScratchOrg,
    Version,
)
from .paginators import ProductPaginator
from .permissions import HasOrgOrReadOnly
from .serializers import (
    FullUserSerializer,
    JobSerializer,
    OrgSerializer,
    PlanSerializer,
    PreflightResultSerializer,
    ProductCategorySerializer,
    ProductSerializer,
    ScratchOrgSerializer,
    VersionSerializer,
)

logger = getLogger(__name__)

User = get_user_model()


def combine_filters(filters=[]):
    return reduce(lambda a, b: a | b, (f for f in filters if f))


class InvalidFields(Exception):
    pass


class FilterAllowedByOrgMixin:
    def omit_allowed_by_org(self, qs):
        if self.request.user.is_authenticated:
            qs = qs.exclude(
                visible_to__isnull=False,
                visible_to__org_type__contains=[self.request.user.full_org_type],
                visible_to__list_for_allowed_by_orgs=False,
            )
        return qs


class GetOneMixin:
    @action(detail=False, methods=["get"])
    def get_one(self, request, *args, **kwargs):
        """
        This takes a set of filters and returns a single entry if
        there's one entry that results from their application, and a 404
        otherwise.
        """
        not_one_result = (
            exceptions.MultipleObjectsReturned,
            exceptions.ObjectDoesNotExist,
            InvalidFields,
        )
        # We want to include more items than the list view includes:
        filter = self.filterset_class(request.GET, queryset=self.model.objects.all())
        try:
            if filter.required_fields != request.GET.keys():
                raise InvalidFields
            qs = self.filter_get_one(filter.qs)
            result = qs.get()
            serializer = self.get_serializer(result)
            return Response(serializer.data)
        except not_one_result:
            return Response("", status=status.HTTP_404_NOT_FOUND)

    def filter_get_one(self, qs):
        """Hook for viewsets using this mixin to apply additional filtering."""
        return qs


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
        "plan__plan_template__planslug__slug",
        "plan__version__label",
        "plan__version__product__productslug__slug",
    )
    permission_classes = (HasOrgOrReadOnly,)

    def get_queryset(self):
        user = self.request.user
        if user.is_staff:
            return Job.objects.all()

        scratch_org = ScratchOrg.objects.get_from_session(self.request.session)
        filters = combine_filters(
            [
                Q(is_public=True),
                Q(user=user) if user.is_authenticated else None,
                Q(org_id=scratch_org.org_id) if scratch_org else None,
            ]
        )

        return Job.objects.filter(filters)

    def perform_destroy(self, instance):
        cache.set(REDIS_JOB_CANCEL_KEY.format(id=instance.id), True)


class ProductCategoryViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = ProductCategorySerializer
    queryset = ProductCategory.objects.all()


class ProductViewSet(
    FilterAllowedByOrgMixin, GetOneMixin, viewsets.ReadOnlyModelViewSet
):
    serializer_class = ProductSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_class = ProductFilter
    pagination_class = ProductPaginator
    model = Product

    def get_queryset(self):
        return self.omit_allowed_by_org(
            Product.objects.published().exclude(is_listed=False)
        )


class VersionViewSet(GetOneMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = VersionSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_class = VersionFilter
    model = Version

    def get_queryset(self):
        return Version.objects.exclude(is_listed=False)

    @action(detail=True, methods=["get"])
    def additional_plans(self, request, pk=None):
        version = self.get_object()
        serializer = PlanSerializer(
            version.additional_plans, many=True, context={"request": request}
        )
        return Response(serializer.data)


class PlanViewSet(FilterAllowedByOrgMixin, GetOneMixin, viewsets.ReadOnlyModelViewSet):
    serializer_class = PlanSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_class = PlanFilter
    model = Plan

    def get_queryset(self):
        plans = Plan.objects.exclude(is_listed=False)
        return self.omit_allowed_by_org(plans)

    def filter_get_one(self, qs):
        # Make sure get_one only finds the most recent plan for each plan_template
        return qs.order_by("plan_template_id", "-created_at").distinct(
            "plan_template_id"
        )

    def preflight_get(self, request):
        plan = get_object_or_404(Plan.objects, id=self.kwargs["pk"])
        scratch_org = ScratchOrg.objects.get_from_session(request.session)

        if scratch_org:
            org_id = scratch_org.org_id
        elif request.user.is_authenticated:
            org_id = request.user.org_id
        else:
            return Response("", status=status.HTTP_404_NOT_FOUND)

        preflight = PreflightResult.objects.most_recent(
            org_id=org_id,
            plan=plan,
            is_valid_and_complete=False,
        )
        if preflight is None:
            return Response("", status=status.HTTP_404_NOT_FOUND)
        serializer = PreflightResultSerializer(instance=preflight)
        return Response(serializer.data)

    def preflight_post(self, request):
        plan = get_object_or_404(Plan.objects, id=self.kwargs["pk"])
        scratch_org = ScratchOrg.objects.filter(
            plan=plan, status=ScratchOrg.Status.complete
        ).get_from_session(request.session)
        is_visible_to = plan.is_visible_to(
            request.user
        ) and plan.version.product.is_visible_to(request.user)
        if not (is_visible_to or scratch_org):
            return Response("", status=status.HTTP_403_FORBIDDEN)

        kwargs = None
        if scratch_org:
            kwargs = {
                "org_id": scratch_org.org_id,
            }

        if request.user.is_authenticated:
            kwargs = {
                "user": request.user,
                "org_id": request.user.org_id,
            }

        if not kwargs:
            return Response("", status=status.HTTP_403_FORBIDDEN)

        preflight_result = PreflightResult.objects.create(
            plan=plan,
            **kwargs,
        )
        preflight_job.delay(preflight_result.pk)
        serializer = PreflightResultSerializer(instance=preflight_result)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post", "get"], permission_classes=(AllowAny,))
    def preflight(self, request, pk=None):
        if request.method == "GET":
            return self.preflight_get(request)
        if request.method == "POST":
            return self.preflight_post(request)

    def scratch_org_get(self, request):
        plan = get_object_or_404(Plan.objects, id=self.kwargs["pk"])
        scratch_org = ScratchOrg.objects.filter(plan=plan).get_from_session(
            request.session
        )
        if not scratch_org:
            return Response("", status=status.HTTP_404_NOT_FOUND)
        serializer = ScratchOrgSerializer(instance=scratch_org)
        return Response(serializer.data)

    def scratch_org_post(self, request, pk=None):
        devhub_enabled = settings.DEVHUB_USERNAME
        if not devhub_enabled:
            return Response(status=status.HTTP_501_NOT_IMPLEMENTED)

        plan = self.get_object()
        valid_plan_type = (
            plan.supported_orgs == SUPPORTED_ORG_TYPES.Scratch
            or plan.supported_orgs == SUPPORTED_ORG_TYPES.Both
        )
        if not valid_plan_type:
            return Response(
                {"detail": "This plan does not support creating a scratch org."},
                status=status.HTTP_409_CONFLICT,
            )

        new_data = request.data.copy()
        new_data["plan"] = str(plan.pk)
        serializer = ScratchOrgSerializer(data=new_data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        # Check queue status
        # If overfull, return 503
        queue = django_rq.get_queue("default")
        if len(queue) > settings.MAX_QUEUE_LENGTH:
            return Response(
                {"detail": "Queue is overfull. Try again later."},
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )

        scratch_org = serializer.save()
        request.session["scratch_org_id"] = str(scratch_org.uuid)

        serializer = ScratchOrgSerializer(instance=scratch_org)
        return Response(
            serializer.data,
            status=status.HTTP_202_ACCEPTED,
        )

    @action(detail=True, methods=["post", "get"], permission_classes=(AllowAny,))
    def scratch_org(self, request, pk=None):
        if request.method == "GET":
            return self.scratch_org_get(request)
        if request.method == "POST":
            return self.scratch_org_post(request)


class OrgViewSet(viewsets.ViewSet):
    permission_classes = (AllowAny,)

    @staticmethod
    def _prepare_org_serialization(org_id):
        current_job = Job.objects.filter(
            org_id=org_id, status=Job.Status.started
        ).first()
        current_preflight = PreflightResult.objects.filter(
            org_id=org_id, status=PreflightResult.Status.started
        ).first()
        return OrgSerializer(
            {
                "org_id": org_id,
                "current_job": current_job,
                "current_preflight": current_preflight,
            }
        ).data

    def list(self, request):
        """
        This will return data on the user's current org(s). It is not a
        list endpoint, but does not take a pk, so we have to implement
        it this way.
        """
        response = {}

        scratch_org = ScratchOrg.objects.get_from_session(request.session)
        if scratch_org:
            org_id = scratch_org.org_id
            response[org_id] = self._prepare_org_serialization(org_id)

        if request.user.is_authenticated:
            org_id = request.user.org_id
            response[org_id] = self._prepare_org_serialization(org_id)

        return Response(response)


class ScratchOrgViewSet(viewsets.GenericViewSet):
    permission_classes = (AllowAny,)
    serializer_class = ScratchOrgSerializer

    @action(detail=True, methods=["GET"])
    def redirect(self, request, pk=None):
        scratch_org = ScratchOrg.objects.filter(
            status=ScratchOrg.Status.complete
        ).get_from_session(request.session)
        if not scratch_org:
            raise Http404
        url = scratch_org.get_login_url()
        return HttpResponseRedirect(redirect_to=url)
