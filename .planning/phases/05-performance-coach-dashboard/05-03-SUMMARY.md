---
phase: 05-performance-coach-dashboard
plan: 03
subsystem: backend-coach-api
tags: [coach-roster, PMC-summary, alerts, coach-athletes, CRUD]
dependency-graph:
  requires: [05-01, 05-02]
  provides: [coach-roster-api, multi-athlete-pmc-summary, computed-alerts, coach-athlete-crud]
  affects: [05-04]
tech-stack:
  added: []
  patterns: [computed-on-read-alerts, batch-wellbeing-queries, soft-delete-relationships]
key-files:
  created:
    - backend/app/services/coach_service.py
    - backend/app/api/endpoints/coach.py
  modified:
    - backend/app/api/router.py
decisions:
  - id: d-0503-01
    summary: "Alerts computed on read (not stored) matching established readiness pattern"
  - id: d-0503-02
    summary: "Batch wellbeing queries using .in_() to avoid N+1 problem"
  - id: d-0503-03
    summary: "fatigue_spike and overtraining_risk are separate alert types (TSB -20 vs -30 thresholds)"
  - id: d-0503-04
    summary: "Wellbeing alerts map through athlete.user_id since assessments use user_id not athlete_id"
  - id: d-0503-05
    summary: "Soft-remove via ended_at (not hard delete) preserving coaching relationship history"
metrics:
  duration: ~3min
  completed: 2026-05-03
---

# Phase 5 Plan 3: Coach Backend Service & API Summary

**One-liner:** CoachService with 7 methods and 5 REST endpoints for roster management, multi-athlete PMC overview, computed alerts, and coach-athlete CRUD.

## What Was Done

### Task 1: CoachService (b0e297c)
Created `backend/app/services/coach_service.py` with a `CoachService` class providing 7 methods:

- **get_coach_id**: Looks up coach UUID from auth user_id via coaches table
- **get_athlete_ids**: Returns active athlete IDs (ended_at IS NULL) from coach_athletes
- **get_roster**: Roster with joined athlete data (name, email, is_active) via Supabase select join
- **get_athletes_pmc_summary**: Multi-athlete CTL/ATL/TSB using PMCService.calculate_pmc_for_athlete per athlete, values rounded to 1 decimal
- **generate_alerts**: Computed-on-read alerts for 4 types:
  - missed_checkin (2+ days, severity: medium)
  - low_readiness (avg < 4, severity: high)
  - fatigue_spike (TSB < -20 or ATL/CTL > 1.5, severity: high)
  - overtraining_risk (TSB < -30, severity: high)
- **add_athlete**: Insert into coach_athletes with access_level="full"
- **remove_athlete**: Soft-delete via ended_at = today

Key implementation detail: wellbeing_assessments use `user_id` (not `athlete_id`), so the alert system maps through `athletes.user_id` to batch-fetch assessments.

### Task 2: Coach API Endpoints (49c28ae)
Created `backend/app/api/endpoints/coach.py` with 5 endpoints:

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/coach/roster | Athlete roster with joined data |
| GET | /api/coach/athletes/pmc-summary | Multi-athlete CTL/ATL/TSB |
| GET | /api/coach/alerts | Computed alerts for trends |
| POST | /api/coach/athletes/{id} | Add athlete to roster (201) |
| DELETE | /api/coach/athletes/{id} | Soft-remove athlete |

All endpoints include:
- Coach role verification via `_get_user_role` (app_metadata first, user_metadata fallback)
- ValueError catch for missing coach record (404)
- Standard HTTPException/RuntimeError/Exception error handling pattern

Router registered at `/api/coach` prefix with "Coach" tag in `backend/app/api/router.py`.

## Deviations from Plan

None - plan executed exactly as written.

## Decisions Made

1. **Computed-on-read alerts** - Alerts are calculated fresh on each request, not stored in notifications table. Matches the readiness pattern established in phase 4.
2. **Batch wellbeing queries** - Used `.in_("user_id", user_ids)` to fetch all athlete assessments in one query, avoiding N+1.
3. **Separate fatigue/overtraining thresholds** - fatigue_spike fires at TSB < -20 (but >= -30), overtraining_risk fires at TSB < -30. No duplicate alerts.
4. **user_id mapping for wellbeing** - wellbeing_assessments uses user_id (FK to auth.users), not athlete_id. Service maps through athletes table.
5. **Soft-delete for relationships** - `ended_at = today` preserves history rather than hard deleting rows.

## Verification Results

- CoachService: 7 async methods confirmed
- API endpoints: 5 routes confirmed (3 GET, 1 POST, 1 DELETE)
- Coach role check: 5 instances (one per endpoint)
- Batch queries: 2 `.in_()` calls (athlete IDs + user IDs)
- All modules parse without syntax errors
- Router includes coach endpoints at /api/coach prefix

## Next Phase Readiness

Plan 05-03 provides the backend API layer that plan 05-04 (Coach Dashboard Frontend) will consume. The frontend can now call:
- `/api/coach/roster` for the athlete list
- `/api/coach/athletes/pmc-summary` for the PMC overview cards
- `/api/coach/alerts` for the alert feed
- POST/DELETE `/api/coach/athletes/{id}` for roster management
