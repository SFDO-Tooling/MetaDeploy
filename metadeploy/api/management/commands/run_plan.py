from datetime import datetime

from django.core.management.base import BaseCommand, CommandError, CommandParser

from metadeploy.api.jobs import create_scratch_org, delete_scratch_org
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
        create_scratch_org(scratch_org.pk, release_test=True)

        delete_scratch_org(scratch_org)
