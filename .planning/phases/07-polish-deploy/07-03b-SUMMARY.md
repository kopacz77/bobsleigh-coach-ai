---
phase: 07-polish-deploy
plan: 03b
subsystem: database
tags: [sqlalchemy, repository-pattern, postgres, services, supabase-decoupling]

# Dependency graph
requires:
  - phase: 07-03a
    provides: "PlanRepository, CoachRepository, TrainingLoadRepository, PerformanceRepository, endpoint migrations"
provides:
  - "All 8 backend service files migrated off Supabase PostgREST"
  - "Health check endpoint using SQLAlchemy engine"
  - "get_supabase() deprecated with DeprecationWarning"
  - "Backend can run with AUTH_PROVIDER=dev against local PostgreSQL"
affects: [07-polish-deploy, future-deploy-phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Service-layer instance attributes for repositories (self.athlete_repo, etc.)"
    - "JSONB column serialization via json.dumps() when binding through SQLAlchemy text()"
    - "Newest-first contract preservation via list(reversed(...)) on repo.get_range() results"

key-files:
  created: []
  modified:
    - "backend/app/services/pmc_service.py"
    - "backend/app/services/performance_service.py"
    - "backend/app/services/training_service.py"
    - "backend/app/services/coach_service.py"
    - "backend/app/services/injury_risk_service.py"
    - "backend/app/services/morning_adaptation_service.py"
    - "backend/app/services/exercise_selection_service.py"
    - "backend/app/services/plan_generation_service.py"
    - "backend/app/main.py"
    - "backend/app/db/session.py"

key-decisions:
  - "Wellbeing services switched to athlete_id-keyed schema (per fresh_clean_schema.sql), aligning with the wellbeing_repo source of truth"
  - "morning_adaptation_service uses wellbeing_repo.get_by_user_and_date() which JOINs athletes -> wellbeing_assessments to resolve user_id internally"
  - "JSONB fields in plan_generation insert serialized via json.dumps because SQLAlchemy text() binding does not auto-convert Python dicts/lists for jsonb columns"
  - "training_service stored_recommendations query kept inline via SQLAlchemy text() rather than adding a new repo (single call site, legacy compatibility)"
  - "exercise_selection_service iterates over categories with separate repo.search() calls instead of IN clause to match the existing ExerciseRepository.search() API"
  - "get_supabase() retained as deprecated function with warnings.warn() so SupabaseAuthProvider continues to work in production auth mode"

patterns-established:
  - "Service init pattern: instantiate all required repositories in __init__ as instance attributes"
  - "Wellbeing access at service layer: use athlete_id directly; resolve user_id -> athlete_id via wellbeing_repo.get_by_user_and_date()"
  - "Date object normalization in PMC: SQLAlchemy returns date objects (not strings) from PostgreSQL; normalize with .strftime() when building string keys"

# Metrics
duration: 7min
completed: 2026-05-28
---

# Phase 7 Plan 03b: Service-Layer Supabase Decoupling Summary

**All 8 backend services migrated to repository layer with SQLAlchemy-based health check, completing the backend decoupling from the Supabase Python client**

## Performance

- **Duration:** 7 min
- **Started:** 2026-05-28T03:49:47Z
- **Completed:** 2026-05-28T03:56:17Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments
- Migrated 8 service files (pmc, performance, training, coach, injury_risk, morning_adaptation, exercise_selection, plan_generation) to use the repository layer exclusively
- Replaced the /health endpoint's Supabase client query with a SQLAlchemy `SELECT id FROM sports LIMIT 1`
- Added DeprecationWarning to get_supabase() so any future regression is surfaced at runtime
- Aligned wellbeing service queries with the canonical athlete_id-keyed schema (matching fresh_clean_schema.sql and wellbeing_repo)
- Fixed a latent bug in coach_service alert generation where an invalid f-string conditional was emitting unparseable output for the ATL/CTL ratio in fatigue_spike alerts
- Confirmed zero `get_supabase()` calls remain anywhere in app/ outside of session.py (definition) and auth_provider.py (SupabaseAuthProvider)

## Task Commits

Each task was committed atomically:

1. **Task 1: Migrate all service files to repository layer** - `3344f43` (refactor)
2. **Task 2: Health check migration + get_supabase deprecation** - `00d524f` (refactor)

## Files Created/Modified
- `backend/app/services/pmc_service.py` - PMC calculations via training_load_repo.get_date_and_load
- `backend/app/services/performance_service.py` - Metrics CRUD/trends via performance_repo
- `backend/app/services/training_service.py` - Workout queries/creation via workout_repo; legacy training_recommendations via inline SQLAlchemy text()
- `backend/app/services/coach_service.py` - Roster, PMC summaries, alerts via coach_repo + wellbeing_repo; switched to athlete_id-keyed wellbeing schema; fixed f-string bug
- `backend/app/services/injury_risk_service.py` - Composite injury risk via pmc_service + wellbeing_repo (newest-first preserved)
- `backend/app/services/morning_adaptation_service.py` - Today's check-in via wellbeing_repo.get_by_user_and_date() (resolves user_id -> athlete_id)
- `backend/app/services/exercise_selection_service.py` - Database exercise selection via exercise_repo.search() iterated per category
- `backend/app/services/plan_generation_service.py` - Athlete fetch, recent workouts, recent wellbeing, feedback history, versioning, and insert all via repositories; JSONB columns serialized via json.dumps
- `backend/app/main.py` - /health endpoint uses SQLAlchemy engine.connect() with text() query
- `backend/app/db/session.py` - get_supabase() emits DeprecationWarning when called

## Decisions Made
- Wellbeing services aligned with athlete_id-keyed schema (matching wellbeing_repo and fresh_clean_schema.sql). Older code used user_id + date, which matched only the production_schema.sql; the repository layer is the canonical source.
- morning_adaptation_service kept its `adapt_workout(plan_day, user_id)` signature, with the user_id -> athlete_id resolution pushed down into wellbeing_repo.get_by_user_and_date() via a JOIN. Avoids breaking the endpoint caller while still removing Supabase from the service layer.
- JSONB columns (plan_data, generation_metadata, injury_risk_factors) are serialized to JSON strings before insert via json.dumps. SQLAlchemy text() does not auto-convert Python dicts/lists to jsonb when using parameter binding.
- training_service.get_training_recommendations queries the legacy training_recommendations table via inline SQLAlchemy text() rather than adding a new repository class for a single call site. Wrapped in try/except so the call returns an empty list if the table is absent in dev environments.
- exercise_selection_service iterates over categories with separate repo.search() calls because ExerciseRepository.search() takes a single category (not a list). Deduplicates by id and breaks out of the loop once count is reached.
- get_supabase() is preserved in session.py as a deprecated function with warnings.warn() so SupabaseAuthProvider continues to work in supabase auth mode. The DeprecationWarning ensures any new regression in service/endpoint code surfaces at runtime.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed invalid f-string conditional in coach_service fatigue_spike alert**
- **Found during:** Task 1 (Migrate coach_service.py)
- **Issue:** The original message used `f"... ATL/CTL: {current_atl / current_ctl:.2f if current_ctl > 0 else 'N/A'}..."` which is not valid Python -- the `if ... else` cannot appear inside a format spec. At runtime this raises a ValueError when CTL > 0 because the format spec is interpreted literally.
- **Fix:** Extracted the conditional into a `ratio_str` local variable before the alert dict, then interpolated `{ratio_str}` into the f-string. Behavior now matches the obvious intent (ratio shown when CTL > 0, "N/A" otherwise).
- **Files modified:** backend/app/services/coach_service.py
- **Verification:** py_compile passes; alert message format reads correctly for both CTL > 0 and CTL == 0 branches.
- **Committed in:** 3344f43 (Task 1 commit)

**2. [Rule 1 - Bug] Aligned service-layer wellbeing access with canonical athlete_id-keyed schema**
- **Found during:** Task 1 (multiple services: coach, injury_risk, morning_adaptation, plan_generation)
- **Issue:** Services queried `wellbeing_assessments` using `user_id` and `date` columns (matching the older production_schema.sql), but the deployed schema (fresh_clean_schema.sql) and the working wellbeing endpoint use `athlete_id` and `assessment_date`. The mismatch meant the services were broken against the real database.
- **Fix:** Services now use wellbeing_repo methods that operate on athlete_id + assessment_date. For morning_adaptation_service (called with user_id), wellbeing_repo.get_by_user_and_date() joins athletes -> wellbeing_assessments internally to resolve user_id -> athlete_id without changing the service signature.
- **Files modified:** backend/app/services/coach_service.py, backend/app/services/injury_risk_service.py, backend/app/services/morning_adaptation_service.py, backend/app/services/plan_generation_service.py
- **Verification:** Repository methods exist and were already exercised by the wellbeing.py endpoint; py_compile passes for all services.
- **Committed in:** 3344f43 (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (both Rule 1 bugs surfaced during the migration)
**Impact on plan:** Both fixes were necessary for correctness against the real database schema. No scope expansion -- both changes stayed inside the service files the plan already required to be migrated.

## Issues Encountered

- `generate_weekly_plan.py` in `app/api/endpoints/` is an orphaned file referencing `app.services.database.supabase_client` (a module that does not exist). It is not mounted in the API router (`app/api/router.py` does not import it) and would fail at import time. Not removed because the plan only covered service files, health check, and session.py; flagging here for a future cleanup pass.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Backend has zero `get_supabase()` calls outside of session.py (definition) and auth_provider.py (SupabaseAuthProvider).
- With AUTH_PROVIDER=dev and DATABASE_URL pointing to local PostgreSQL, the backend can run without any Supabase credentials.
- Combined with 07-03a (endpoint migration), the Supabase decoupling for backend code is complete.
- Future cleanup candidate: remove orphaned `generate_weekly_plan.py` endpoint file that references a non-existent `services.database` module.

---
*Phase: 07-polish-deploy*
*Completed: 2026-05-28*
