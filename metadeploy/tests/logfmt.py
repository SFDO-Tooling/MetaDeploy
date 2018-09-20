import datetime
import logging

from ..logfmt import LogfmtFormatter


def test_formatter_format():
    record = logging.LogRecord(
        'name',
        logging.INFO,
        '/path/name',
        1,
        'Some message',
        (),
        None,
    )
    time = datetime.datetime.fromtimestamp(record.created).strftime(
        '%Y-%m-%d %H:%M:%S.%f',
    )

    result = LogfmtFormatter().format(record)
    expected = ' '.join([
        f'id=unknown',
        f'at=INFO',
        f'time="{time}"',
        f'msg="Some message"',
        f'tag=external',
        f'module=name',
    ])

    assert result == expected


def test_formatter_format_line():
    extra = {
        'none': None,
        'bool': True,
        'number': 1,
        'dict': {},
    }
    result = LogfmtFormatter().format_line(extra)
    expected = 'none= bool=true number=1 dict="{}"'

    assert result == expected


def test_formatter_tag():
    record = logging.LogRecord(
        'name',
        logging.INFO,
        '/path/name',
        1,
        'Some message',
        (),
        None,
    )

    record.tag = 'some-tag'

    result = LogfmtFormatter()._get_tag(record)
    expected = '"some-tag"'

    assert result == expected
