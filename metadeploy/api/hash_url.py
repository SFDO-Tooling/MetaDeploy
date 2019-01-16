import hashlib


def convert_org_url_to_key(url):
    """
    This isn't to securely hide the URL or anything; just to quickly make sure that we
    can use it as a Redis key. That is, to make sure it doesn't contain any characters
    Redis doesn't like.
    """
    return hashlib.sha1(url.encode("utf-8")).hexdigest()
