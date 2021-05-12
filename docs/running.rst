===============================
Local Machine Development Setup
===============================

Cloning The Project
===================

::

    git clone git@github.com:SFDO-Tooling/MetaDeploy
    cd MetaDeploy

Making A Virtual Env
====================

MetaDeploy development requires Python v3.8. If ``which python3.8`` returns a
non-empty path, it's already installed and you can continue to the next step. If
it returns nothing, then install Python v3.8 using ``brew install python``, or
from `Python.org`_.

.. _Python.org: https://www.python.org/downloads/

There are a variety of tools that let you set up environment variables
temporarily for a particular "environment" or directory. We use
`virtualenvwrapper`_. Assuming you're in the repo root, do the following to
create a virtualenv (once you have `virtualenvwrapper`_ installed locally)::

    mkvirtualenv metadeploy --python=$(which python3.8)
    setvirtualenvproject

Install Python requirements::

    make dev-install

Copy the ``.env`` file somewhere that will be sourced when you need it::

    cp env.example $VIRTUAL_ENV/bin/postactivate

Edit this file to change ``DJANGO_SECRET_KEY`` and ``DJANGO_HASHID_SALT`` to any
two different arbitrary string values. Also set ``DB_ENCRYPTION_KEY``::

    python manage.py shell
    from cryptography.fernet import Fernet
    Fernet.generate_key()

This will output a bytestring, e.g. ``b'mystring='``. Copy just the contents of
``'...'``, e.g. ``export DB_ENCRYPTION_KEY='mystring='``.

Finally, edit the following environment variables (if you're an OddBird, you can
find these values in the shared Keybase team folder -- ``metadeploy/env``)::

    export SFDX_CLIENT_SECRET=...
    export SFDX_CLIENT_CALLBACK_URL=...
    export SFDX_CLIENT_ID=...
    export SFDX_HUB_KEY=...
    export GITHUB_APP_ID=...
    export GITHUB_APP_KEY=...

Now run ``workon metadeploy`` again to set those environment variables.

Your ``PATH`` (and environment variables) will be updated when you
``workon metadeploy`` and restored when you ``deactivate``. This will make sure
that whenever you are working on MD, you use the MD-specific version of Node
instead of any system-wide Node you may have.

**All of the remaining steps assume that you have the virtualenv activated.**
(``workon metadeploy``)

.. _virtualenvwrapper: https://virtualenvwrapper.readthedocs.io/en/latest/

Installing JavaScript Requirements
==================================

The project-local version of `Node.js`_ can be downloaded and unpacked locally
(in the git-ignored ``node/`` directory), so you don't have to install it
system-wide (and possibly conflict with other projects wanting other Node
versions).

To download and install the project-local version of Node (and `yarn`_)::

    bin/unpack-node

If you can run ``which node`` and see a path inside your MD repo ending with
``.../node/bin/node``, then you've got it set up right and can move on.

Then use ``yarn`` to install dependencies::

    yarn

.. _Node.js: http://nodejs.org
.. _yarn: https://yarnpkg.com/

Setting Up The Database
=======================

Assuming you have `Postgres <https://www.postgresql.org/download/>`_ installed
and running locally::

    createdb metadeploy

Then run the initial migrations::

    python manage.py migrate

If your database has outdated sample data for development, remove it with::

    python manage.py truncate_data

To populate the database with sample data for development, run::

    python manage.py populate_data


Creating A Superuser
====================

To use the Django admin UI, you'll need to create a superuser::

    ./manage.py createsuperuser

You'll want to login to your user through the Admin URL rather
than through the visible login button.

    http://localhost:8000/admin/login

Running The Server
==================

The local development server requires `Redis <https://redis.io/>`_ to manage
background worker tasks. If you can successfully run ``redis-cli ping`` and see
output ``PONG``, then you have Redis installed and running. Otherwise, run
``brew install redis`` (followed by ``brew services start redis``) or refer to
the `Redis Quick Start`_.

To run the local development server::

    yarn serve

This starts a process running Django, a process running Node, and an ``rq`` worker process.
The running server will be available at `<http://localhost:8080/>`_.

.. _Redis Quick Start: https://redis.io/topics/quickstart

Logging in with Salesforce
==========================

Once you've logged in, you probably want to make your user a superuser.
You can do that easily via the ``promote_superuser`` management
command::

    python manage.py promote_superuser <your email>
