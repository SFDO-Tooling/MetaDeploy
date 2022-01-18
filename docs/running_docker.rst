========================
Docker Development Setup
========================

Cloning the project
-------------------

::

    git clone git@github.com:SFDO-Tooling/MetaDeploy
    cd MetaDeploy

Docker and Docker-Compose Installation
--------------------------------------

To download and install Docker please visit: https://hub.docker.com/?overlay=onboarding
and follow the installation instructions to download Docker if needed.
To verify you have successfully installed Docker type:

::

    docker -v

*You should see something like the following:*
    ``Docker version 19.03.4, build 9013bf5``


To download and install docker-compose please visit: https://docs.docker.com/v17.09/compose/install/
and follow the installation instructions to download docker-compose if needed.
To verify you have successfully installed docker-compose type:

::

    docker-compose -v

*You should see something like the following:*
    ``docker-compose version 1.16.1, build 6d1ac219``

Running MetaDeploy In Docker
============================

Below are the following steps necessary to run MetaDeploy on Docker:

1. `.env File Creation and Variable Declaration`_
    __ `.env File Creation and Variable Declaration`

2. `Building Your Docker Containers`_
    __ `Building Your Docker Containers`


3. `Running Your Docker Containers`_
    __ `Running Your Docker Containers`


.env File Creation And Variable Declaration
-------------------------------------------

*Please begin by making a copy of .env.docker.example and renaming it .env in your root project directory*

Local Variables
---------------

POSTGRES_USER:
    Environment variable set in the docker-compose.yml file under the postgres service,
    represents database user. This value has already been configured for you, but
    you can reconfigure it.

POSTGRES_PASSWORD:
    Environment variable set in the docker-compose.yml file under the postgres service,
    represents database password. This database is configured with no password for
    development purposes so leave as is unless changing for production purposes.

POSTGRES_DB:
    Environment variable set in the docker-compose.yml file under the postgres service,
    represents database. This variable has already been set to the proper
    value `metadeploy` for the user.

.. note::

    MetaDeploy needs a connection to the GitHub API to fetch repositories for installation.
    This can be set up using a personal GitHub account by providing your personal access token.

GITHUB_TOKEN:
    This represents a GitHub user's Personal Access Token which requires a scope of `repo`.
    If you need to generate a personal access token please visit the following:
    https://help.github.com/en/articles/creating-a-personal-access-token-for-the-command-line

SFDX_CLIENT_CALLBACK_URL:
    Callback url of the connected Salesforce app. The variable has already been set to the proper value for projects running under localhost.

.. note::

    If you're an OddBird, you can find the following values in the shared Keybase team folder -- ``metadeploy/env``

SFDX_CLIENT_ID:
    Consumer key of the connected app that MetaDeploy will use for authenticating to any persistent org.

SFDX_CLIENT_SECRET:
    Consumer secret of the connected app.

DEVHUB_USERNAME:
    The username associated with your Dev Hub. If you have the Salesforce CLI setup it should be the username with the ``(D)`` next to it when running ``sfdx force:org:list``.

DOCKER_SFDX_HUB_KEY:
    This represents the private key (with newlines encoded as ``\n`` for Docker) corresponding to a certificate that was uploaded to the "Use digital signatures" setting of the Salesforce connected app. Ensure a newline char (``\n``) comes after ``-----END PRIVATE KEY-----``. Only required if you enable scratch orgs for a plan.



Other Variables
---------------

*Some variables in this section are preset; the description will state where it is declared.*

DB_ENCRYPTION_KEY:
    This key is used as an encryption key for database use.
    Generate a value using cryptography.fernet.Fernet.generate_key()
BUILD_ENV:
    Docker argument variable used to determine what dependencies and scripts to run when
    installing dependencies and populating databases, currently set in docker-compose.yml
    web service ARG variable section. For production this value is set to producion.
    For development purposes set this value to development.

NODE_VERSION:
    Environment variable used to set node version for download, this variable is set in the Dockerfile

YARN_VERSION:
    Environment variable used to set yarn version for download, this variable is set in the Dockerfile

PYTHONUNBUFFERED:
    Environment variable set in Dockerfile used to not write .pyc files to Docker container

DATABASE_URL:
    Environment variable set in Dockerfile. Represents the full path of database url.

REDIS_URL:
    This represents the url to the location where the redis server, configured for Meta CI. Set in Dockerfile.

DJANGO_HASHID_SALT:
    This represents the hashid salt for the django application, currently set to
    arbritary string due to non production defaults, can be overridden
    in docker-compose.yml. Currently set in Dockerfile.

DJANGO_SECRET_KEY:
    This represents the key for the django web application, currently set to arbritary
    string due to non production defaults, can be overridden in docker-compose.yml.
    Currently set in Dockerfile. For local testing, arbritary strings such as the one given
    in the .env.docker.example will suffice. Otherwise use your production secret key.

DJANGO_DEBUG:
    This represents the value needed for django development debugging.
    Please set this to true. Production may want to have this disabled.

SECURE_SSL_REDIRECT:
    Set to True to force redirecting to https.

