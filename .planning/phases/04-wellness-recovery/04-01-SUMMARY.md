---
phase: 04-wellness-recovery
plan: 01
subsystem: api
tags: [fastapi, pydantic, wellbeing, readiness, supabase]

# Dependency graph
requires:
  - phase: 01-foundation
    provides: "Supabase client, FastAPI app structure, router pattern"
  - phase: 02-auth-roles
    provides: "get_current_user dependency, _get_user_role helper, coach role check"
provides:
  - "Wellbeing check-in POST/GET endpoints"
  - "Readiness score calculation (server-side)"
  - "Coach readiness overview endpoint"
  - "Wellbeing history endpoint with date range"
  - "CheckInCreate Pydantic schema with 1-10 validators"
affects: [04-02, 04-03, 04-04, frontend-wellness]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Readiness score calculated on read, not stored in DB"
    - "[CONCERN] prefix in notes column for injury flag encoding"
    - "Upsert pattern: check existing then update/insert"

key-files:
  created:
    - backend/app/schemas/wellbeing.py
    - backend/app/api/endpoints/wellbeing.py
  modified:
    - backend/app/api/router.py

key-decisions:
  - "Readiness score and recovery_status computed on read (no schema migration needed)"
  - "Concern flag encoded as [CONCERN] prefix in notes column (avoids adding DB column)"
  - "Coach readiness shows 'gray' for athletes without today's check-in"
  - "Upsert on user_id+date so re-submitting same day updates existing record"

patterns-established:
  - "Wellbeing _calculate_readiness helper: reusable for any row from wellbeing_assessments"
  - "_get_user_role duplicated from training.py (copied, not shared import — matches existing pattern)"

# Metrics
duration: 3min
completed: 2026-05-03
---

# Phase 4 Plan 01: Wellbeing API Summary

**Wellbeing check-in CRUD endpoints with server-side readiness scoring and coach readiness overview**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-03T12:47:40Z
- **Completed:** 2026-05-03T12:50:35Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- POST /checkin endpoint with upsert, server-side user_id/date, and [CONCERN] flag encoding
- GET /checkin/today with 204 No Content when no data, plus readiness calculation
- GET /history with configurable day range and per-row readiness enrichment
- GET /coach/readiness with role check, gray status for missing data, concern detection
- CheckInCreate schema with Field(ge=1, le=10) validators on all 5 score fields

## Task Commits

Each task was committed atomically:

1. **Task 1: Create wellbeing Pydantic schemas and API endpoints** - `25654c4` (feat)
2. **Task 2: Register wellbeing router and verify backend starts** - `48ff9a0` (feat)

## Files Created/Modified
- `backend/app/schemas/wellbeing.py` - CheckInBase/CheckInCreate schemas with 1-10 validators and flag_concern
- `backend/app/api/endpoints/wellbeing.py` - 4 endpoints: checkin CRUD, history, coach readiness + _calculate_readiness helper
- `backend/app/api/router.py` - Added wellbeing router at /api/wellbeing prefix

## Decisions Made
- Readiness score calculated on read, not stored: avoids needing a schema migration for readiness_score/recovery_status columns
- Concern flag encoded as "[CONCERN] " prefix in notes: no new DB column needed, detectable via startswith check
- Coach readiness returns "gray" status for athletes without today's check-in (distinguishes "no data" from "red")
- Upsert logic via check-then-update/insert (Supabase PostgREST doesn't support native upsert on non-PK constraints)
- _get_user_role duplicated in wellbeing.py matching existing training.py pattern (no shared utility yet)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Wellbeing API endpoints ready for frontend integration in 04-02
- _calculate_readiness helper available for reuse in recovery/trend endpoints
- Coach readiness endpoint ready for dashboard integration
- No blockers for next plan

---
*Phase: 04-wellness-recovery*
*Completed: 2026-05-03*
