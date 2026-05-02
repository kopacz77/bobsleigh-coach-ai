# Codebase Concerns

**Analysis Date:** 2026-05-02

## Tech Debt

**Entire backend API returns hardcoded mock data instead of querying the database:**
- Issue: Every API endpoint (athletes, training, performance) returns hardcoded mock/placeholder data. No endpoint actually queries the database despite SQLAlchemy models and a database session being fully configured.
- Files:
  - `backend/app/api/endpoints/athletes.py` (lines 13-38: returns hardcoded athlete list, lines 42-57: returns hardcoded athlete by ID)
  - `backend/app/services/training_service.py` (lines 31-115: returns hardcoded workouts, line 128: returns mock ID)
  - `backend/app/services/performance_service.py` (lines 30-50: returns hardcoded metrics, lines 63-106: generates fake trend data, lines 160-189: returns hardcoded peer comparison)
  - `backend/app/services/pmc_service.py` (lines 53-69: uses `np.random.seed(42)` to generate fake training load data instead of querying)
- Impact: The application is non-functional as a real product. All data displayed is fake. The database models exist but are unused.
- Fix approach: Wire up each service method to use SQLAlchemy queries via `SessionLocal` or dependency-injected `db` sessions. Replace mock data with actual DB queries.

**Duplicate API client modules in frontend:**
- Issue: Two separate files create axios instances pointing at the same backend, with slightly different configurations. `frontend/src/lib/api.ts` has auth token injection enabled; `frontend/src/utils/api.ts` has it commented out.
- Files:
  - `frontend/src/lib/api.ts` (active auth interceptor)
  - `frontend/src/utils/api.ts` (auth interceptor commented out)
- Impact: Confusing which module to import from. Components could use the wrong one and lose auth headers.
- Fix approach: Delete `frontend/src/utils/api.ts`. Standardize all imports to use `@/lib/api`.

**Dual charting library usage:**
- Issue: The frontend uses both `chart.js`/`react-chartjs-2` AND `recharts` for charts, increasing bundle size unnecessarily.
- Files using `react-chartjs-2`:
  - `frontend/src/components/training/TrainingAnalytics.tsx`
  - `frontend/src/components/dashboard/PerformanceChart.tsx`
  - `frontend/src/components/performance/PerformanceTrends.tsx`
- Files using `recharts`:
  - `frontend/src/components/dashboard/AthleteDashboard.tsx`
  - `frontend/src/components/dashboard/AdminDashboard.tsx`
  - `frontend/src/components/check-in/WeeklyReview.tsx`
  - `frontend/src/components/charts/TrendCharts.tsx`
  - `frontend/src/components/wellbeing/PhysicalMetrics.tsx`
  - `frontend/src/components/performance/PerformanceAssessment.tsx`
- Impact: Significant bundle size bloat (chart.js ~200KB + recharts ~150KB). Inconsistent chart styling/behavior.
- Fix approach: Standardize on recharts (more components already use it). Remove chart.js and react-chartjs-2 dependencies.

**Dual Supabase client pattern in frontend:**
- Issue: Some components use `useSupabaseClient()` from `@supabase/auth-helpers-react` while others use `supabase` from `@/lib/supabase`. The `SupabaseProvider` at `frontend/src/providers/SupabaseProvider.tsx` creates its own client but doesn't integrate with `@supabase/auth-helpers-react`. These are two separate, uncoordinated auth state sources.
- Files using `@supabase/auth-helpers-react` (20+ components):
  - `frontend/src/components/dashboard/AthleteDashboard.tsx`
  - `frontend/src/components/dashboard/CoachDashboard.tsx`
  - `frontend/src/components/dashboard/AdminDashboard.tsx`
  - `frontend/src/components/wellbeing/RecoveryHealth.tsx`
  - `frontend/src/components/wellbeing/PhysicalMetrics.tsx`
  - `frontend/src/components/wellbeing/MoodTracking.tsx`
  - `frontend/src/components/wellbeing/Reflection.tsx`
  - `frontend/src/components/wellbeing/WellbeingAssessment.tsx`
  - `frontend/src/components/check-in/DailyCheckIn.tsx`
  - `frontend/src/components/check-in/WeeklyReview.tsx`
  - `frontend/src/components/training/TrainingAssessment.tsx`
  - `frontend/src/components/performance/PerformanceAssessment.tsx`
  - `frontend/src/components/settings/MFASetup.tsx`
  - `frontend/src/components/onboarding/Onboarding.tsx`
  - `frontend/src/components/onboarding/AthleteProfile.tsx`
  - `frontend/src/components/onboarding/GoalSetting.tsx`
  - `frontend/src/components/onboarding/TrainingPreferences.tsx`
  - `frontend/src/components/onboarding/InitialAssessment.tsx`
  - `frontend/src/components/dashboard/AthleteOverview.tsx`
