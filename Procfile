web: newrelic-admin run-program daphne --bind 0.0.0.0 --port $PORT metadeploy.asgi:application
worker: newrelic-admin run-python manage.py rqworker default short
scheduler: newrelic-admin run-python manage.py rqscheduler default short
