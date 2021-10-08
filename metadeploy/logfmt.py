import datetime
import io
import logging
import numbers

from django.utils.log import ServerFormatter
from logfmt import parse
from rq import get_current_job

NO_JOB_ID = "no-job-id"


class JobIDFilter(logging.Filter):
    def filter(self, record):
        if get_current_job():
            record.job_id = get_current_job().id
        else:
            record.job_id = NO_JOB_ID
        return True


def quote_logvalue(value):
    """Return a value formatted for use in a logfmt log entry.

    The input is quoted if it contains spaces or quotes; otherwise returned unchanged
    """
    s = str(value)
    if " " in s or '"' in s:
        string = s.replace('"', "\\" + '"')
        return f'"{s}"'
    return s


class LogfmtFormatter(ServerFormatter):
    """
    To use this logger to its fullest extent, log lines like this:

        logger.error(
            message,
            extra={
                'tag': 'some tag',
                'context': {
                    ... whatever other data you need to log.
                },
            },
        )
    """

    def _parse_msg(self, msg):
        msg = list(parse(io.StringIO(msg)))
        return msg[0]

    def format_line(self, extra):
        out = []
        for k, v in extra.items():
            if k == "event":
                continue  # already emitted at the beginning of the line
            if v is None:
                v = ""
            elif isinstance(v, bool):
                v = "true" if v else "false"
            elif isinstance(v, numbers.Number):
                pass  # v can be string-interpolated as-is.
            else:
                if isinstance(v, (dict, object)):
                    v = str(v)
                v = quote_logvalue(v)
            out.append("{}={}".format(k, v))
        return " ".join(out)

    def _get_time(self, record):
        return quote_logvalue(
            datetime.datetime.fromtimestamp(record.created).strftime(
                "%Y-%m-%d %H:%M:%S.%f"
            )
        )

    def _get_id(self, record):
        return (
            getattr(record, "request_id", None)
            or getattr(record, "job_id", None)
            or "unknown"
        )

    def _get_tag(self, record):
        tag = getattr(record, "tag", None)
        if tag:
            return quote_logvalue(tag)

    def format(self, record):
        parsed_msg = record.module == "logging_middleware"
        id_ = self._get_id(record)
        time = self._get_time(record)
        tag = self._get_tag(record)
        if parsed_msg:
            msg = self._parse_msg(record.getMessage())
        else:
            msg = record.getMessage()
        context = getattr(record, "context", {})
        rest = self.format_line(context)
        fields = []
        if "event" in context:
            fields.append(f"event={context['event']}")
        fields += [
            f"request_id={id_}",
            f"at={record.levelname}",
            f"time={time}",
            f"module={record.module}",
        ]
        if tag:
            fields.append(f"tag={tag}")
        if parsed_msg:
            for k, v in msg.items():
                fields.append(f"{k}={quote_logvalue(str(v))}")
        else:
            fields.append(f"msg={quote_logvalue(msg)}")
        fields.append(f"{rest}")
        return " ".join(filter(None, fields))
