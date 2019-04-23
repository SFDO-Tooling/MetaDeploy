from unittest.mock import MagicMock

import pytest

from ..push import notify_org_result_changed, report_error


class AsyncMock(MagicMock):
    async def __call__(self, *args, **kwargs):
        return super().__call__(*args, **kwargs)


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_report_error(mocker, user_factory):
    push_message = mocker.patch(
        "metadeploy.api.push.push_message_about_instance", new=AsyncMock()
    )
    user = user_factory()
    await report_error(user)
    assert push_message.called


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_notify_org_job_changed(mocker, user_factory, job_factory, plan_factory):
    # get_channel_layer = mocker.patch("metadeploy.api.push.get_channel_layer")
    # channel_layer = MagicMock(name="channel_layer")
    # channel_layer.group_send = AsyncMock(name="group_send")
    # get_channel_layer.return_value = channel_layer
    user = user_factory()
    plan = plan_factory()
    job = job_factory(user=user, plan=plan, organization_url="https://example.com/")
    await notify_org_result_changed(job)
    # assert channel_layer.group_send.called
