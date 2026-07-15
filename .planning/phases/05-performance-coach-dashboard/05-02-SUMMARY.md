---
phase: 05-performance-coach-dashboard
plan: 02
subsystem: frontend-performance
tags: [react-query, recharts, pmc, performance, hooks, api]
requires:
  - 05-01 (PMC backend endpoints)
provides:
  - Performance hooks with string athleteId and enabled guards
  - PerformanceChart wired to useTrainingLoad hook
  - PerformanceMetrics wired to usePerformanceMetrics hook
  - PerformanceTrends wired to usePerformanceTrends hook
affects:
  - 05-03 (coach dashboard may reuse performance hooks)
  - 05-04 (any remaining performance views)
tech-stack:
  added: []
  patterns:
    - useMemo for API data transformation to chart format
    - Skeleton loading states for chart placeholders
    - enabled guard pattern on all React Query hooks
key-files:
  created: []
  modified:
    - frontend/src/lib/api.ts
    - frontend/src/hooks/usePerformance.ts
    - frontend/src/components/dashboard/PerformanceChart.tsx
    - frontend/src/components/performance/PerformanceMetrics.tsx
    - frontend/src/components/performance/PerformanceTrends.tsx
decisions:
  - Use Intl.DateTimeFormat for chart date labels (no external date library needed)
  - Dynamic metric grouping by metric_type from API (not hardcoded categories)
  - Show metric count in RingProgress instead of computed score (no historical bests available in single API call)
  - Default PMC chart to 42 days (6 weeks) for better training load visibility
metrics:
  duration: 2min
  completed: 2026-05-03
---

# Phase 5 Plan 2: Performance Frontend Rewire Summary

Rewired all performance frontend components from hardcoded mock data to real API calls via React Query hooks, fixing the athleteId type mismatch (number to string UUID).

## What Was Done

### Task 1: Fix performanceAPI and hook types (number -> string)
**Commit:** 277322b

Changed all `performanceAPI` method signatures in `api.ts` from `athleteId: number` to `athleteId: string` to match the UUID-based Supabase schema. Updated all four hooks in `usePerformance.ts` to accept string athleteId and added `enabled: !!athleteId` guards to prevent queries from firing with empty/undefined athleteId values. Reduced `useTrainingLoad` staleTime from 1 hour to 5 minutes for fresher PMC data.

### Task 2: Rewire PerformanceChart, PerformanceMetrics, and PerformanceTrends
**Commit:** c2215a6

**PerformanceChart:** Removed the entire `useState`/`useEffect` mock data generation (hardcoded ctlValues, atlValues, tsbValues arrays). Replaced with `useTrainingLoad(athleteId, days)` hook call. Transforms `data.daily_load` array from API into chart format using `useMemo`. Added Mantine `Skeleton` for loading state and centered empty-state message when no training data exists. Changed `athleteId` prop from optional number (default 1) to required string. Changed default days from 14 to 42 for better training load visibility.

**PerformanceMetrics:** Removed all hardcoded strength/speed/power metric objects. Replaced with `usePerformanceMetrics(athleteId)` hook call. Dynamically groups API response by `metric_type` field, displaying the most recent value per `metric_name`. Uses a `TYPE_CONFIG` map for category labels and colors (strength=blue, speed=green, power=orange, endurance=violet, technique=cyan). Shows metric count in the RingProgress overview. Added loading skeleton and empty-state placeholder.

**PerformanceTrends:** Removed all hardcoded `strengthData`, `speedData`, `powerData` objects with fake date/value arrays. Replaced with `usePerformanceTrends(athleteId, specificMetric, 180)` hook call (6 months of history). Transforms API response array into chart format with formatted dates. Keeps the SegmentedControl category/metric selectors. Updated metric option values to match actual database metric_name values (e.g., `back_squat_1rm` instead of `squat_1rm`). Added loading skeleton and empty-state message.

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Use Intl.DateTimeFormat for chart dates | Avoids dayjs dependency; built-in browser API is sufficient |
| Dynamic metric grouping from API data | More flexible than hardcoded categories; adapts to whatever metric_types exist in DB |
| Show metric count instead of computed score | Single API call returns latest metrics, not historical bests needed for percentage scoring |
| Default PMC chart to 42 days | 6 weeks provides better training load trend visibility than 14 days |

## Deviations from Plan

None - plan executed exactly as written.

## Verification

- TypeScript compiles without errors (`npx tsc --noEmit` clean)
- No hardcoded data in any of the three components (grep verified)
- All three components import and use their respective hooks (grep verified)
- No `number` types for athleteId in usePerformance.ts or performanceAPI (grep verified)
- All hooks have enabled guards (grep verified)

## Next Phase Readiness

All performance components are now wired to real backend endpoints. The components accept `athleteId: string` props and will need parent pages to pass the authenticated user's athlete ID (from useAuth or similar). The `athleteAPI` section in api.ts still uses `number` types -- this is out of scope for this plan but should be addressed eventually.
