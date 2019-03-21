from logging import Handler


class ResultSpoolLogger(Handler):
    def __init__(self, *args, result=None, **kwargs):
        self.result = result
        self.current_key = None
        super().__init__(*args, **kwargs)

    def emit(self, record):
        try:
            msg = f"\n{record.getMessage()}"
            self.result.results[self.current_key]["logs"] += msg
        except KeyError as e:
            msg = record.getMessage()
            if e.args[0] == "logs":
                self.result.results[self.current_key]["logs"] = msg
            else:
                self.result.results[self.current_key] = {"logs": msg}
        # Websocket triggered on save automatically if results changes:
        self.result.save()
