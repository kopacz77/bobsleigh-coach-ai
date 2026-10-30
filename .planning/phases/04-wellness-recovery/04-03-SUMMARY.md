---
phase: 04-wellness-recovery
plan: 03
subsystem: ui
tags: [react, mantine, recharts, react-query, coach-dashboard, wellbeing, traffic-light]

requires:
  - phase: 04-01
    provides: "Backend GET /api/wellbeing/coach/readiness endpoint with traffic light data"
  - phase: 04-02
    provides: "wellbeingAPI client and useWellbeingHistory hook"
provides:
  - "CoachReadiness component with traffic light table for athlete readiness"
  - "WellbeingTrends chart wired to backend API via React Query"
  - "Coach dashboard integration with readiness overview"
affects: [04-04, 05-performance]

tech-stack:
  added: []
  patterns:
    - "Coach views use React Query hooks (not direct Supabase queries)"
    - "Traffic light sorting: red > yellow > gray > green (problems surface first)"

key-files:
  created:
    - frontend/src/components/dashboard/CoachReadiness.tsx
  modified:
    - frontend/src/lib/api.ts
    - frontend/src/hooks/useWellbeing.ts
    - frontend/src/components/dashboard/CoachDashboard.tsx
    - frontend/src/components/wellbeing/WellbeingTrends.tsx

key-decisions:
  - "Replaced direct Supabase daily_checkins query with CoachReadiness component (table did not exist)"
  - "Removed objective metrics chart from WellbeingTrends (daily_metrics table not in schema)"
  - "CoachReadiness placed in both Athletes tab and Check-Ins tab for visibility"

patterns-established:
  - "Coach dashboard readiness via API-backed React Query hook, not direct Supabase"
  - "Athlete sorting by severity for coach attention prioritization"

duration: 4min
completed: 2026-05-03
---

# Phase 4 Plan 3: Coach Readiness & Wellbeing Trends Summary

**Coach readiness traffic light table with severity sorting, and WellbeingTrends rewired from direct Supabase to useWellbeingHistory React Query hook**

## Performance

- **Duration:** 4 min
- **Started:** 2026-05-03T12:57:21Z
- **Completed:** 2026-05-03T13:00:51Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created CoachReadiness component with colored traffic light indicators (green/yellow/red/gray) and injury concern alert icons
- Athletes sorted by severity: red first, then yellow, gray, green -- so problems surface to top
- Integrated CoachReadiness into CoachDashboard, replacing broken direct Supabase query to non-existent daily_checkins table
- Rewrote WellbeingTrends to use useWellbeingHistory hook with configurable time range selector

## Task Commits

Each task was committed atomically:

1. **Task 1: Add coach readiness API method and hook, create CoachReadiness component** - `173aaf0` (feat)
2. **Task 2: Integrate CoachReadiness into dashboard and wire WellbeingTrends to API** - `8777022` (feat)

## Files Created/Modified
- `frontend/src/components/dashboard/CoachReadiness.tsx` - Traffic light readiness table with sorted athletes, injury flag tooltips
- `frontend/src/lib/api.ts` - Added getCoachReadiness method to wellbeingAPI
- `frontend/src/hooks/useWellbeing.ts` - Added useCoachReadiness hook with 2-min stale time
- `frontend/src/components/dashboard/CoachDashboard.tsx` - Integrated CoachReadiness, removed broken daily_checkins query
- `frontend/src/components/wellbeing/WellbeingTrends.tsx` - Rewired from direct Supabase to useWellbeingHistory hook

## Decisions Made
- Replaced direct Supabase daily_checkins query with CoachReadiness component -- the daily_checkins table did not exist, causing silent failures
- Removed objective metrics chart (body_weight, resting_hr, sleep_hours) from WellbeingTrends since daily_metrics table is not in our simplified schema
- Placed CoachReadiness in both the Athletes tab (prominent at top) and Check-Ins tab for easy access
- Removed alert generation code that depended on daily_checkins data (alerts panel remains but starts empty until future alert system is built)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Removed broken daily_checkins Supabase query and dependent alert logic**
- **Found during:** Task 2
- **Issue:** CoachDashboard queried a "daily_checkins" table that does not exist in the Supabase schema, causing silent errors. Alert generation logic also depended on this non-existent data.
- **Fix:** Removed the direct Supabase query block and all alert generation logic that depended on checkInsData. The CoachReadiness component now provides readiness data via the backend API.
- **Files modified:** frontend/src/components/dashboard/CoachDashboard.tsx
- **Verification:** TypeScript compiles, grep confirms no daily_checkins references remain
- **Committed in:** 8777022 (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Bug fix was necessary -- the removed code queried a non-existent table. No scope creep.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Coach readiness view complete, ready for Plan 04 (recovery recommendations)
- All wellbeing frontend components now use React Query hooks
- No direct Supabase imports remain in wellbeing or coach readiness components

---
*Phase: 04-wellness-recovery*
*Completed: 2026-05-03*
