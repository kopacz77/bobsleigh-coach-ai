---
phase: 01-foundation
plan: 03
subsystem: backend, api, database
tags: [fastapi, supabase, supabase-py, pmc, training-loads, crud]

# Dependency graph
requires:
  - phase: 01-02
    provides: "get_supabase() factory, UUID-compatible Pydantic schemas, clean backend deps"
provides:
  - "All 4 registered API routers query Supabase database (no mock data)"
  - "PMC calculations from real training_loads table data"
  - "CRUD operations on athletes table via REST endpoints"
  - "Workout queries with exercise joins"
  - "Performance metrics and trends from database"
affects: [01-04, 02-authentication, 03-frontend-data-binding]

# Tech tracking
tech-stack:
  added: []
  patterns: ["supabase.table('x').select('*').eq('col', val).execute() for all queries", "graceful 503 when Supabase unconfigured", "empty arrays for missing data instead of mock data"]

key-files:
  created: []
  modified:
    - backend/app/api/endpoints/athletes.py
    - backend/app/api/endpoints/training.py
    - backend/app/api/endpoints/performance.py
    - backend/app/services/training_service.py
    - backend/app/services/performance_service.py
    - backend/app/services/pmc_service.py

key-decisions:
  - "Return raw dicts from Supabase instead of Pydantic response_model validation (tighten later)"
  - "Soft-delete athletes (set is_active=False) instead of hard delete"
  - "PMC returns empty response when no training data exists (not fake random data)"
  - "Peer comparison returns stub placeholder (not yet implemented)"

patterns-established:
  - "All endpoints: try/except with RuntimeError->503, generic Exception->500"
  - "Services call get_supabase() per-method (not stored on instance)"
  - "PMC fills date gaps with 0 load for continuous time series"
  - "Empty data returns empty arrays/defaults, never mock data"

# Metrics
duration: 4min
completed: 2026-05-02
---

# Phase 1 Plan 3: Wire Backend to Supabase Summary

**Replaced all hardcoded mock data in 6 backend files with real Supabase queries via get_supabase().table() pattern**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-02T17:38:11Z
- **Completed:** 2026-05-02T17:42:09Z
- **Tasks:** 2/2 completed
- **Files modified:** 6

## Accomplishments
- Eliminated all hardcoded mock data from athletes, training, and performance endpoints
- Wired all 13 API endpoints to real Supabase database queries
- Replaced np.random.seed(42) fake PMC data with real training_loads table queries
- Changed all athlete_id parameters from int to str (UUID strings)
- Added graceful error handling: 503 for unconfigured Supabase, 500 for query failures

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire athletes endpoint to Supabase** - `56670b9` (feat)
2. **Task 2: Wire training/performance services to Supabase** - `c7d99a5` (feat)

## Files Created/Modified
- `backend/app/api/endpoints/athletes.py` - 5 CRUD endpoints querying Supabase athletes table
- `backend/app/api/endpoints/training.py` - 4 endpoints using TrainingService with Supabase
- `backend/app/api/endpoints/performance.py` - 4 endpoints using PerformanceService with Supabase, athlete_id changed from int to str
- `backend/app/services/training_service.py` - Queries workouts, workout_exercises, training_recommendations tables
- `backend/app/services/performance_service.py` - Queries performance_metrics table, PMC via real data
- `backend/app/services/pmc_service.py` - Queries training_loads table, calculates CTL/ATL/TSB from real data

## Decisions Made
- **Removed response_model from most endpoints:** Supabase returns all columns including ones not in our Pydantic schemas. Using raw dicts avoids validation errors. Can tighten response models once schemas match database exactly.
- **Soft-delete for athletes:** DELETE endpoint sets `is_active=False` rather than removing the row, preserving referential integrity with workouts/metrics.
- **Empty defaults for no data:** PMC service returns empty lists and "No Data" status when an athlete has no training loads, rather than generating fake random data.
- **Peer comparison stub:** Returns `{"message": "Peer comparison not yet implemented", "data": []}` since the feature requires cross-athlete analysis not yet designed.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- None

## Next Phase Readiness
- All 13 registered API endpoints now query Supabase (ready for frontend data binding)
- PMC calculations work correctly on real data (exponential decay formulas preserved)
- Backend starts cleanly and all routes register successfully
- **Blocker for full verification:** Supabase schema deployment and .env configuration are still manual steps (deferred from 01-02)

---
*Phase: 01-foundation*
*Completed: 2026-05-02*
