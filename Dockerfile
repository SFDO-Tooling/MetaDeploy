ARG BUILD_ENV=development
ARG PROD_ASSETS
ARG OMNIOUT_TOKEN
FROM node:22 AS node_base
FROM python:3.12

# Node and npm
COPY --from=node_base /usr/local/lib/node_modules /usr/local/lib/node_modules
COPY --from=node_base /usr/local/bin/node /usr/local/bin/node
COPY --from=node_base /opt/yarn-* /opt/yarn
RUN ln -s /usr/local/lib/node_modules/corepack/dist/corepack.js /usr/local/bin/corepack
RUN ln -s /usr/local/lib/node_modules/npm/bin/npm-cli.js /usr/local/bin/npm
RUN ln -s /usr/local/lib/node_modules/npm/bin/npx-cli.js /usr/local/bin/npx
RUN ln -s /opt/yarn/bin/yarn /usr/local/bin/yarn
RUN ln -s /opt/yarn/bin/yarnpkg /usr/local/bin/yarnpkg
RUN node --version && npm --version && yarn --version

# System setup:
RUN apt-get update \
  && apt-get install -y gettext redis-tools --no-install-recommends \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

# Python context setup:
RUN pip install --no-cache-dir --upgrade pip pip-tools

# ================ ENVIRONMENT
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

WORKDIR /app

# Env setup:
ENV PYTHONPATH=/app
ENV DJANGO_SETTINGS_MODULE=config.settings.production
ENV OMNIOUT_TOKEN=${OMNIOUT_TOKEN}

# Install sfdx
RUN npm install --location=global sfdx-cli --ignore-scripts

# Python requirements:
COPY ./requirements requirements
RUN pip install --no-cache-dir --upgrade pip pip-tools \
    && pip install --no-cache-dir -r requirements/prod.txt
RUN pip install --no-cache-dir -r requirements/dev.txt

# JS client setup:
COPY ./.npmrc .npmrc
COPY ./package.json package.json
COPY ./yarn.lock yarn.lock
RUN yarn install --ignore-optional --check-files

COPY . /app

# Avoid building prod assets in development
RUN if [ "${BUILD_ENV}" = "production" ] || [ -n "${PROD_ASSETS}" ] ; then yarn prod ; else mkdir -p dist/prod ; fi

# This is not a real key! It is present because we need a key
# that matches the structure of the real value to launch the application.
RUN \
  DB_ENCRYPTION_KEY="Ul-OySkEawSxUc7Ck13Twu2109IzIFh54C1WXO9KAFE=" \
  GITHUB_TOKEN="sample token" \
  SFDX_CLIENT_SECRET="sample secret" \
  SFDX_CLIENT_CALLBACK_URL="sample callback" \
  SFDX_CLIENT_ID="sample id" \
  python manage.py collectstatic --noinput

CMD /app/start-server.sh
