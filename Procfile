web: newrelic-admin run-program gunicorn metadeploy.wsgi:application --preload
worker: python manage.py rqworker default short
scheduler: python manage.py rqscheduler default short
