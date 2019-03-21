import pytest

from ..result_spool_logger import ResultSpoolLogger


class MockRecord:
    def __init__(self, msg):
        self.msg = msg

    def getMessage(self):
        return self.msg


@pytest.mark.django_db
class TestResultSpoolLogger:
    def test_emit(self, job_factory):
        job = job_factory(results={"test": {"logs": ""}})
        handler = ResultSpoolLogger(result=job)
        handler.current_key = "test"
        record = MockRecord("test")

        handler.emit(record)

        job.refresh_from_db()
        assert job.results == {"test": {"logs": "\ntest"}}

    def test_emit_no_logs_key(self, job_factory):
        job = job_factory(results={"test": {}})
        handler = ResultSpoolLogger(result=job)
        handler.current_key = "test"
        record = MockRecord("test")

        handler.emit(record)

        job.refresh_from_db()
        assert job.results == {"test": {"logs": "test"}}

    def test_emit_no_current_key(self, job_factory):
        job = job_factory(results={})
        handler = ResultSpoolLogger(result=job)
        handler.current_key = "test"
        record = MockRecord("test")

        handler.emit(record)

        job.refresh_from_db()
        assert job.results == {"test": {"logs": "test"}}
