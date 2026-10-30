---
phase: 06-ai-training-engine
plan: 04
subsystem: ui
tags: [react-query, mantine, coach-ui, plan-review, approval-workflow, injury-risk]

# Dependency graph
requires:
  - phase: 06-ai-training-engine/02
    provides: Plan API endpoints (pending, approve, reject, generate, generate-batch, current, get-plan)
  - phase: 05-performance-coach-dashboard
    provides: CoachDashboard with Tabs layout, React Query patterns, Mantine UI conventions
provides:
  - plansAPI client in api.ts with 8 endpoint methods
  - 7 React Query hooks for plan CRUD and approval workflow
  - CoachPlanQueue component for pending plan review
  - PlanReviewCard with expandable day-by-day detail and approve/reject actions
  - RejectFeedbackModal for structured rejection feedback
  - GenerateAllButton for batch plan generation
  - Plans tab in CoachDashboard (2nd position with pending count badge)
affects: [06-03 morning adaptation frontend, athlete plan view, mobile plan review]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "plansAPI client pattern matching existing coachAPI/trainingAPI in api.ts"
    - "React Query mutation hooks with query invalidation on success"
    - "Expandable card pattern with Mantine Collapse for detail drill-down"
    - "Injury risk color coding: green=low (<0.3), yellow=moderate (0.3-0.6), red=high (>0.6)"

key-files:
  created:
    - frontend/src/hooks/usePlans.ts
    - frontend/src/components/plans/CoachPlanQueue.tsx
    - frontend/src/components/plans/PlanReviewCard.tsx
    - frontend/src/components/plans/RejectFeedbackModal.tsx
    - frontend/src/components/plans/GenerateAllButton.tsx
  modified:
    - frontend/src/lib/api.ts
    - frontend/src/components/dashboard/CoachDashboard.tsx

key-decisions:
  - "Plans tab placed 2nd in CoachDashboard (after Athletes, before Check-Ins) -- plan review is primary coach activity"
  - "Pending count badge on Plans tab for at-a-glance visibility"
  - "Rejection modal enforces min 10-char feedback (not just non-empty) for meaningful AI feedback"
  - "GenerateAllButton calculates next Monday automatically (no manual date picker)"
  - "PlanReviewCard uses Collapse for expandable detail (not separate route/page)"

patterns-established:
  - "Plans component directory: frontend/src/components/plans/"
  - "Injury risk thresholds: <0.3 low/green, 0.3-0.6 moderate/yellow, >=0.6 high/red"
  - "RejectFeedbackModal pattern: modal with validation -> parent handles mutation"

# Metrics
duration: 3min
completed: 2026-05-04
---

# Phase 6 Plan 4: Coach Plan Review UI Summary

**Coach plan review queue with expandable day-by-day detail, approve/reject workflow, rejection feedback modal, batch generation button, and Plans tab in CoachDashboard**

## Performance

- **Duration:** 3 min
- **Started:** 2026-05-04T20:10:17Z
- **Completed:** 2026-05-04T20:13:54Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments
- plansAPI client with 8 endpoint methods and 7 React Query hooks for full plan lifecycle
- CoachPlanQueue showing pending plans with PlanReviewCard expandable detail (day-by-day exercises with sets/reps/weight)
- Approve/reject workflow with RejectFeedbackModal enforcing min 10-char feedback for AI learning
- Injury risk warnings (colored badge + Alert component) on plans with moderate+ risk scores
- Plans tab wired into CoachDashboard as 2nd tab with pending count badge

## Task Commits

Each task was committed atomically:

1. **Task 1: Add plans API client and React Query hooks** - `b6905c3` (feat)
2. **Task 2: Build coach plan review UI components and wire into CoachDashboard** - `bb7975a` (feat)

## Files Created/Modified
- `frontend/src/lib/api.ts` - Added plansAPI export with 8 plan endpoint methods
- `frontend/src/hooks/usePlans.ts` - 7 React Query hooks: usePendingPlans, usePlan, useCurrentPlan, useTodaysWorkout, useApprovePlan, useRejectPlan, useGenerateBatch
- `frontend/src/components/plans/CoachPlanQueue.tsx` - Pending plans list with loading/empty states
- `frontend/src/components/plans/PlanReviewCard.tsx` - Expandable plan card with day-by-day exercises, approve/reject buttons, injury risk display
- `frontend/src/components/plans/RejectFeedbackModal.tsx` - Modal for structured rejection feedback with min 10-char validation
- `frontend/src/components/plans/GenerateAllButton.tsx` - Batch generation trigger for next Monday
- `frontend/src/components/dashboard/CoachDashboard.tsx` - Added Plans tab (2nd position) with pending count badge

## Decisions Made
- Plans tab placed as 2nd tab in CoachDashboard (after Athletes, before Check-Ins) since plan review is a primary coach activity
- Pending plans count badge shown on Plans tab for at-a-glance queue visibility
- Rejection modal enforces minimum 10 characters of feedback (not just non-empty) to ensure meaningful input for AI feedback loop
- GenerateAllButton auto-calculates next Monday date (no manual date picker needed)
- PlanReviewCard uses Mantine Collapse for expandable detail rather than navigating to a separate page (keeps queue review fast)
- Plan day sections rendered in fixed order: warm_up, main, accessory, cool_down

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Coach plan review UI complete -- coaches can see pending plans, review day-by-day detail, approve, reject with feedback, and batch generate
- plansAPI and usePlans hooks ready for athlete-facing plan view (useCurrentPlan, useTodaysWorkout)
- Injury risk display pattern established for reuse in athlete views
- All 7 plan endpoints from 06-02 are now wired to the frontend

---
*Phase: 06-ai-training-engine*
*Completed: 2026-05-04*
