#!/usr/bin/env bash 
set -e

python manage.py migrate --noinput

# NOTIFY_REPO_OF_RELEASE should contain the
# owner/repo for a GitHub repository that 
# will be sent the heroku-release-phase event
if [ -n "$NOTIFY_REPO_OF_RELEASE" ] ; then

     repo=$NOTIFY_REPO_OF_RELEASE
     token=$GITHUB_TOKEN

     echo "> Dispatching 'heroku-release-phase' event to: $repo"

     curl -X POST \
          https://api.github.com/repos/$repo/dispatches \
          -H "Accept: application/vnd.github.v3+json" \
          -H "Authorization: Bearer $token" \
          -d '{"event_type":"heroku-release-phase"}'
fi

echo "Done."
