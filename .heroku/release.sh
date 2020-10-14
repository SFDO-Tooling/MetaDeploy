#!/usr/bin/env bash 
set -e

python manage.py migrate --noinput

if [ -n "$test_on_release" ] ;
then
     echo "Dispatching heroku-release-phase event."
     repo=$GITHUB_REPO
     token=$GITHUB_TOKEN
     curl -X POST \

          -H "Accept: application/vnd.github.v3+json" \
          -H "Authorization: Bearer $token" \

          https://api.github.com/repos/$repo/dispatches \

          -d '{"event_type":"heroku-release-phase"}'
else
     echo "Environment variable test_on_release not set."
fi

echo "Done."
