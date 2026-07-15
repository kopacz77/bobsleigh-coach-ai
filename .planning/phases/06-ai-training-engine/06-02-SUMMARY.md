---
phase: 06-ai-training-engine
plan: 02
subsystem: api, ai
tags: [injury-risk, plan-approval, coach-workflow, fastapi, background-tasks, acwr, tsb]

# Dependency graph
requires:
  - phase: 06-ai-training-engine/01
    provides: PlanGenerationService, ExerciseSelectionService, weekly_plans table
  - phase: 05-performance-coach-dashboard
    provides: PMCService for CTL/ATL/TSB, CoachService for roster and athlete IDs
provides:
  - InjuryRiskService combining ACWR + TSB + wellbeing + sleep into composite risk score
  - Plan approval API (pending queue, approve, reject with feedback)
  - Plan generation API (single + batch with BackgroundTasks)
  - Athlete current-plan endpoint (approved plans only)
affects: [06-03 morning adaptation, 06-04 injury risk warnings, frontend plan review UI]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Composite rule-based risk scoring with independent components (TSB, ACWR, wellbeing, sleep)"
    - "Coach approval workflow: pending_review -> approved/rejected state machine via API"
    - "BackgroundTasks for batch generation and post-rejection regeneration"
    - "Route ordering: static paths (/current, /pending) before parameterized (/{plan_id})"

key-files:
  created:
    - backend/app/services/injury_risk_service.py
    - backend/app/api/endpoints/plans.py
  modified:
    - backend/app/api/router.py

key-decisions:
  - "InjuryRiskService as standalone service (not embedded in PlanGenerationService) for reuse by API endpoints"
  - "Route /current before /{plan_id} to prevent FastAPI path parameter capture"
  - "Rejection auto-triggers background regeneration (new version with parent_plan_id)"
  - "Batch generation uses BackgroundTasks to avoid HTTP timeout on large rosters"
  - "Pydantic request models for type-safe body validation (GeneratePlanRequest, RejectPlanRequest)"

patterns-established:
  - "InjuryRiskService pattern: gather PMC + wellbeing -> score components independently -> sum + classify"
  - "Plan API follows exact coach.py/training.py patterns: _get_user_role, try/except chain, raw dicts"

# Metrics
duration: 3min
completed: 2026-05-04
---

# Phase 6 Plan 2: Plan API & Injury Risk Summary

**Injury risk service (ACWR+TSB+wellbeing+sleep) and 7-endpoint plan API with coach approval workflow, batch generation, and athlete current-plan retrieval**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-04T20:04:37Z
- **Completed:** 2026-05-04T20:08:03Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- InjuryRiskService that combines 4 risk components (TSB 0-0.3, ACWR 0-0.3, wellbeing 0-0.2, sleep 0-0.2) into a composite 0-1 score
- 7 plan API endpoints: pending queue, single generate, batch generate, approve, reject, get single plan, athlete current plan
- Batch generation and post-rejection regeneration use FastAPI BackgroundTasks
- Plans router registered at /api/plans with all endpoints following codebase auth patterns

## Task Commits

Each task was committed atomically:

1. **Task 1: Build injury risk assessment service** - `b3ac69e` (feat)
2. **Task 2: Create plan API endpoints with approval workflow** - `ab14622` (feat)

## Files Created/Modified
- `backend/app/services/injury_risk_service.py` - Composite injury risk scoring combining ACWR, TSB, wellbeing trends, and sleep quality
- `backend/app/api/endpoints/plans.py` - 7 endpoints for plan generation, approval workflow, and athlete plan retrieval
- `backend/app/api/router.py` - Plans router registration at /plans prefix

## Decisions Made
- InjuryRiskService kept as standalone service (not embedded in PlanGenerationService) so both API endpoints and plan generation can use it independently
- Route /current registered before /{plan_id} to prevent FastAPI matching "current" as a UUID path parameter
- Rejection automatically triggers background plan regeneration with new version (parent_plan_id set for lineage)
- Batch generation uses BackgroundTasks -- returns immediately with athlete count, generates in background
- Pydantic BaseModel request schemas used for body validation (GeneratePlanRequest, GenerateBatchRequest, RejectPlanRequest)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed route ordering for /current vs /{plan_id}**
- **Found during:** Task 2 (Plan API endpoints)
- **Issue:** GET /current was registered after GET /{plan_id}, which would cause FastAPI to match "current" as a plan_id path parameter
- **Fix:** Moved /current endpoint before /{plan_id} with explanatory comment
- **Files modified:** backend/app/api/endpoints/plans.py
- **Verification:** Route order confirmed correct in final file
- **Committed in:** ab14622 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Route ordering fix was necessary for correct routing. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required. (weekly_plans table migration from 06-01 still needed if not yet deployed.)

## Next Phase Readiness
- Plan API ready for frontend plan review UI
- InjuryRiskService ready for injury risk warnings and dashboard display (06-04)
- Approval workflow ready for morning adaptation endpoint to check approved plans (06-03)
- All 7 endpoints compilable and following established codebase patterns

---
*Phase: 06-ai-training-engine*
*Completed: 2026-05-04*
