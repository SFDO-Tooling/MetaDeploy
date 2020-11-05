class GetScratchOrgIdFromQueryStringMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        scratch_org_id = request.GET.get("scratch_org_id", None)
        if scratch_org_id:
            session = request.session
            session["scratch_org_id"] = scratch_org_id
            session.save()
        response = self.get_response(request)
        return response
