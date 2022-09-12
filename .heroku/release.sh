#!/bin/sh 
set -e

if [ -n "$CTC_URL" ] ; then
     # Run migration surrounded by CTC start/stop
     python .heroku/check_change_traffic_control.py
else
     # Simply run the migration
     python manage.py migrate --noinput
fi

if [ -n "$RELEASE_TEST_ENABLED" ]; then
     echo "Release tests enabled. Scheduling tests now."
     python manage.py schedule_release_test
fi


echo "Done."
