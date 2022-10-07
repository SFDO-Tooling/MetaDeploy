from functools import reduce
from logging import getLogger

import django_rq
from django.contrib.auth.models import AnonymousUser
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core import exceptions
from django.core.cache import cache
from django.db.models import Q
from django.http import Http404, HttpResponseRedirect
from django.shortcuts import get_object_or_404
from django_filters.rest_framework import DjangoFilterBackend
from drf_spectacular.utils import extend_schema
from rest_framework import generics, mixins, status, viewsets
import rest_framework.exceptions as drf_exceptions
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authentication import SessionAuthentication

from metadeploy.api.constants import REDIS_JOB_CANCEL_KEY
from metadeploy.api.filters import PlanFilter, ProductFilter, VersionFilter
from metadeploy.api.jobs import preflight_job
from metadeploy.api.models import (
    SUPPORTED_ORG_TYPES,
    Job,
    Plan,
    PreflightResult,
    Product,
    ProductCategory,
    ScratchOrg,
    Token,
    Version,
)
from metadeploy.api.paginators import ProductPaginator
from metadeploy.api.permissions import HasOrgOrReadOnly
from metadeploy.api.serializers import (
    FullUserSerializer,
    JobSerializer,
    OrgSerializer,
    PlanSerializer,
    PreflightResultSerializer,
    ProductCategorySerializer,
    ProductSerializer,
    ScratchOrgSerializer,
    UserInfoSerializer,
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
    """
    This is a degenerate endpoint that just shows some details of the current user.
    """

    model = User
    serializer_class = FullUserSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


class UserInfoView(generics.GenericAPIView):
    """
    If authenticated, returns the current user's username.
    """

    serializer_class = UserInfoSerializer
    permission_classes = ()

    def get(self, request):
        # check to see if user is logged in
        if isinstance(request.user, AnonymousUser):
            raise drf_exceptions.NotAuthenticated(
                detail="Please login to view information about your user."
            )
        return Response({"username": request.user.username})


class ResetTokenView(APIView):
    permission_classes = [IsAuthenticated]
    authentication_classes = [SessionAuthentication]
    serializer_class = None

    def get(self, request, *args, **kwargs):
        """
        Allow users to get a new token if one already exists.
        """

        try:
            token = Token.objects.get(user=request.user)
        except Token.DoesNotExist:
            return Response(
                "Unable to reset token: a token does not exist.",
                status=status.HTTP_403_FORBIDDEN,
            )

        # reset token
        token.delete()
        token = Token.objects.create(user=request.user)

        return Response({"token": token.key})


class JobViewSet(
    mixins.CreateModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    mixins.DestroyModelMixin,
    viewsets.GenericViewSet,
):
    """
    This is a constrained endpoint. You cannot list or meaningfully update.
    """

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

    # Used by drf-spectacular to infer path parameter types
    queryset = Job.objects.none()

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
    """
    A `Category` is an organizing principle associated with `Products`.
    """

    serializer_class = ProductCategorySerializer

    def get_queryset(self):
        # Usually we would simply define `queryset = ProductCategory.objects.all()`
        # directly on the class, but that would "freeze" the queryset on the instances
        # that belong to the Site that is active during class definition. By using a
        # method instead we make sure site-filtering is applied correctly on each
        # request.
        return ProductCategory.objects.all()


class ProductViewSet(
    FilterAllowedByOrgMixin, GetOneMixin, viewsets.ReadOnlyModelViewSet
):
    """
    A `Product` is a set of `Versions` of metadata for your Salesforce org.
    """

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
    """
    A `Version` is a specific iteration of a `Product`.
    """

    serializer_class = VersionSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_class = VersionFilter
    model = Version

    def get_queryset(self):
        return Version.objects.exclude(is_listed=False)

    @extend_schema(request=None, responses={200: PlanSerializer(many=True)})
    @action(detail=True, methods=["get"])
    def additional_plans(self, request, pk=None):
        version = self.get_object()
        serializer = PlanSerializer(
            version.additional_plans, many=True, context={"request": request}
        )
        return Response(serializer.data)


class PlanViewSet(FilterAllowedByOrgMixin, GetOneMixin, viewsets.ReadOnlyModelViewSet):
    """
    A `Version` has many `Plans`, which detail the concrete steps to go through to apply
    metadata to an org. Put another way, a `Plan` is like a particular set of options
    for the `Version`.
    """

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

    @extend_schema(methods=["get"], responses={200: PreflightResultSerializer})
    @extend_schema(
        methods=["post"], request=None, responses={201: PreflightResultSerializer}
    )
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

    @extend_schema(methods=["get"], responses={200: ScratchOrgSerializer})
    @extend_schema(
        methods=["post"],
        request=ScratchOrgSerializer,
        responses={202: ScratchOrgSerializer},
    )
    @action(detail=True, methods=["post", "get"], permission_classes=(AllowAny,))
    def scratch_org(self, request, pk=None):
        if request.method == "GET":
            return self.scratch_org_get(request)
        if request.method == "POST":
            return self.scratch_org_post(request)


class OrgViewSet(generics.RetrieveAPIView):
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

    @extend_schema(
        responses={200: {"type": "object", "additionalProperties": {"type": "object"}}}
    )
    def get(self, request):
        """
        This will return data on the user's current org(s).
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

    # Used by drf-spectacular to infer path parameter types
    queryset = ScratchOrg.objects.none()

    @extend_schema(request=None, responses={302: None})
    @action(detail=True, methods=["GET"])
    def redirect(self, request, pk=None):
        scratch_org = ScratchOrg.objects.filter(
            status=ScratchOrg.Status.complete
        ).get_from_session(request.session)
        if not scratch_org:
            raise Http404
        url = scratch_org.get_login_url()
        return HttpResponseRedirect(redirect_to=url)
