MetaDeploy
==========

Setup
-----

Cloning the project
~~~~~~~~~~~~~~~~~~~

Like so::

   git clone git@github.com:oddbird/metadeploy
   cd metadeploy

Making a virtual env
~~~~~~~~~~~~~~~~~~~~

MetaDeploy development requires Python v3.6. If ``which python3.6`` returns
a non-empty path, it's already installed and you can continue to the next step.
If it returns nothing, then install Python v3.6 using
``brew install https://raw.githubusercontent.com/Homebrew/homebrew-core/f2a764ef944b1080be64bd88dca9a1d80130c558/Formula/python.rb``,
or from `Python.org`_.

.. _Python.org: https://www.python.org/downloads/

Assuming you use `virtualenvwrapper`_, setup is pretty simple::

   mkvirtualenv metadeploy --python=$(which python3.6)
   setvirtualenvproject

Copy the ``.env`` file somewhere that will be sourced when you need it::

    cp env.example $VIRTUAL_ENV/bin/postactivate

You can also edit this file if you have any values that you know should
be different.

Now run ``workon metadeploy`` again to set those environment variables.

Your ``PATH`` (and environment variables) will be updated when you
``workon metadeploy`` and restored when you ``deactivate``. This will make
sure that whenever you are working on MD, you use the MD-specific version of
Node instead of any system-wide Node you may have.

Adapting this project to use `Pipenv`_ is left as an exercise to the
reader.

.. _virtualenvwrapper: https://virtualenvwrapper.readthedocs.io/en/latest/
.. _Pipenv: https://docs.pipenv.org/

Installing requirements
~~~~~~~~~~~~~~~~~~~~~~~

While activated::

    pip install -r requirements.txt

Setting up JS dependencies
~~~~~~~~~~~~~~~~~~~~~~~~~~

First, install the project-local version of Node. It is
important that you do all this with the virtualenv activated, for the
``$PATH``-munging that it does::

   bin/unpack-node

Then use ``yarn`` to install dependencies::

   yarn

Setting up the database
~~~~~~~~~~~~~~~~~~~~~~~

Assuming you have Postgres on your system::

   createdb metadeploy

Then run the initial migrations::

   python src/manage.py migrate

To make an initial user::

   python src/manage.py createsuperuser

Then follow the prompts.

You'll have to also create an entry in the database with configuration
information for talking with SalesForce for OAuth. You can do this by
filling in the form at
`<https://localhost:8000/admin/socialaccount/socialapp/add/>`_ if you're
logged in as your superuser.

To fill this in, you'll need some specific values from a Connected App
in your SalesForce configuration. If you're an Oddbird, you can find
these values in Keybase.

Setting up a message queue
~~~~~~~~~~~~~~~~~~~~~~~~~~

Just have Redis running locally.

Running the service
~~~~~~~~~~~~~~~~~~~

There are two basic processes: the web and the worker. The web will
handle web requests, the worker will handle longer-running background
tasks. The two processes communicate through the message queue, and
indirectly through the database.

To run web in development::

   python src/manage.py runserver_plus --cert-file cert.crt

This will create a ``.crt`` and ``.key`` file if they don't exist.
You'll have add them to your browser, as they'll be self-signed and not
automatically trusted. We need to serve local development on HTTPS to
support Salesforce's requirement for an HTTPS callback for OAuth though.

To run worker in development::

   celery -A metadeploy worker -l debug

In production, the commands in the Procfile should suffice.

Access the running server at `<https://localhost:8000/>`_.
