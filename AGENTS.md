# Agent instructions for MetaDeploy

This file is consumed by AI coding agents (Claude Code, Cursor, GitHub Copilot Workspace, others) at session start. It captures durable operational knowledge that is not obvious from reading the code.

If you are an agent and the user asks you to operate this repository, read this file first. If a section disagrees with what you observe, trust what you observe and propose an update to this file.

## Repository orientation

- MetaDeploy is a Django + React app with a job-runner backend (`worker`, `worker-short`) that runs CumulusCI installation plans against customer Salesforce orgs.
- The frontend is in `src/js/` (React + Redux + i18n via `i18next`); the backend is in `metadeploy/` (Django + DRF + django-rq + django-allauth + Channels via daphne).
- Production deploys to Heroku under team `sfdc-sfdo-releng`. Pipeline `metadeploy` includes `metadeploy-stg` (staging) and `metadeploy` (production); `sfdo-se-install` is a sibling production app for an SE-install variant.
- Tests: backend uses `pytest`; frontend uses `jest`. Lint: `flake8` / `ruff` for Python; `eslint` / `prettier` for JS/TS. CI runs on GitHub Actions (`.github/workflows/test.yml`).

## Heroku gotchas that have actually burned operators

These are non-obvious behaviors specific to how MetaDeploy is deployed.

### `heroku config:set` is asynchronous and goes through release-phase

Every `heroku config:set` against a MetaDeploy app creates a new release that runs `./.heroku/release.sh` as release-phase (the script runs Django migrations). **The change is not live until release-phase exits 0.** `heroku config:get` returns the *current* release's value, not the value you just queued.

Practical consequences:

- After `heroku config:set ...`, do not validate by `heroku config:get` immediately. Check `heroku releases --app <app>` and wait for the new version to appear at the top as `Current: vXXXX`. Release-phase typically takes 30s–2min on a healthy app; longer if the dyno is sick or migrations are heavy.
- **Never use a sentinel-test pattern** (set an obviously-wrong value to confirm the API works, then set the real value back). On release-phase apps, the sentinel release will eventually go live and break downstream services that read the var. `CONNECTED_APP_CLIENT_KEY` is the canonical example: a sentinel briefly going live takes OAuth offline.
- Several rapid `config:set` calls queue several releases. They drain in order. The final live value is whichever release's phase succeeds last.
- To inspect what is queued in an in-flight release: `heroku releases:info v<version> --app <app>` shows the queued config. The `Current:` line at the top of `heroku releases` is the ground truth for what is live.

### Heroku app names get a unique suffix

New Heroku apps get a 12-char hex suffix on the `*.herokuapp.com` hostname (e.g. `sfdo-metadeploy-dev-bfc619acb610.herokuapp.com`). The Connected App `CONNECTED_APP_CALLBACK_URL` and `DJANGO_ALLOWED_HOSTS` must use the suffixed hostname. The git remote name (`https://git.heroku.com/<app-name>.git`) does **not** include the suffix.

## Connected App / OAuth

- The Connected App that backs OAuth lives in dev hub `felix` (`00D460000017Fel`) and is named `Salesforce_Delivery_Cloud_Pre_Production`. Multiple services share it; do not edit its callback URL list without checking with the user first.
- The Salesforce Connected App "Callback URL" field validates the **whole list** on every save. Adding one entry can fail the save because of an already-stale entry elsewhere in the list. If validation rejects an entry, suspect the rejected entry first, not the one you are trying to add.
- `CONNECTED_APP_CALLBACK_URL` (Django config var) must match the callback URL registered on the Connected App **byte for byte**, including the trailing slash. allauth is slash-sensitive.

## Branch and PR conventions

- Branch names are descriptive of the work (`feature/<topic>`, `fix/<topic>`, `chore/<topic>`, `docs/<topic>`). Do not name branches after plan phases.
- PRs to `main` require CI green and review.
- The `restart/phase-0-spike` branch (PR #3588) is in flight as of mid-May 2026; it switches the deploy to Heroku container runtime and pins `python:3.12-slim-bookworm`. Until that lands, `main` builds use the legacy buildpack stack.

## What this file is not

- Not a substitute for reading `CONTRIBUTING.md` or the docs under `docs/`. They are the canonical references; this file points at non-obvious operational gotchas.
- Not a place for ephemeral task state, in-flight plans, or commit-message conventions. Those belong in working files, plans, or commit history.
