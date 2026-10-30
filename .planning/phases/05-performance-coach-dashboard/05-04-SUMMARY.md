# Phase 5 Plan 4: Coach Dashboard API Wiring Summary

## One-liner
CoachDashboard rewired from direct Supabase queries to React Query hooks backed by /api/coach/* endpoints with real PMC summary table and computed alerts

## What Was Done

### Task 1: Create coachAPI client methods and useCoachDashboard hooks
- Added `coachAPI` object to `frontend/src/lib/api.ts` with 5 methods: getRoster, getPMCSummary, getAlerts, addAthlete, removeAthlete
- Created `frontend/src/hooks/useCoachDashboard.ts` with 5 React Query hooks:
  - `useCoachRoster()` - fetches coach's athlete roster (5min stale time)
  - `useCoachPMCSummary()` - fetches per-athlete PMC data (5min stale time)
  - `useCoachAlerts()` - fetches computed alerts (2min stale time)
  - `useAddAthlete()` - mutation to add athlete to roster (invalidates roster cache)
  - `useRemoveAthlete()` - mutation to remove athlete (invalidates roster cache)
- Commit: `b7fa6a0`

### Task 2: Rewire CoachDashboard from direct Supabase to React Query hooks
- Removed all `useSupabase` imports and direct Supabase queries (`athlete_coaches`, `workouts` tables)
- Removed useState for athletes, upcomingWorkouts, alerts, loading (React Query manages state)
- Removed entire useEffect data-fetching block
- Athletes tab: replaced hardcoded "Team Performance" panel (fake data like "5.24s", "7.8/10", "92%") with real PMC Summary table showing CTL/ATL/TSB per athlete
- PMC Summary table: color-coded TSB badges (green > 0, yellow -10 to 0, red < -10) with form status labels
- Alerts tab: wired to useCoachAlerts() with real alert types (fatigue_spike, overtraining_risk, missed_checkin, low_readiness)
- Alert filter dropdown updated to match real alert types from API
- Severity badges: high=red, medium=yellow, low=blue
- Alert count badge on tab from real data
- Workouts tab: replaced raw Supabase workout query with CoachWorkoutView component
- Loading states: Mantine Skeleton components during data fetch
- Commit: `105d56a`

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| CoachDashboard has zero Supabase imports | All data flows through React Query hooks -> coachAPI -> /api/coach/* endpoints |
| TSB color thresholds: >0 green, -10..0 yellow, <-10 red | Standard PMC interpretation for training form |
| Alert filter values match API alert types | fatigue_spike, overtraining_risk, low_readiness, missed_checkin (not old injury/readiness/missed) |
| Removed time filter select (today/week/month) | API endpoints handle time ranges server-side; client filter was coupled to Supabase queries |

## Files Modified

| File | Action | Description |
|------|--------|-------------|
| `frontend/src/lib/api.ts` | Modified | Added coachAPI export with 5 endpoint methods |
| `frontend/src/hooks/useCoachDashboard.ts` | Created | 5 React Query hooks (3 queries, 2 mutations) |
| `frontend/src/components/dashboard/CoachDashboard.tsx` | Modified | Full rewrite: Supabase -> React Query hooks |

## Verification Results

- No `supabase` or `useSupabase` imports in CoachDashboard.tsx (confirmed)
- No `athlete_coaches` table references in frontend dashboard (confirmed)
- All coach data flows through /api/coach/* endpoints via React Query (confirmed)
- No hardcoded fake data ("5.24s", "7.8/10", "92%") remaining (confirmed)
- TypeScript compiles with zero errors (confirmed)
- useCoachRoster, useCoachAlerts, useCoachPMCSummary all imported and called (confirmed)

## Duration
~2 minutes
