# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

MetaDeploy is a web-based tool for installing Salesforce products. It uses Django REST Framework for the backend API, React/Redux for the frontend, Django Channels for WebSockets, and Django-RQ with Redis for background task processing. The application integrates with CumulusCI for Salesforce deployment automation and GitHub for fetching installation repositories.

## Tech Stack

- **Backend**: Django 3.x + Django REST Framework
- **Frontend**: React 18 + Redux + TypeScript
- **Real-time**: Django Channels (WebSockets via `channels_redis`)
- **Task Queue**: Django-RQ (Redis Queue) with scheduler
- **Database**: PostgreSQL with encryption via `sfdo_template_helpers.crypto`
- **Build Tools**: Webpack 5, Babel, Jest for testing
- **Python**: 3.12
- **Node**: 22.x

## Development Commands

### Initial Setup

```bash
# Python environment
mkvirtualenv metadeploy --python=$(which python3.12)
setvirtualenvproject
make dev-install

# JavaScript dependencies
nvm use
yarn

# Database setup
createdb metadeploy
python manage.py migrate
python manage.py populate_data
python manage.py createsuperuser
```

### Running the Development Server

```bash
# Full stack (Django + Webpack + RQ workers)
yarn serve

# Individual services
yarn django:serve       # Django on port 8000
yarn webpack:serve      # Webpack dev server on port 8080
yarn worker:serve       # RQ worker for background jobs
yarn scheduler:serve    # RQ scheduler
yarn rq:serve          # Both RQ worker and scheduler
```

### Testing

```bash
# Python tests
yarn test:py                    # Unit tests only (excludes integration tests)
yarn test:py:integration        # Integration tests (mark with @pytest.mark.integration)
python -m pytest path/to/test.py::TestClass::test_method  # Run specific test

# JavaScript tests
yarn test:js                    # Run all JS tests
yarn test:js:watch             # Run with watcher
yarn test:js:coverage          # With coverage report

# Linting and formatting
yarn lint                      # Format and lint all files
yarn lint:py                   # Python (isort + black + flake8)
yarn lint:js                   # JavaScript (prettier + eslint + tsc)
yarn lint:sass                 # SCSS files
yarn tsc                       # TypeScript type checking only
```

### Building Assets

```bash
yarn build                     # Development build to dist/
yarn prod                      # Production build to dist/prod/
```

### Storybook

```bash
yarn storybook                 # View component library at http://localhost:6006/
```

### Internationalization

```bash
# Backend (requires GNU gettext: brew install gettext)
python manage.py makemessages --locale <locale>
python manage.py compilemessages

# Frontend: Auto-generated to locales_dev/en/translation.json on build
# Copy to locales/en/translation.json to activate
```

## Architecture

### Backend Structure

**Django Apps:**
- `metadeploy/api/` - Main REST API with models, serializers, viewsets
- `metadeploy/adminapi/` - Admin-specific API endpoints
- `metadeploy/` - Core Django app with WebSocket consumers and routing

**Key Models** (`metadeploy/api/models.py`):
- `Product` - Installable Salesforce products
- `Version` - Product versions
- `PlanTemplate` - Installation plan templates
- `Plan` - Concrete installation plans with steps
- `Step` - Individual installation steps
- `Job` - Running installation jobs (uses HashID for public IDs)
- `PreflightResult` - Preflight check results
- `ScratchOrg` - Scratch org management
- `AllowedList` - Org-based access control

**Background Jobs:**
- Jobs are queued to RQ (Redis Queue) workers
- Two worker queues: `default` and `short`
- Scheduler manages recurring tasks via `rqscheduler`
- Integration with CumulusCI's `FlowCoordinator` for running installation flows

**WebSocket Architecture:**
- Uses Django Channels for real-time updates
- Consumer: `metadeploy/consumers.py` → `PushNotificationConsumer`
- Routing: `metadeploy/routing.py` → `ws/notifications/` endpoint
- Push notifications in `metadeploy/api/push.py` for job/org/preflight updates

### Frontend Structure

