#!/usr/bin/env bash

python manage.py migrate --noinput

set -e

repo=$GITHUB_REPO
token=$GITHUB_TOKEN

curl -X POST \

     -H "Accept: application/vnd.github.v3+json" \
     -H "Authorization: Bearer $token" \

     https://api.github.com/repos/$repo/dispatches \

     -d '{"event_type":"production-smoke-test",
       "client_payload":{
        "review_app_url": "https://$app.herokuapp.com",
        "PR_NUM": "$pr"
       }
      }'

echo "Done."
