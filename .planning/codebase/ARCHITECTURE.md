# Architecture

**Analysis Date:** 2026-05-02

## Pattern Overview

**Overall:** Three-tier client-server with separate ML pipeline

The application follows a monorepo structure with three independent subsystems:
1. **Frontend** (Next.js App Router) - UI and client-side logic
2. **Backend** (FastAPI) - REST API with service layer
3. **ML** (Python/scikit-learn) - Offline model training and inference

**Key Characteristics:**
- Dual data access paths: frontend accesses Supabase directly AND through the FastAPI backend
- Backend endpoints heavily use mock/placeholder data instead of real database queries
- ML models are standalone Python classes, not yet integrated into the backend API pipeline
- Docker Compose orchestrates all three services plus a local PostgreSQL instance
- Supabase serves as both the production database (PostgreSQL) and authentication provider

## Layers

**Presentation Layer (Frontend):**
- Purpose: Render UI, manage client-side state, handle user interactions
- Location: `frontend/src/`
- Contains: Next.js pages, React components, hooks, providers, API clients
- Depends on: Supabase JS client (direct DB access), Axios HTTP client (backend API)
- Used by: End users (athletes, coaches)

**API Layer (Backend Endpoints):**
- Purpose: Expose REST endpoints, validate requests, route to services
- Location: `backend/app/api/endpoints/`
- Contains: FastAPI router definitions with request/response handling
- Depends on: Pydantic schemas (`backend/app/schemas/`), service layer
- Used by: Frontend via Axios HTTP calls

**Service Layer (Backend Services):**
- Purpose: Business logic, PMC calculations, training recommendations
- Location: `backend/app/services/`
- Contains: `TrainingService`, `PerformanceService`, `PMCService`
- Depends on: Database models (in theory), PMC calculations
- Used by: API endpoints
- Note: Currently returns hardcoded mock data, not connected to actual DB

**Data Access Layer (Backend Models + Supabase):**
- Purpose: Define database schema, manage connections
- Location: `backend/app/db/` (SQLAlchemy models), `backend/sql/` (raw SQL schemas)
- Contains: SQLAlchemy ORM models, session management, raw SQL migration files
- Depends on: PostgreSQL via SQLAlchemy or Supabase client
- Used by: Service layer (intended), Frontend Supabase client (direct)
- Note: Two competing schema definitions exist - SQLAlchemy models (integer PKs) vs SQL files (UUID PKs)

**ML Layer (Machine Learning):**
- Purpose: Train and run prediction models for PMC, injury risk, training plans
- Location: `ml/` (structured package), `ml_models/` (standalone scripts)
- Contains: Model classes, data loaders, training scripts, Jupyter notebooks
- Depends on: scikit-learn, numpy, pandas, matplotlib
- Used by: Not yet integrated into backend API (standalone execution only)

## Data Flow

**Athlete Dashboard Request (Current Implementation):**

1. User navigates to `/dashboard` in Next.js app
2. `AuthGuard` component checks Supabase auth state via `getCurrentUser()`
3. Page renders `AthleteStats`, `PerformanceChart`, `TrainingRecommendations` components
4. Components use React Query hooks (e.g., `usePerformanceMetrics(athleteId)`)
5. Hooks call API client functions in `frontend/src/lib/api.ts` via Axios
6. Backend FastAPI endpoint receives request at `/api/performance/metrics/{athlete_id}`
7. Endpoint instantiates service class (e.g., `PerformanceService()`)
8. Service returns mock/placeholder data (no real DB query)
9. Response flows back through React Query cache to component

**Weekly Plan Generation (Advanced Flow - `generate_weekly_plan` endpoint):**

