from unittest import mock

import pytest
from django.conf import settings
from django.core.management import call_command

mock_scheduler = mock.Mock()
mock_scheduler.get_jobs.return_value = [mock.Mock(meta="cron_string")]


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

    def test_command__success_with_overridden_queue(self, caplog):
        # add an existing job with unique name to the queue
        with mock.patch.object(
            settings,
            "CRON_JOBS",
            {
                "test_job": {
                    "func": "metadeploy.api.jobs.cleanup_user_data_job",
                    "cron_string": "* * * * *",
                    "queue_name": "speedy",
                }
            },
        ):
            call_command("metadeploy_rqscheduler")
            mock_scheduler.cancel.assert_called()
            mock_scheduler.cron.assert_called()
            expected_output = (
                "Scheduled job test_job: "
                "{'func': 'metadeploy.api.jobs.cleanup_user_data_job', "
                "'cron_string': '* * * * *', 'queue_name': 'speedy', "
                "'use_local_timezone': True}"
            )
            assert expected_output in caplog.text

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
