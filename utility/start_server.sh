#!/bin/bash

# running django database migrations 
python /app/manage.py migrate
# creating test data if local settings are configured
if [ "${DJANGO_SETTINGS_MODULE}" = "config.settings.local" ] ; then
    echo "CREATING ADMIN USER FOR TESTING PURPOSES..."
    # Using key error as an indicator for whether or not to run database population and job scheduling scripts
    echo "from django.contrib.auth import get_user_model; User = get_user_model(); User.objects.create_superuser('admin', 'admin@example.com', 'password')" | python manage.py shell
    if [ $? -eq 0 ] ; then
        # populating database with test repository, done only once
        echo "POPULATING DATABASE WITH TEST DATA..."
        python /app/manage.py populate_db;
        # running job scheduler 
        python /app/manage.py metaci_scheduled_jobs;
        # populating socialApp records
        python /app/manage.py populate_social_apps --prod-id "${CONNECTED_APP_CLIENT_ID}" --prod-secret "${CONNECTED_APP_CLIENT_SECRET}";
    else
        # Redirect stdout from echo command to stderr.
        echo "Admin user has already been created."
    fi
fi
# starting server and webpack
yarn serve