ADMIN_API_ALLOWED_SUBNETS:
    This is a value to signify what subnets are allowed access to the admin view.
    For development purposes this value was set to 0.0.0.0/0

Building Your Docker Containers
-------------------------------

.. note::

    VS Code users: refer to `Docker development using VS Code`_.

This next section assumes you have installed ``docker`` and ``docker-compose``.
Additionally it assumes you have a ``.env`` file in the root directory of this
project, a template of variables needed can be found under ``.env.docker.example``.

To configure and run your environment you must run two commands in the project root.
Note that docker-compose build will take some significant time to build the first time but will
be much faster for subsequent builds. It is also important to note that once you bring
up the web application it will take a minute or two to build.
::

    docker-compose build

Running Your Docker Containers
------------------------------
MetaDeploy's docker container comes out of the box with development test
data and the creation of a default admin user.

If you would like to disable this functionality please add a `DJANGO_SETTINGS_MODULE` environment variable
in the web service section of the docker-compose file to set it from its default value (set in Dockerfile) from
`config.settings.local` to `config.settings.production`.
For examples of how to do this please see `setting docker-compose environment variables`_.

.. _setting docker-compose environment variables: https://docs.docker.com/compose/environment-variables/

Then run the following command:
::

    docker-compose up -d
    or
    docker-compose up (for debug mode)

This command may take a few minutes to finish. Once it's done, visit ``localhost:8000/admin/login``
and login with the following credentials if DJANGO_SETTINGS_MODULE is config.settings.local:

username:
    ``admin``
password:
    ``password``

From here you should be able to run builds. However note that this default account will not be created
when BUILD_ENV is set to production

Docker Commands
---------------
To stop your virtual containers run the following command:
The docker-compose stop command will stop your containers, but it won’t remove them.
::

    docker-compose stop

To start your virtual containers run the following command:
::

    docker-compose start

To bring your virtual containers up for the first time run the following command:
::

    docker-compose up -d

To bring your virtual containers down run the following command:

.. warning:: The docker-compose down command will stop your containers,
    but also removes the stopped containers as well as any networks that were created.

::

    docker-compose down

Removes stopped service containers. To remove your stopped containers enter the following commands

.. warning:: This will destroy anything that is in the virtual environment,
    however the database data will persist

::

    docker-compose rm

(then enter ``y`` when prompted. If you would like to clear the database as well include a -v flag i.e. ``docker-compose down -v``)

To view all running services run the following command:

::

    docker-compose ps

If you'd like to test something out manually in that test environment for any reason you can run the following:
In order to run relevant management commands like `manage.py makemigrations`, or if you'd like to test
something out manually in that test environment for any reason you can run the following:

::

    docker-compose exec web bash

After this you will be inside of a linux commandline, and are free to test around in your container.

Or you could directly run a command like this:
::

    docker-compose exec web python manage.py makemigrations

Docker development using VS Code
--------------------------------

Because front-end and back-end dependencies are installed in a Docker container
instead of locally, text editors that rely on locally-installed packages (e.g.
for code formatting/linting on save) need access to the running Docker
container. `VS Code`_ supports this using the `Remote Development`_ extension
pack.

Once you have the extension pack installed, when you open the MetaDeploy folder
in VS Code, you will be prompted to "Reopen in Container". Doing so will
effectively run ``docker-compose up`` and reload your window, now running inside
the Docker container. If you do not see the prompt, run the "Remote-Containers:
Open Folder in Container..." command from the VS Code Command Palette to start
the Docker container.

A number of project-specific VS Code extensions will be automatically installed
for you within the Docker container. See `.devcontainer/devcontainer.json
<.devcontainer/devcontainer.json>`_ and `.devcontainer/docker-compose.dev.yml
<.devcontainer/docker-compose.dev.yml>`_ for Docker-specific VS Code settings.

The first build will take a number of minutes, but subsequent builds will be
significantly faster.

Similarly to the behavior of ``docker-compose up``, VS Code automatically runs
database migrations and starts the development server/watcher. To run any local commands,
open an `integrated terminal`_ in VS Code (``Ctrl-```) and use any of the development
commands (this terminal runs inside the Docker container and can run all the commands that can be run in
RUNNING.RST and CONTRIBUTING.RST)::

    $ python manage.py migrate  # run database migrations
    $ yarn serve  # start the development server/watcher

For any commands, when using the VS Code integrated terminal inside the
Docker container, omit any ``docker-compose run --rm web...`` prefix, e.g.::

    $ python manage.py promote_superuser <your email>
    $ yarn test:js
    $ python manage.py truncate_data
    $ python manage.py populate_data

``yarn serve`` is run for you on connection to container. You can view the running app at
`<http://localhost:8080/>`_ in your browser.

For more detailed instructions and options, see the `VS Code documentation`_.

.. _VS Code: https://code.visualstudio.com/
.. _Remote Development: https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack
.. _integrated terminal: https://code.visualstudio.com/docs/editor/integrated-terminal
.. _VS Code documentation: https://code.visualstudio.com/docs/remote/containers
