import logging
import uuid
from statistics import median
from typing import Union

from asgiref.sync import async_to_sync
from colorfield.fields import ColorField
from cumulusci.core.config import FlowConfig
from cumulusci.core.flowrunner import (
    FlowCoordinator,
    PreflightFlowCoordinator,
    StepSpec,
)
from cumulusci.core.tasks import BaseTask
from cumulusci.core.utils import import_class
from django.conf import settings
from django.contrib.auth.models import AbstractUser
from django.contrib.auth.models import UserManager as BaseUserManager
from django.contrib.postgres.fields import ArrayField
from django.contrib.sites.models import Site
from django.core.exceptions import ValidationError
from django.core.serializers.json import DjangoJSONEncoder
from django.core.validators import MaxValueValidator, MinValueValidator, RegexValidator
from django.db import models
from django.db.models import Count, F, Func, JSONField, Q
from django.utils.translation import gettext_lazy as _
from model_utils import Choices, FieldTracker
from parler.managers import TranslatableQuerySet
from parler.models import TranslatableModel, TranslatedFields
from sfdo_template_helpers.fields import MarkdownField as BaseMarkdownField
from sfdo_template_helpers.slugs import AbstractSlug, SlugMixin

from .belvedere_utils import convert_to_18
from .constants import ERROR, HIDE, OPTIONAL, ORGANIZATION_DETAILS, SKIP
from .salesforce import refresh_access_token
from .flows import JobFlowCallback, PreflightFlowCallback
from .push import (
    notify_org_changed,
    notify_org_result_changed,
    notify_post_job,
    notify_post_task,
    preflight_canceled,
    preflight_completed,
    preflight_failed,
    preflight_invalidated,
)

logger = logging.getLogger(__name__)
