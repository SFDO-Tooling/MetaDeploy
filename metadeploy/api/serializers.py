from collections import OrderedDict
from typing import Optional

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils.translation import gettext_lazy as _
from drf_spectacular.extensions import OpenApiSerializerFieldExtension
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from rest_framework.fields import SkipField
from rest_framework.relations import PKOnlyObject
from rest_framework.utils.urls import replace_query_param

from .constants import ERROR, HIDE, WARN
from .models import (
    ORG_TYPES,
    SUPPORTED_ORG_TYPES,
    Job,
    Plan,
    PreflightResult,
    Product,
    ProductCategory,
    ScratchOrg,
    SiteProfile,
    Step,
    Version,
)
from .paginators import ProductPaginator

User = get_user_model()

hash_id_openapi_schema = {"type": "string", "format": "HashID"}


def get_from_data_or_instance(instance, data, name, default=None):
    value = data.get(name, getattr(instance, name, default))
    # Handle the case where value is a *RelatedManager:
    if hasattr(value, "all") and callable(value.all):
        return value.all()
    return value


class HashIdFix(OpenApiSerializerFieldExtension):
    # Fix drf_spectacular warnings about not knowing the return type of HashId fields
    target_class = "hashid_field.rest.UnconfiguredHashidSerialField"

    def map_serializer_field(self, auto_schema, direction):  # pragma: nocover
        return hash_id_openapi_schema


class HashIdModelSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)


class StringListField(serializers.ListField):
    child = serializers.CharField()


@extend_schema_field({"type": "object", "example": {"Lw7K5wK": [{"status": "ok"}]}})
class StepResultsField(serializers.JSONField):
    """
    Each key is a Step ID and the value is an array of results for that Step
    """


@extend_schema_field(hash_id_openapi_schema)
class IdOnlyField(serializers.Field):
    def __init__(self, *args, model=None, **kwargs):
        self.model = model
        return super().__init__(*args, **kwargs)

    def to_representation(self, value):
        return str(value.id)

    def to_internal_value(self, data):
        return self.model.objects.get(pk=data)


class ErrorWarningCountMixin:
    @staticmethod
    def _count_status_in_results(results, status_name):
        count = 0
        for results_list in results.values():
            for result in results_list:
                try:
                    if result["status"] == status_name:
                        count += 1
                except TypeError:
                    pass
        return count

    def get_error_count(self, obj) -> int:
        if obj.status == self.Meta.model.Status.started:
            return 0
        return self._count_status_in_results(obj.results, ERROR)

    def get_warning_count(self, obj) -> int:
        if obj.status == self.Meta.model.Status.started:
            return 0
        return self._count_status_in_results(obj.results, WARN)


class CircumspectSerializerMixin:
    def circumspect_visible(self, obj, user):  # pragma: nocover
        raise NotImplementedError("Subclasses must implement circumspect_visible")

    def to_representation(self, instance):
        """
        Object instance -> Dict of primitive datatypes.

        Inlined from rest_framework.serializers
        """
        ret = OrderedDict()
        fields = self._readable_fields

        for field in fields:
            try:
                attribute = field.get_attribute(instance)
                should_be_circumspect = (
                    field.field_name in self.Meta.circumspect_fields
                    and not self.circumspect_visible(
                        instance, self.context["request"].user
                    )
                )
                if should_be_circumspect:
                    attribute = None
            except SkipField:  # pragma: nocover
                continue

            # We skip `to_representation` for `None` values so that fields do
            # not have to explicitly deal with that case.
            #
            # For related fields with `use_pk_only_optimization` we need to
            # resolve the pk value.
            check_for_none = (
                attribute.pk if isinstance(attribute, PKOnlyObject) else attribute
            )
            if check_for_none is None:
                ret[field.field_name] = None
            else:
                ret[field.field_name] = field.to_representation(attribute)

        return ret


class FullUserSerializer(HashIdModelSerializer):
    is_production_org = serializers.SerializerMethodField()
    username = serializers.CharField(source="sf_username")

    class Meta:
        model = User
        fields = (
            "id",
            "username",
            "email",
            "valid_token_for",
            "org_name",
            "org_type",
            "is_production_org",
            "is_staff",
        )

    def get_is_production_org(self, obj) -> bool:
        return obj.full_org_type == ORG_TYPES.Production


class LimitedUserSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source="sf_username")

    class Meta:
        model = User
        fields = ("username", "is_staff")


class UserInfoSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=256)


class StepSerializer(HashIdModelSerializer):
    kind = serializers.CharField(source="get_kind_display")
    name = serializers.CharField()
    description = serializers.CharField()

    class Meta:
        model = Step
        fields = (
            "id",
            "name",
            "description",
            "is_required",
            "is_recommended",
            "kind",
            "kind_icon",
        )


class PlanSerializer(CircumspectSerializerMixin, HashIdModelSerializer):
    slug = serializers.CharField(read_only=True)
    old_slugs = StringListField(read_only=True)
    version = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )
    is_allowed = serializers.SerializerMethodField()
    steps = StepSerializer(many=True, required=False)
    title = serializers.CharField()
    preflight_message = serializers.SerializerMethodField()
    not_allowed_instructions = serializers.SerializerMethodField()
    requires_preflight = serializers.BooleanField(read_only=True)
    # Prefer the already calculated value instead of the expensive `Plan.average_duration`
    average_duration = serializers.IntegerField(
        source="calculated_average_duration", read_only=True
    )

    class Meta:
        model = Plan
        fields = (
            "id",
            "title",
            "version",
            "preflight_message",
            "tier",
            "slug",
            "old_slugs",
            "order_key",
            "steps",
            "is_allowed",
            "is_listed",
            "not_allowed_instructions",
            "average_duration",
            "requires_preflight",
            "supported_orgs",
            "scratch_org_duration",
        )
        circumspect_fields = ("steps", "preflight_message")

    def get_preflight_message(self, obj) -> str:
        return (
            getattr(obj.plan_template, "preflight_message_markdown", "")
            + obj.preflight_message_additional_markdown
        )

    def circumspect_visible(self, obj, user):
        return obj.is_visible_to(user) and obj.version.product.is_visible_to(user)

    def get_is_allowed(self, obj) -> bool:
        return obj.is_visible_to(self.context["request"].user)

    def get_not_allowed_instructions(self, obj) -> str:
        if not obj.version.product.is_visible_to(self.context["request"].user):
            return getattr(obj.version.product.visible_to, "description_markdown", None)
        return getattr(obj.visible_to, "description_markdown", None)

    def validate(self, data):
        """
        Check that restricted plans only support persistent orgs.
        """
        visible_to = get_from_data_or_instance(self.instance, data, "visible_to")
        supported_orgs = get_from_data_or_instance(
            self.instance,
            data,
            "supported_orgs",
            default=SUPPORTED_ORG_TYPES.Persistent,
        )
        if visible_to and supported_orgs != SUPPORTED_ORG_TYPES.Persistent:
            raise serializers.ValidationError(
                {
                    "supported_orgs": _(
                        'Restricted plans (with a "visible to" AllowedList) can only support persistent org types.'
                    )
                }
            )
        return data


class VersionSerializer(HashIdModelSerializer):
    product = serializers.PrimaryKeyRelatedField(
        read_only=True, pk_field=serializers.CharField()
    )
    primary_plan = PlanSerializer()
    secondary_plan = PlanSerializer()
    description = serializers.CharField()

    class Meta:
        model = Version
        fields = (
            "id",
            "product",
            "label",
            "description",
            "created_at",
            "primary_plan",
            "secondary_plan",
            "is_listed",
        )


class ProductCategorySerializer(serializers.ModelSerializer):
    description = serializers.CharField(source="description_markdown")
    first_page = serializers.SerializerMethodField()

    # Parler fields require explicit typing to generate the API schema
    title = serializers.CharField()

    class Meta:
        model = ProductCategory
        fields = ("id", "title", "description", "is_listed", "first_page")

    def get_next_link(self, paginator, category_id):
        if not paginator.page.has_next():
            return None
        path = reverse("product-list")
        page_number = paginator.page.next_page_number()
        url = paginator.request.build_absolute_uri(path)
        url = replace_query_param(url, "category", category_id)
        return replace_query_param(url, paginator.page_query_param, page_number)

    def get_previous_link(self, paginator, category_id):
        """
        We expect this to always be None, because we know we're returning the first
        page.
        """
        return None

    @extend_schema_field(
        {
            "properties": {
                "count": {"type": "number", "format": "int"},
                "next": {"type": "string", "format": "uri"},
                "previous": {"type": "string", "format": "uri"},
                "results": {
                    "type": "array",
                    "items": {"$ref": "#/components/schemas/Product"},
                },
            }
        }
    )
    def get_first_page(self, obj):
        paginator = ProductPaginator()
        qs = self._get_product_qs(obj)
        page = paginator.paginate_queryset(qs, self.context["request"])
        return {
            "count": paginator.page.paginator.count,
            "next": self.get_next_link(paginator, str(obj.id)),
            "previous": self.get_previous_link(paginator, str(obj.id)),
            "results": ProductSerializer(page, many=True, context=self.context).data,
        }

    def _get_product_qs(self, obj):
        user = self.context["request"].user
        qs = obj.product_set.published().exclude(is_listed=False)
        if user.is_authenticated:
            qs = qs.exclude(
                visible_to__isnull=False,
                visible_to__org_type__contains=[user.full_org_type],
                visible_to__list_for_allowed_by_orgs=False,
            )
        return qs