- Files using `@/lib/supabase` directly:
  - `frontend/src/hooks/useAuth.ts`
  - `frontend/src/components/auth/AuthGuard.tsx`
  - `frontend/src/components/wellbeing/WellbeingTrends.tsx`
  - `frontend/src/components/wellbeing/WellbeingAssessment.tsx` (uses BOTH)
  - `frontend/src/components/wellbeing/WellbeingCalendar.tsx`
  - `frontend/src/app/auth/login/page.tsx`
- Impact: `@supabase/auth-helpers-react` requires a `SessionContextProvider` wrapper that is NOT in the component tree (only a custom `SupabaseProvider` exists). This means `useSupabaseClient()` returns `null` in 20+ components, causing runtime crashes.
- Fix approach: Choose one pattern. Either add `SessionContextProvider` from auth-helpers, or migrate all components to use the custom `useSupabase()` hook from `frontend/src/providers/SupabaseProvider.tsx`.

**Massive one-off data processing scripts littering backend root:**
- Issue: 8+ standalone Python scripts for data parsing/deduplication sit in the backend root directory. These are one-time-use scripts for Joshua Hudson's data but bloat the codebase.
- Files:
  - `backend/joshua_data_parser.py` (507 lines)
  - `backend/analyze_joshua_training_data.py` (494 lines)
  - `backend/comprehensive_exercise_extraction.py` (769 lines)
  - `backend/exercise_deduplication_engine.py` (597 lines)
  - `backend/improved_exercise_deduplicator.py` (601 lines)
  - `backend/conservative_exercise_deduplicator.py` (511 lines)
  - `backend/final_exercise_deduplicator.py` (861 lines)
  - `backend/populate_exercise_library.py` (443 lines)
  - `backend/refine_exercise_library.py` (660 lines)
  - `backend/excel_to_db_converter.py` (318 lines)
- Impact: 5,761 lines of one-off code cluttering the backend. Makes navigation difficult and increases cognitive load.
- Fix approach: Move to `backend/scripts/data_migration/` or `tools/` directory. Add README explaining their purpose and that they are one-time-use.

**SQLAlchemy models use Integer IDs but Supabase schema uses UUIDs:**
- Issue: The SQLAlchemy models in `backend/app/db/models/` use `Integer` primary keys while both the fresh and production Supabase schemas use `uuid` primary keys. The models cannot work with the actual database.
- Files:
  - `backend/app/db/models/athlete.py` (line 12: `id = Column(Integer, primary_key=True)`)
  - `backend/app/db/models/user.py` (line 12: `id = Column(Integer, primary_key=True)`)
  - `backend/app/db/models/workout.py` (line 12, 27, 45, 66: all use `Integer` PKs)
  - `backend/app/db/models/performance.py` (line 12, 30, 53: all use `Integer` PKs)
  - `backend/sql/fresh_clean_schema.sql` (uses `uuid PRIMARY KEY DEFAULT uuid_generate_v4()`)
  - `backend/sql/production_schema.sql` (uses `uuid NOT NULL DEFAULT uuid_generate_v4()`)
- Impact: Backend cannot connect to or interact with the actual Supabase database. Complete schema mismatch.
- Fix approach: Update all SQLAlchemy models to use `UUID` type for primary keys and foreign keys. Use `sqlalchemy.dialects.postgresql.UUID`.

