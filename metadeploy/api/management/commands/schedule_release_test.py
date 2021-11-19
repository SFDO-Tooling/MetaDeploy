import logging
import requests
from datetime import timedelta
from typing import List

from requests.exceptions import HTTPError

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.management.base import BaseCommand

import django_rq

from metadeploy.api.models import Plan, PlanTemplate

MINUTE_DELAY = 5
TIME_TO_LIVE = 86400
HEROKU_API_URL = f"https://api.heroku.com/apps/{settings.HEROKU_APP_NAME}/dynos"
HEADERS = {
    "Accept": "application/vnd.heroku+json; version=3",
    "Authorization": f"Bearer {settings.HEROKU_TOKEN}",
}

logger = logging.getLogger(__name__)


def execute_release_test() -> None:
    """For each plan to test, make an API call to Heroku
    to spin up a one-off dyno, and run the plan against
    a fresh scratch org."""
    plans_to_test = get_plans_to_test()
    if not plans_to_test:
        logger.info("No plans found for regression testing.")
        return

    check_settings()
    for plan in plans_to_test:
        command = f"python ./manage.py run_plan {str(plan.id)}"
        resp = start_job_in_one_off_dyno(command)
        if resp.status_code > 299:
            logger.error(
                f"One-off dyno could not be started: {resp.status_code} : {resp.text}"
            )
            raise HTTPError("An internal server error occurred.")


def get_plans_to_test() -> List[Plan]:
    """Returns all plans related to PlanTemplates that have
    not opted out of regression testing, and have a tier or 'primary'.
    (See PlanTemplate.regression_test_opt_out)"""
    plan_templates = PlanTemplate.objects.filter(regression_test_opt_out=False)
    plans = [
        Plan.objects.filter(plan_template=template.pk, tier=Plan.Tier.primary)
        .order_by("-created_at")
        .first()
        for template in plan_templates
    ]
    return [p for p in plans if p is not None]


def check_settings() -> None:
    """Raises an error if we don't have the settings needed to talk to Heroku."""
    if not settings.HEROKU_APP_NAME:
        raise ImproperlyConfigured(
            "The HEROKU_APP_NAME environment variable is required for regression testing."
        )
    if not settings.HEROKU_TOKEN:
        raise ImproperlyConfigured(
            "The HEROKU_TOKEN environment variable is required for regression testing."
        )


def start_job_in_one_off_dyno(command: str) -> requests.Response:
    """Calls the Heroku API and starts a one-off dyno.
    The given command is executed on the dyno."""
    return requests.post(
        HEROKU_API_URL,
        headers=HEADERS,
        json={"command": command, "time_to_live": str(TIME_TO_LIVE)},
    )


class Command(BaseCommand):
    help = "Schedules regression tests to execute after a deploy on Heroku"

    def handle(self, *args, **options):  # pragma: no cover
        scheduler = django_rq.get_scheduler("default")
        scheduler.enqueue_in(timedelta(minutes=MINUTE_DELAY), execute_release_test)
