---
phase: 07-polish-deploy
plan: 03a
subsystem: database
tags: [sqlalchemy, repository-pattern, postgres, api-endpoints]

# Dependency graph
requires:
  - phase: 07-02
    provides: "BaseRepository, athlete/exercise/workout/wellbeing repos, 4 endpoint migrations"
provides:
  - "PlanRepository for weekly plans CRUD, approval workflow, versioning"
  - "CoachRepository for roster, relationships, dashboard queries"
  - "TrainingLoadRepository for PMC data and sRPE upsert"
  - "PerformanceRepository for metrics CRUD and type listing"
  - "All 8 endpoint files migrated off Supabase PostgREST"
affects: [07-03b, 07-polish-deploy]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Module-level repository singletons in endpoint files"
    - "Helper functions for coach_id/athlete_id lookup via repos"

key-files:
  created:
    - "backend/app/db/repositories/plan_repo.py"
    - "backend/app/db/repositories/coach_repo.py"
    - "backend/app/db/repositories/training_load_repo.py"
    - "backend/app/db/repositories/performance_repo.py"
  modified:
    - "backend/app/api/endpoints/plans.py"
    - "backend/app/api/endpoints/coach.py"
    - "backend/app/api/endpoints/performance.py"
    - "backend/app/db/repositories/__init__.py"

key-decisions:
  - "TrainingLoadRepository in separate file (training_load_repo.py) with full method set, coexists with workout_repo.py version"
  - "auth.py already had zero Supabase calls - no migration needed"
  - "coach.py endpoints still delegate to CoachService (service migration deferred to 03b)"
  - "plan_repo.get_athlete_names helper added to avoid Supabase calls in pending plans endpoint"

patterns-established:
  - "Endpoint helper _get_coach_id_for_user() wraps coach_repo lookup with ValueError"
  - "plan_repo.update_status handles approved/rejected branching internally"

# Metrics
duration: 5min
completed: 2026-05-11
---

# Phase 7 Plan 03a: Remaining Repository Layer and Endpoint Migration Summary

**Four new repositories (plan, coach, training_load, performance) and migration of remaining endpoint files to zero Supabase PostgREST calls**

## Performance

- **Duration:** 5 min
- **Started:** 2026-05-11T16:42:32Z
- **Completed:** 2026-05-11T16:47:08Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Created PlanRepository with plan CRUD, approval/rejection workflow, versioning, and batch athlete name lookup
- Created CoachRepository with roster queries, athlete relationship management, and soft-remove via ended_at
- Created TrainingLoadRepository with date-range queries, additive upsert, and lightweight PMC data fetch
- Created PerformanceRepository with metrics CRUD, trend queries, and distinct type listing
- Migrated plans.py, coach.py, and performance.py to use repository layer exclusively
- Confirmed auth.py already had zero Supabase calls (clean)
- Updated repositories __init__.py to export all 9 classes (base + 8 repos)

## Task Commits

Each task was committed atomically:

1. **Task 1: Remaining repositories** - `21ecd8e` (feat)
2. **Task 2: Migrate remaining endpoint files** - `663a070` (feat)

## Files Created/Modified
- `backend/app/db/repositories/plan_repo.py` - PlanRepository with CRUD, approval workflow, versioning
- `backend/app/db/repositories/coach_repo.py` - CoachRepository with roster, relationships, dashboard queries
- `backend/app/db/repositories/training_load_repo.py` - TrainingLoadRepository with PMC data and sRPE upsert
- `backend/app/db/repositories/performance_repo.py` - PerformanceRepository with metrics CRUD
- `backend/app/api/endpoints/plans.py` - Migrated from Supabase to plan_repo, athlete_repo, coach_repo
- `backend/app/api/endpoints/coach.py` - Migrated athlete verification to coach_repo.athlete_exists()
- `backend/app/api/endpoints/performance.py` - Migrated ownership check to athlete_repo.verify_ownership()
- `backend/app/db/repositories/__init__.py` - Exports all 9 repository classes

## Decisions Made
- TrainingLoadRepository placed in its own file (training_load_repo.py) rather than only in workout_repo.py, providing cleaner import paths for service migration
- auth.py confirmed already clean -- no Supabase calls, no migration needed
- coach.py endpoint layer still delegates to CoachService for roster/alerts/PMC (service-layer Supabase calls deferred to Plan 03b)
- Added get_athlete_names helper to both PlanRepository and CoachRepository for batch name lookup without Supabase

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All endpoint files are now Supabase-free, ready for Plan 03b (service-layer migration)
- CoachService, PerformanceService, and PMCService still use get_supabase() internally -- these are the targets for Plan 03b
- Repository __init__.py exports all classes for convenient service-layer imports

---
*Phase: 07-polish-deploy*
*Completed: 2026-05-11*
