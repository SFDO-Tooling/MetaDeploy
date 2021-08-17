#!/usr/bin/env bash 
set -e

python manage.py migrate --noinput

if [ -n "$CTC_URL" ] ; then
     echo "> Checking change traffic control..."
     python .heroku/check_change_traffic_control.py
fi

echo "Done."
