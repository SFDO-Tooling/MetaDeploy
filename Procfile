web: daphne --bind 0.0.0.0 --port $PORT metadeploy.asgi:application
scheduler: python manage.py rqscheduler default
worker: python manage.py rqworker default
release: python manage.py migrate --noinput
