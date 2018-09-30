web: newrelic-admin run-program gunicorn metadeploy.wsgi:application --preload
worker: newrelic-admin run-python manage.py rqworker default short
scheduler: newrelic-admin run-python manage.py rqscheduler default short
