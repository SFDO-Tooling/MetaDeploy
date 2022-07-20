# Development MetaDeploy

## Using Docker

To set up MetaDeploy using Docker please see the following instructions
[./docs/running_docker.md](./docs/running_docker.md).

## Using Local Machine

MetaDeploy can be configured locally. To achieve this follow the instructions
provided in [./docs/running.md](./docs/running.md).

## Development Tasks

To run these tests with Docker first run the following commands,

    docker-compose up -d
    docker-compose exec web bash

If you are not using Docker or are using the VS Code integrated terminal inside
the Docker container simply execute the commands in your project's root
directory:

- `yarn serve`: starts development server (with watcher) at
  <http://localhost:8080/> (assets are served from `dist/` dir)
- `yarn test:py`: run Python tests
- `yarn test:py:integration`: run Python integration tests
- `yarn test:js`: run JS tests
- `yarn test:js:watch`: run JS tests with a watcher for development
- `yarn lint`: formats and lints all files
- `yarn lint:js`: formats, lints, and type-checks `.js` files
- `yarn lint:sass`: formats and lints `.scss` files
- `yarn lint:py`: formats and lints `.py` files
- `yarn prettier:js`: formats `.js` files
- `yarn lint:other`: formats `.json`, `.md`, and `.yml` files
- `yarn tsc`: runs JS type-checking
- `yarn build`: builds development (unminified) static assets into `dist/` dir
- `yarn prod`: builds production (minified) static assets into `dist/prod/` dir

## Writing integration tests

For now, our Salesforce integration tests do not modify state on the Salesforce
side; they only test that they _could_. As such, we don't need to generate
scratch orgs to test against.

Instead, we will use some stable testing credentials for a stable test org.

## Internationalization

To build and compile `.mo` and `.po` files for the backend, run:

    $ python manage.py makemessages --locale <locale>
    $ python manage.py compilemessages

These commands require the
[GNU gettext toolset](https://www.gnu.org/software/gettext/)
(`brew install gettext`).

For the front-end, translation JSON files are served from `locales/<language>/`
directories, and the
[user language is auto-detected at runtime](https://github.com/i18next/i18next-browser-languageDetector).

During development, strings are parsed automatically from the JS, and an English
translation file is auto-generated to `locales_dev/en/translation.json` on every
build (`yarn build` or `yarn serve`). When this file changes, translations must
be copied over to the `locales/en/translation.json` file in order to have any
effect.

Strings with dynamic content (i.e. known only at runtime) cannot be
automatically parsed, but will log errors while the app is running if they're
missing from the served translation files. To resolve, add the missing key:value
translations to `locales/<language>/translation.json`.

## Storybook Development Workflow

When doing development for the component library in Storybook, use the following
command:

    $ yarn storybook

After running, you can view the Storybook at <http://localhost:6006/> in your
browser.

## Multi-tenancy

A single MetaDeploy instance is capable of serving multiple domains while
storing completely independent sets of Products, Versions, and Plans. This is
possible because most models have a foreign key to Django's `Site` model and the
application filters down the objects by matching the request host with the
corresponding Site instance (see `metadeploy.multitenancy`).

This multi-tenancy feature is enabled at all times, and you can create new Sites
by following these steps:

- Visit the `Sites` section in the Django admin and ensure the first Site record
  matches the domain you are using, including the port (in development this will
  be `localhost:8080`).
- Add an additional Site record for each domain you want to serve. In
  development, you can use the un-proxied url `localhost:8000` (notice the port
  is different here, so this is treated as a different domain) or a domain
  provided by [ngrok](https://ngrok.com/). Remember to add new domains to the
  `DJANGO_ALLOWED_HOSTS` and `ADMIN_API_ALLOWED_SUBNETS` env vars.
- Add a new callback URL for each new Site to the relevant Salesforce Connected
  App to ensure users can log in via Salesforce from any domain.

### User accounts

User accounts are global, not site-scoped. When users log in with their
Salesforce account they will be authenticated with the same User instance across
different Sites. Keep in mind that users will still need to reauthenticate if
they visit a different domain because cookies and sessions cannot be shared
across domains.

### Admin usage

Regular staff users will only have access to the objects related to the Site
they are currently visiting. Superusers will notice a new "site selector" at the
top of the Django admin. As a convenience, they can choose any Site record from
this dropdown to instantly manage the objects on a different Site without having
to log in from a different domain.

### API & front-end usage

All endpoints and user-facing pages (for both the public and admin APIs) will
only have access to the objects associated with their Site. In these contexts
there is no "site selector"; the current site is determined by the host from
which users make the request.

The Token authentication method is still available as an alternative to
cookie-based sessions, but keep in mind that Tokens are site-scoped. This means
the same user will have different tokens for different domains. A self-service
endpoint is available at `/api/token/` -- it accepts a `username` and `password`
payload and returns the token to authenticate further requests.

### Command line usage

By default, all `manage.py` commands will be executed on the Site that matches
`settings.SITE_ID` (usually the very first Site record). To execute a command on
a different site, set the `DJANGO_SITE_ID` env var:

```bash
DJANGO_SITE_ID=2 python manage.py shell
# Use the shell to interact with objects on the Site with `id=2`
```

To completely disable site filtering and have access to all objects across all
sites, you can set `DJANGO_SITE_FILTERING_DISABLED=true` instead. Keep in mind
that without care this could leave the database in a broken state, with some
objects pointing to related elements that don't exist on their own site.
