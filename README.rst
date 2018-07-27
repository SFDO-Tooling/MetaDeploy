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

   python src/manage.py runserver

To run worker in development::

   celery -A metadeploy worker -l debug

In production, the commands in the Procfile should suffice.

.. todo:: Set up JS dependencies?

Access the running server at `<http://localhost:8000/>`.
