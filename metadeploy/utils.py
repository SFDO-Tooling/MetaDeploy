def get_remote_ip(request):
    """Get the IP address of the host that connected to Heroku

    (This may be a proxy, so don't assume it's the client's actual IP address.)
    """
    value = request.META.get("HTTP_X_FORWARDED_FOR") or request.META.get("REMOTE_ADDR")
    # X-Forwarded-For may be a list of multiple IP addresses.
    # The last one was added by Heroku so should be trustworthy.
    return value.split(",")[-1].strip()
