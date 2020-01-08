import json

from django.core.management.base import BaseCommand

from metadeploy.api.models import ClickThroughAgreement


class Command(BaseCommand):
    help = (
        "Queries for api_clickthroughagreement records and outputs them in csv format"
    )

    def handle(self, *args, **options):
        click_through_agreements = ClickThroughAgreement.objects.all()

        agreements_dict = {}
        for agreement in click_through_agreements:
            agreements_dict[agreement.id] = agreement.text

        localization = {"en": agreements_dict}

        self.stdout.write(json.dumps(localization))
