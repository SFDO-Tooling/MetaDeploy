FROM ghcr.io/oddbird/pyjs:py3.9-node16

ARG BUILD_ENV=development
ARG PROD_ASSETS
ARG OMNIOUT_TOKEN
WORKDIR /app

# Env setup:
ENV PYTHONPATH /app
ENV DJANGO_SETTINGS_MODULE config.settings.production
ENV OMNIOUT_TOKEN ${OMNIOUT_TOKEN}

# Install sfdx
RUN npm install --location=global sfdx-cli --ignore-scripts

# Python requirements:
COPY ./requirements requirements
RUN pip install --no-cache-dir --upgrade pip pip-tools \
    && pip install --no-cache-dir -r requirements/prod.txt
RUN if [ "${BUILD_ENV}" = "development" ] ; then \
    pip install --no-cache-dir -r requirements/dev.txt; \
    fi

# JS client setup:
COPY ./.npmrc .npmrc
COPY ./package.json package.json
COPY ./yarn.lock yarn.lock
RUN yarn install --check-files

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