**Redux Store** (`src/js/store/`):
- `user/` - User authentication state
- `products/` - Product catalog
- `plans/` - Installation plans and preflights
- `jobs/` - Running jobs state
- `orgs/` - Salesforce org connections
- `scratchOrgs/` - Scratch org state
- `socket/` - WebSocket connection state
- `errors/` - Global error handling

**Components** (`src/js/components/`):
- Organized by feature (products, plans, jobs, orgs)
- TypeScript with React 18
- Uses Salesforce Lightning Design System React components

**WebSocket Client:**
- Uses `sockette` library for reconnection handling
- Connected to `/ws/notifications/` endpoint
- Updates Redux store on incoming messages

### API Routes

REST API endpoints are registered in `metadeploy/api/urls.py`:
- `/api/jobs/` - Job management
- `/api/products/` - Product catalog
- `/api/versions/` - Version management
- `/api/plans/` - Plan management and execution
- `/api/orgs/` - Org connection and status
- `/api/scratch-orgs/` - Scratch org lifecycle
- `/api/user/` - User profile
- `/api/ui/` - Bootstrap data

Admin API in `metadeploy/adminapi/urls.py` requires authentication.

## Environment Variables

Required environment variables (see `env.example`):
- `DATABASE_URL` - PostgreSQL connection string
- `REDIS_URL` - Redis connection for Channels and RQ
- `DB_ENCRYPTION_KEY` - Fernet key for database encryption
- `DJANGO_SECRET_KEY` - Django secret key
- `DJANGO_HASHID_SALT` - Salt for HashID field generation
- `GITHUB_TOKEN` or `GITHUB_APP_ID` + `GITHUB_APP_KEY` - GitHub API access
- `SFDX_CLIENT_ID`, `SFDX_CLIENT_SECRET`, `SFDX_CLIENT_CALLBACK_URL` - Salesforce OAuth
- `SFDX_HUB_KEY`, `DEVHUB_USERNAME` - Scratch org creation

## Testing Conventions

**Python:**
- Tests in `metadeploy/tests/` and `metadeploy/api/tests/`
- Mark integration tests with `@pytest.mark.integration`
- Default pytest run excludes integration tests
- Uses pytest-django with `--ds config.settings.test`
- Coverage configured in `pytest.ini` and `.coveragerc`

**JavaScript:**
- Tests colocated or in `test/js/` directory
- Jest configuration in `jest.config.js`
- Uses React Testing Library
- Mock store utilities via `redux-mock-store`

## Settings Configuration

Settings are split across `config/settings/`:
- `base.py` - Shared settings
- `local.py` - Local development (DEBUG=True)
- `production.py` - Production configuration
- `test.py` - Test environment

Settings are loaded based on `DJANGO_MODE` environment variable.

## CumulusCI Integration

MetaDeploy integrates deeply with CumulusCI:
- `FlowCoordinator` and `PreflightFlowCoordinator` run installation flows
- Custom callbacks in `metadeploy/api/flows.py` (`JobFlowCallback`, `PreflightFlowCallback`)
- Org credentials encrypted in database, decrypted for CCI runtime
- Task results logged and pushed via WebSocket to frontend

## Common Development Workflows

**Adding a new API endpoint:**
1. Define model in `metadeploy/api/models.py`
2. Create serializer in appropriate serializers file
3. Add viewset in `metadeploy/api/views.py`
4. Register route in `metadeploy/api/urls.py`
5. Run migrations: `python manage.py makemigrations && python manage.py migrate`

**Adding a background job:**
1. Define job function (typically in relevant module)
2. Enqueue with `django_rq.enqueue()`
3. Job runs in worker process managed by `rqworker`

**Adding WebSocket notifications:**
1. Use push functions in `metadeploy/api/push.py`
2. Frontend listens via WebSocket and updates Redux store
3. Components react to store changes

**Running single test:**
```bash
# Python
pytest metadeploy/api/tests/test_models.py::TestProduct::test_slug

# JavaScript  
yarn test:js -- path/to/test.tsx -t "test name pattern"
```

## Docker Development

Alternative to local setup - see `docs/running_docker.md`:
```bash
docker compose up -d
docker compose exec web bash
# Run commands inside container
```
