web: newrelic-admin run-program daphne --bind 0.0.0.0 --port $PORT metadeploy.asgi:application
devworker: newrelic-admin run-python manage.py rqworker default short
scheduler: newrelic-admin run-python manage.py rqscheduler default short
worker: newrelic-admin run-python manage.py rqworker default
worker-short: newrelic-admin run-python manage.py rqworker short
release: python manage.py migrate --noinput
