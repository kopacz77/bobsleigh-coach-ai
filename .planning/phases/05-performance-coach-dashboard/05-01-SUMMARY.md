---
phase: 05-performance-coach-dashboard
plan: 01
subsystem: backend-training-pipeline
tags: [sRPE, PMC, training-loads, performance-service]
dependency-graph:
  requires: [03-training-core]
  provides: [training-load-auto-calculation, full-pmc-time-series]
  affects: [05-02, 05-03, 05-04]
tech-stack:
  added: []
  patterns: [sRPE-upsert-on-completion, fail-safe-side-effect]
key-files:
  created: []
  modified:
    - backend/app/api/endpoints/training.py
    - backend/app/services/performance_service.py
decisions:
  - id: d-0501-01
    summary: "sRPE upsert wrapped in try/except so failure does not break workout update"
  - id: d-0501-02
    summary: "Multiple workouts same day sum their training loads (additive upsert)"
  - id: d-0501-03
    summary: "Full PMC time series returned (removed [-8:] truncation)"
metrics:
  duration: ~2min
  completed: 2026-05-03
---

# Phase 5 Plan 1: Training Load Pipeline & PMC Fix Summary

**sRPE auto-upsert on workout completion; full PMC time series returned instead of last 8 days**

## What Was Done

### Task 1: sRPE Training Load Upsert (02fc9f1)

Added `_upsert_training_load()` helper function to `training.py` that:
- Calculates sRPE as `RPE x duration` (duration in minutes from the `duration` column)
- Queries `training_loads` table for existing row matching athlete_id + date
- If row exists: sums the new sRPE onto the existing load (supports multiple sessions/day)
- If no row: inserts a new training_loads record

The PATCH `/workouts/{workout_id}` endpoint now calls this helper after a successful update when:
1. The workout has `is_completed = True`
2. Both `rpe` and `duration` values are present

The upsert is wrapped in try/except so a failure in training load calculation never breaks the workout update response -- errors are logged but the original updated workout is still returned.

### Task 2: Full PMC Time Series (32d3c8a)

In `PerformanceService.get_training_load()`:
- Removed all `[-8:]` slices from the `daily_load` zip (dates, loads, ctl, atl, tsb)
- The PMC chart now receives the complete time series for full curve visualization

Also fixed column name references in `performance_service.py`:
- `get_performance_metrics()`: changed `.order("test_date", desc=True)` to `.order("date", desc=True)`
- `get_performance_trends()`: changed `.gte("test_date", from_date)` and `.order("test_date")` to use `"date"`

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| d-0501-01 | sRPE upsert wrapped in try/except | Side-effect must not break primary operation |
| d-0501-02 | Multiple workouts same day sum loads | Additive approach matches sports science convention |
| d-0501-03 | Return full PMC time series | Frontend needs all data points for chart rendering |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed test_date column references**
- **Found during:** Task 2
- **Issue:** `performance_service.py` referenced `test_date` column which does not exist in the production `performance_metrics` table schema. The correct column is `date`.
- **Fix:** Changed all `test_date` references to `date` in `get_performance_metrics()` and `get_performance_trends()`
- **Files modified:** backend/app/services/performance_service.py
- **Commit:** 32d3c8a

## Verification

- `_upsert_training_load` function exists and is called from PATCH handler
- No `[-8:]` slices remain in performance_service.py
- No `test_date` references remain in performance_service.py
- Both modules import cleanly without errors

## Next Phase Readiness

This plan provides the data pipeline that Plans 05-02 through 05-04 depend on:
- Training loads are now automatically populated when workouts are completed
- The PMC endpoint returns full time series data for chart visualization
- No blockers for subsequent plans
