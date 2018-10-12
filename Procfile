web: newrelic-admin run-program daphne metadeploy.asgi:application
worker: newrelic-admin run-python manage.py rqworker default short
scheduler: newrelic-admin run-python manage.py rqscheduler default short
