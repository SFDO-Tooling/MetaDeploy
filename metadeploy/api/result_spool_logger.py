from logging import Handler

from ansi2html import Ansi2HTMLConverter


class ResultSpoolLogger(Handler):
    def __init__(self, *args, result=None, **kwargs):
        self.result = result
        self.current_key = None
        super().__init__(*args, **kwargs)

    def emit(self, record):
        if self.current_key is None:
            return
        msg = self.format(record)
        conv = Ansi2HTMLConverter(scheme="osx", inline=True)
        msg = conv.convert(msg, full=False)
        try:
            content = f"\n{msg}"
            self.result.results[self.current_key][0]["logs"] += content
        except KeyError as e:
            content = msg
            # If the missing key is "logs", we have a dict at
            # current_key, so just add the logs key:
            if e.args[0] == "logs":
                self.result.results[self.current_key][0]["logs"] = content
            # Otherwise, we don't have a dict there, so let's add one,
            # and start it with the logs key:
            else:
                self.result.results[self.current_key] = [{"logs": content}]
        # Websocket triggered on save automatically if results changes:
        self.result.save()
