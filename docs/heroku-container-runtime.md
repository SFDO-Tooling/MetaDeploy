# Heroku container runtime

MetaDeploy is built and deployed via the [Heroku container runtime](https://devcenter.heroku.com/articles/build-docker-images-heroku-yml) rather than the legacy buildpacks slug. The container image is built from the repository's `Dockerfile` per the spec in `heroku.yml`, and the resulting image runs the `web`, `worker`, `worker-short`, and `devworker` dynos.

This page documents two things every operator of a MetaDeploy deployment should know:

1. How the container image is built and released.
2. How to keep the base image patched against published CVEs.

## Build and release

`heroku.yml` declares the build, release, and run commands. The relevant fields are:

```yaml
build:
  docker:
    web: Dockerfile
release:
  image: web
  command:
    - ./.heroku/release.sh
run:
  web: bash -c "exec daphne --bind 0.0.0.0 --port $PORT metadeploy.asgi:application"
  worker: ./manage.py rqworker default short
  worker-short: ./manage.py rqworker short
  devworker: ./manage.py rqworker default short --burst
```

Two paths produce a deployed container:

- **Heroku-built (preferred).** A push to a branch that is wired to a Heroku review-app pipeline, or a direct push to a tracked app, causes Heroku to clone the repo, run `docker build` against the `Dockerfile` declared in `heroku.yml`, run the `release.command` (`./.heroku/release.sh`, which does `python manage.py migrate --noinput`), then promote the new image to the dyno formation. This is the path the GitHub Actions CI exercises for review apps.
- **Locally built (fallback).** If Heroku's build queue is congested or the build environment is otherwise unavailable, you can build the image on your workstation and push it directly to the Heroku container registry:

  ```bash
  docker buildx build --platform linux/amd64 --build-arg BUILD_ENV=production \
      -t registry.heroku.com/<app>/web --load .
  heroku container:push web -a <app>
  heroku container:release web -a <app>
  ```

  **Caveat.** `heroku container:release` does **not** execute the `release.command` declared in `heroku.yml`. After a manual `container:release`, run the release script yourself before serving traffic:

  ```bash
  heroku run -a <app> -- bash ./.heroku/release.sh
  ```

  On Apple Silicon hosts the `--platform linux/amd64` flag is required so the resulting image runs on Heroku's amd64 dynos. QEMU emulation under Docker Desktop handles the cross-build transparently; expect the first build to take 5–10 minutes longer than a native build.

## Heroku Private Spaces note

In Heroku Private Spaces the `run` field in `heroku.yml` is **not** consulted to start the dyno. The container image's `CMD` is used instead. Because of this, the `Dockerfile`'s final `CMD` is kept aligned with the `web` `run` command above (`daphne` against `metadeploy.asgi:application`). If you change one, change the other in the same commit.

## CVE update mechanism

The base image is `python:3.12-slim-bookworm` (Debian 12 + CPython 3.12). Vulnerabilities published against CPython, Debian packages, the Node toolchain layer, or the system OpenSSL flow into the deployed image when it is rebuilt. We do **not** currently have automated rebuild-on-CVE plumbing for this repository (no Dependabot or scheduled GitHub Actions job that bumps the `FROM` tag and opens a PR). Until that is in place, follow the **manual rebuild cadence** below.

### Manual rebuild cadence

- **Trigger.** A maintainer rebuilds the image **at least monthly**, and additionally on any of: a Critical CVE against `python:3.12-slim-bookworm`, a Critical CVE against a major Debian package known to ship in the image (`openssl`, `libxml2`, `libcurl4`, `nodejs`), or an emergency advisory from Salesforce security.
- **Procedure.** Push a no-op or version-bump commit to the default branch and let the normal Heroku build pipeline rebuild from the latest base image:

  ```bash
  git commit --allow-empty -m "chore: rebuild image to pick up base-image CVE patches"
  git push origin main
  ```

  The Heroku review-app and staging build pulls the current `python:3.12-slim-bookworm` digest at build time, picking up any Debian / CPython / Node patches published since the previous build. After the staging dyno is healthy, promote the slug to production through the normal pipeline.
- **Verification.** After the rebuild, `heroku run -a <app> -- python -V` prints the current CPython point release, and `heroku run -a <app> -- dpkg -l openssl` shows the patched Debian package version. Spot-check against the upstream advisory.
- **Followup tracking.** When the cross-cutting [SFDO-Tooling apps restart roadmap](https://github.com/SFDO-Tooling) publishes an automated CVE-rebuild mechanism (cron-driven rebuild + redeploy, or a workflow that bumps the `FROM` tag and opens a PR), this repo should adopt it and this section should be replaced by a cross-reference.

## Local development

`docker-compose.yml` uses the same `Dockerfile` but with `BUILD_ENV=development` and overrides `CMD` to run the Django development server with hot reload. The production container behavior is not exercised by `docker-compose up`; if you need to verify the production image locally, run:

```bash
docker run --rm -e PORT=8000 -p 8000:8000 \
    -e DATABASE_URL=... -e REDIS_URL=... \
    registry.heroku.com/<app>/web
```
