from logging import Handler


class ResultSpoolLogger(Handler):
    def __init__(self, *args, result=None, **kwargs):
        self.result = result
        self.current_key = None
        super().__init__(*args, **kwargs)

    def emit(self, record):
        if self.current_key is None:
            return
        try:
            msg = f"\n{record.getMessage()}"
            self.result.results[self.current_key]["logs"] += msg
        except KeyError as e:
            msg = record.getMessage()
            # If the missing key is "logs", we have a dict at
            # current_key, so just add the logs key:
            if e.args[0] == "logs":
                self.result.results[self.current_key]["logs"] = msg
            # Otherwise, we don't have a dict there, so let's add one,
            # and start it with the logs key:
            else:
                self.result.results[self.current_key] = {"logs": msg}
        # Websocket triggered on save automatically if results changes:
        self.result.save()
