---
phase: 07-polish-deploy
plan: 02
subsystem: database
tags: [sqlalchemy, repository-pattern, postgresql, sql, migration]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "SQLAlchemy engine and session configuration"
  - phase: 03-training-core
    provides: "Workout and exercise endpoint structure"
  - phase: 04-wellness-recovery
    provides: "Wellbeing endpoint structure"
provides:
  - "BaseRepository with common query execution helpers (SQLAlchemy Core)"
  - "AthleteRepository with CRUD, soft-delete, ownership verification"
  - "ExerciseRepository with dynamic search and array contains filters"
  - "WorkoutRepository with CRUD, batch exercise loading, training load upsert"
  - "WellbeingRepository with upsert, user-to-athlete resolution, batch latest"
  - "Four endpoint files fully migrated off Supabase PostgREST"
affects: [07-03, 07-04, 07-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Repository pattern wrapping SQLAlchemy Core text() queries"
    - "Parameterized SQL with :param syntax to prevent injection"
    - "Dynamic SET clause building from dict keys for flexible updates"
    - "Separate queries instead of JOINs for nested data (workout exercises)"
    - "DISTINCT ON for efficient per-entity latest record queries"
    - "Batch exercise fetching via IN clause to avoid N+1 queries"

key-files:
  created:
    - "backend/app/db/repositories/__init__.py"
    - "backend/app/db/repositories/base.py"
    - "backend/app/db/repositories/athlete_repo.py"
    - "backend/app/db/repositories/exercise_repo.py"
    - "backend/app/db/repositories/workout_repo.py"
    - "backend/app/db/repositories/wellbeing_repo.py"
  modified:
    - "backend/app/db/session.py"
    - "backend/app/api/endpoints/athletes.py"
    - "backend/app/api/endpoints/exercises.py"
    - "backend/app/api/endpoints/training.py"
    - "backend/app/api/endpoints/wellbeing.py"

key-decisions:
  - "BaseRepository uses engine.connect() context manager (not sessions) for lightweight Core queries"
  - "Wellbeing queries use schema column names (assessment_date, athlete_id) not legacy Supabase names"
  - "TrainingLoadRepository colocated in workout_repo.py since it shares the training domain"
  - "Coach readiness uses DISTINCT ON + batch fetch instead of N+1 per-athlete queries"
  - "get_supabase() kept in session.py with deprecation comment (other files still use it)"
  - "TrainingService import kept in training.py for recommendations endpoint (service migration deferred)"

patterns-established:
  - "Repository instantiation: module-level singleton (e.g., athlete_repo = AthleteRepository())"
  - "Dynamic WHERE: build conditions list then join with AND"
  - "Dynamic SET: build from dict keys for flexible PATCH/PUT"
  - "Nested data: fetch parent rows, then batch-fetch children via IN clause"

# Metrics
duration: 6min
completed: 2026-05-11
---

# Phase 7 Plan 2: Repository Layer Summary

**BaseRepository with SQLAlchemy Core queries, 5 domain repositories, and 4 endpoint files fully migrated off Supabase PostgREST**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-11T16:31:29Z
- **Completed:** 2026-05-11T16:37:37Z
- **Tasks:** 2
- **Files modified:** 11

## Accomplishments
- Created BaseRepository with _execute, _execute_one, _execute_insert, _execute_update, _execute_delete helpers using SQLAlchemy Core
- Built 5 domain repositories (Athlete, Exercise, Workout, TrainingLoad, Wellbeing) with full CRUD and specialized queries
- Migrated athletes.py, exercises.py, training.py, and wellbeing.py completely off Supabase PostgREST
- Replaced N+1 coach readiness queries with batch DISTINCT ON pattern

## Task Commits

Each task was committed atomically:

1. **Task 1: Base repository and athlete/exercise repositories** - `afcd693` (feat)
2. **Task 2: Workout and wellbeing repositories + endpoint migration** - `cfca366` (feat)

## Files Created/Modified
- `backend/app/db/repositories/__init__.py` - Package init with BaseRepository export
- `backend/app/db/repositories/base.py` - BaseRepository with 5 query execution methods
- `backend/app/db/repositories/athlete_repo.py` - AthleteRepository with CRUD, ownership, soft-delete
- `backend/app/db/repositories/exercise_repo.py` - ExerciseRepository with search, array contains, categories
- `backend/app/db/repositories/workout_repo.py` - WorkoutRepository + TrainingLoadRepository with nested exercise batch loading
- `backend/app/db/repositories/wellbeing_repo.py` - WellbeingRepository with upsert, user resolution, batch latest
- `backend/app/db/session.py` - Deprecated get_supabase() with docstring warning
- `backend/app/api/endpoints/athletes.py` - Migrated from Supabase to AthleteRepository
- `backend/app/api/endpoints/exercises.py` - Migrated from Supabase to ExerciseRepository
- `backend/app/api/endpoints/training.py` - Migrated from Supabase to WorkoutRepository/TrainingLoadRepository
- `backend/app/api/endpoints/wellbeing.py` - Migrated from Supabase to WellbeingRepository

## Decisions Made
- **BaseRepository uses engine.connect():** Lightweight Core queries, no ORM session overhead. Matches existing session.py engine.
- **Wellbeing uses schema column names:** Repository uses `assessment_date` and `athlete_id` (from fresh_clean_schema.sql) instead of legacy `date` and `user_id` that the Supabase endpoints used. Endpoints now resolve user_id -> athlete_id before querying.
- **TrainingLoadRepository colocated:** Placed in workout_repo.py alongside WorkoutRepository since training load is tightly coupled to workout completion flow.
- **Coach readiness batch optimization:** Replaced per-athlete N+1 query loop with DISTINCT ON batch fetch, reducing from N+1 to 2 queries for the entire coach readiness endpoint.
- **TrainingService kept for recommendations:** The /recommendations endpoint still delegates to TrainingService (which internally uses Supabase). Service-level migration is deferred to a later plan.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added batch exercise loading for workout lists**
- **Found during:** Task 2 (training.py migration)
- **Issue:** Plan specified separate queries per workout for exercises, but the get_workouts and get_weekly_workouts endpoints return lists that would cause N+1 queries
- **Fix:** Added `get_workouts_with_exercises()` method that batch-fetches exercises for all workouts using a single IN clause query
- **Files modified:** backend/app/db/repositories/workout_repo.py
- **Verification:** Method imports and can be called
- **Committed in:** cfca366 (Task 2 commit)

**2. [Rule 2 - Missing Critical] Added batch latest wellbeing for coach readiness**
- **Found during:** Task 2 (wellbeing.py migration)
- **Issue:** Original code did N+1 queries (one per athlete) for coach readiness. Repository should batch this.
- **Fix:** Added `get_batch_latest_by_athlete_ids()` using DISTINCT ON for efficient per-athlete latest records
- **Files modified:** backend/app/db/repositories/wellbeing_repo.py, backend/app/api/endpoints/wellbeing.py
- **Verification:** Method imports and endpoint compiles
- **Committed in:** cfca366 (Task 2 commit)

---

**Total deviations:** 2 auto-fixed (2 missing critical)
**Impact on plan:** Both auto-fixes improve query performance. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Repository layer foundation is complete and tested for imports
- Remaining endpoint/service files (plans.py, coach.py, performance.py, auth.py, all services) still use get_supabase() and need migration in subsequent plans
- get_supabase() is deprecated but kept until all files are migrated
- The TrainingService still uses Supabase internally (deferred to service migration plan)

---
*Phase: 07-polish-deploy*
*Completed: 2026-05-11*
