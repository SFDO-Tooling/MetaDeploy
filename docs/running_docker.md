# Docker Development Setup

## Cloning the project

    git clone git@github.com:SFDO-Tooling/MetaDeploy
    cd MetaDeploy

## Docker and Docker-Compose Installation

To download and install Docker Desktop please visit:
<https://www.docker.com/products/docker-desktop/> and follow the installation
instructions to download Docker if needed. To verify you have successfully
installed Docker, run:

    docker -v

_You should see something like the following:_

: `Docker version 20.10.14, build a224086`

The latest version of Docker Desktop comes with docker-compose installed. To
verify you have successfully installed docker-compose, run:

    docker-compose -v

_You should see something like the following:_

    Docker Compose version v2.5.1

If docker-compose is not installed, visit
<https://docs.docker.com/compose/install/> and follow the installation
instructions to download docker-compose.

### Running MetaDeploy In Docker

Below are the following steps necessary to run MetaDeploy on Docker:

1.  [.env File Creation and Variable Declaration](#env-file-creation-and-variable-declaration)
2.  [Building Your Docker Containers](#building-your-docker-containers)
3.  [Running Your Docker Containers](#running-your-docker-containers)

## .env File Creation And Variable Declaration

Please begin by making a copy of `env.example` and renaming it `.env` in your
root project directory:

    cp env.example .env

Edit this file to change `DJANGO_SECRET_KEY` and `DJANGO_HASHID_SALT` to any two
different arbitrary string values.

Next, run the following commands to generate a database encryption key:

    pip install cryptography
    python
    >>> from cryptography.fernet import Fernet
    >>> Fernet.generate_key()

This will output a bytestring, e.g. `b'mystring='`. Copy only the contents of
`'...'`, and add it to your `.env` file as `DB_ENCRYPTION_KEY`, e.g.
`DB_ENCRYPTION_KEY="mystring="`.

To exit the Python shell, press `Ctrl-Z` and then `Enter` on Windows, or
`Ctrl-D` on OS X or Linux. Alternatively, you could also type the Python command
`exit()` and press `Enter`.

> **Note**
> MetaDeploy needs a connection to the GitHub API to fetch repositories for
installation. This can be set up using a personal GitHub account by providing
your personal access token as `GITHUB_TOKEN` _or_ by using a GitHub App and
setting `GITHUB_APP_ID` and `DOCKER_GITHUB_APP_KEY` (with newlines encoded as
`\n` for Docker).
>
> To use a Personal Access Token (which requires a scope of
`repo::public_repo`), see:
https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token


**SFDX_CLIENT_CALLBACK_URL**
Callback url of the connected Salesforce app. The variable has already been
set to the proper value for projects running under localhost.

**SFDX_CLIENT_ID**
Consumer key of the connected app that MetaDeploy will use for authenticating
to any persistent org.

**SFDX_CLIENT_SECRET**
Consumer secret of the connected app.

**DEVHUB_USERNAME**
The username associated with your Dev Hub. If you have the Salesforce CLI
setup it should be the username with the `(D)` next to it when running
`sfdx force:org:list`.

**DOCKER_SFDX_HUB_KEY**
This represents the private key (with newlines encoded as `\n` for Docker)
corresponding to a certificate that was uploaded to the "Use digital signatures"
setting of the Salesforce connected app. Ensure a newline char (`\n`) comes
after `-----END PRIVATE KEY-----`. Only required if you enable scratch orgs for
a plan.

## Building Your Docker Containers

> **Note**
> VS Code users: refer to [Docker development using VS
Code](#docker-development-using-vs-code).


This next section assumes you have installed `docker` and `docker-compose`.
Additionally it assumes you have a `.env` file in the root directory of this
project, a template of variables needed can be found in `env.example`.

To configure and run your environment you must run two commands in the project
root. Note that `docker-compose build` will take some significant time to build
the first time but will be much faster for subsequent builds. It is also
important to note that once you bring up the web application it will take a
minute or two to build.

    docker-compose build

## Running Your Docker Containers

MetaDeploy's docker container comes out of the box with development test data
and the creation of a default admin user.

If you would like to disable this functionality please add a
`DJANGO_SETTINGS_MODULE` environment variable in the web service section of the
docker-compose file to set it from its default value (set in Dockerfile) from
`config.settings.local` to `config.settings.production`. For examples of how to
do this please see [setting docker-compose environment
variables](https://docs.docker.com/compose/environment-variables/).

Then run the following command:

    docker-compose up -d
    or
    docker-compose up (for debug mode)

This command may take a few minutes to finish. Once it's done, visit
`localhost:8000/admin/login` and login with the following credentials if
`DJANGO_SETTINGS_MODULE` is `config.settings.local`:

**username** `admin`

**password** `password`

From here you should be able to run builds. However note that this default
account will not be created when `BUILD_ENV` is set to `production`.

## Docker Commands

To stop your virtual containers run the following command (the docker-compose
stop command will stop your containers, but it won't remove them):

    docker-compose stop

To start your virtual containers run the following command:

    docker-compose start

To bring your virtual containers up for the first time run the following
command:

    docker-compose up -d

To bring your virtual containers down run the following command:

> **Note**
> The docker-compose down command will stop your containers, but also removes
the stopped containers as well as any networks that were created.

    docker-compose down

Removes stopped service containers. To remove your stopped containers enter the
following commands

> **Warning**
> This will destroy anything that is in the virtual environment, however the
database data will persist

    docker-compose rm

(then enter `y` when prompted. If you would like to clear the database as well
include a -v flag i.e. `docker-compose down -v`)

To view all running services run the following command:

    docker-compose ps

If you'd like to test something out manually in that test environment for any
reason you can run the following: In order to run relevant management commands
like `manage.py makemigrations`, or if you'd like to test something
out manually in that test environment for any reason you can run the following:

    docker-compose exec web bash

After this you will be inside of a linux commandline, and are free to test
around in your container.

Or you could directly run a command like this:

    docker-compose exec web python manage.py makemigrations

## Docker development using VS Code

Because front-end and back-end dependencies are installed in a Docker container
instead of locally, text editors that rely on locally-installed packages (e.g.
for code formatting/linting on save) need access to the running Docker
container. [VS Code](https://code.visualstudio.com/) supports this using the
[Remote Development](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack)
extension pack.

Once you have the extension pack installed, when you open the MetaDeploy folder
in VS Code, you will be prompted to "Reopen in Container". Doing so will
effectively run `docker-compose up` and reload your window, now running inside
the Docker container. If you do not see the prompt, run the "Remote-Containers:
Open Folder in Container\..." command from the VS Code Command Palette to start
the Docker container.

A number of project-specific VS Code extensions will be automatically installed
for you within the Docker container. See `.devcontainer/devcontainer.json` and
`.devcontainer/docker-compose.dev.yml` for Docker-specific VS Code settings.

The first build will take a number of minutes, but subsequent builds will be
significantly faster.

Similarly to the behavior of `docker-compose up`, VS Code automatically runs
database migrations and starts the development server/watcher. To run any local
commands, open an
[integrated terminal](https://code.visualstudio.com/docs/editor/integrated-terminal)
in VS Code (`Ctrl-`\`) and use any of the development commands (this terminal
runs inside the Docker container and can run all the commands that can be run in
RUNNING.MD and CONTRIBUTING.MD):

    $ python manage.py migrate  # run database migrations
    $ yarn serve  # start the development server/watcher

For any commands, when using the VS Code integrated terminal inside the Docker
container, omit any `docker-compose run --rm web...` prefix, e.g.:

    $ python manage.py promote_superuser <your email>
    $ yarn test:js
    $ python manage.py truncate_data
    $ python manage.py populate_data

`yarn serve` is run for you on connection to container. You can view the running
app at <http://localhost:8080/> in your browser.

For more detailed instructions and options, see the
[VS Code documentation](https://code.visualstudio.com/docs/remote/containers).

## Troubleshooting
If you encounter errors with starting the Postgres database service, sometimes it can help to remove the databse, rebuild the container, and restart the service with the following commands:

**Note** - this will delete any local data such as products or users that exist in the database.

1. Stop any existing containers with `docker compose down` or with selecting "Reopen Folder Locally" from VS Code.
2. Open a [integrated terminal](https://code.visualstudio.com/docs/editor/integrated-terminal)
in VS Code (`Ctrl-`\`).
3. Remove the `postgres` database folder that was creating
```bash
rm -rf postgres
```
4. Rebuild the containers - this will take a few minutes.
```bash
docker compose build
```
5. Start the containers, either with "Reopen in Container" in VS Code or `docker compose up`.
6. To confirm the Postgres database is up and running correctly, in a new terminal in the container, run the database migration command below:
```
python manage.py migrate
```
If successful, the output should from the command should resemble this:
```bash
root@f795226068a4:/app# python manage.py migrate
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying contenttypes.0002_remove_content_type_name... OK
  Applying auth.0001_initial... OK
  Applying auth.0002_alter_permission_name_max_length... OK
  Applying auth.0003_alter_user_email_max_length... OK
  Applying auth.0004_alter_user_username_opts... OK
  Applying auth.0005_alter_user_last_login_null... OK
  Applying auth.0006_require_contenttypes_0002... OK
  Applying auth.0007_alter_validators_add_error_messages... OK
  Applying auth.0008_alter_user_username_max_length... OK
  Applying auth.0009_alter_user_last_name_max_length... OK
  Applying api.0001_initial... OK
  ....
```
