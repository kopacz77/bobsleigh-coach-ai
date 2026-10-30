---
phase: 06-ai-training-engine
plan: 05
subsystem: ui
tags: [mantine, athlete-ui, adapted-workout, injury-risk, weekly-plan, training-page]

# Dependency graph
requires:
  - phase: 06-ai-training-engine/02
    provides: Plan API endpoints (current, today with adaptation)
  - phase: 06-ai-training-engine/03
    provides: Morning adaptation service (adapted weights computed on read)
  - phase: 06-ai-training-engine/04
    provides: usePlans hooks (useTodaysWorkout, useCurrentPlan), plans component directory
provides:
  - AdaptedWorkoutView showing today's exercises with planned vs adapted weights
  - InjuryRiskBanner for moderate/high risk alerts
  - WeeklyPlanOverview showing 7-day plan with today highlighted
  - Training page integration (plan views wired into existing tabs)
affects: [phase-07 mobile polish, athlete onboarding flow, workout logging integration]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Adapted vs planned weight display: strikethrough planned + bold adapted"
    - "Adaptation color coding: green=1.0, yellow=0.9, orange=0.8, red=<0.8 multiplier"
    - "TrainingTabs component wrapping existing training page with new AI plan tabs"
    - "InjuryRiskBanner only renders for moderate/high risk (silent for low)"

key-files:
  created:
    - frontend/src/components/plans/AdaptedWorkoutView.tsx
    - frontend/src/components/plans/InjuryRiskBanner.tsx
    - frontend/src/components/plans/WeeklyPlanOverview.tsx
    - frontend/src/components/training/TrainingTabs.tsx
  modified:
    - frontend/src/components/training/index.tsx

key-decisions:
  - "Injury risk display thresholds: <0.3 low/green, 0.3-0.6 moderate/yellow, >=0.6 high/red"
  - "Adaptation alert color based on multiplier (green/yellow/orange/red gradient)"
  - "AdaptedWorkoutView at top of training page for immediate athlete visibility"
  - "WeeklyPlanOverview shows all 7 days with today highlighted via border color"
  - "TrainingTabs wraps existing content (preserves workout log and history)"

patterns-established:
  - "Athlete plan views in frontend/src/components/plans/ (same directory as coach views)"
  - "Adaptation display: bold adapted value + strikethrough planned value"
  - "Empty state messaging: 'No approved plan' with helpful context, not error"

# Metrics
duration: 4min
completed: 2026-05-04
---

# Phase 6 Plan 5: Athlete Workout Views Summary

**Athlete-facing adapted workout view with planned vs adapted weight display, injury risk banner, weekly plan overview, and training page integration**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-04T21:00:00Z
- **Completed:** 2026-05-05T01:35:27Z
- **Tasks:** 3 (2 auto + 1 checkpoint verified)
- **Files modified:** 5

## Accomplishments
- AdaptedWorkoutView showing today's exercises with adaptation metadata (planned vs adapted weights side-by-side)
- InjuryRiskBanner displaying warnings for moderate/high risk with risk factor bullet points
- WeeklyPlanOverview showing 7-day plan with today highlighted and training phase badge
- TrainingTabs component wrapping existing training page with "Today's Plan" and "Weekly Plan" tabs
- Training page index updated to integrate new plan views without breaking existing functionality

## Task Commits

Each task was committed atomically:

1. **Task 1: Build athlete workout view components** - `3eed263` (feat)
2. **Task 2: Wire plan views into existing training page** - `e1ea719` (feat)
3. **Task 3: Human verification checkpoint** - approved by user

## Files Created/Modified
- `frontend/src/components/plans/AdaptedWorkoutView.tsx` - Today's workout with adaptation display (planned vs adapted weights, section breakdowns, RPE target, empty/rest states)
- `frontend/src/components/plans/InjuryRiskBanner.tsx` - Alert banner for moderate/high injury risk with risk factor listing
- `frontend/src/components/plans/WeeklyPlanOverview.tsx` - 7-day plan overview with today highlighted, training phase badge, injury risk integration
- `frontend/src/components/training/TrainingTabs.tsx` - Tab wrapper adding AI plan views to existing training page
- `frontend/src/components/training/index.tsx` - Updated to use TrainingTabs with AdaptedWorkoutView and WeeklyPlanOverview

## Decisions Made
- AdaptedWorkoutView placed at top of training page (most important daily athlete interaction)
- Adapted weights shown as bold primary value with planned weight as strikethrough secondary (clear visual hierarchy)
- Adaptation alert color gradient: green (multiplier=1.0), yellow (0.9), orange (0.8), red (<0.8)
- InjuryRiskBanner only renders for moderate/high risk (low risk shows nothing, avoiding alert fatigue)
- Rest day shows encouraging message with recovery tips
- No plan state shows helpful message pointing to coach review
- TrainingTabs preserves all existing workout logging and history functionality

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 6 (AI Training Engine) is now FULLY complete:
  - Plan generation service (06-01)
  - Plan API with approval workflow (06-02)
  - Morning adaptation service (06-03)
  - Coach plan review UI (06-04)
  - Athlete workout views (06-05)
- End-to-end flow operational: coach generates plans -> reviews/approves -> athlete sees adapted workout daily
- Ready for Phase 7 (final polish, deployment, testing)

---
*Phase: 06-ai-training-engine*
*Completed: 2026-05-04*
