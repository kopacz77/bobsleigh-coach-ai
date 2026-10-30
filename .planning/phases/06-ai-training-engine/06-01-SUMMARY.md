---
phase: 06-ai-training-engine
plan: 01
subsystem: ai, database
tags: [plan-generation, periodization, exercise-selection, rule-based, supabase, jsonb]

# Dependency graph
requires:
  - phase: 05-performance-coach-dashboard
    provides: PMCService for CTL/ATL/TSB, CoachService for athlete roster and alerts
  - phase: 01-foundation
    provides: Database schema (athletes, exercises, workouts, wellbeing_assessments tables)
provides:
  - weekly_plans database table with approval state machine
  - PlanGenerationService for rule-based 7-day plan generation
  - ExerciseSelectionService for database-backed exercise queries
  - Injury risk scoring (TSB + ACWR + wellbeing)
  - Coach feedback learning via rejection notes keyword matching
affects: [06-02 plan approval API, 06-03 morning adaptation, 06-04 injury risk]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Rule-based plan generation pipeline (gather context -> select template -> fill exercises -> assign weights -> apply preferences)"
    - "Three-tier weight assignment: history -> profile max -> conservative estimate"
    - "Periodization templates as Python dicts (5 phases x 7 days)"
    - "JSONB plan_data with sections (warm_up, main, accessory, cool_down)"
    - "Automatic plan versioning on regeneration after rejection"
    - "Fatigue-aware template adjustment (reduces sessions when TSB < -20)"

key-files:
  created:
    - backend/sql/weekly_plans_migration.sql
    - backend/app/services/exercise_selection_service.py
    - backend/app/services/plan_generation_service.py
  modified: []

key-decisions:
  - "Rule-based engine in backend/app/services/ (not ml/ module) -- deterministic, debuggable, works with limited data"
  - "5 periodization phases: general_prep, specific_prep, pre_competition, competition, transition"
  - "Injury risk computed at generation time using TSB, ACWR, and wellbeing signals -- no ML model needed"
  - "Coach feedback learning uses simple keyword matching (volume_high -> reduce sets, intensity_high -> reduce weight)"
  - "Exercise selection queries exercises table first, falls back to hardcoded bobsleigh defaults"
  - "Weight assignment uses _round_to_plate(2.5kg) for all planned weights"
  - "Plan versioning: rejected plans get version+1 with parent_plan_id linking"
  - "week_start constrained to Monday via CHECK(EXTRACT(DOW FROM week_start) = 1)"

patterns-established:
  - "PlanGenerationService pattern: class-based, async methods, uses get_supabase() + other services"
  - "ExerciseSelectionService pattern: session_type -> categories -> DB query -> fallback defaults"
  - "Plan data JSONB structure: days[] -> sections[] -> exercises[] with weight_source tracking"

# Metrics
duration: 6min
completed: 2026-05-04
---

# Phase 6 Plan 1: Plan Generation Engine Summary

**Rule-based 7-day training plan generator with periodization templates, three-tier weight assignment, exercise selection from DB, and injury risk scoring**

## Performance

- **Duration:** 6 min
- **Started:** 2026-05-04T19:55:38Z
- **Completed:** 2026-05-04T20:01:12Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- weekly_plans table with full approval state machine (pending_review/approved/rejected), versioning, and injury risk metadata
- PlanGenerationService producing personalized 7-day plans from athlete PMC, workout history, wellbeing, and coach feedback
- ExerciseSelectionService querying exercises table with hardcoded bobsleigh fallbacks
- Three-tier weight assignment: history-first, profile-max-fallback, conservative-estimate
- Fatigue-aware template adjustment that reduces sessions when TSB < -20
- Coach feedback learning that adjusts volume and intensity from rejection note keywords

## Task Commits

Each task was committed atomically:

1. **Task 1: Create weekly_plans database migration** - `b8c176d` (feat)
2. **Task 2: Build exercise selection service** - `5befe36` (feat)
3. **Task 3: Build plan generation service** - `5550b09` (feat)

## Files Created/Modified
- `backend/sql/weekly_plans_migration.sql` - DDL for weekly_plans table with indexes, RLS, constraints, and updated_at trigger
- `backend/app/services/exercise_selection_service.py` - Exercise picker that queries DB by category with hardcoded fallbacks
- `backend/app/services/plan_generation_service.py` - Core plan generation engine (1197 lines) with 5 periodization templates, weight assignment, and injury risk

## Decisions Made
- Rule-based engine lives in backend/app/services/ (not ml/ module) because it is business logic, not a trainable model
- 5 periodization phases with bobsleigh-specific weekly templates from research
- Injury risk computed at plan generation time (no separate ML model needed for v1)
- Coach feedback learning uses simple keyword matching -- pragmatic for v1, can be upgraded later
- week_start CHECK constraint enforces Monday-only (prevents mid-week plan starts)
- Plan versioning via parent_plan_id for rejection-regeneration lineage tracking

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
- Deploy weekly_plans_migration.sql to Supabase (manual step, same as other schema migrations)

## Next Phase Readiness
- Plan generation service ready for API endpoint wiring (06-02)
- Exercise selection service ready for use by plan generation
- weekly_plans table ready for approval workflow (06-02)
- Injury risk scoring ready for integration with injury risk warnings (06-04)

---
*Phase: 06-ai-training-engine*
*Completed: 2026-05-04*
