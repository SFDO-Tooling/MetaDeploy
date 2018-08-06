MetaDeploy
==========

Setup
-----

Cloning the project
~~~~~~~~~~~~~~~~~~~

Like so::

   git clone git@github.com:salesforce/metadeploy.git
   cd metadeploy

Making a virtual env
~~~~~~~~~~~~~~~~~~~~

Assuming you use `Virtualenvwrapper`_, setup is pretty simple::

   mkvirtualenv metadeploy
   setvirtualenvproject

Copy the ``.env`` file somewhere that will be sourced when you need it::

    mv env.example $VIRTUAL_ENV/bin/postactivate

You can also edit this file if you have any values that you know should
be different.

Now run ``workon metadeploy`` again to set those
environment variables.

Adapting this project to use `Pipenv`_ is left as an exercise to the
reader.

.. _Virtualenvwrapper: https://virtualenvwrapper.readthedocs.io/en/latest/
.. _Pipenv: https://docs.pipenv.org/

Setting up the database
~~~~~~~~~~~~~~~~~~~~~~~

Assuming you have Postgres on your system::

   createdb metadeploy

Then run the initial migrations::

   python src/manage.py migrate

To make an initial user::

   python src/manage.py createsuperuser

Then follow the prompts.

You'll have to also create a database row containing configuration
information for talking with the SalesForce connected app you're using
for OAuth. You can do this at
`<https://localhost:8000/admin/socialaccount/socialapp/add/>`_.

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

.. todo:: Set up JS dependencies?

Access the running server at `<https://localhost:8000/>`_.
