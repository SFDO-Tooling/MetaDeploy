import json
import os

from django.apps import apps
from django.contrib.sites.models import Site
from django.core.exceptions import ObjectDoesNotExist
from django.core.management.base import BaseCommand, CommandError


class Command(BaseCommand):
    help = "Queries for translatable field values and outputs them in JSON format"

    translatable_objects = {
        "Product": {
            "fields": [
                "title",
                "short_description",
                "description",
                "click_through_agreement",
                "error_message",
            ]
        },
        "PlanTemplate": {
            "fields": ["preflight_message", "post_install_message", "error_message"]
        },
        # "Plan": {
        # "fields": [
        # "title",
        # "preflight_message_additional",
        # "post_install_message_additional",
        # ]
        # },
        # "Step": {"fields": ["name", "description"]},
        "SiteProfile": {
            "fields": ["name", "company_name", "welcome_text", "copyright_notice"]
        },
    }

    field_descriptions = {
        "Product": {
            "title": "The name of the product",
            "short_description": "Short description of the product",
            "description": "Description of the product",
            "click_through_agreement": "Users must check a box to agree to this legal text before running the installer",
            "error_message": "Message regarding what to do if an error occurs during installation",
        },
        "PlanTemplate": {
            "preflight_message": "Message displayed during preflight checks",
            "post_install_message": "Message displayed after installation completes",
            "error_message": "Message displayed to users if an error occurs",
        },
        # "Plan": {
        # "title": "Title of the plan",
        # "preflight_message_additional": "An additional preflight message",
        # "post_install_message_additional": "An additional post install message",
        # },
        # "Step": {
        # "name": "The name of the step",
        # "description": "Description of the step",
        # },
        "SiteProfile": {
            "name": "Name of the site profile",
            "company_name": "Name of the company",
            "welcome_text": "Text shown above products on the home page",
            "copyright_notice": "Copyright notice shown in the footer of the page",
        },
    }

    def handle(self, *args, **options):
        # Ensure the site env var is set so `CurrentSiteManager` reads from it. This is
        # just to make callers explicitly specify the site to run the command on
        if Site.objects.count() > 1 and os.environ.get("DJANGO_SITE_ID") is None:
            raise CommandError(
                "Multiple Sites detected. Set the `DJANGO_SITE_ID` env var to your desired Site ID."
            )

        translatable_labels = {}
        for obj in self.translatable_objects:
            model = apps.get_model("api", obj)
            model_fields = self.translatable_objects[obj]["fields"]

            record_info = {}
            for record in model.objects.all():
                record_info[str(record.id)] = {}
                for field in model_fields:
                    try:
                        field_info = {
                            "message": getattr(record, field),
                            "description": self.field_descriptions[obj][field],
                        }
                        record_info[str(record.id)][field] = field_info
                    except ObjectDoesNotExist:
                        pass
                translatable_labels[obj] = record_info

        self.stdout.write(json.dumps(translatable_labels))
