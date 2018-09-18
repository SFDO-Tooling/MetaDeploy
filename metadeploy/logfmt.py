from django.utils.log import ServerFormatter


class LogfmtFormatter(ServerFormatter):
    def format(self, r):
        rest = ' '.join(
            f'{k}="{v}"'
            for k, v
            in getattr(r, 'extras', {}).items()
        )
        return ' '.join([
            f'at={r.levelname} msg="{r.msg}" tag={r.processName}',
            f'{rest}',
        ])
