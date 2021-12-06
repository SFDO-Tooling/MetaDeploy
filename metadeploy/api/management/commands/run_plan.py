from datetime import datetime
from logging import getLogger

from django.core.management.base import BaseCommand, CommandError, CommandParser

from metadeploy.api.jobs import JobLogStatus, JobType, delete_scratch_org
from metadeploy.api.jobs import setup_scratch_org
from metadeploy.api.jobs import run_plan_steps
from metadeploy.api.jobs import run_preflight_checks_sync
from metadeploy.api.models import Plan
from metadeploy.api.models import ScratchOrg

logger = getLogger(__name__)


class Command(BaseCommand):
    help = "Runs preflight checks and plan against a scratch org in a one-off dyno on Heroku."

    def add_arguments(self, parser: CommandParser) -> None:
        parser.add_argument("plan_id", type=str)
        return super().add_arguments(parser)

    def handle(self, *args, **options):
        plan_id: str = options["plan_id"]
        try:
            plan = Plan.objects.get(id=plan_id)
        except Plan.DoesNotExist:
            raise CommandError(f"Plan with Id {plan_id} does not exist.")

        scratch_org = ScratchOrg.objects.create(
            plan=plan, enqueued_at=datetime.utcnow().isoformat()
        )
        try:
            org, plan = setup_scratch_org(scratch_org.pk)
        except Exception:
            context = f"{plan.version.product.slug}/{plan.version.label}/{plan.slug}"
            logger.info(
                "Scratch org creation failed.",
                extra={
                    "context": {
                        "event": JobType.TEST_JOB,
                        "context": context,
                        "status": JobLogStatus.ERROR,
                    }
                },
            )
            raise
        run_preflight_checks_sync(org, release_test=True)
        run_plan_steps(org, release_test=True)
        delete_scratch_org(scratch_org)
