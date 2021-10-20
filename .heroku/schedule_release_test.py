import logging
import requests
from datetime import timedelta
from typing import List

from requests.exceptions import HTTPError

from django.conf import settings
from django.core.exceptions import ImproperlyConfigured

import django_rq

from metadeploy.api.models import Plan, PlanTemplate

MINUTE_DELAY = 5
TIME_TO_LIVE = 86400
HEROKU_API_URL = f"https://api.heroku.com/apps/{settings.heroku_worker_app_name}/dynos"
HEADERS = {
    "Accept": "application/vnd.heroku+json; version=3",
    "Authorization": f"Bearer {settings.heroku_token}",
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
        command = f"python ./manage.py run_plan {str(plan.Id)}"
        resp = start_job_in_one_off_dyno(command)
        if resp.status_code > 299:
            logger.error(
                f"One-off dyno could not be started: {resp.status_code} : {resp.text}"
            )
            raise HTTPError("An internal server error occurred.")


def get_plans_to_test() -> List[Plan]:
    """Returns all plans related to PlanTemplates that have
    not opted out of regression testing.
    (See PlanTemplate.regression_test_opt_out)"""
    plan_templates = PlanTemplate(regression_test_opt_out=False)
    return [
        Plan.objects.filter(plan_template=template.Id).order_by("-created_at").first()
        for template in plan_templates
    ]


def check_settings() -> None:
    """Raises an error if we don't have the settings needed to talk to Heroku."""
    if not settings.heroku_worker_app_name:
        raise ImproperlyConfigured(
            "The HEROKU_WORKER_APP_NAME environment variable is required for regression testing."
        )
    if not settings.heroku_token:
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


if __name__ == "__main__":
    scheduler = django_rq.get_scheduler("short")
    scheduler.enqueue_in(timedelta(minutes=MINUTE_DELAY), execute_release_test)
