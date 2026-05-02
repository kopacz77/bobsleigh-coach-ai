# Codebase Structure

**Analysis Date:** 2026-05-02

## Directory Layout

```
bobsleigh-coach-ai/
├── .github/
│   └── workflows/
│       └── ci.yml                  # GitHub Actions CI/CD pipeline
├── .planning/
│   └── codebase/                   # GSD codebase analysis documents
├── backend/                        # FastAPI Python backend
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/          # FastAPI route handlers
│   │   │   │   ├── athletes.py     # /api/athletes CRUD
│   │   │   │   ├── auth.py         # /api/auth login
│   │   │   │   ├── generate_weekly_plan.py  # AI plan generation (NOT registered)
│   │   │   │   ├── performance.py  # /api/performance metrics
│   │   │   │   └── training.py     # /api/training workouts
│   │   │   └── router.py           # Central API router
│   │   ├── core/
│   │   │   ├── config.py           # Pydantic settings (env vars)
│   │   │   └── security.py         # JWT + bcrypt utilities
│   │   ├── db/
│   │   │   ├── models/
│   │   │   │   ├── __init__.py     # Model barrel export
│   │   │   │   ├── athlete.py      # Athlete SQLAlchemy model
│   │   │   │   ├── performance.py  # PerformanceMetric, TrainingLoad, TrainingRecommendation
│   │   │   │   ├── user.py         # User SQLAlchemy model
│   │   │   │   └── workout.py      # Exercise, Workout, WorkoutExercise, WorkoutExerciseSet
│   │   │   └── session.py          # SQLAlchemy engine, session, Base
│   │   ├── models/
│   │   │   └── user.py             # Pydantic User model (separate from db models)
│   │   ├── schemas/
│   │   │   ├── athlete.py          # Athlete Pydantic schemas (Base/Create/Update/Full)
│   │   │   ├── token.py            # Token/TokenData schemas
│   │   │   └── training.py         # Workout/WorkoutExercise schemas
│   │   ├── services/
│   │   │   ├── performance_service.py  # Performance metrics and trends (mock data)
│   │   │   ├── pmc_service.py      # PMC calculations with workout generation
│   │   │   └── training_service.py # Workout CRUD and recommendations (mock data)
│   │   ├── init_db.py              # Database initialization with sample data
│   │   └── main.py                 # FastAPI app creation and startup
│   ├── converted_data/             # JSON exports of parsed training data
│   │   ├── athletes.json
│   │   ├── exercises.json
│   │   ├── injuries.json
│   │   ├── performance_tests.json
│   │   ├── wellbeing_entries.json
│   │   └── workouts.json
│   ├── scripts/
│   │   ├── generate_secret_key.py
│   │   ├── parse_josh_training_data.py
│   │   ├── test_weekly_plan.py
│   │   └── validate_parsed_data.py
│   ├── sql/
│   │   ├── adaptive_training_extension.sql  # Extension for adaptive training
│   │   ├── fix_numeric_fields.sql           # Migration fix
│   │   ├── fresh_clean_schema.sql           # Full schema for new deployments
│   │   ├── import_josh_data.sql             # Joshua data import
│   │   ├── insert_joshua_data.sql           # Joshua sample data
│   │   ├── populate_exercise_data.sql       # Exercise library seed data
│   │   └── production_schema.sql            # Current live schema (documentation)
│   ├── tests/
│   │   ├── test_performance_api.py  # Performance endpoint tests
│   │   └── test_pmc_service.py      # PMC service unit tests
│   ├── Dockerfile                   # Backend container (actually a Next.js Dockerfile)
│   ├── requirements.txt             # Python dependencies
│   ├── *.py                         # Various standalone data processing scripts
│   └── *.json                       # Exercise libraries, training data
├── docs/                            # Project documentation
│   ├── ADAPTIVE_TRAINING_SYSTEM.md
│   ├── API.md
│   ├── ARCHITECTURE.md
│   ├── BIOME.md
│   ├── DATABASE.md
│   ├── DEPLOYMENT.md
│   ├── GETTING_STARTED.md
│   ├── JOSHUA_HUDSON_ANALYSIS.md
│   └── SUPABASE.md
├── frontend/                        # Next.js React frontend
│   ├── public/                      # Static assets
│   ├── src/
│   │   ├── app/                     # Next.js App Router pages
│   │   │   ├── auth/login/page.tsx  # Login page
│   │   │   ├── dashboard/page.tsx   # Main dashboard
│   │   │   ├── demo/page.tsx        # Adaptive training demo
│   │   │   ├── performance/page.tsx # Performance metrics page
│   │   │   ├── profile/page.tsx     # User profile page
│   │   │   ├── settings/page.tsx    # Settings page
│   │   │   ├── training/page.tsx    # Training/workout page
│   │   │   ├── wellbeing/page.tsx   # Wellbeing tracker page
│   │   │   ├── layout.tsx           # Root layout (providers, auth guard)
│   │   │   ├── not-found.tsx        # 404 page
│   │   │   └── page.tsx             # Home page (Welcome component)
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   └── AuthGuard.tsx    # Auth wrapper, redirect if unauthenticated
│   │   │   ├── charts/
│   │   │   │   └── TrendCharts.tsx  # Recharts-based trend visualization
│   │   │   ├── check-in/
│   │   │   │   ├── DailyCheckIn.tsx
│   │   │   │   ├── WeeklyReview.tsx
│   │   │   │   └── index.tsx
│   │   │   ├── coach/
│   │   │   │   └── TrainingApprovalPanel.tsx
│   │   │   ├── common/
│   │   │   │   ├── ErrorBoundary.tsx     # React error boundary
│   │   │   │   └── LoadingStates.tsx     # Skeleton loaders, AI processing states
│   │   │   ├── dashboard/
│   │   │   │   ├── AdminDashboard.tsx
│   │   │   │   ├── AthleteDashboard.tsx
│   │   │   │   ├── AthleteOverview.tsx
│   │   │   │   ├── AthleteStats.tsx
│   │   │   │   ├── CoachDashboard.tsx
│   │   │   │   ├── DashboardHeader.tsx
│   │   │   │   ├── PerformanceChart.tsx
│   │   │   │   ├── RecoveryStatus.tsx
│   │   │   │   ├── TrainingSummary.tsx
│   │   │   │   ├── UpcomingWorkouts.tsx
│   │   │   │   └── index.tsx
│   │   │   ├── feedback/
│   │   │   │   └── DailyFeedbackForm.tsx
│   │   │   ├── layout/
│   │   │   │   ├── AppShell.tsx     # Main layout with sidebar navigation
│   │   │   │   └── index.tsx
│   │   │   ├── onboarding/
│   │   │   │   ├── AthleteProfile.tsx
│   │   │   │   ├── GoalSetting.tsx
│   │   │   │   ├── InitialAssessment.tsx
│   │   │   │   ├── Onboarding.tsx
│   │   │   │   ├── TrainingPreferences.tsx
│   │   │   │   └── index.tsx
│   │   │   ├── performance/
│   │   │   │   ├── PerformanceAssessment.tsx
│   │   │   │   ├── PerformanceMetrics.tsx
│   │   │   │   ├── PerformanceTrends.tsx
│   │   │   │   └── index.tsx
│   │   │   ├── profile/
│   │   │   │   └── ProfileCard.tsx
│   │   │   ├── settings/
│   │   │   │   ├── MFASetup.tsx
│   │   │   │   └── Settings.tsx
│   │   │   ├── training/
│   │   │   │   ├── ExerciseCard.tsx
│   │   │   │   ├── LoadAdjustments.tsx
│   │   │   │   ├── SessionRecommendations.tsx
│   │   │   │   ├── TrainingAnalytics.tsx
│   │   │   │   ├── TrainingAssessment.tsx
│   │   │   │   ├── TrainingHeader.tsx
│   │   │   │   ├── TrainingRecommendations.tsx
│   │   │   │   ├── TrainingTabs.tsx
│   │   │   │   ├── WorkoutCalendar.tsx
│   │   │   │   ├── WorkoutDayCard.tsx
│   │   │   │   ├── WorkoutForm.tsx
│   │   │   │   ├── WorkoutList.tsx
│   │   │   │   └── index.tsx
│   │   │   ├── ui/
│   │   │   │   └── index.ts         # Barrel re-exports from other component dirs
│   │   │   ├── wellbeing/
│   │   │   │   ├── MoodTracking.tsx
│   │   │   │   ├── PhysicalMetrics.tsx
│   │   │   │   ├── RecoveryHealth.tsx
│   │   │   │   ├── Reflection.tsx
│   │   │   │   ├── WellbeingAssessment.tsx
│   │   │   │   ├── WellbeingCalendar.tsx
│   │   │   │   ├── WellbeingTrends.tsx
│   │   │   │   └── index.tsx
│   │   │   ├── ClientOnly.tsx
│   │   │   └── Welcome.tsx
│   │   ├── hooks/
│   │   │   ├── useAthlete.ts        # Athlete profile queries/mutations
│   │   │   ├── useAuth.ts           # Supabase auth state hook
│   │   │   ├── usePerformance.ts    # Performance data queries
│   │   │   └── useTraining.ts       # Training data queries/mutations
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios API client with endpoint definitions
│   │   │   └── supabase.ts          # Supabase client + direct DB access functions
│   │   ├── providers/
│   │   │   ├── ReactQueryProvider.tsx   # TanStack React Query provider
│   │   │   └── SupabaseProvider.tsx     # Supabase client context provider
│   │   ├── styles/
│   │   │   └── theme.ts             # Mantine theme configuration
│   │   └── utils/
│   │       └── api.ts               # Duplicate Axios instance (unused?)
│   ├── Dockerfile                   # Frontend container (Next.js multi-stage)
│   ├── next.config.js               # Next.js configuration
│   ├── package.json                 # Frontend dependencies
│   ├── postcss.config.js            # PostCSS for Mantine
│   └── tsconfig.json                # TypeScript configuration
├── logo/                            # Brand logo images
├── ml/                              # Machine learning package
│   ├── data/
│   │   ├── joshua_data_loader.py    # Load Joshua's training data
│   │   ├── pmc_calculator.py        # PMC calculation utilities
│   │   ├── preprocess.py            # Data preprocessing
│   │   └── README.md
│   ├── models/
│   │   ├── injury_risk_model.py     # Gradient boosting injury predictor
│   │   ├── joshua_recommendation_engine.py  # Joshua-specific recommendation engine
│   │   ├── pmc_model.py             # PMC model with visualization
│   │   ├── weekly_plan_generator.py # AI weekly training plan generator
│   │   └── README.md
│   ├── notebooks/
│   │   ├── 01_pmc_analysis.ipynb
│   │   ├── 02_injury_risk_analysis.ipynb
│   │   └── README.md
│   ├── training/
│   │   ├── train_injury_risk_model.py
│   │   ├── train_joshua_pmc_model.py
│   │   ├── train_pmc_model.py
│   │   └── README.md
│   ├── requirements.txt
│   └── setup_and_train.py
├── ml_models/                       # Standalone ML scripts (outside ml package)
│   └── joshua_predictor.py          # Joshua-specific performance predictor
├── scripts/
│   └── deploy.sh                    # Google Cloud Run deployment script
├── biome.json                       # Biome linter/formatter config
├── docker-compose.yml               # Docker orchestration (frontend, backend, db)
├── package.json                     # Root workspace package.json
├── pnpm-workspace.yaml              # pnpm workspace definition
├── .env.example                     # Environment variable template
├── .npmrc                           # npm/pnpm registry config
├── CLAUDE.md                        # AI coding assistant instructions
├── README.md                        # Project overview
└── *.md                             # Various planning/documentation files
```

