web: daphne --bind 0.0.0.0 --port $PORT metadeploy.asgi:application
devworker: python manage.py rqworker default short
scheduler: python manage.py rqscheduler default short
worker: python manage.py rqworker default
worker-short: python manage.py rqworker short
release: python manage.py migrate --noinput