1. Coach sends POST to `/api/training/generate_weekly_plan`
2. Endpoint checks coach permission via `coach_athletes` Supabase table
3. Fetches athlete data, competitions, previous workouts, feedback, wellbeing from Supabase
4. Initializes `WeeklyPlanGenerator` with exercise library and phase templates
5. Generator calculates training phase based on competition proximity
6. PMC model calculates current fitness/fatigue state
7. Plan is generated with exercises, sets, reps, and progressive overload
8. Plan is saved to `training_plans` table in Supabase
9. Coach can approve/reject/modify via separate endpoints

**Direct Supabase Access (Frontend bypass):**

1. Frontend components call functions in `frontend/src/lib/supabase.ts`
2. Functions like `getRecentWorkouts()`, `createWorkout()` query Supabase directly
3. This bypasses the FastAPI backend entirely
4. Used alongside (not instead of) backend API calls, creating dual data paths

**State Management:**
- Server state: React Query (`@tanstack/react-query`) with configurable stale times (1min default, 5min athlete data, 1hr performance data)
- Client state: React `useState` hooks (no global client state store)
- Auth state: Supabase auth listener in `useAuth` hook + `AuthGuard` wrapper
- Demo state: localStorage for feedback history in demo page

## Key Abstractions

**PMCModel / PMCService:**
- Purpose: Calculate Performance Management Chart metrics (CTL/ATL/TSB)
- Examples: `ml/models/pmc_model.py`, `backend/app/services/pmc_service.py`
- Pattern: Exponential decay model. CTL (42-day fitness), ATL (7-day fatigue), TSB = CTL - ATL
- Note: Duplicated implementation exists in both `ml/` and `backend/app/services/`

**Service Classes:**
- Purpose: Encapsulate business logic per domain
- Examples: `backend/app/services/training_service.py`, `backend/app/services/performance_service.py`
- Pattern: Stateless classes instantiated per-request in endpoints. No dependency injection.

**Pydantic Schemas:**
- Purpose: Request/response validation and serialization
- Examples: `backend/app/schemas/athlete.py`, `backend/app/schemas/training.py`
- Pattern: Base/Create/Update/Full inheritance pattern (e.g., `AthleteBase` -> `AthleteCreate` -> `Athlete`)

**React Query Hooks:**
- Purpose: Encapsulate API calls with caching, loading states, error handling
- Examples: `frontend/src/hooks/useTraining.ts`, `frontend/src/hooks/usePerformance.ts`
- Pattern: Thin wrappers around `useQuery`/`useMutation` calling API client functions

**WeeklyPlanGenerator:**
- Purpose: AI-powered weekly training plan generation
- Examples: `ml/models/weekly_plan_generator.py`
- Pattern: Complex class that combines PMC state, competition proximity, athlete feedback, and exercise library to produce periodized training plans
- Note: Referenced from `backend/app/api/endpoints/generate_weekly_plan.py` but uses relative imports that suggest it was designed to live inside the backend package

## Entry Points

**Frontend Application:**
- Location: `frontend/src/app/layout.tsx`
- Triggers: Browser navigation
- Responsibilities: Provider hierarchy (ReactQuery -> Supabase -> Mantine -> AuthGuard), global styles
- Provider order: `ReactQueryProvider` > `SupabaseProvider` > `MantineProvider` > `AuthGuard`

**Backend Application:**
- Location: `backend/app/main.py`
- Triggers: Uvicorn server start (`uvicorn app.main:app --reload`)
- Responsibilities: FastAPI app creation, CORS middleware, API router mounting at `/api` prefix, health check at `/health`

**API Router:**
- Location: `backend/app/api/router.py`
- Triggers: Included by `main.py`
- Responsibilities: Mount all endpoint routers with prefixes: `/api/auth`, `/api/athletes`, `/api/training`, `/api/performance`
- Note: `generate_weekly_plan.py` endpoint exists but is NOT registered in the router

**Database Initialization:**
- Location: `backend/app/init_db.py`
- Triggers: Manual execution (`python -m app.init_db`)
- Responsibilities: Create SQLAlchemy tables, populate with sample data (users, athletes, exercises, workouts, metrics, training loads)

