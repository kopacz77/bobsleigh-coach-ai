---
phase: 06-ai-training-engine
plan: 03
subsystem: api, ai
tags: [morning-adaptation, readiness, load-adjustment, wellbeing, athlete-workout, compute-on-read]

# Dependency graph
requires:
  - phase: 06-ai-training-engine/01
    provides: PlanGenerationService, weekly_plans table with plan_data JSONB structure
  - phase: 06-ai-training-engine/02
    provides: Plan API endpoints, /current endpoint pattern, _get_athlete_id_for_user helper
  - phase: 04-wellness-recovery
    provides: Wellbeing check-in endpoints, wellbeing_assessments table
provides:
  - MorningAdaptationService with readiness-based load multipliers
  - /api/plans/today endpoint returning adapted daily workout for athletes
  - Readiness tier system (5 tiers from 1.0 to 0.50 multiplier)
  - Coach alert flag when readiness < 2
affects: [06-04 frontend plan review UI, athlete daily workout view, coach notification system]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Compute-on-read adaptation: adapted values are additional fields alongside planned values (never stored back)"
    - "Deep copy sections to prevent mutation of original plan data"
    - "Graceful degradation: wellbeing query failure returns unmodified plan (no error to athlete)"
    - "Readiness tier lookup via sorted threshold list (highest-first scan)"

key-files:
  created:
    - backend/app/services/morning_adaptation_service.py
  modified:
    - backend/app/api/endpoints/plans.py

key-decisions:
  - "Adaptation computed on read, never stored -- weekly_plans table stays immutable after approval"
  - "adapted_weight_kg and adapted_reps are additional fields (planned_weight_kg and reps preserved)"
  - "Wellbeing query failure returns plan unmodified (graceful degradation, not 500)"
  - "Rest days return message without adaptation (no weight/rep adjustment needed)"
  - "Route /today registered before /{plan_id} to prevent FastAPI path parameter capture"

patterns-established:
  - "MorningAdaptationService pattern: fetch check-in -> calculate readiness -> determine tier -> apply multiplier"
  - "Athlete endpoint pattern: no coach role required, uses _get_athlete_id_for_user + user.id"

# Metrics
duration: 2min
completed: 2026-05-04
---

# Phase 6 Plan 3: Morning Adaptation & Today's Workout Summary

**Readiness-based morning load adaptation with 5-tier multiplier system and athlete /today endpoint for adapted daily workouts**

## Performance

- **Duration:** 2 min
- **Started:** 2026-05-04T20:10:14Z
- **Completed:** 2026-05-04T20:12:50Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- MorningAdaptationService that fetches morning wellness check-in, calculates readiness (1-10 scale), and applies weight multiplier (1.0/0.90/0.80/0.65/0.50)
- Reps reduced by 25% when readiness < 4 (significant/severe tiers)
- Coach alert flag when readiness < 2 (severe tier)
- GET /api/plans/today endpoint for athletes to see today's adapted workout
- Rest day detection returns appropriate message without adaptation
- 204 No Content when no approved plan exists for the current week
- Graceful degradation: wellbeing query failure returns unmodified plan

## Task Commits

Each task was committed atomically:

1. **Task 1: Build morning adaptation service** - `5f0fc84` (feat)
2. **Task 2: Add /api/plans/today endpoint** - `20e5eae` (feat)

## Files Created/Modified
- `backend/app/services/morning_adaptation_service.py` - Readiness-based load adjustment service with 5 tiers, plate rounding, and graceful degradation
- `backend/app/api/endpoints/plans.py` - Added /today endpoint with morning adaptation, rest day handling, and day matching by date or day_number

## Decisions Made
- Adaptation is compute-on-read (plan table never modified) -- aligns with immutable approved plan principle
- adapted_weight_kg and adapted_reps are ADDITIONAL fields alongside planned values (never replace)
- Wellbeing query errors return unmodified plan (athlete sees planned workout, not an error)
- Rest days return "Rest day - recovery is training too" message with no adaptation applied
- /today route registered before /{plan_id} following the same pattern as /current

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. (weekly_plans table migration from 06-01 still needed if not yet deployed.)

## Next Phase Readiness
- Morning adaptation service ready for frontend AdaptedWorkoutView component
- /today endpoint ready for athlete daily workout display
- Coach alert flag (readiness < 2) ready for integration with coach notification system
- All service patterns consistent with existing codebase conventions

---
*Phase: 06-ai-training-engine*
*Completed: 2026-05-04*
