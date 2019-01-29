from functools import partial

from ipware import get_client_ip as get_ip_original

get_client_ip = partial(get_ip_original, proxy_order="right_most")
get_client_ip.__name__ = "get_client_ip"
get_client_ip.__doc__ = (
    "Retrieve the client's IP from a request object.\n\n"
    "using the 'right most' proxy ordering in order to get the IP that originated "
    "the request to the Heroku LB."
)
