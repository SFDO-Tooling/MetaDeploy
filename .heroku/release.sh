#!/usr/bin/env bash 
set -e

if [ -n "$CTC_URL" ] ; then
     # Run migration surrounded by CTC start/stop
     python .heroku/check_change_traffic_control.py
else
     # Simply run the migration
     python manage.py migrate --noinput
fi

# TODO: RELEASE_TEST_ENABLED should be set to "True" (case insensitive)
if [ -n "$RELEASE_TEST_ENABLED" ]; then
     echo "Release tests enabled. Scheduling tests now."
     python .heroku/schedule_release_test.py 
fi


echo "Done."
