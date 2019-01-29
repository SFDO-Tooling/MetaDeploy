from ipware import get_client_ip as get_ip_original


def get_client_ip(request, *args, **kwargs):
    """Retrieve the client's IP from a request object

    using the 'right most' proxy ordering in order to get the IP that originated
    the request to the Heroku LB.
    """
    return get_ip_original(request, *args, proxy_order="right_most", **kwargs)
