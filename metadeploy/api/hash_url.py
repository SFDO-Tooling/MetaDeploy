import hashlib


def convert_org_id_to_key(org_id):
    """
    This isn't to securely hide the org id or anything;
    just to quickly make sure that we can use it as a Redis key.
    That is, to make sure it doesn't contain any characters
    Redis doesn't like.
    """
    return hashlib.sha1(org_id.encode("utf-8")).hexdigest()
