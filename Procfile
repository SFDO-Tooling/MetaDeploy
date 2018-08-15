web: gunicorn metadeploy.wsgi:application --preload
worker: python manage.py rqworker default
