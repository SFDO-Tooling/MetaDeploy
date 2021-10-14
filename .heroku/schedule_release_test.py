import logging
import requests

from requests.exceptions import HTTPError

from django.conf import settings

from metadeploy.api.models import Plan, PlanTemplate

# get the queue we want to add callable too
# add callable to queue x min in advance

logger = logging.getLogger(__name__)


def execute_release_test():
    # Get all PlanTemplates that are not opted out
    plan_templates = PlanTemplate(regression_test_opt_out=False)
    plans_to_test = [
        Plan.objects.filter(plan_template=template.Id).order_by("-created_at").first()
        for template in plan_templates
    ]

    url = f"https://api.heroku.com/apps/{api_settings.heroku_worker_app_name}/dynos"

    headers = {
        "Accept": "application/vnd.heroku+json; version=3",
        "Authorization": f"Bearer {api_settings.heroku_token}",
    }

    for plan in plans_to_test:
        command = f"python ./manage.py run_plan {str(plan.Id)}"
        resp = requests.post(
            url,
            headers=headers,
            json={"command": command, "time_to_live": "86400"},
        )

        if resp.status_code > 299:
            logger.error(
                f"One-off dyno could not be started: {resp.status_code} : {resp.text}"
            )
            raise HTTPError(status.HTTP_500_INTERNAL_SERVER_ERROR)