class ProductSerializer(CircumspectSerializerMixin, HashIdModelSerializer):
    slug = serializers.CharField(read_only=True)
    old_slugs = StringListField(read_only=True)
    category = serializers.CharField(source="category.title")
    most_recent_version = VersionSerializer()
    is_allowed = serializers.SerializerMethodField()
    description = serializers.CharField(source="description_markdown")
    click_through_agreement = serializers.CharField(
        source="click_through_agreement_markdown"
    )
    title = serializers.CharField()
    tags = StringListField()
    short_description = serializers.CharField()
    not_allowed_instructions = serializers.SerializerMethodField()
    is_listed = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = (
            "id",
            "title",
            "tags",
            "description",
            "short_description",
            "click_through_agreement",
            "category",
            "color",
            "icon",
            "image",
            "most_recent_version",
            "slug",
            "old_slugs",
            "is_allowed",
            "is_listed",
            "order_key",
            "not_allowed_instructions",
            "layout",
        )
        circumspect_fields = ("description",)

    def circumspect_visible(self, obj, user):
        return obj.is_visible_to(user)

    def get_is_allowed(self, obj) -> bool:
        return obj.is_visible_to(self.context["request"].user)

    def get_is_listed(self, obj) -> bool:
        return obj.is_listed and not obj.is_listed_by_org_only(
            self.context["request"].user
        )

    def get_not_allowed_instructions(self, obj) -> Optional[str]:
        return getattr(obj.visible_to, "description_markdown", None)