## Directory Purposes

**`backend/app/api/endpoints/`:**
- Purpose: FastAPI route handler definitions
- Contains: One file per domain area (auth, athletes, training, performance)
- Key files: `backend/app/api/endpoints/training.py`, `backend/app/api/endpoints/performance.py`
- Pattern: Each file creates an `APIRouter()`, defines route handlers, imports schemas/services

**`backend/app/db/models/`:**
- Purpose: SQLAlchemy ORM model definitions
- Contains: Database table mappings with relationships
- Key files: `backend/app/db/models/workout.py` (4 models), `backend/app/db/models/performance.py` (3 models)
- Note: Uses integer primary keys, while production Supabase schema uses UUIDs

**`backend/app/schemas/`:**
- Purpose: Pydantic request/response schemas for API validation
- Contains: Base/Create/Update/Full schema inheritance per domain
- Key files: `backend/app/schemas/athlete.py`, `backend/app/schemas/training.py`

**`backend/app/services/`:**
- Purpose: Business logic layer between API endpoints and data access
- Contains: Service classes with async methods
- Key files: `backend/app/services/pmc_service.py` (474 lines, most complex)
- Note: All services currently return mock/hardcoded data

**`backend/sql/`:**
- Purpose: Raw SQL schema definitions for Supabase PostgreSQL
- Contains: Schema creation, data seeding, migration fixes
- Key files: `backend/sql/fresh_clean_schema.sql` (clean setup), `backend/sql/production_schema.sql` (live reference)
- Note: This is the authoritative schema; SQLAlchemy models are a simplified subset