**`generate_weekly_plan` endpoint imports 6 non-existent modules:**
- Issue: The endpoint at `backend/app/api/endpoints/generate_weekly_plan.py` imports from modules that don't exist anywhere in the backend package hierarchy. It also isn't registered in the API router.
- Files:
  - `backend/app/api/endpoints/generate_weekly_plan.py` (lines 6-12)
  - Imports that don't exist:
    - `...services.auth` (no `auth` service)
    - `...services.database` (no `database` service)
    - `...models.user` (exists at wrong path)
    - `...ml.models.weekly_plan_generator` (not in backend, only in `ml/`)
    - `...ml.models.pmc_model` (not in backend)
    - `...services.exercise_library` (doesn't exist)
    - `...services.training_templates` (doesn't exist)
  - `backend/app/api/router.py` (does NOT include this endpoint)
- Impact: This endpoint is dead code that cannot be imported or called. It would crash on import.
- Fix approach: Either implement the missing service modules or remove this endpoint until the architecture supports it.

**Frontend demo page imports 4 non-existent modules:**
- Issue: The demo page imports from modules that have never been created.
- Files:
  - `frontend/src/app/demo/page.tsx` (lines 23-26)
  - Missing modules:
    - `@/lib/mockData/sessionData`
    - `@/lib/notifications/toast`
    - `@/lib/storage/localStorage`
    - `@/lib/types/training`
- Impact: Demo page will crash on load. This is user-facing.
- Fix approach: Either create these modules or remove the demo page.

## Known Bugs

**Multiple frontend files have duplicate/broken imports (will not compile):**
- Symptoms: Syntax errors from duplicate import blocks, misplaced `'use client'` directives, and duplicate identifiers.
- Files:
  - `frontend/src/components/wellbeing/Reflection.tsx`: `'use client'` on line 6 (after imports), duplicate `Divider`/`Select` imports, duplicate `React`/`useState`/`useEffect` imports, duplicate `Calendar` import, duplicate `useDisclosure` import, duplicate `useSupabaseClient` import, stray `}` on line 34
  - `frontend/src/components/wellbeing/WellbeingAssessment.tsx`: Two `'use client'` directives (lines 4, 9), broken import block with bare identifiers outside a block (lines 36-39), duplicate `useMantineTheme`, duplicate `IconBrain`/`IconHeartFilled`/`IconMoodNervous`/`IconSalad`/`IconZzz`, duplicate `React`/`useState`/`useEffect`
- Trigger: These files will fail TypeScript compilation and Next.js build.
- Workaround: None. These files must be fixed.

**Auth endpoint uses hardcoded credentials:**
- Symptoms: Login only works with `test@example.com` / `password`.
- Files: `backend/app/api/endpoints/auth.py` (line 15)
- Trigger: Any login attempt with real credentials.
- Workaround: The frontend uses Supabase Auth directly, bypassing this endpoint.

**PMC service uses fixed random seed producing identical data for all athletes:**
- Symptoms: Every athlete gets the same training load history and recommendations.
- Files: `backend/app/services/pmc_service.py` (line 58: `np.random.seed(42)`)
- Trigger: Calling any PMC or performance endpoint for any athlete ID.
- Workaround: None within current mock data architecture.

**Backend tests use `async def` without pytest-asyncio:**
- Symptoms: Tests in `test_pmc_service.py` defined as `async def` will be silently skipped or fail because `pytest-asyncio` is not in `requirements.txt`.
- Files:
  - `backend/tests/test_pmc_service.py` (lines 14, 44, 81: `async def test_*`)
  - `backend/requirements.txt` (no `pytest-asyncio` dependency)
- Trigger: Running `pytest` - async tests are not collected.
- Workaround: None. Add `pytest-asyncio` and mark tests with `@pytest.mark.asyncio`.

## Security Considerations

**Hardcoded default secret key in production config:**
- Risk: JWT tokens are signed with `"supersecretkey"` if `SECRET_KEY` env var is not set. Any attacker can forge valid JWT tokens.
- Files: `backend/app/core/config.py` (line 16: `SECRET_KEY: str = "supersecretkey"`)
- Current mitigation: None. The default is insecure.
- Recommendations: Remove the default value. Require `SECRET_KEY` to be set via environment variable. Fail fast on startup if missing.

**Hardcoded database password in data processing script:**
- Risk: Database credentials embedded in source code.
- Files: `backend/populate_exercise_library.py` (line 422: `"postgresql://postgres:password@localhost:5432/bobsleigh_coach"`)
- Current mitigation: None.
- Recommendations: Use environment variables for all connection strings.

**Default database password "postgres" in config and Docker:**
- Risk: Default PostgreSQL password used in development config and docker-compose.
- Files:
  - `backend/app/core/config.py` (line 21: `DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/bobsleigh"`)
  - `docker-compose.yml` (line 43: `POSTGRES_PASSWORD=postgres`)
  - `.env.example` (line 7: `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bobsleigh`)
- Current mitigation: Only used in development.
- Recommendations: Use different passwords in docker-compose. Never use the same password in .env.example.

**Hardcoded test user with known password hash in init_db.py:**
- Risk: A user with known credentials (`test@example.com` / `password`) is seeded into the database.
- Files: `backend/app/init_db.py` (line 45: bcrypt hash for "password")
- Current mitigation: Only runs once during initialization.
- Recommendations: Only seed in development mode. Check `ENVIRONMENT` setting before creating test data.

**Auth endpoint accepts hardcoded credentials without rate limiting:**
- Risk: The auth endpoint has no rate limiting, account lockout, or brute force protection.
- Files: `backend/app/api/endpoints/auth.py` (lines 11-33)
- Current mitigation: None.
- Recommendations: Implement rate limiting middleware. Migrate to Supabase Auth for the backend (currently only frontend uses it).

**No authentication on any API endpoint:**
- Risk: All athlete, training, performance, and workout endpoints have no auth guards. Any unauthenticated request can access any athlete's data.
- Files:
  - `backend/app/api/endpoints/athletes.py` (no `Depends(get_current_user)`)
  - `backend/app/api/endpoints/training.py` (no auth dependency)
  - `backend/app/api/endpoints/performance.py` (no auth dependency)
- Current mitigation: Data is all mock, so no real data is exposed yet.
- Recommendations: Add auth dependency injection to all endpoints. Implement row-level authorization.

**CORS allows all methods and headers:**
- Risk: Overly permissive CORS configuration.
- Files: `backend/app/main.py` (lines 18-23: `allow_methods=["*"]`, `allow_headers=["*"]`)
- Current mitigation: Origins are restricted to `localhost:3000`.
- Recommendations: Restrict to specific methods (GET, POST, PUT, DELETE) and headers needed.

**Error messages in generate_weekly_plan leak internal details:**
- Risk: Catch-all exception handlers return `str(e)` to the client, potentially leaking stack traces, file paths, or database details.
- Files: `backend/app/api/endpoints/generate_weekly_plan.py` (lines 130, 262, 306: `detail=f"Failed to ... : {str(e)}"`)
- Current mitigation: Endpoint doesn't actually work (broken imports).
- Recommendations: Log full errors server-side, return generic error messages to clients.

## Performance Bottlenecks

**AthleteDashboard component is 1,436 lines in a single file:**
- Problem: Monolithic component with inline data, inline chart configs, and complex rendering logic all in one file.
- Files: `frontend/src/components/dashboard/AthleteDashboard.tsx` (1,436 lines)
- Cause: No component decomposition. All sub-sections (stats, charts, calendar, recommendations) are inline.
- Improvement path: Extract into sub-components: StatsGrid, WorkoutCalendar, PerformanceRadar, RecentWorkouts, etc.

**Other oversized frontend components:**
- Problem: Multiple components exceed 700 lines.
- Files:
  - `frontend/src/components/wellbeing/RecoveryHealth.tsx` (1,419 lines)
  - `frontend/src/components/performance/PerformanceAssessment.tsx` (1,050 lines)
  - `frontend/src/components/dashboard/AdminDashboard.tsx` (987 lines)
  - `frontend/src/components/wellbeing/Reflection.tsx` (946 lines)
  - `frontend/src/components/dashboard/CoachDashboard.tsx` (920 lines)
  - `frontend/src/components/check-in/WeeklyReview.tsx` (858 lines)
  - `frontend/src/components/wellbeing/PhysicalMetrics.tsx` (743 lines)
  - `frontend/src/components/training/TrainingAssessment.tsx` (729 lines)
- Cause: All mock data, type definitions, helper functions, and rendering co-located in single files.
- Improvement path: Extract types to shared type files, mock data to fixture files, helper functions to utils.

**N+1 query pattern in generate_weekly_plan:**
- Problem: For each workout, individual queries fetch exercise groups, then for each group, individual queries fetch exercises.
- Files: `backend/app/api/endpoints/generate_weekly_plan.py` (lines 156-167)
- Cause: Sequential Supabase queries in nested loops.
- Improvement path: Use Supabase's nested select syntax or join queries.

**Frontend components with hardcoded mock data bloat every render:**
- Problem: Multiple components define large mock data arrays inline, re-allocated on every render.
- Files:
  - `frontend/src/components/training/WorkoutList.tsx` (lines 37-101: `mockWorkouts` array)
  - `frontend/src/components/training/TrainingAnalytics.tsx` (lines 53-73: mock distribution/chart data)
  - `frontend/src/components/performance/PerformanceTrends.tsx` (lines 36-90: hardcoded trend data)
  - `frontend/src/components/dashboard/AdminDashboard.tsx` (line 396: hardcoded 2023 dates)
- Cause: Development stage code not replaced with API calls.
- Improvement path: Move to API calls using the existing React Query hooks.

## Fragile Areas

**Two separate User models with different shapes:**
- Files:
  - `backend/app/db/models/user.py` (SQLAlchemy ORM model with `hashed_password`, `is_active`, `is_superuser`)
  - `backend/app/models/user.py` (Pydantic model with `disabled` field, no password)
- Why fragile: Auth endpoint uses the Pydantic model but init_db uses the SQLAlchemy model. They have different fields. Changes to one won't propagate to the other.
- Safe modification: Unify into one Pydantic schema for API responses and one SQLAlchemy model for DB.
- Test coverage: None for auth flow.

**Seven SQL schema files with no migration system:**
- Files:
  - `backend/sql/fresh_clean_schema.sql`
  - `backend/sql/production_schema.sql`
  - `backend/sql/adaptive_training_extension.sql`
  - `backend/sql/fix_numeric_fields.sql`
  - `backend/sql/populate_exercise_data.sql`
  - `backend/sql/insert_joshua_data.sql`
  - `backend/sql/import_josh_data.sql`
- Why fragile: No migration tool (like Alembic). Schema changes require manual SQL. No version tracking. The "production_schema.sql" may already be out of sync with actual production.
- Safe modification: Use Alembic for migrations. Stop maintaining raw SQL files for schema changes.
- Test coverage: None.

**CI/CD pipeline tests are commented out:**
- Files: `.github/workflows/ci.yml` (lines 28-29: frontend tests commented out, lines 51-52: backend tests commented out)
- Why fragile: No automated quality gate. Broken code can be merged to main.
- Safe modification: Uncomment test steps after fixing broken files.
- Test coverage: CI runs linting only.

## Scaling Limits

**Mock data architecture prevents multi-user usage:**
- Current capacity: 1 user (hardcoded athlete ID 1)
- Limit: Cannot support multiple athletes because all endpoints return the same hardcoded data regardless of athlete_id parameter.
- Scaling path: Implement actual database queries. The schema supports multi-user.

**No database connection pooling:**
- Current capacity: Single synchronous connections via SQLAlchemy.
- Limit: Under load, each request creates and destroys a connection.
- Scaling path: Use `pool_size` and `max_overflow` parameters in `create_engine()`. Consider async SQLAlchemy with `asyncpg`.
- Files: `backend/app/db/session.py` (line 8: `create_engine(settings.DATABASE_URL)` with no pool config)

## Dependencies at Risk

**PyTorch and Transformers in backend requirements (unused):**
- Risk: `torch==2.1.2` and `transformers==4.36.2` add ~2GB to the Docker image and install time. They are not imported anywhere in the backend application code.
- Impact: Slow builds, large container images, unnecessary security surface area.
- Migration plan: Remove from `backend/requirements.txt`. If ML models are needed, create a separate ML service.
- Files: `backend/requirements.txt` (lines 28-29)

**`fastapi-cors==0.0.6` is redundant:**
- Risk: FastAPI has built-in CORS middleware (which is already used in `backend/app/main.py`). This package is unnecessary and could conflict.
- Impact: Potential import confusion.
- Migration plan: Remove from `backend/requirements.txt`.
- Files: `backend/requirements.txt` (line 21)

**`@supabase/auth-helpers-react` used without proper provider setup:**
- Risk: 20+ components import `useSupabaseClient` from this package but no `SessionContextProvider` wraps the app. All these hooks return null/undefined.
- Impact: Runtime crashes in most components.
- Migration plan: Either add the proper provider from `@supabase/auth-helpers-react` or replace all imports with the custom `useSupabase` hook.
- Files: `frontend/src/app/layout.tsx` (no `SessionContextProvider`), `frontend/package.json` (line 20)

## Missing Critical Features

**No database migration system:**
- Problem: No Alembic or other migration tool. Schema changes are untracked.
- Blocks: Safe schema evolution, team collaboration on database changes.

**No logging framework in backend:**
- Problem: Error handling in `generate_weekly_plan.py` uses `print()`. The rest of the backend has no logging at all. Only `init_db.py` uses Python's `logging` module.
- Blocks: Production debugging, error monitoring, audit trails.
- Files: `backend/app/api/endpoints/generate_weekly_plan.py` (lines 130, 261, 306: `print(f"Error...")`)

**No input validation on API endpoints:**
- Problem: Athlete endpoints accept any data without validation. No field-level constraints beyond Pydantic model structure.
- Blocks: Data integrity, protection against malformed requests.

**Google OAuth backend endpoint is a stub:**
- Problem: The Google OAuth endpoint returns a static message string.
- Files: `backend/app/api/endpoints/auth.py` (lines 36-40: returns `{"message": "Google auth will be implemented"}`)
- Blocks: Backend-driven auth flow.

## Test Coverage Gaps

**Zero frontend tests:**
- What's not tested: All 60+ React components, all custom hooks, all pages.
- Files: No test files exist under `frontend/src/`.
- Risk: Any refactoring (especially the broken import fixes) could introduce regressions with no detection.
- Priority: High - at minimum, critical flows (auth, dashboard, training views) need tests.

**Backend tests exist but are non-functional:**
- What's not tested:
  - `backend/tests/test_pmc_service.py`: 3 async tests that won't be collected (no pytest-asyncio).
  - `backend/tests/test_performance_api.py`: 4 sync tests that test mock data (validates structure of hardcoded responses, not real logic).
- Files:
  - `backend/tests/test_pmc_service.py` (3 tests, all async without proper runner)
  - `backend/tests/test_performance_api.py` (4 tests, only validate mock data shape)
- Risk: No real business logic, database interaction, or auth flow is tested.
- Priority: High - need integration tests with a real or test database.

**ML models have no tests at all:**
- What's not tested: PMC model calculations, injury risk predictions, weekly plan generation, Joshua predictor.
- Files:
  - `ml/models/pmc_model.py`
  - `ml/models/injury_risk_model.py`
  - `ml/models/weekly_plan_generator.py`
  - `ml/models/joshua_recommendation_engine.py`
  - `ml_models/joshua_predictor.py`
- Risk: ML predictions could be silently wrong.
- Priority: Medium - need unit tests for core algorithms at minimum.

**No end-to-end tests:**
- What's not tested: Full user flows (login -> view dashboard -> log workout -> get recommendations).
- Files: No e2e test framework configured.
- Risk: Integration points between frontend, backend, and database are completely untested.
- Priority: Medium.

## Massive Uncommitted Changes

**6+ months of uncommitted changes across 150+ files:**
- Issue: The git status shows modifications to virtually every file in the project, with the last commit from approximately November 2025. This creates enormous risk of losing work and makes code review impossible.
- Impact: Cannot track what changed when or why. Cannot revert individual changes. Entire working tree is at risk.
- Fix approach: Stage and commit logically grouped changes. Consider using `git add -p` to create meaningful, reviewable commits. At minimum, create a snapshot commit of the current state.

---

*Concerns audit: 2026-05-02*
