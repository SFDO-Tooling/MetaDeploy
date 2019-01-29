import logging
import time

from django.conf import settings
from log_request_id import (
    LOG_REQUESTS_SETTING,
    REQUEST_ID_RESPONSE_HEADER_SETTING,
    local,
)
from log_request_id.middleware import RequestIDMiddleware

from metadeploy import get_client_ip

logger = logging.getLogger(__name__)


class LoggingMiddleware(RequestIDMiddleware):
    def process_request(self, request):
        local.start_time = time.time()
        request_id = self._get_request_id(request)
        local.request_id = request_id
        request.id = request_id

    def process_response(self, request, response):
        """
        Inlined and modified from log_request_id.middleware.

        Modified to add more elements to the message, while the request is available.
        """
        if getattr(settings, REQUEST_ID_RESPONSE_HEADER_SETTING, False) and getattr(
            request, "id", None
        ):
            response[getattr(settings, REQUEST_ID_RESPONSE_HEADER_SETTING)] = request.id

        if not getattr(settings, LOG_REQUESTS_SETTING, False):  # pragma: nocover
            return response

        # Don't log favicon
        if "favicon" in request.path:  # pragma: nocover
            return response

        user = getattr(request, "user", None)
        user_id = getattr(user, "pk", None) or getattr(user, "id", None)
        ip_str, _ = get_client_ip(request)
        if not ip_str:  # pragma: nocover
            ip_str = (
                "unknown"
            )  # on the mysterious chance that the request has no IP, don't screw up.

        message = "method=%s path=%s status=%s source_ip=%s user_agent=%s time=%s"
        args = (
            request.method,
            request.path,
            response.status_code,
            ip_str,
            repr(request.META.get("HTTP_USER_AGENT", "unknown")),
            time.time() - local.start_time,
        )

        if user_id:
            message += " user=%s"
            args += (user_id,)

        logger.info(message, *args)

        try:
            del local.request_id
        except AttributeError:  # pragma: nocover
            pass

        return response
