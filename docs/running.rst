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

MetaDeploy development requires Python v3.9. If ``which python3.9`` returns a
non-empty path, it's already installed and you can continue to the next step. If
it returns nothing, then install Python v3.9 using ``brew install python``, or
from `Python.org`_.

.. _Python.org: https://www.python.org/downloads/

Assuming you're in the repo root, do the following to create a virtualenv (once
you have `virtualenvwrapper`_ installed locally)::

    mkvirtualenv metadeploy --python=$(which python3.9)
    setvirtualenvproject

Install Python requirements::

    make dev-install

Create an ``.env`` file with the required environment variables::

    cp env.example .env

Edit this file to change ``DJANGO_SECRET_KEY`` and ``DJANGO_HASHID_SALT`` to
any two different arbitrary string values.

Next, run the following commands to generate a database encryption key::

    python
    >>> from cryptography.fernet import Fernet
    >>> Fernet.generate_key()

This will output a bytestring, e.g. ``b'mystring='``. Copy only the contents
of ``'...'``, and add it to your ``.env`` file as ``DB_ENCRYPTION_KEY``, e.g.
``DB_ENCRYPTION_KEY="mystring="``.

To exit the Python shell, press ``Ctrl-Z`` and then ``Enter`` on Windows, or
``Ctrl-D`` on OS X or Linux. Alternatively, you could also type the Python
command ``exit()`` and press ``Enter``.

Set the following environment variables::

    SFDX_CLIENT_SECRET=...
    SFDX_CLIENT_CALLBACK_URL=...
    SFDX_CLIENT_ID=...
    SFDX_HUB_KEY=...
    DEVHUB_USERNAME=...

Finally, MetaDeploy needs a connection to the GitHub API to fetch repositories
for installation. This can be set up using a personal GitHub account by
providing your personal access token as ``GITHUB_TOKEN`` *or* by using a GitHub
App and setting ``GITHUB_APP_ID`` and ``GITHUB_APP_KEY``.

To use a Personal Access Token (which requires a scope of `repo::public_repo`),
see:
https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token

    GITHUB_TOKEN=...

Or to use a GitHub App, update::

    GITHUB_APP_ID=...
    GITHUB_APP_KEY=...

**All of the remaining steps assume that you have the virtualenv activated.**
(``workon metadeploy``)

.. _virtualenvwrapper: https://virtualenvwrapper.readthedocs.io/en/latest/

Installing JavaScript Requirements
==================================

The project uses `nvm`_ to install a specific version of `Node.js`_. Assuming
you have ``nvm`` already installed and configured, run ``nvm install`` to
install and activate the Node version specified in ``.nvmrc``. Then use `yarn`_
to install dependencies::

    nvm use
    yarn

**All of the remaining steps assume that you have the nvm activated.** (``nvm
use``)

.. _nvm: https://github.com/nvm-sh/nvm
.. _Node.js: http://nodejs.org
.. _yarn: https://yarnpkg.com/

Setting Up The Database
=======================

Assuming you have `Postgres <https://www.postgresql.org/download/>`_ installed
and running locally::

    createdb metadeploy

Add the database information to the ``.env`` file in URL form (replace USER and
PASSWORD with your database credentials)::

    DATABASE_URL=postgres://<USER>:<PASSWORD>@localhost:5432/metadeploy

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

Connecting to CumulusCI
=======================

To connect your CumulusCI to your local MetaDeploy instance, first create a superuser as described above.
Then, log in to the Django admin UI at http://localhost:8000/admin. Create a Token for your superuser.

In your terminal, connect the MetaDeploy service::

    cci service connect metadeploy local

For the ``Url``, enter ``http://localhost:8000/admin/rest``. Note that ``http://localhost:8000/api`` is the non-admin
API, and will not work. Then enter the Token you created above. You can allow CumulusCI to set this service as the
default MetaDeploy service if you wish. If you use multiple MetaDeploy services, you can always activate your local
service with::

    cci service default metadeploy local

Once your local MetaDeploy service is connected, you can publish plans with::

    cci task run metadeploy_publish
