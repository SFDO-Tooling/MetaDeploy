from .util import HashIdMixin
from parler.models import TranslatableModel
from parler.models import TranslatedFields
from django.utils.translation import gettext_lazy as _
from django.db import models
from django.db.models import JSONField, Choices, F
from cumulusci.core.utils import import_class
from cumulusci.core.tasks import BaseTask
from django.core.validators import RegexValidator
from cumulusci.core.flowrunner import StepSpec

from .models import Plan
from metadeploy.api.constants import STEP_NUM
from metadeploy.api.models.util import DottedArray


class Step(HashIdMixin, TranslatableModel):
    Kind = Choices(
        ("metadata", _("Metadata")),
        ("onetime", _("One Time Apex")),
        ("managed", _("Managed Package")),
        ("data", _("Data")),
        ("other", _("Other")),
    )

    translations = TranslatedFields(
        name=models.CharField(max_length=1024, help_text="Customer facing label"),
        description=models.TextField(blank=True),
    )

    plan = models.ForeignKey(Plan, on_delete=models.CASCADE, related_name="steps")
    is_required = models.BooleanField(default=True)
    is_recommended = models.BooleanField(default=True)
    kind = models.CharField(choices=Kind, default=Kind.metadata, max_length=64)
    path = models.CharField(
        max_length=2048, help_text="dotted path e.g. flow1.flow2.task_name"
    )
    step_num = models.CharField(
        max_length=64,
        help_text="dotted step number for CCI task",
        validators=[RegexValidator(regex=STEP_NUM)],
    )
    task_class = models.CharField(
        max_length=2048, help_text="dotted module path to BaseTask implementation"
    )
    task_config = JSONField(default=dict, blank=True)
    source = JSONField(blank=True, null=True)

    class Meta:
        ordering = (DottedArray(F("step_num")),)

    @property
    def kind_icon(self):
        if self.kind == self.Kind.metadata:
            return "package"
        if self.kind == self.Kind.onetime:
            return "apex"
        if self.kind == self.Kind.managed:
            return "archive"
        if self.kind == self.Kind.data:
            return "paste"
        return None

    def to_spec(self, project_config, skip: bool = False):
        if self.source:
            project_config = project_config.include_source(self.source)
        task_class = import_class(self.task_class)
        assert issubclass(task_class, BaseTask)
        return StepSpec(
            step_num=self.step_num,
            task_name=self.path,  # skip from_flow path construction in StepSpec ctr
            task_config=self.task_config or {"options": {}},
            task_class=task_class,
            skip=skip,
            project_config=project_config,
        )

    def __str__(self):
        return f"Step {self.name} of {self.plan.title} ({self.step_num})"

    def get_translation_strategy(self):
        return "text", f"{self.plan.plan_template.product.slug}:steps"

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)

        from metadeploy.adminapi.translations import update_translations

        update_translations(self)
