web: yarn django:serve:prod
devworker: python manage.py rqworker default short
scheduler: python manage.py rqscheduler --queue short
worker: python manage.py rqworker default
worker-short: python manage.py rqworker short
release: python manage.py migrate --noinput
