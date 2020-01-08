from django.core.management.base import BaseCommand

from metadeploy.api.models import ClickThroughAgreement


class Command(BaseCommand):
    help = (
        "Queries for api_clickthroughagreement records and outputs them in csv format"
    )

    def handle(self, *args, **options):
        click_through_agreements = ClickThroughAgreement.objects.all()
        for agreement in click_through_agreements:
            # Output Id, text in csv format
            self.stdout.write(f"{agreement.id}, {agreement.text}")
