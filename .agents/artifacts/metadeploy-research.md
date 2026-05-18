# MetaDeploy - Comprehensive Research Document

## 1. Project Overview

**MetaDeploy** is a web-based tool for installing Salesforce products, built and maintained by Salesforce.org's SFDO-Tooling team. It enables publishing CumulusCI flows as self-service installers that any user can run against their own Salesforce org.

- **Repository**: [github.com/SFDO-Tooling/MetaDeploy](https://github.com/SFDO-Tooling/MetaDeploy)
- **License**: BSD-3-Clause (Copyright 2021, Salesforce.com, Inc.)
- **First Commit**: July 25, 2018
- **Latest Commit**: December 11, 2024
- **Total Commits**: ~3,925
- **Documentation**: [metadeploy.readthedocs.io](https://metadeploy.readthedocs.io)
- **Production Instance**: [install.salesforce.org](https://install.salesforce.org)

## 2. Technology Stack

### Backend
| Technology | Version/Details |
|---|---|
| **Python** | 3.12 |
| **Django** | Core web framework |
| **Django Channels** | WebSocket support via Daphne ASGI server |
| **Django REST Framework** | REST API layer |
| **CumulusCI** | Salesforce CI/CD framework integration (core dependency) |
| **PostgreSQL** | 12.9 (primary database) |
| **Redis** | 6.2 (caching, task queues, WebSocket channel layer) |
| **django-rq** | Background job processing (via Redis Queue) |
| **django-parler** | Internationalization/translatable models |
| **Fernet Encryption** | Database field encryption (via sfdo-template-helpers) |
| **Sentry** | Error tracking/monitoring |
| **Boto3/S3** | Optional image/file storage |
| **Daphne** | ASGI application server |

### Frontend
| Technology | Version/Details |
|---|---|
| **Node.js** | 22.x |
| **React** | 18.2 |
| **TypeScript** | 4.7 |
| **Redux** | 4.2 (with redux-thunk, redux-logger) |
| **React Router** | 5.3 (v5, not v6) |
| **Salesforce Lightning Design System** | 2.18 (`@salesforce-ux/design-system`) |
| **Salesforce Design System React** | 0.10 (`@salesforce/design-system-react`) |
| **i18next** | Internationalization framework |
| **Webpack** | 5.73 (build tool) |
| **Storybook** | 6.5 (component development) |
| **Jest** | 28.1 (testing) |
| **Yarn** | 1.x (package manager) |

### Infrastructure
| Technology | Details |
|---|---|
| **Heroku** | Primary deployment platform |
| **Docker** | Local development environment |
| **GitHub Actions** | CI/CD (tests, Storybook deploy, production smoke tests) |
| **SFDX CLI** | Salesforce DX for org management |

## 3. Architecture

### High-Level Architecture

```
┌─────────────────┐     ┌─────────────────┐
│   React SPA     │◄───►│  Django REST API │
│  (SLDS themed)  │     │  (DRF ViewSets)  │
│                 │     │                  │
│  Redux Store    │     │  /api/jobs       │
│  - products     │     │  /api/products   │
│  - plans        │     │  /api/versions   │
│  - jobs         │     │  /api/plans      │
│  - orgs         │     │  /api/orgs       │
│  - scratchOrgs  │     │  /api/scratch-orgs│
│  - user         │     │  /api/user       │
│  - errors       │     │  /api/categories │
│  - socket       │     │  /api/ui         │
└────────┬────────┘     └────────┬─────────┘
         │                       │
    WebSocket                    │
         │              ┌────────▼─────────┐
         └─────────────►│ Django Channels   │
                        │ (Daphne ASGI)    │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │   Redis          │
                        │ - Channel Layer  │
                        │ - Task Queues    │
                        │ - Cache          │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │  RQ Workers      │
                        │ - run_flows_job  │
                        │ - preflight_job  │
                        │ - scratch_org    │
                        │ - cleanup        │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │  CumulusCI       │
                        │  Flow Execution  │
                        └────────┬─────────┘
                                 │
                        ┌────────▼─────────┐
                        │ Salesforce Orgs  │
                        │ (via SFDX/OAuth) │
                        └──────────────────┘
```

### Process Architecture (Heroku Procfile)

| Process | Command | Purpose |
|---|---|---|
| **web** | `daphne --bind 0.0.0.0 --port $PORT metadeploy.asgi:application` | Main ASGI web server |
| **devworker** | `honcho start -f Procfile_devworker` | Development worker |
| **worker** | `.heroku/start_metadeploy_worker.sh` | Production RQ workers |
| **worker-short** | `honcho start -f Procfile_worker_short` | Short-lived job worker |
| **release** | `.heroku/release.sh` | Release phase migrations |

### Data Model (Core Entities)

```
ProductCategory (1)──────(N) Product
                              │
Product (1)──────────────(N) Version
                              │
Version (1)──────────────(N) Plan ◄── PlanTemplate
                              │
Plan (1)─────────────────(N) Step
                              │
Plan ──────────────────── Job (installation execution)
Plan ──────────────────── PreflightResult (pre-check)
Plan ──────────────────── ScratchOrg

User ──── SocialAccount (Salesforce OAuth)
Product ── AllowedList ── AllowedListOrg (access control)
SiteProfile (site branding/config)
Translation (i18n data)
```

**Key models** (defined in `metadeploy/api/models.py`, 1,177 lines):
- **Product**: A Salesforce product/package available for installation
- **Version**: A specific release of a product (tied to a git tag)
- **Plan**: An installation plan containing ordered steps (CumulusCI flow)
- **Step**: A single step within a plan
- **Job**: A running or completed installation execution
- **PreflightResult**: Validation checks run before an installation
- **ScratchOrg**: Temporary org for testing installations
- **AllowedList / AllowedListOrg**: Access control by org ID or type
- **ProductCategory**: Grouping/categorization of products
- **SiteProfile**: Site branding and configuration
- **Translation**: i18n support for model content

### Authentication & Authorization

- **Salesforce OAuth**: Users authenticate via Salesforce (django-allauth with custom SalesforceOAuth2 provider)
- **SFDX Connected App**: OAuth client configured via `SFDX_CLIENT_ID`, `SFDX_CLIENT_SECRET`, `SFDX_CLIENT_CALLBACK_URL`
- **GitHub Integration**: Either Personal Access Token (`GITHUB_TOKEN`) or GitHub App (`GITHUB_APP_ID`, `GITHUB_APP_KEY`) for repository access
- **AllowedList Access Control**: Products and Plans can be restricted to specific org IDs or org types (Production, Sandbox, Scratch, Developer)
- **Admin API**: Separate admin REST API (`/admin/rest`) with IP-based subnet restrictions (`ADMIN_API_ALLOWED_SUBNETS`)
- **DB Encryption**: Sensitive fields encrypted using Fernet symmetric encryption

## 4. Codebase Structure

```
MetaDeploy/
├── metadeploy/                    # Django application (17,899 lines Python)
│   ├── api/                       # Core API app
│   │   ├── models.py              # Data models (1,177 lines)
│   │   ├── views.py               # DRF ViewSets
│   │   ├── serializers.py         # DRF serializers
│   │   ├── jobs.py                # Background job definitions
│   │   ├── flows.py               # CumulusCI flow integration
│   │   ├── salesforce.py          # Salesforce API interactions
│   │   ├── github.py              # GitHub API interactions
│   │   ├── cci_configs.py         # CumulusCI configuration
│   │   ├── push.py                # WebSocket push notifications
│   │   ├── permissions.py         # API permissions
│   │   ├── filters.py             # DRF filters
│   │   ├── admin.py               # Django admin config
│   │   ├── cleanup.py             # Scheduled cleanup tasks
│   │   └── urls.py                # API URL routing
│   ├── adminapi/                  # Admin REST API
│   │   ├── api.py                 # Admin API endpoints
│   │   ├── translations.py        # Translation management
│   │   └── urls.py                # Admin API routing
│   ├── management/commands/       # Custom management commands
│   │   ├── promote_superuser.py
│   │   ├── get_sf_token.py
│   │   ├── extract_labels.py
│   │   └── metadeploy_rqscheduler.py
│   ├── consumers.py               # WebSocket consumers
│   ├── routing.py                 # ASGI/WebSocket routing
│   ├── asgi.py                    # ASGI application
│   ├── urls.py                    # Root URL config
│   └── tests/                     # Python test suite
├── src/                           # Frontend source (~9,552 lines TS/TSX)
│   ├── js/
│   │   ├── index.tsx              # App entry point
│   │   ├── components/            # React components
│   │   │   ├── products/          # Product listing/detail pages
│   │   │   ├── plans/             # Plan detail/execution UI
│   │   │   ├── jobs/              # Job progress/results UI
│   │   │   ├── scratchOrgs/       # Scratch org management
│   │   │   └── header/            # Navigation header
│   │   ├── store/                 # Redux state management
│   │   │   ├── products/          # Products state
│   │   │   ├── plans/             # Plans state
│   │   │   ├── jobs/              # Jobs state
│   │   │   ├── org/               # Org state
│   │   │   ├── user/              # User state
│   │   │   ├── scratchOrgs/       # Scratch orgs state
│   │   │   ├── errors/            # Error state
│   │   │   └── socket/            # WebSocket state
│   │   └── utils/                 # Shared utilities
│   ├── sass/                      # SCSS stylesheets
│   └── stories/                   # Storybook stories
├── config/settings/               # Django settings
│   ├── base.py                    # Base settings
│   ├── local.py                   # Local development
│   ├── production.py              # Production
│   └── test.py                    # Test settings
├── docs/                          # Documentation (ReadTheDocs)
├── locales/                       # i18n translation files (35 languages)
├── requirements/                  # Python requirements (pip-compile)
├── robot/                         # Robot Framework tests
├── templates/                     # Django HTML templates
├── .github/workflows/             # GitHub Actions CI/CD
├── Dockerfile                     # Docker build
├── docker-compose.yml             # Docker Compose config
├── Procfile                       # Heroku process definitions
└── webpack.*.js                   # Webpack build configs
```

## 5. API Endpoints

### Public REST API (`/api/`)
| Endpoint | ViewSet | Description |
|---|---|---|
| `/api/products/` | `ProductViewSet` | List/retrieve products |
| `/api/versions/` | `VersionViewSet` | List/retrieve versions |
| `/api/plans/` | `PlanViewSet` | List/retrieve plans, trigger preflights |
| `/api/jobs/` | `JobViewSet` | Create/monitor installation jobs |
| `/api/orgs/` | `OrgViewSet` | Org information |
| `/api/categories/` | `ProductCategoryViewSet` | Product categories |
| `/api/scratch-orgs/` | `ScratchOrgViewSet` | Scratch org management |
| `/api/user/` | `UserView` | Current user info |
| `/api/ui/` | `BootstrapView` | UI bootstrap data |

### Admin REST API (`/admin/rest/`)
Used by CumulusCI to publish plans via `cci task run metadeploy_publish`.

### WebSocket
Real-time updates for job progress, preflight results, and org status changes via Django Channels.

## 6. Background Jobs

### User-Triggered
| Job | Description |
|---|---|
| `run_flows_job` | Runs a CumulusCI plan/flow against a user's Salesforce org |
| `enqueuer_job` | Enqueues `run_flows_job` (avoids DB transaction race conditions) |
| `preflight_job` | Runs preflight checks against an org before installation |
| `create_scratch_org` | Creates a Salesforce scratch org (may also run plan steps) |
| `delete_scratch_org` | Deletes a scratch org |

### Scheduled (Periodic)
| Job | Frequency | Description |
|---|---|---|
| `cleanup_user_data` | Every minute | Cancels stale jobs, expires OAuth tokens (10 min default), deletes old users (30 days), clears old exceptions (90 days) |
| `expire_preflight_results` | Every minute | Invalidates preflight checks older than 10 minutes (configurable via `PREFLIGHT_LIFETIME_MINUTES`) |
| `calculate_average_plan_runtimes` | Daily | Precomputes average installation times for display |

## 7. Key Integration Points

### CumulusCI
- MetaDeploy is deeply integrated with CumulusCI for flow execution
- Plans map to CumulusCI flows defined in `cumulusci.yml`
- Publishing workflow: `cci task run metadeploy_publish -o tag TAG`
- Custom CCI configs via `MetaDeployCCI` class in `cci_configs.py`

### Salesforce
- OAuth authentication for users connecting their orgs
- Flow execution against user orgs via SFDX
- Scratch org creation/deletion
- Org type detection (Production, Sandbox, Scratch, Developer)

### GitHub
- Repository access for fetching source code during installations
- Supports GitHub App or Personal Access Token authentication
- Used during plan publishing and flow execution

### Vlocity/OmniStudio
- Optional dependency on `@omnistudio/omniscript-lwc-compiler`
- Vlocity npm package included as a dependency
- VBT LWC compiler documentation present (`docs/vbt-lwc-compiler.md`)

## 8. Development Setup

### Docker (Recommended)
```bash
git clone git@github.com:SFDO-Tooling/MetaDeploy.git
cd MetaDeploy
cp env.example .env
# Edit .env with required values
docker compose up -d
docker compose exec web bash
yarn serve  # Start dev server at http://localhost:8080/
```

### Local Machine
```bash
# Prerequisites: Python 3.12, Node.js 22, PostgreSQL, Redis
mkvirtualenv metadeploy --python=$(which python3.12)
make dev-install
cp env.example .env
# Edit .env (DJANGO_SECRET_KEY, DJANGO_HASHID_SALT, DB_ENCRYPTION_KEY, SFDX_*, GITHUB_*)
createdb metadeploy
python manage.py migrate
python manage.py populate_data  # Sample data
yarn install
yarn serve  # Starts Django + Webpack + RQ workers
```

### Key Development Commands
| Command | Description |
|---|---|
| `yarn serve` | Start all dev servers (Django + Webpack + RQ) |
| `yarn test:py` | Run Python tests (pytest) |
| `yarn test:js` | Run JavaScript tests (Jest) |
| `yarn lint` | Format and lint all files |
| `yarn storybook` | Start Storybook at http://localhost:6006/ |
| `yarn build` | Build development assets |
| `yarn prod` | Build production assets |

### Required Environment Variables
| Variable | Description |
|---|---|
| `DB_ENCRYPTION_KEY` | Fernet encryption key for DB fields |
| `SFDX_CLIENT_ID` | Salesforce Connected App consumer key |
| `SFDX_CLIENT_SECRET` | Salesforce Connected App consumer secret |
| `SFDX_CLIENT_CALLBACK_URL` | OAuth callback URL |
| `GITHUB_TOKEN` or `GITHUB_APP_ID` + `GITHUB_APP_KEY` | GitHub API access |
| `DJANGO_SECRET_KEY` | Django secret key |
| `DJANGO_HASHID_SALT` | Salt for HashID obfuscation |

## 9. Deployment (Heroku)

- **Buildpacks**: Node.js + Python (dual buildpack)
- **Add-ons**: Heroku PostgreSQL, Heroku Redis
- **Formation**: web (Daphne), devworker, worker, worker-short
- **Release Phase**: Runs database migrations (`.heroku/release.sh`)
- **Post-build**: `yarn prod` (webpack production build)
- **Static Files**: WhiteNoise for serving, optional S3/Bucketeer for uploads
- **Monitoring**: Sentry integration for error tracking
- **Smoke Tests**: Robot Framework tests triggered by `heroku-release-phase` webhook

## 10. Internationalization (i18n)

- **Backend**: Django's `gettext` with `.mo`/`.po` files
- **Frontend**: i18next with browser language auto-detection
- **Coverage**: 35+ language directories in `locales/`
- **Translatable Models**: Products, plans, steps, categories use django-parler
- **Translation Workflow**: Auto-parsed from JS during builds; manual updates for dynamic strings

## 11. Top Contributors (by commit count)

| Contributor | Commits |
|---|---|
| Jonny Gerig Meyer | 1,335 |
| David Glick | 607 |
| Kit La Touche | 603 |
| Brandon Parker | 490 |
| pyup-bot | 341 |
| Ed Rivas | 119 |
| Christian Carter | 101 |
| dvdherron | 92 |
| David Reed | 78 |

## 12. Project Activity & Health

- **Total Commits**: ~3,925 (since July 2018)
- **2024 Commits**: 13 (slowing activity)
- **2023 Commits**: 64
- **Test Coverage**: Targets 100% Python coverage (`--fail-under=100`)
- **CI**: GitHub Actions for tests, linting, Storybook deployment, production smoke tests
- **Recent Focus Areas**: Python 3.12 migration, rate limiting, websocket origin validation, accessibility improvements, CumulusCI version upgrades

## 13. Notable Design Patterns

1. **Job Drain Pattern**: Jobs are not directly scheduled — an `enqueuer_job` picks up `Job` model instances to avoid DB transaction visibility issues (see `jobs.py` header comment).
2. **HashID Obfuscation**: Public-facing IDs use `hashid_field` to avoid exposing sequential database IDs.
3. **AllowedList Access Control**: Flexible product/plan visibility based on org IDs or org types.
4. **WebSocket Real-time Updates**: Job progress, preflight results, and org changes pushed via Django Channels.
5. **Translatable Models**: django-parler for multi-language model content with TranslatedFields.
6. **Encrypted Tokens**: OAuth tokens stored encrypted using Fernet symmetric encryption.

## 14. Security Considerations

- Database field encryption (Fernet) for sensitive data
- OAuth token expiry (10 minutes default, configurable via `TOKEN_LIFETIME_MINUTES`)
- Admin API restricted by IP subnet (`ADMIN_API_ALLOWED_SUBNETS`)
- WebSocket origin validation (added in recent commits)
- Rate limiting on API endpoints (ScopedRateThrottle, added 2024)
- User data cleanup: auto-deletion of non-staff users inactive for 30 days
- Exception field clearing after 90 days (protects customer metadata)
