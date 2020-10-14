web: daphne --bind 0.0.0.0 --port $PORT metadeploy.asgi:application
devworker: honcho start -f Procfile_devworker
worker: python manage.py rqworker default
worker-short: honcho start -f Procfile_worker_short
release: ./heroku/release.sh 