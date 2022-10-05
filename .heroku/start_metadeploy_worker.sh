set -e
mkdir -p /opt/google/chrome
ln -s /app/.apt/usr/bin/google-chrome /opt/google/chrome/chrome
python manage.py rqworker default
