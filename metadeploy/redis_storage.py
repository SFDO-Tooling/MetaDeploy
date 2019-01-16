""" RedisStorage is a Naive Django Storage (TM)

It stores your blobs in ....what's not really a blob store, redis!
"""

import base64
import mimetypes
from datetime import datetime
from functools import partialmethod

import redis
from django.conf import settings
from django.core.files.base import ContentFile, File
from django.core.files.storage import Storage
from django.utils import timezone
from django.utils.deconstruct import deconstructible
from django_rq.queues import get_redis_connection

REDIS_MAX: int = 512_000_000  # this is the largest allowable value
DEFAULT_MAX: int = 1_600_000  # this is the default allowable file size
TOTAL_MULTIPLY: int = 100  # used as allocation multiplier


@deconstructible
class RedisStorage(Storage):
    """RedisStorage implements Django Storage by shoving file contents into Redis keys.
    This is inelegant, but often useful for local and test development,
    where Redis is already there.

    Not Implemented: listdir, path (directory structures)
    """

    key_namespace: str = "djtempstore"
    key_format: str = "{ns}:{prefix}:{type}:{name}"

    def __init__(self, config: dict = None):
        if not config:
            config = settings.REDIS_STORAGE_CONFIG
        self.redis: redis.StrictRedis = get_redis_connection(config, True)
        self.max_size: int = config.get("MAX_SIZE", DEFAULT_MAX)
        if self.max_size > REDIS_MAX:
            self.max_size = REDIS_MAX

        self.total_allocation: int = config.get(
            "TOTAL_ALLOCATION", self.max_size * TOTAL_MULTIPLY
        )
        self.key_prefix: str = config.get("KEY_PREFIX", "default")

    def delete(self, name: str):
        """ Deletes the file referenced by name. """
        self.redis.delete(self.blob_key(name), self.metadata_key(name))

    def exists(self, name: str):
        """ Returns True if a file referenced by the given name already exists in the
        storage system, or False if the name is available for a new file.
        """
        return self.redis.hexists(
            self.metadata_key(name), "size"
        ) and self.redis.exists(self.blob_key(name))

    def get_accessed_time(self, name) -> datetime:
        """ Returns a datetime of the last accessed time of the file.
        """
        return self.redis.hget(self.metadata_key(name), "accessed_at")

    def get_created_time(self, name):
        """
        Return the creation time (as a datetime) of the file specified by name.
        """
        return self.redis.hget(self.metadata_key(name), "created_at")

    def get_modified_time(self, name):
        """
        Return the last modified time (as a datetime) of the file specified by
        """
        return self.redis.hget(self.metadata_key(name), "modified_at")

    def size(self, name):
        """
        Return the total size, in bytes, of the file specified by name.
        """
        return self.redis.hget(self.metadata_key(name), "size")

    def url(self, name):
        """
        Return an absolute URL where the file's contents can be accessed
        directly by a Web browser.
        """
        file = self.open(name)
        mime = self.redis.hget(self.metadata_key(name), "mime").decode()
        return f"data:{mime};base64,{base64.b64encode(file.read()).decode()}"

    def _open(self, name, mode) -> ContentFile:
        """Retrieve the specified file from storage."""
        raw = self.redis.get(self.blob_key(name))
        file = ContentFile(raw, name)
        self.redis.hincrby(self.metadata_key(name), "accesses", 1)
        self.redis.hset(self.metadata_key(name), "accessed_at", timezone.now())
        return file

    def _save(self, name, content: File):
        """
        Save new content to the file specified by name.

        The content is already a django.File, and the name is from get_available_name.
        """
        content = ContentFile(
            content.read(), name
        )  # "cast" to a ContentFile, designed for in memory use
        content.open()  # seek to 0
        key_was_set = self.redis.set(self.blob_key(name), content.read())
        metadata_was_set = self.redis.hmset(
            self.metadata_key(name), self.metadata(name, content)
        )
        assert key_was_set, "Setting the key failed, somehow."
        assert metadata_was_set, "Setting the metadata failed, somehow."
        return name

    def _format(self, type_=None, name=None):
        # curried by blob_key & metadata_key
        return self.key_format.format(
            ns=self.key_namespace, prefix=self.key_prefix, type=type_, name=name
        )

    def metadata(self, name, content):
        return {
            "size": content.size,
            "created_at": timezone.now(),
            "modified_at": timezone.now(),
            "accessed_at": None,
            "accesses": 0,
            "mime": mimetypes.guess_type(name)[0],
        }

    blob_key = partialmethod(_format, "blob")
    metadata_key = partialmethod(_format, "metadata")
