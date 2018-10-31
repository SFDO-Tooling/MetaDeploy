Development Setup
=================

Cloning the project
-------------------

::

    git clone git@github.com:SFDO-Tooling/metadeploy
    cd metadeploy

Making a virtual env
--------------------

MetaDeploy development requires Python v3.6. If ``which python3.6`` returns a
non-empty path, it's already installed and you can continue to the next step. If
it returns nothing, then install Python v3.6 using
``brew install https://raw.githubusercontent.com/Homebrew/homebrew-core/f2a764ef944b1080be64bd88dca9a1d80130c558/Formula/python.rb``,
or from `Python.org`_.

.. _Python.org: https://www.python.org/downloads/

There are a variety of tools that let you set up environment variables
temporarily for a particular "environment" or directory. We use
`virtualenvwrapper`_. Assuming you're in the repo root, do the following to
create a virtualenv (once you have `virtualenvwrapper`_ installed locally)::

    mkvirtualenv metadeploy --python=$(which python3.6)
    setvirtualenvproject

Copy the ``.env`` file somewhere that will be sourced when you need it::

    cp env.example $VIRTUAL_ENV/bin/postactivate

Edit this file to change ``DJANGO_SECRET_KEY`` to any arbitrary string value,
and to edit the following environment variables (if you're an OddBird, you can
find these values in the shared Keybase team folder -- ``metadeploy/env``)::

    export BUCKETEER_AWS_ACCESS_KEY_ID=...
    export BUCKETEER_AWS_SECRET_ACCESS_KEY=...
    export BUCKETEER_BUCKET_NAME=...
    export CONNECTED_APP_CLIENT_SECRET=...
    export CONNECTED_APP_CALLBACK_URL=...
    export CONNECTED_APP_CLIENT_ID=...
    export GITHUB_TOKEN=...

Now run ``workon metadeploy`` again to set those environment variables.

Your ``PATH`` (and environment variables) will be updated when you
``workon metadeploy`` and restored when you ``deactivate``. This will make sure
that whenever you are working on MD, you use the MD-specific version of Node
instead of any system-wide Node you may have.

**All of the remaining steps assume that you have the virtualenv activated
(``workon metadeploy``).**

.. _virtualenvwrapper: https://virtualenvwrapper.readthedocs.io/en/latest/

Installing Python requirements
------------------------------

::

    pip install -r requirements/local.txt

Installing JavaScript requirements
----------------------------------

The project-local version of `Node.js`_ is bundled with the repo and can be
unpacked locally (in the git-ignored ``node/`` directory), so you don't have to
install it system-wide (and possibly conflict with other projects wanting other
Node versions).

To install the project-local version of Node (and `yarn`_)::

    bin/unpack-node

If you can run ``which node`` and see a path inside your MD repo ending with
``.../node/bin/node``, then you've got it set up right and can move on.

Then use ``yarn`` to install dependencies::

    yarn

.. _Node.js: http://nodejs.org
.. _yarn: https://yarnpkg.com/

Setting up the database
-----------------------

Assuming you have `Postgres <https://www.postgresql.org/download/>`_ installed
and running locally::

    createdb metadeploy

Then run the initial migrations::

    python manage.py migrate

If your database has outdated sample data for development, remove it with::

    python manage.py truncate_data

To populate the database with sample data for development, run::

    python manage.py populate_data

Running the server
------------------

The local development server requires `Redis <https://redis.io/>`_ to manage
background worker tasks. If you can successfully run ``redis-cli ping`` and see
output ``PONG``, then you have Redis installed and running. Otherwise, run
``brew install redis`` (followed by ``brew services start redis``) or refer to
the `Redis Quick Start`_.

To run the local development server::

    yarn serve

The running server will be available at `<http://localhost:8080/>`_.

.. _Redis Quick Start: https://redis.io/topics/quickstart

Logging in with Salesforce
--------------------------

To setup the Salesforce OAuth integration, run the ``populate_social_apps``
management command. The values to use in place of the ``XXX` and ``YYY`` flags
can be found on the Connected App you've made in your Salesforce configuration,
or if you're an OddBird, you can find these values in the shared Keybase team
folder (``metadeploy/prod.db``)::

    python manage.py populate_social_apps --prod-id XXX --prod-secret YYY

You can also run it with ``--test-id`` and ``--test-secret``, or
``--cust-id`` and ``--cust-secret``, or all three sets at once, to
populate all three providers.

If you don't have a Salesforce account, ask `Kit <mailto:kit@oddbird.net>`_ to
send you an invitation by email.

Once you've logged in, you probably want to make your user a superuser.
You can do that easily via the ``promote_superuser`` management
command::

    python manage.py promote_superuser <your email>

Development Tasks
-----------------

- ``yarn serve``: starts development server (with watcher) at
  `<http://localhost:8080/>`_ (assets are served from ``dist/`` dir)
- ``yarn pytest``: run Python tests
- ``yarn test``: run JS tests
- ``yarn test:watch``: run JS tests with a watcher for development
- ``yarn lint``: formats and lints ``.scss`` and ``.js`` files; lints ``.py``
  files
- ``yarn prettier``: formats ``.scss`` and ``.js`` files
- ``yarn eslint``: lints ``.js`` files
- ``yarn stylelint``: lints ``.scss`` files
- ``yarn flake8``: lints ``.py`` files
- ``yarn build``: builds development (unminified) static assets into ``dist/``
  dir
- ``yarn prod``: builds production (minified) static assets into ``dist/prod/``
  dir

In commit messages or pull request titles, we use the following emojis to label
which development commands need to be run before serving locally (these are
automatically prepended to commit messages):

- 📦 (``:package:``) -> ``pip install -r requirements/local.txt``
- 🛢 (``:oil_drum:``) -> ``python manage.py migrate``
- 🐈 (``:cat2:``) -> ``yarn``
- 🙀 (``:scream_cat:``) -> ``rm -rf node_modules/; bin/unpack-node; yarn``
