#!/bin/sh 
set -e

if [ -n "$CTC_URL" ] ; then
     # Run migration surrounded by CTC start/stop
     python .heroku/check_change_traffic_control.py
else
     # Simply run the migration
     python manage.py migrate --noinput
fi

# RELEASE_TEST_ENABLED needs to be set to 'True' (case-insensitive).
LOWER_CASE = $(echo $RELEASE_TEST_ENABLED | tr [:upper:] [:lower:])
if [ $LOWER_CASE = true ]; then
     echo "Release tests enabled. Scheduling tests now."
     python .heroku/schedule_release_test.py 
fi


echo "Done."
