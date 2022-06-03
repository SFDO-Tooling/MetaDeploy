from . import state


class CurrentRequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        state.request = request
        response = self.get_response(request)
        del state.request
        return response
