from django.apps import AppConfig
from django.utils import timezone

from django_rq import get_scheduler


class ApiConfig(AppConfig):
    name = 'metadeploy.api'
    verbose_name = 'API'

    def ready(self):
        from .jobs import run_enqueuer

        scheduler = get_scheduler('default')
        scheduler.schedule(
            scheduled_time=timezone.now(),
            func=run_enqueuer.delay,
            interval=1,
        )
