from unittest.mock import MagicMock

import pytest
from channels.layers import get_channel_layer

from ..push import (
    job_started,
    notify_org_changed,
    notify_org_result_changed,
    report_error,
)


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
async def test_notify_org_result_changed(
    mocker, user_factory, job_factory, plan_factory
):
    gcl = mocker.patch("metadeploy.api.push.get_channel_layer", wraps=get_channel_layer)
    user = user_factory()
    plan = plan_factory()
    job = job_factory(user=user, plan=plan, org_id=user.org_id)
    await notify_org_result_changed(job)
    gcl.assert_called()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_notify_org_changed(mocker, scratch_org_factory):
    soj = scratch_org_factory()
    gcl = mocker.patch("metadeploy.api.push.get_channel_layer", wraps=get_channel_layer)
    await notify_org_changed(soj, "error!")
    gcl.assert_called()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_notify_org_changed__attribute_error(mocker, scratch_org_factory):
    soj = scratch_org_factory()
    gcl = mocker.patch("metadeploy.api.push.get_channel_layer", wraps=get_channel_layer)
    await notify_org_changed(soj, error="fake error")
    gcl.assert_called()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_notify_org_changed__list(mocker, scratch_org_factory):
    soj = scratch_org_factory()
    gcl = mocker.patch("metadeploy.api.push.get_channel_layer", wraps=get_channel_layer)
    await notify_org_changed(soj, error=MagicMock(content=["fake error"]))
    gcl.assert_called()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_notify_org_changed__dict(mocker, scratch_org_factory):
    soj = scratch_org_factory()
    gcl = mocker.patch("metadeploy.api.push.get_channel_layer", wraps=get_channel_layer)
    await notify_org_changed(soj, error=MagicMock(content={"message": "fake error"}))
    gcl.assert_called()


@pytest.mark.django_db
@pytest.mark.asyncio
async def test_job_started(mocker, scratch_org_factory, job_factory):
    soj = scratch_org_factory()
    job = job_factory()
    gcl = mocker.patch("metadeploy.api.push.get_channel_layer", wraps=get_channel_layer)
    await job_started(soj, job)
    gcl.assert_called()
