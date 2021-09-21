======================
Development MetaDeploy
======================

Using Docker
------------

To set up MetaDeploy using Docker please
see the following instructions `<./docs/running_docker.rst>`_.

Using Local Machine
-------------------

MetaDeploy can be configured locally.
To achieve this follow the instructions provided in `<./docs/running.rst>`_.

Development Tasks
-----------------

To run these tests with Docker first run the following commands,

::

    docker-compose up -d
    docker-compose exec web bash

If you are not using Docker or are using the VS Code integrated terminal
inside the Docker container simply execute the commands in your project's
root directory:

- ``yarn serve``: starts development server (with watcher) at
  `<http://localhost:8080/>`_ (assets are served from ``dist/`` dir)
- ``yarn test:py``: run Python tests
- ``yarn test:py:integration``: run Python integration tests
- ``yarn test:js``: run JS tests
- ``yarn test:js:watch``: run JS tests with a watcher for development
- ``yarn lint``: formats and lints all files
- ``yarn lint:js``: formats, lints, and type-checks ``.js`` files
- ``yarn lint:sass``: formats and lints ``.scss`` files
- ``yarn lint:py``: formats and lints ``.py`` files
- ``yarn prettier:js``: formats ``.js`` files
- ``yarn lint:other``: formats ``.json``, ``.md``, and ``.yml`` files
- ``yarn tsc``: runs JS type-checking
- ``yarn build``: builds development (unminified) static assets into ``dist/``
  dir
- ``yarn prod``: builds production (minified) static assets into ``dist/prod/``
  dir


Commits
-------

In commit messages or pull request titles, we use the following emojis to label
which development commands need to be run before serving locally (these are
automatically prepended to commit messages):

- 📦 (``:package:``) -> ``make dev-install``
- 🛢 (``:oil_drum:``) -> ``python manage.py migrate``
- 🐈 (``:cat2:``) -> ``yarn``

Writing integration tests
-------------------------

For now, our Salesforce integration tests do not modify state on the
Salesforce side; they only test that they *could*. As such, we don't
need to generate scratch orgs to test against.

Instead, we will use some stable testing credentials for a stable test
org. If you are part of OddBirds, you can find them in keybase.

Internationalization
--------------------

To build and compile ``.mo`` and ``.po`` files for the backend, run::

   $ python manage.py makemessages --locale <locale>
   $ python manage.py compilemessages

These commands require the `GNU gettext toolset`_ (``brew install gettext``).

For the front-end, translation JSON files are served from
``locales/<language>/`` directories, and the `user language is auto-detected at
runtime`_.

During development, strings are parsed automatically from the JS, and an English
translation file is auto-generated to ``locales_dev/en/translation.json`` on
every build (``yarn build`` or ``yarn serve``). When this file changes,
translations must be copied over to the ``locales/en/translation.json`` file in
order to have any effect.

Strings with dynamic content (i.e. known only at runtime) cannot be
automatically parsed, but will log errors while the app is running if they're
missing from the served translation files. To resolve, add the missing key:value
translations to ``locales/<language>/translation.json``.

.. _GNU gettext toolset: https://www.gnu.org/software/gettext/
.. _user language is auto-detected at runtime: https://github.com/i18next/i18next-browser-languageDetector

Storybook Development Workflow
------------------------------

When doing development for the component library in Storybook,
use one of these two commands::

    $ ./derrick storybook  # if running outside of container
    $ yarn storybook  # if working in a remote container in VS Code

After running one of these commands, you can view the Storybook at
`<http://localhost:6006/>`_ in your browser.
