import pytest

from io import StringIO
from unittest import mock
from django.core.management import call_command


class TestMetaDeployRQSchedulerCommand:
    @pytest.mark.django_db
    @mock.patch("django.conf.settings.CRON_JOBS")
    def test_command__success(self, CRON_JOBS):

        # add an existing job with unique name to the queue

        CRON_JOBS = {
            "test_job": {
                "func": "metadeploy.api.jobs.cleanup_user_data_job",
                "cron_string": "* * * * *",
            }
        }
        output = StringIO()
        call_command("metadeploy_rqscheduler", stdout=output)

        # query for existing job, assert it was cancelled
        # assert that job defined in settings.CRON_JOBS is in the 'short' queue
        # assert we see the "Scheduled job test_job: {'queue_name': 'short', 'use_local_timezone': True}""

    @pytest.mark.django_db
    @mock.patch("django.conf.settings.CRON_JOBS")
    def test_command__job_missing(self):
        """Test that a missing job attribute raises the expected error"""
        CRON_JOBS = {
            "test_job": {
                "not_func": "metadeploy.api.jobs.cleanup_user_data_job",
                "cron_string": "* * * * *",
            }
        }
        with pytest.raises(TypeError):
            call_command("metadeploy_rqscheduler")
