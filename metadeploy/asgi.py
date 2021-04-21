"""
ASGI entrypoint. Configures Django and then runs the application
defined in the ASGI_APPLICATION setting.
"""

import os
import sys

import django
from channels.routing import get_default_application
from newrelic import agent

# newrelic patches sqlite in a way that interferes with coverage reporting
if "pytest_cov" not in sys.modules:  # pragma: no cover
    agent.initialize()
    agent.wrap_web_transaction("django.core.handlers.base", "BaseHandler.get_response")

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")

django.setup()

application = get_default_application()