**`frontend/src/app/`:**
- Purpose: Next.js App Router pages (file-based routing)
- Contains: One `page.tsx` per route
- Key files: `frontend/src/app/layout.tsx` (root with providers), `frontend/src/app/dashboard/page.tsx`
- Pattern: Pages are thin wrappers that compose components inside `<AppShell>`

**`frontend/src/components/`:**
- Purpose: Reusable React UI components organized by domain
- Contains: 14 subdirectories by feature area
- Key files: `frontend/src/components/layout/AppShell.tsx` (main layout), `frontend/src/components/auth/AuthGuard.tsx`
- Pattern: Each subdirectory has an `index.tsx` barrel export file

**`frontend/src/hooks/`:**
- Purpose: Custom React hooks for data fetching and state management
- Contains: React Query wrappers for each API domain
- Key files: `frontend/src/hooks/useAuth.ts`, `frontend/src/hooks/useTraining.ts`

**`frontend/src/lib/`:**
- Purpose: API clients and external service configuration
- Contains: Axios client (`api.ts`), Supabase client + direct queries (`supabase.ts`)
- Note: `frontend/src/utils/api.ts` is a duplicate Axios instance without auth interceptor

**`frontend/src/providers/`:**
- Purpose: React context providers for global state
- Contains: ReactQuery and Supabase providers
- Key files: `frontend/src/providers/ReactQueryProvider.tsx`, `frontend/src/providers/SupabaseProvider.tsx`