**ML Model Training:**
- Location: `ml/training/train_pmc_model.py`, `ml/training/train_injury_risk_model.py`, `ml/training/train_joshua_pmc_model.py`
- Triggers: Manual execution (`python -m ml.training.train_pmc_model`)
- Responsibilities: Load data, train models, save checkpoints

**Docker Orchestration:**
- Location: `docker-compose.yml`
- Triggers: `docker-compose up`
- Responsibilities: Start frontend (port 3000), backend (port 8000), PostgreSQL (port 5432)

## API Routes

**Authentication (`/api/auth`):**
- `POST /api/auth/token` - Login with email/password (placeholder, hardcoded test user)
- `POST /api/auth/google` - Google OAuth (placeholder, not implemented)

**Athletes (`/api/athletes`):**
- `GET /api/athletes/` - List all athletes (placeholder data)
- `GET /api/athletes/{athlete_id}` - Get athlete by ID (placeholder)
- `POST /api/athletes/` - Create athlete (placeholder)
- `PUT /api/athletes/{athlete_id}` - Update athlete (placeholder)
- `DELETE /api/athletes/{athlete_id}` - Delete athlete (placeholder)

**Training (`/api/training`):**
- `GET /api/training/workouts?athlete_id=X&limit=N` - Get workouts (mock data via service)
- `GET /api/training/workouts/{workout_id}` - Get specific workout (placeholder)
- `POST /api/training/workouts` - Create workout (mock via service)
- `GET /api/training/recommendations?athlete_id=X` - Get AI recommendations (mock via PMCService)

**Performance (`/api/performance`):**
- `GET /api/performance/metrics/{athlete_id}` - Get performance metrics (mock data)
- `GET /api/performance/trends/{athlete_id}?metric=X&days=N` - Get trends (generated mock data)
- `GET /api/performance/load/{athlete_id}?days=N` - Get PMC data (calculated from mock loads)
- `GET /api/performance/comparison/{athlete_id}` - Get peer comparison (mock data)

**Not Registered (exists but not mounted):**
- `POST /api/training/generate_weekly_plan` - Generate AI weekly plan
- `POST /api/training/approve_weekly_plan/{plan_id}` - Approve plan
- `POST /api/training/reject_weekly_plan/{plan_id}` - Reject plan

## Error Handling

**Strategy:** Minimal error handling, mostly HTTP exceptions

**Backend Patterns:**
- FastAPI endpoints use `HTTPException` for 404/401/403 errors
- `generate_weekly_plan.py` wraps entire endpoint in try/except with generic 500 response
- No centralized error handling middleware
- Errors logged via `print()` statements, not structured logging

**Frontend Patterns:**
- `ErrorBoundary` component in `frontend/src/components/common/ErrorBoundary.tsx` for React rendering errors
- Auth errors caught in `useAuth` hook with `console.error`
- API errors handled by React Query's built-in error state
- No global error handler or error reporting service

## Cross-Cutting Concerns

**Logging:**
- Backend: Mix of `print()`, `logging.getLogger()`, and no logging
- Frontend: `console.log` / `console.error` only
- No structured logging, log aggregation, or log levels consistently used

**Validation:**
- Backend: Pydantic schemas for request/response validation on some endpoints
- Frontend: Mantine `useForm` with inline validators for login form
- Zod installed but not observed in use

**Authentication:**
- Dual auth strategy: Supabase Auth (frontend) + JWT (backend)
- Frontend: `AuthGuard` wraps all routes, redirects to `/auth/login` if unauthenticated
- Backend: OAuth2PasswordRequestForm with hardcoded test credentials
- `generate_weekly_plan.py` uses `get_current_user` dependency (Supabase-based)
- Main API endpoints (athletes, training, performance) have NO authentication applied

**Authorization:**
- Coach-athlete permission checks only in `generate_weekly_plan.py`
- No role-based access control on main API endpoints
- No Row Level Security policies enforced through SQLAlchemy path

---

*Architecture analysis: 2026-05-02*
