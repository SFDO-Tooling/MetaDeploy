from datetime import datetime

from django.core.management.base import BaseCommand, CommandError, CommandParser

from metadeploy.api.jobs import delete_scratch_org
from metadeploy.api.jobs import setup_scratch_org
from metadeploy.api.jobs import run_plan_steps
from metadeploy.api.jobs import run_preflight_checks_sync
from metadeploy.api.models import Plan
from metadeploy.api.models import ScratchOrg


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
        org, plan = setup_scratch_org(scratch_org.pk)
        run_preflight_checks_sync(org, release_test=True)
        run_plan_steps(org, release_test=True)
        delete_scratch_org(scratch_org)
