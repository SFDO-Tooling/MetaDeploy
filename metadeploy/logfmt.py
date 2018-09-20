import datetime
import numbers

from django.utils.log import ServerFormatter


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

    def _escape_quotes(self, string):
        return '"{}"'.format(string.replace('"', '\\' + '"'))

    def format_line(self, extra):
        out = []
        for k, v in extra.items():
            if v is None:
                v = ''
            elif isinstance(v, bool):
                v = 'true' if v else 'false'
            elif isinstance(v, numbers.Number):
                pass  # v can be string-interpolated as-is.
            else:
                if isinstance(v, (dict, object)):
                    v = str(v)
                v = self._escape_quotes(v)
            out.append('{}={}'.format(k, v))
        return ' '.join(out)

    def _get_time(self, record):
        return self._escape_quotes(
            datetime.datetime.fromtimestamp(record.created).strftime(
                '%Y-%m-%d %H:%M:%S.%f',
            ),
        )

    def _get_id(self, record):
        return getattr(
            record,
            'request_id',
            None,
            # ) or getattr(
            #     record,
            #     'msg',  # TODO: Parse the Job ID out of the msg :(
            #     None,
        ) or 'unknown'

    def _get_tag(self, record):
        tag = getattr(record, 'tag', None)
        if tag:
            return self._escape_quotes(tag)
        return 'external'

    def format(self, record):
        id_ = self._get_id(record)
        time = self._get_time(record)
        msg = self._escape_quotes(record.getMessage())
        tag = self._get_tag(record)
        rest = self.format_line(getattr(record, 'context', {}))
        return ' '.join(filter(None, [
            f'id={id_}',  # TODO: get-id method
            f'at={record.levelname}',
            f'time={time}',
            f'msg={msg}',
            f'tag={tag}',
            f'module={record.module}',
            f'{rest}',
        ]))
