#!/bin/sh 
set -e

if [ -n "$CTC_URL" ] ; then
     # Run migration surrounded by CTC start/stop
     python .heroku/check_change_traffic_control.py
else
     # Simply run the migration
     python manage.py migrate --noinput
fi

if [ $RELEASE_TEST_ENABLED = true ]; then
     echo "Release tests enabled. Scheduling tests now."
     python .heroku/schedule_release_test.py 
fi


echo "Done."
