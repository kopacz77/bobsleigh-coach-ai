# External Integrations

**Analysis Date:** 2026-05-02

## APIs & External Services

**Supabase (Primary BaaS):**
- Used for: Authentication, direct database access from frontend, and data loading for ML pipeline
- Frontend SDK: `@supabase/supabase-js` 2.49.1 (`frontend/src/lib/supabase.ts`)
- Frontend Auth Helpers: `@supabase/auth-helpers-react` 0.5.0
- Backend SDK: `supabase` 2.3.0 (Python, used in `ml/data/joshua_data_loader.py`, `backend/app/api/endpoints/generate_weekly_plan.py`)
- Auth: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (frontend), `SUPABASE_URL`, `SUPABASE_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (backend)

**FastAPI Backend (Internal API):**
- Base URL: `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000`)
- Client: Axios instance with Bearer token interceptor (`frontend/src/lib/api.ts`)
- API prefix: `/api`
- Endpoints:
  - `/api/auth/token` - JWT login (POST)
  - `/api/auth/google` - Google OAuth placeholder (POST)
  - `/api/athletes/{id}` - Athlete CRUD (GET, PUT)
  - `/api/training/workouts` - Workout management (GET, POST)
  - `/api/training/recommendations` - AI recommendations (GET)
  - `/api/performance/metrics/{id}` - Performance metrics (GET)
  - `/api/performance/trends/{id}` - Performance trends (GET)
  - `/api/performance/load/{id}` - PMC training load (GET)
  - `/api/performance/comparison/{id}` - Peer comparison (GET)
  - `/api/training/generate_weekly_plan` - ML-generated weekly plans (POST)
  - `/api/training/approve_weekly_plan/{id}` - Coach approval (POST)
  - `/api/training/reject_weekly_plan/{id}` - Coach rejection (POST)
- Interactive docs: `/docs` (Swagger, dev only), `/redoc` (dev only)
- Health check: `/health`

## Data Storage

**Databases:**
- PostgreSQL 16 (primary)
  - Connection: `DATABASE_URL` env var (default: `postgresql://postgres:postgres@localhost:5432/bobsleigh`)
  - ORM: SQLAlchemy 2.0.25 (`backend/app/db/session.py`)
  - Direct access: Supabase client from frontend (`frontend/src/lib/supabase.ts`)
  - Tables (via SQLAlchemy models):
    - `users` - Authentication (`backend/app/db/models/user.py`)
    - `athletes` - Athlete profiles (`backend/app/db/models/athlete.py`)
    - `exercises` - Exercise library (`backend/app/db/models/workout.py`)
    - `workouts` - Training sessions (`backend/app/db/models/workout.py`)
    - `workout_exercises` - Exercises within workouts (`backend/app/db/models/workout.py`)
    - `workout_exercise_sets` - Individual sets (`backend/app/db/models/workout.py`)
    - `performance_metrics` - Test results (`backend/app/db/models/performance.py`)
    - `training_loads` - PMC data (CTL/ATL/TSB) (`backend/app/db/models/performance.py`)
    - `training_recommendations` - AI-generated plans (`backend/app/db/models/performance.py`)
  - Additional tables referenced in code but not in SQLAlchemy models:
    - `wellbeing_assessments` - Daily wellness (accessed via Supabase client)
    - `coach_athletes` - Coach-athlete relationships
    - `competitions` - Upcoming competitions
    - `workout_feedback` - Athlete feedback
    - `training_plans` - Generated weekly plans
    - `workout_exercise_groups` - Exercise groupings
  - SQL schemas: `backend/sql/production_schema.sql`, `backend/sql/fresh_clean_schema.sql`
  - Hosting: Supabase (managed PostgreSQL) for production, Docker `postgres:16-alpine` for local dev

**File Storage:**
- Local filesystem only (model checkpoints saved to `ml/models/checkpoints/` via `joblib`)
- No cloud storage integration (S3, GCS, etc.)

**Caching:**
- None (no Redis, Memcached, or in-memory caching layer)
- React Query provides client-side cache with 1-minute stale time (`frontend/src/providers/ReactQueryProvider.tsx`)

## Authentication & Identity

**Auth Provider: Supabase Auth**
- Primary method: Google OAuth via `supabase.auth.signInWithOAuth({ provider: "google" })` (`frontend/src/lib/supabase.ts`)
- Auth state listener: `supabase.auth.onAuthStateChange()` (`frontend/src/hooks/useAuth.ts`)
- Session persistence: `persistSession: true`, `autoRefreshToken: true` (`frontend/src/providers/SupabaseProvider.tsx`)
- Auth guard: `frontend/src/components/auth/AuthGuard.tsx`

