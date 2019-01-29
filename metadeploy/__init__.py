from functools import partial

from ipware import get_client_ip as get_ip_original

get_client_ip = partial(get_ip_original, proxy_order="right_most")
