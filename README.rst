MetaDeploy
==========

.. image:: https://circleci.com/gh/oddbird/metadeploy.svg?style=shield&circle-token=36ac74830e831dfbdbdbe40aa68b6910df25016f
     :target: https://circleci.com/gh/oddbird/metadeploy
     :alt: Build Status

.. image:: https://coveralls.io/repos/github/oddbird/metadeploy/badge.svg?branch=master&amp;t=nvcQcu
     :target: https://coveralls.io/github/oddbird/metadeploy?branch=master
     :alt: Test Coverage

.. image:: https://badges.greenkeeper.io/oddbird/metadeploy.svg?token=cdd1aa435bc2abd632c8499a57f321736ca10821eb55bd45a68df6b138e20a31&ts=1534281126964
     :target: https://greenkeeper.io/
     :alt: Greenkeeper Status

.. image:: https://pyup.io/repos/github/oddbird/metadeploy/shield.svg?token=2ed1ac41-6006-4162-99f8-bcc41e7cf43d
     :target: https://pyup.io/repos/github/oddbird/metadeploy/
     :alt: Python Updates

.. image:: https://pyup.io/repos/github/oddbird/metadeploy/python-3-shield.svg?token=2ed1ac41-6006-4162-99f8-bcc41e7cf43d
     :target: https://pyup.io/repos/github/oddbird/metadeploy/
     :alt: Python 3 Status

Setup
-----

Cloning the project
~~~~~~~~~~~~~~~~~~~

Like so::

   git clone git@github.com:oddbird/metadeploy
   cd metadeploy

Making a virtual env
~~~~~~~~~~~~~~~~~~~~

MetaDeploy development requires Python v3.6. If ``which python3.6`` returns a
non-empty path, it's already installed and you can continue to the next step. If
it returns nothing, then install Python v3.6 using
``brew install https://raw.githubusercontent.com/Homebrew/homebrew-core/f2a764ef944b1080be64bd88dca9a1d80130c558/Formula/python.rb``,
or from `Python.org`_.

.. _Python.org: https://www.python.org/downloads/

Assuming you use `virtualenvwrapper`_, setup is pretty simple::

   mkvirtualenv metadeploy --python=$(which python3.6)
   setvirtualenvproject

Copy the ``.env`` file somewhere that will be sourced when you need it::

    cp env.example $VIRTUAL_ENV/bin/postactivate

You can also edit this file if you have any values that you know should be
different.

Now run ``workon metadeploy`` again to set those environment variables.

Your ``PATH`` (and environment variables) will be updated when you
``workon metadeploy`` and restored when you ``deactivate``. This will make sure
that whenever you are working on MD, you use the MD-specific version of Node
instead of any system-wide Node you may have.

.. _virtualenvwrapper: https://virtualenvwrapper.readthedocs.io/en/latest/

Installing requirements
~~~~~~~~~~~~~~~~~~~~~~~

While activated::

    pip install -r requirements.txt

Setting up JS dependencies
~~~~~~~~~~~~~~~~~~~~~~~~~~

First, install the project-local version of Node. It is important that you do
all this with the virtualenv activated, for the ``$PATH``-munging that it does::

   bin/unpack-node

Then use ``yarn`` to install dependencies::

   yarn

Setting up the database
~~~~~~~~~~~~~~~~~~~~~~~

Assuming you have Postgres on your system::

   createdb metadeploy

Then run the initial migrations::

   python src/manage.py migrate

Logging in with Salesforce
~~~~~~~~~~~~~~~~~~~~~~~~~~

To make an initial local user::

   python src/manage.py createsuperuser

To setup the Salesforce OAuth integration, add two entries (one for Production,
and one for Sandbox) in the database with configuration information. You can do
this by filling in the form twice at
`<https://localhost:8080/admin/socialaccount/socialapp/add/>`_ (you'll first be
asked to login using the local user you created above).

To fill it in, you'll need some specific values from Connected Apps in your
Salesforce configuration. If you're an OddBird, you can find these values in the
shared Keybase team folder (``metadeploy/prod.db``).

If you don't have a Salesforce account, ask `Kit <mailto:kit@oddbird.net>`_ to
send you an invitation by email.

Running the service
~~~~~~~~~~~~~~~~~~~

There are two basic processes: the web and the worker. The web will handle web
requests, the worker will handle longer-running background tasks. The two
processes communicate through the message queue, and indirectly through the
database.

Starting the web service
````````````````````````

To run web in development::

   yarn serve

The running server will be available at `<https://localhost:8080/>`_.

We need to serve local development on HTTPS to support Salesforce's requirement
for an HTTPS callback for OAuth. You'll have to add a local certificate
exception to your browser (following the browser prompts) the first time, as
they'll be self-signed and not automatically trusted.

The WebSocket server (to live-reload on file changes) listens on
``wss://localhost:5000``. In FireFox, this requires first visiting
`<https://localhost:5000/>`_ to add another local certificate exception.

Setting up a message queue
``````````````````````````

Just have Redis running locally.

Starting the worker service
```````````````````````````

To run worker in development::

   celery -A metadeploy worker -l debug

In production, the commands in the Procfile should suffice.

Development Tasks
-----------------

- ``yarn serve``: starts development server (with watcher) at
  `<https://localhost:8080/>`_ (assets are served from ``dist/`` dir)
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
- ``yarn test``: run JS tests
- ``yarn test:watch``: run JS tests with a watcher for development