**`ml/models/`:**
- Purpose: ML model class definitions
- Contains: PMC model, injury risk predictor, weekly plan generator, recommendation engine
- Key files: `ml/models/weekly_plan_generator.py` (~900 lines, most complex)

**`ml/training/`:**
- Purpose: Model training scripts
- Contains: Training pipelines for each model type
- Key files: `ml/training/train_joshua_pmc_model.py` (Joshua-specific PMC training)

**`ml/data/`:**
- Purpose: Data loading and preprocessing utilities
- Contains: Data loaders, PMC calculators, preprocessors

**`backend/converted_data/`:**
- Purpose: JSON exports of parsed training data from Excel
- Contains: Athletes, exercises, injuries, performance tests, wellbeing entries, workouts
- Generated: Yes (from `backend/excel_to_db_converter.py`)
- Committed: Yes

## Key File Locations

**Entry Points:**
- `frontend/src/app/layout.tsx`: Root layout with all providers
- `backend/app/main.py`: FastAPI application creation
- `docker-compose.yml`: Full-stack orchestration

**Configuration:**
- `backend/app/core/config.py`: Backend settings (env vars, secrets, DB URL)
- `frontend/next.config.js`: Next.js config (env vars, build settings)
- `frontend/tsconfig.json`: TypeScript compiler options (path alias `@/*` -> `./src/*`)
- `biome.json`: Biome linter/formatter rules (project-wide)
- `.env.example`: Required environment variables template
- `frontend/src/styles/theme.ts`: Mantine theme (colors, typography)

**Core Logic:**
- `backend/app/services/pmc_service.py`: PMC calculation + workout generation (474 lines)
- `ml/models/weekly_plan_generator.py`: AI weekly plan generation (~900 lines)
- `ml/models/injury_risk_model.py`: Injury risk prediction model
- `frontend/src/lib/supabase.ts`: Direct Supabase DB access functions
- `frontend/src/lib/api.ts`: Backend API client with all endpoint definitions

**Testing:**
- `backend/tests/test_pmc_service.py`: PMC service unit tests
- `backend/tests/test_performance_api.py`: Performance API integration tests

**Database Schema:**
- `backend/sql/fresh_clean_schema.sql`: Canonical schema for new deployments
- `backend/sql/production_schema.sql`: Live schema documentation
- `backend/app/db/models/`: SQLAlchemy ORM models (simplified subset)

## Naming Conventions

