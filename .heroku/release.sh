#!/usr/bin/env bash 
set -e

python manage.py migrate --noinput

# NOTIFY_REPO_OF_RELEASE should contain the
# owner/repo for a GitHub repository that 
# will be sent the heroku-release-phase event
if [ -n "$NOTIFY_REPO_OF_RELEASE" ] ; then
     repo="$NOTIFY_REPO_OF_RELEASE"
     echo "> Dispatching 'heroku-release-phase' event to: $repo"
     python .heroku/notify_github.py "$repo"
fi

echo "Done."
