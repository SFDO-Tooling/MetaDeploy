from logging import Handler


class ResultSpoolLogger(Handler):
    def __init__(self, *args, result=None, **kwargs):
        self.result = result
        super().__init__(*args, **kwargs)

    def emit(self, record):
        try:
            self.result.results["logs"] += record.msg
        except KeyError:
            self.result.results["logs"] = record.msg
        # Websocket triggered on save automatically if results changes:
        self.result.save()