class JobSerializer(ErrorWarningCountMixin, HashIdModelSerializer):
    user = serializers.HiddenField(default=serializers.CurrentUserDefault())
    org_name = serializers.SerializerMethodField()
    instance_url = serializers.SerializerMethodField()
    org_id = serializers.SerializerMethodField()
    is_production_org = serializers.SerializerMethodField()
    product_slug = serializers.CharField(
        source="plan.version.product.slug", read_only=True
    )
    version_label = serializers.CharField(source="plan.version.label", read_only=True)
    version_is_most_recent = serializers.SerializerMethodField()
    plan_slug = serializers.CharField(source="plan.slug", read_only=True)
    results = StepResultsField(required=False)

    # Why `objects` instead of `objects.all()`? The call to `.all()` seems to "freeze"
    # the resulting queryset when this file is imported. At that point it returns the
    # objects from the default Site, which means validation fails later when the
    # serializer is executed on other Site instances. Leaving out `.all()` makes DRF
    # always re-run the queryset to get fresh objects for each Site.
    plan = serializers.PrimaryKeyRelatedField(
        queryset=Plan.objects, pk_field=serializers.CharField()
    )
    steps = serializers.PrimaryKeyRelatedField(
        queryset=Step.objects, many=True, pk_field=serializers.CharField()
    )
    error_count = serializers.SerializerMethodField()
    warning_count = serializers.SerializerMethodField()

    # Emitted fields:
    creator = serializers.SerializerMethodField()
    user_can_edit = serializers.SerializerMethodField()
    message = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = (
            "id",
            "user",
            "creator",
            "plan",
            "steps",
            "instance_url",
            "org_id",
            "results",
            "created_at",
            "edited_at",
            "enqueued_at",
            "job_id",
            "status",
            "org_name",
            "org_type",
            "is_production_org",
            "product_slug",
            "version_label",
            "version_is_most_recent",
            "plan_slug",
            "error_count",
            "warning_count",
            "is_public",
            "user_can_edit",
            "message",
            "error_message",
        )
        extra_kwargs = {
            "created_at": {"read_only": True},
            "edited_at": {"read_only": True},
            "enqueued_at": {"read_only": True},
            "job_id": {"read_only": True},
            "status": {"read_only": True},
            "org_type": {"read_only": True},
        }

    def requesting_user_has_rights(self, include_staff=True):
        """
        Does the user making the request have rights to see this object?

        The user is derived from the serializer context.
        """
        try:
            if self.instance.user:
                user = self.context["request"].user
                is_owner = user == self.instance.user
                return is_owner or user.is_staff if include_staff else is_owner
            scratch_org = ScratchOrg.objects.get_from_session(
                self.context["request"].session
            )
            return scratch_org and self.instance.org_id == scratch_org.org_id
        except (AttributeError, KeyError):
            return False

    def get_message(self, obj) -> str:
        return (
            getattr(obj.plan.plan_template, "post_install_message_markdown", "")
            + obj.plan.post_install_message_additional_markdown
        )

    def get_user_can_edit(self, obj) -> bool:
        return self.requesting_user_has_rights(include_staff=False)

    @extend_schema_field(LimitedUserSerializer(allow_null=True))
    def get_creator(self, obj):
        if obj.user and self.requesting_user_has_rights():
            return LimitedUserSerializer(instance=obj.user).data
        return None

    def get_org_id(self, obj) -> Optional[str]:
        if self.requesting_user_has_rights():
            return obj.org_id
        return None

    def get_org_name(self, obj) -> Optional[str]:
        if self.requesting_user_has_rights():
            return obj.org_name
        return None

    @extend_schema_field(serializers.URLField(allow_null=True))
    def get_instance_url(self, obj) -> Optional[str]:
        if self.requesting_user_has_rights():
            return obj.instance_url
        return None

    def get_is_production_org(self, obj) -> bool:
        return obj.full_org_type == ORG_TYPES.Production

    def get_version_is_most_recent(self, obj) -> bool:
        return obj.plan.version == obj.plan.version.product.most_recent_version

    @staticmethod
    def _has_valid_preflight(most_recent_preflight, plan):
        if not plan.requires_preflight:
            return True

        if not most_recent_preflight:
            return False

        return not most_recent_preflight.has_any_errors()

    @staticmethod
    def _has_valid_steps(*, plan, steps, preflight):
        """
        Every set in this method is a set of numeric Step PKs, from the
        local database.
        """
        required_steps = set(plan.required_step_ids)
        if preflight:
            required_steps -= set(preflight.optional_step_ids)
        return not set(required_steps) - {s.id for s in steps}

    def _pending_job_exists(self, *, org_id):
        return Job.objects.filter(status=Job.Status.started, org_id=org_id).first()

    def validate_plan(self, value):
        if not value.is_visible_to(self.context["request"].user):
            raise serializers.ValidationError(
                _("You are not allowed to install this plan.")
            )
        if not value.version.product.is_visible_to(self.context["request"].user):
            raise serializers.ValidationError(
                _("You are not allowed to install this product.")
            )
        return value

    def _validate_results(self, data):
        if self.instance:
            # results are read-only except during creation
            del data["results"]
        else:
            for step_id, results in data["results"].items():
                # make sure results can't be set initially except to hide steps
                if any(result["status"] != HIDE for result in results):
                    raise serializers.ValidationError(_("Invalid initial results."))

    def validate(self, data):
        user = get_from_data_or_instance(self.instance, data, "user")
        org_id = getattr(self.instance, "org_id", getattr(user, "org_id", None))
        plan = get_from_data_or_instance(self.instance, data, "plan")
        steps = get_from_data_or_instance(self.instance, data, "steps", default=[])

        scratch_org = None
        if not (user and user.is_authenticated):
            scratch_org = ScratchOrg.objects.filter(
                status=ScratchOrg.Status.complete
            ).get_from_session(self.context["request"].session)
            if not org_id:
                org_id = getattr(scratch_org, "org_id", None)

        if not org_id:
            raise serializers.ValidationError(_("No valid org."))

        most_recent_preflight = PreflightResult.objects.most_recent(
            org_id=org_id, plan=plan
        )
        no_valid_preflight = not self.instance and not self._has_valid_preflight(
            most_recent_preflight, plan=plan
        )
        if no_valid_preflight:
            raise serializers.ValidationError(_("No valid preflight."))

        invalid_steps = not self.instance and not self._has_valid_steps(
            plan=plan, steps=steps, preflight=most_recent_preflight
        )
        if invalid_steps:
            raise serializers.ValidationError(_("Invalid steps for plan."))

        if "results" in data:
            self._validate_results(data)

        pending_job = not self.instance and self._pending_job_exists(org_id=org_id)
        if pending_job:
            raise serializers.ValidationError(
                _(
                    f"Pending job {pending_job.id} exists. Please try again later, or "
                    f"cancel that job."
                )
            )

        data["org_id"] = org_id
        user_has_valid_token = False

        if user and user.is_authenticated:
            user_has_valid_token = all(user.token)
            data["org_type"] = user.org_type
            data["full_org_type"] = user.full_org_type
        elif scratch_org:
            user_has_valid_token = True
            data["user"] = None
            data["full_org_type"] = ORG_TYPES.Scratch
        if not user_has_valid_token:
            raise serializers.ValidationError(
                _("The connection to your org has been lost. Please log in again.")
            )

        return data