**Backend Auth (Separate System):**
- JWT tokens via `python-jose` with HS256 algorithm (`backend/app/core/security.py`)
- Password hashing: bcrypt via passlib (`backend/app/core/security.py`)
- Token endpoint: `/api/auth/token` - currently hardcoded test credentials (`backend/app/api/endpoints/auth.py`)
- Token expiry: 30 minutes (configurable via `ACCESS_TOKEN_EXPIRE_MINUTES`)
- Secret key: `SECRET_KEY` env var (defaults to insecure `"supersecretkey"`)

**Auth Architecture Note:**
- Two authentication systems exist: Supabase Auth (frontend) and custom JWT (backend)
- The backend auth endpoint has placeholder/mock implementation
- Frontend stores auth token in localStorage and sends as Bearer token to backend (`frontend/src/lib/api.ts`)
- A second API client at `frontend/src/utils/api.ts` has the auth interceptor commented out

## Monitoring & Observability

**Error Tracking:**
- None (no Sentry, Datadog, or similar)

**Logs:**
- Backend: Python `logging` module (used in `ml/data/joshua_data_loader.py`, `ml/models/joshua_recommendation_engine.py`)
- Backend endpoints: `print()` statements for error logging (`backend/app/api/endpoints/generate_weekly_plan.py`)
- Frontend: `console.error()` for auth errors (`frontend/src/providers/SupabaseProvider.tsx`)
- No structured logging or log aggregation

## CI/CD & Deployment

**Hosting:**
- Google Cloud Run (target platform)
- Services: `bobsleigh-coach-ai-backend`, `bobsleigh-coach-ai-frontend`
- Container registry: Google Container Registry (`gcr.io`)
- Resources: 512Mi memory, 1 CPU per service

**CI Pipeline:**
- GitHub Actions (`.github/workflows/ci.yml`)
- Triggers: push to `main`, pull requests to `main`
- Frontend job: Node 18, npm ci, ESLint (test step commented out)
- Backend job: Python 3.11, pip install, flake8 linting (pytest step commented out)
- Build jobs: Docker image builds for frontend and backend (push to main only)
- Deploy job: Commented out, uses `google-github-actions/setup-gcloud` with `scripts/deploy.sh`
- **Issue:** CI uses `npm` but project is configured for `pnpm`

**Deployment Script:**
- `scripts/deploy.sh` - Bash script for Cloud Run deployment
- Builds Docker images, pushes to GCR, deploys both services
- Requires: `GCP_PROJECT_ID`, `GCP_REGION` env vars
- Also uses `npm` instead of `pnpm`

## Environment Configuration

**Required env vars:**
- `SUPABASE_URL` - Supabase project URL
- `SUPABASE_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (elevated permissions)
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing key
- `CORS_ORIGINS` - Allowed CORS origins (comma-separated)
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase URL for frontend
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon key for frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL for frontend

**Optional env vars:**
- `ENVIRONMENT` - `development` or `production` (controls Swagger docs visibility)

**Secrets location:**
- `.env` file at project root (not committed)
- `.env.example` at project root (template, committed)
- GitHub Actions secrets for CI/CD: `GCP_PROJECT_ID`, `GCP_REGION`, `GCP_SA_KEY`

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- None detected

## ML Model Integration

**Model Serving:**
- Models are loaded in-process within the FastAPI backend, not via separate model serving infrastructure
- Model checkpoints stored at `ml/models/checkpoints/` as `.pkl` and `.joblib` files
- `backend/app/services/pmc_service.py` - PMC calculations (in-process, uses numpy)
- `backend/app/api/endpoints/generate_weekly_plan.py` imports `WeeklyPlanGenerator` and `PMCModel` from `ml/` directory

**Data Pipeline:**
- `ml/data/joshua_data_loader.py` - Loads training data from Supabase for ML training
- Uses Supabase Python client directly (env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`)
- No automated data pipeline or scheduled training

**Model Types:**
- PMC Model (`ml/models/pmc_model.py`) - Fitness-fatigue calculation (numpy, no ML)
- Injury Risk Model (`ml/models/injury_risk_model.py`) - GradientBoostingClassifier (scikit-learn, serialized via joblib)
- Recommendation Engine (`ml/models/joshua_recommendation_engine.py`) - Rule-based with ML predictions (uses serialized model files)

## Dual Data Access Pattern

**The frontend accesses data through two parallel paths:**

1. **Direct Supabase queries** - `frontend/src/lib/supabase.ts` calls Supabase client directly for:
   - Athlete profiles (`athletes` table)
   - Workouts with exercises (`workouts`, `workout_exercises` tables)
   - Training recommendations (`training_recommendations` table)

2. **FastAPI backend API** - `frontend/src/lib/api.ts` calls backend via Axios for:
   - Authentication (`/api/auth/token`)
   - Athlete profiles (`/api/athletes/`)
   - Training data (`/api/training/`)
   - Performance metrics (`/api/performance/`)

This dual-access pattern means the same data can be reached through either path, creating potential consistency issues.

---

*Integration audit: 2026-05-02*
