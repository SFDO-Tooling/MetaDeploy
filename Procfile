web: daphne --bind 0.0.0.0 --port $PORT metadeploy.asgi:application
devworker: honcho start -f Procfile_devworker
worker: sh .heroku/start_metadeploy_worker.sh
worker-short: honcho start -f Procfile_worker_short
release: ./.heroku/release.sh 
