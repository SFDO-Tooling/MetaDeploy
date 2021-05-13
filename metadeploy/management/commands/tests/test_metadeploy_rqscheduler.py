import pytest

from io import StringIO
from unittest import mock
from django.core.management import call_command
from django.conf import settings

mock_scheduler = mock.Mock()
mock_scheduler.get_jobs.return_value = [{}]


@mock.patch("django_rq.management.commands.rqscheduler.Command.handle", mock.Mock())
@mock.patch("django_rq.get_scheduler", mock.Mock(return_value=mock_scheduler))
class TestMetaDeployRQSchedulerCommand:
    def test_command__success(self, caplog):
        # add an existing job with unique name to the queue
        with mock.patch.object(
            settings,
            "CRON_JOBS",
            {
                "test_job": {
                    "func": "metadeploy.api.jobs.cleanup_user_data_job",
                    "cron_string": "* * * * *",
                }
            },
        ):
            call_command("metadeploy_rqscheduler")
            mock_scheduler.cancel.assert_called()
            mock_scheduler.cron.assert_called()
            assert "Scheduled job test_job" in caplog.text

    def test_command__job_missing(self):
        """Test that a missing job attribute raises the expected error"""
        with mock.patch.object(
            settings,
            "CRON_JOBS",
            {
                "test_job": {
                    "not_func": "metadeploy.api.jobs.cleanup_user_data_job",
                    "cron_string": "* * * * *",
                }
            },
        ):
            with pytest.raises(TypeError):
                call_command("metadeploy_rqscheduler")