**Files:**
- Frontend pages: `page.tsx` (Next.js convention)
- Frontend components: `PascalCase.tsx` (e.g., `AuthGuard.tsx`, `PerformanceChart.tsx`)
- Frontend hooks: `camelCase.ts` with `use` prefix (e.g., `useAuth.ts`, `useTraining.ts`)
- Frontend lib/utils: `camelCase.ts` (e.g., `api.ts`, `supabase.ts`)
- Backend endpoints: `snake_case.py` (e.g., `athletes.py`, `generate_weekly_plan.py`)
- Backend models: `snake_case.py` (e.g., `user.py`, `workout.py`)
- Backend schemas: `snake_case.py` (e.g., `athlete.py`, `training.py`)
- Backend services: `snake_case.py` with `_service` suffix (e.g., `pmc_service.py`)
- SQL files: `snake_case.sql` (e.g., `fresh_clean_schema.sql`)
- ML models: `snake_case.py` with `_model` suffix (e.g., `pmc_model.py`, `injury_risk_model.py`)

**Directories:**
- Frontend components: `kebab-case` or `camelCase` by feature (e.g., `check-in/`, `dashboard/`)
- Backend: `snake_case` by layer (e.g., `endpoints/`, `models/`, `services/`)

**Barrel Exports:**
- Frontend: `index.tsx` or `index.ts` in each component directory
- Backend models: `__init__.py` in `backend/app/db/models/`

## Where to Add New Code

**New API Endpoint:**
- Create handler: `backend/app/api/endpoints/{domain}.py`
- Create schemas: `backend/app/schemas/{domain}.py`
- Create service: `backend/app/services/{domain}_service.py`
- Register route: Add `include_router()` in `backend/app/api/router.py`
- Add tests: `backend/tests/test_{domain}_api.py`

**New Frontend Page:**
- Create page: `frontend/src/app/{route}/page.tsx`
- Wrap content in `<AppShell>` for navigation layout
- Add nav link in `frontend/src/components/layout/AppShell.tsx` (navLinks array)

**New Frontend Component:**
- Create component: `frontend/src/components/{feature}/{ComponentName}.tsx`
- Export from: `frontend/src/components/{feature}/index.tsx`
- Use Mantine components for UI primitives
- Use `@tabler/icons-react` for icons

**New React Query Hook:**
- Create hook: `frontend/src/hooks/use{Domain}.ts`
- Add API client functions: `frontend/src/lib/api.ts` (in the appropriate API object)
- Follow existing pattern: `useQuery`/`useMutation` wrapping API calls

**New ML Model:**
- Define model class: `ml/models/{model_name}.py`
- Create training script: `ml/training/train_{model_name}.py`
- Add data loader if needed: `ml/data/{data_source}_loader.py`

**New Database Table:**
- Add to SQL schema: `backend/sql/fresh_clean_schema.sql`
- Optionally add SQLAlchemy model: `backend/app/db/models/{table}.py`
- Register in: `backend/app/db/models/__init__.py`

**New Utility/Helper:**
- Frontend shared: `frontend/src/utils/{helper}.ts`
- Frontend API-related: `frontend/src/lib/{helper}.ts`
- Backend: `backend/app/core/{utility}.py`

## Special Directories

**`backend/converted_data/`:**
- Purpose: JSON exports of Joshua Hudson's training data parsed from Excel
- Generated: Yes, by `backend/excel_to_db_converter.py`
- Committed: Yes (contains athlete-specific data)

**`backend/sql/`:**
- Purpose: Raw SQL schema files for Supabase
- Generated: No (hand-written)
- Committed: Yes
- Note: `production_schema.sql` is documentation-only, not meant to be executed

**`frontend/public/`:**
- Purpose: Static assets served by Next.js
- Generated: No
- Committed: Yes

**`ml/notebooks/`:**
- Purpose: Jupyter notebooks for data exploration and analysis
- Generated: Partially (outputs are generated)
- Committed: Yes

**`docs/`:**
- Purpose: Project documentation
- Generated: No (hand-written)
- Committed: Yes
- Note: Contains 9 markdown files covering architecture, API, database, deployment, etc.

**`logo/`:**
- Purpose: Brand logo image assets
- Generated: Yes (AI-generated)
- Committed: Yes

**`ml_models/`:**
- Purpose: Standalone ML scripts outside the main `ml/` package
- Contains: `joshua_predictor.py` only
- Note: This appears to be an older/alternate location; prefer `ml/models/` for new models

---

*Structure analysis: 2026-05-02*