class PreflightResultSerializer(ErrorWarningCountMixin, HashIdModelSerializer):
    plan = IdOnlyField(read_only=True)
    user = IdOnlyField(read_only=True)
    is_ready = serializers.SerializerMethodField()
    error_count = serializers.SerializerMethodField()
    warning_count = serializers.SerializerMethodField()
    instance_url = serializers.URLField(read_only=True, allow_null=True)
    results = StepResultsField(read_only=True)

    def get_is_ready(self, obj) -> bool:
        return (
            obj.is_valid
            and obj.status == PreflightResult.Status.complete
            and self._count_status_in_results(obj.results, ERROR) == 0
        )

    class Meta:
        model = PreflightResult
        fields = (
            "id",
            "instance_url",
            "org_id",
            "user",
            "plan",
            "created_at",
            "edited_at",
            "is_valid",
            "status",
            "results",
            "error_count",
            "warning_count",
            "is_ready",
        )
        extra_kwargs = {
            "org_id": {"read_only": True},
            "created_at": {"read_only": True},
            "edited_at": {"read_only": True},
            "is_valid": {"read_only": True},
            "status": {"read_only": True},
        }


class JobSummarySerializer(HashIdModelSerializer):
    product_slug = serializers.CharField(source="plan.version.product.slug")
    version_label = serializers.CharField(source="plan.version.label")
    plan_slug = serializers.CharField(source="plan.slug")
    plan_average_duration = serializers.SerializerMethodField()

    class Meta:
        model = Job
        fields = (
            "id",
            "product_slug",
            "version_label",
            "plan_slug",
            "plan_average_duration",
        )

    def get_plan_average_duration(self, obj) -> Optional[int]:
        if obj.plan.calculated_average_duration:
            return obj.plan.calculated_average_duration
        return None


class OrgSerializer(serializers.Serializer):
    org_id = serializers.CharField()
    current_job = JobSummarySerializer()
    current_preflight = IdOnlyField()


class SiteSerializer(serializers.ModelSerializer):
    welcome_text = serializers.CharField(source="welcome_text_markdown")
    copyright_notice = serializers.CharField(source="copyright_notice_markdown")
    master_agreement = serializers.CharField(source="master_agreement_markdown")

    class Meta:
        model = SiteProfile
        fields = (
            "name",
            "company_name",
            "welcome_text",
            "master_agreement",
            "copyright_notice",
            "show_product_tags",
            "show_metadeploy_wordmark",
            "company_logo",
            "favicon",
        )


class ScratchOrgSerializer(HashIdModelSerializer):
    class Meta:
        model = ScratchOrg
        fields = (
            "id",
            "plan",
            "email",
            "enqueued_at",
            "created_at",
            "edited_at",
            "expires_at",
            "status",
            "org_id",
            "uuid",
        )
        extra_kwargs = {
            "email": {"required": True, "write_only": True},
            "enqueued_at": {"read_only": True},
            "created_at": {"read_only": True},
            "edited_at": {"read_only": True},
            "expires_at": {"read_only": True},
            "status": {"read_only": True},
            "org_id": {"read_only": True},
            "uuid": {"read_only": True},
        }

    plan = IdOnlyField(model=Plan)
