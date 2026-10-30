# Phase 5: Performance & Coach Dashboard - Research

**Researched:** 2026-05-03
**Domain:** PMC metrics, performance charting, coach dashboard architecture, alert systems
**Confidence:** HIGH

## Summary

This phase builds the coach's command center and wires up PMC / performance trend charts to real data. The codebase already has substantial infrastructure in place: the PMC calculation service (`pmc_service.py`) with correct exponential decay math, performance endpoints with auth guards, a coach dashboard component with tabs/readiness/workout compliance, and React Query hooks for performance data. The primary work is (1) adapting the PMC model's training load input for bobsleigh power sports, (2) rewiring hardcoded/mock frontend components to real API data, (3) building the coach-athlete relationship management endpoints, and (4) implementing the alert system using the existing `notifications` table.

The key domain-specific finding is that the current PMC time constants (42-day CTL, 7-day ATL) are appropriate for bobsleigh athletes. The standard 42-day CTL constant needs no change (the PMC model is insensitive to CTL constant changes per Coggan). The ATL constant of 7 days is already reasonable for power sport athletes. The more critical adaptation is how training load (TSS equivalent) is calculated for strength/power sessions -- the session-RPE method (sRPE = RPE x duration_minutes) is the validated standard for non-endurance sports.

**Primary recommendation:** Keep existing PMC exponential decay code as-is. Focus effort on (a) reliable sRPE-based training load calculation from logged workouts, (b) rewiring all mock-data components to real API calls, and (c) building coach endpoints that query across the coach_athletes relationship table.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| recharts | ^2.12.0 | PMC chart, performance trends | Already used throughout app, ComposedChart supports dual-axis PMC display |
| @tanstack/react-query | ^5.17.19 | Data fetching/caching | Already used for all API hooks, stale-time-based refresh |
| @mantine/core | ^7.15.0 | UI components (Tables, Badges, Cards) | Project UI framework |
| @tabler/icons-react | ^2.47.0 | Icons for alerts, status indicators | Already used across dashboard |
| axios | ^1.6.5 | HTTP client for API calls | Already configured with auth interceptor |

### Supporting (Already Installed)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| dayjs | ^1.11.10 | Date formatting/manipulation | Date range selectors, chart axis labels |
| zod | ^3.22.4 | Schema validation | Validating coach-athlete relationship payloads |

### Not Needed
| Instead of | Why Not | What to Use |
|------------|---------|-------------|
| @mantine/charts | Would add another dependency wrapping recharts | Use recharts directly (already in use, all chart components built with it) |
| d3.js | Overkill, steep learning curve | recharts handles all required chart types |
| chart.js | Different paradigm, would require rewrite | recharts already established |
| socket.io / real-time alerts | Unnecessary complexity for MVP alerts | Polling via React Query (short staleTime for coach views) |

## Architecture Patterns

### Backend Pattern: Coach Service Layer

The existing codebase uses a service-layer pattern (e.g., `PMCService`, `PerformanceService`, `TrainingService`). Follow the same pattern for coach-specific functionality.

```
backend/app/
  api/endpoints/
    performance.py     # Existing - add coach PMC endpoints
    coach.py           # NEW - coach roster, alerts, relationship management
  services/
    pmc_service.py     # Existing - no changes needed to math
    performance_service.py  # Existing - extend for full PMC time series
    coach_service.py   # NEW - roster queries, alert generation, relationship CRUD
```

### Frontend Pattern: Hooks + Components

Follow the existing pattern of React Query hooks wrapping API calls, consumed by components.

```
frontend/src/
  hooks/
    usePerformance.ts  # Existing - fix athleteId type (number -> string)
    useCoachDashboard.ts  # NEW - roster, alerts, multi-athlete PMC
  components/
    dashboard/
      CoachDashboard.tsx      # Existing - wire alerts to real data
      CoachReadiness.tsx      # Existing - already real data via useCoachReadiness
      PerformanceChart.tsx    # Existing - rewire from mock to useTrainingLoad
    performance/
      PerformanceMetrics.tsx  # Existing - rewire from hardcoded to API
      PerformanceTrends.tsx   # Existing - rewire from hardcoded to API
  lib/
    api.ts  # Existing - add coachAPI endpoints
```

### Pattern 1: sRPE Training Load Calculation

**What:** Calculate daily training load from workout data using session-RPE method.
**When to use:** Whenever a workout is completed/updated with an RPE value.
**Why:** The session-RPE method (sRPE = RPE x duration) is validated for strength, power, speed, plyometric, and resistance training modalities. It does not require a power meter or sport-specific equipment.

```python
# Source: Foster et al. (2001), validated by Frontiers in Neuroscience (2017)
# sRPE formula: training_load = RPE * duration_minutes
def calculate_training_load(rpe: int, duration_minutes: int) -> float:
    """Calculate session training load using session-RPE method.

    Args:
        rpe: Rate of Perceived Exertion (1-10 scale)
        duration_minutes: Session duration in minutes

    Returns:
        Training load in arbitrary units (AU)

    Example:
        High intensity strength (RPE 8, 75 min) = 600 AU
        Recovery session (RPE 3, 45 min) = 135 AU
        Sprint training (RPE 9, 60 min) = 540 AU
    """
    return float(rpe * duration_minutes)
```

### Pattern 2: Coach Authorization Guard

**What:** Reusable dependency for coach-only endpoints.
**When to use:** All coach-specific endpoints.

```python
# Follow the existing pattern from wellbeing.py and training.py
from app.core.security import get_current_user

def _get_user_role(user) -> str:
    """Extract role from user metadata (app_metadata preferred, user_metadata fallback)."""
    role = "athlete"
    if hasattr(user, "app_metadata") and user.app_metadata:
        role = user.app_metadata.get("role", "athlete")
    if role == "athlete" and hasattr(user, "user_metadata") and user.user_metadata:
        role = user.user_metadata.get("role", "athlete")
    return role

async def _get_coach_id(user) -> str:
    """Look up the coach record for the authenticated user."""
    sb = get_supabase()
    result = sb.table("coaches").select("id").eq("user_id", user.id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="No coach profile found")
    return result.data[0]["id"]

async def _get_coach_athlete_ids(coach_id: str) -> list[str]:
    """Get all athlete IDs assigned to a coach."""
    sb = get_supabase()
    result = (
        sb.table("coach_athletes")
        .select("athlete_id")
        .eq("coach_id", coach_id)
        .is_("ended_at", "null")
        .execute()
    )
    return [row["athlete_id"] for row in result.data]
```

### Pattern 3: PMC Chart with Dual Y-Axis (recharts)

**What:** ComposedChart combining bar (daily load) with lines (CTL, ATL, TSB) on two Y-axes.
**When to use:** PMC visualization in both athlete and coach views.

```tsx
// Source: Existing PerformanceChart.tsx pattern, extended for real data
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

// Key pattern: TSB on right axis, loads on left axis
<ComposedChart data={pmcData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="date" />
  <YAxis yAxisId="left" label={{ value: "Training Load", angle: -90, position: "insideLeft" }} />
  <YAxis yAxisId="right" orientation="right" label={{ value: "TSB (Form)", angle: 90, position: "insideRight" }} />
  <Tooltip />
  <Legend />
  <Bar yAxisId="left" dataKey="load" fill={theme.colors.gray[3]} name="Daily Load" />
  <Line yAxisId="left" type="monotone" dataKey="ctl" stroke={theme.colors.blue[6]} name="CTL (Fitness)" dot={false} />
  <Line yAxisId="left" type="monotone" dataKey="atl" stroke={theme.colors.red[6]} name="ATL (Fatigue)" dot={false} />
  <Line yAxisId="right" type="monotone" dataKey="tsb" stroke={theme.colors.green[6]} name="TSB (Form)" dot={false} />
</ComposedChart>
```

### Pattern 4: Alert Generation (Server-Side, Computed on Read)

**What:** Generate alerts by querying recent data for concerning patterns, rather than storing alerts persistently.
**When to use:** Coach dashboard alerts tab.
**Why:** Simpler than event-driven alert creation, matches existing pattern (readiness score computed on read, not stored).

```python
# Alert types for bobsleigh coaches:
ALERT_RULES = {
    "fatigue_spike": {
        "condition": "TSB drops below -20 or ATL/CTL ratio > 1.5",
        "severity": "high",
        "message": "Fatigue spike detected for {athlete_name}"
    },
    "missed_checkin": {
        "condition": "No wellbeing assessment for 2+ consecutive days",
        "severity": "medium",
        "message": "{athlete_name} has not checked in for {days} days"
    },
    "declining_performance": {
        "condition": "Performance metric declined > 5% over last 3 tests",
        "severity": "medium",
        "message": "{athlete_name}'s {metric} showing decline"
    },
    "overtraining_risk": {
        "condition": "TSB below -30 for 3+ consecutive days",
        "severity": "high",
        "message": "Overtraining risk: {athlete_name} TSB at {tsb}"
    },
    "low_readiness": {
        "condition": "Readiness score below 4 for 2+ consecutive days",
        "severity": "high",
        "message": "{athlete_name} reporting poor readiness"
    }
}
```

### Anti-Patterns to Avoid

- **Storing PMC values in the training_loads table:** The existing schema has `ctl`, `atl`, `tsb` columns in `training_loads`, but the PMC service correctly calculates these on-the-fly from raw loads. Do NOT pre-compute and store -- always calculate from the time series to maintain consistency.
- **Separate alert storage for computed alerts:** The production `notifications` table is for persistent notifications (messages from coach, system announcements). Trend-based alerts (fatigue, missed checkins) should be computed on read, not stored as notifications.
- **Mixing athlete_id types:** The hooks use `number` for athleteId but the actual IDs are UUID strings. This must be corrected.
- **Direct Supabase queries in coach components:** The CoachDashboard currently queries Supabase directly for some data. All coach queries should go through the backend API (which uses the service role key) for consistent authorization.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Exponential decay PMC math | Custom formula | Existing `PMCService.calculate_pmc_for_athlete()` | Already correctly implemented with configurable time constants |
| Training load from RPE | Complex TSS estimation | sRPE = RPE x duration_minutes | Validated formula for power sports, simpler than TSS |
| Date range filling (gaps = rest days) | Manual loop | Existing gap-fill logic in `pmc_service.py` lines 72-89 | Already handles missing days as 0 load |
| Coach role checking | Custom middleware | Existing `_get_user_role()` helper | Already used in wellbeing.py and training.py |
| Readiness calculation | New readiness algorithm | Existing `_calculate_readiness()` in wellbeing.py | Already produces score + recovery status |
| Chart dual-axis layout | Custom D3 chart | recharts `ComposedChart` with dual `YAxis` | Already demonstrated in `PerformanceChart.tsx` |
| Auth token forwarding | Manual token management | Existing axios interceptor in `api.ts` | Automatically attaches Supabase bearer token |

**Key insight:** The PMC math, role checks, readiness calculation, and chart patterns all exist. The real work is wiring data pipelines together, not building new algorithms.

## Common Pitfalls

### Pitfall 1: athleteId Type Mismatch (number vs string)
**What goes wrong:** `usePerformanceMetrics(athleteId: number)` is declared with `number` type, but all IDs in the database and API are UUID strings. Calling with the wrong type causes silent failures or incorrect API URLs.
**Why it happens:** The hooks were scaffolded before the database was finalized.
**How to avoid:** Change all hook parameter types from `number` to `string`. Check every `performanceAPI` method signature too.
**Warning signs:** API returning empty results or 404s when data exists.

### Pitfall 2: PMC Chart Empty When No Training Loads Exist
**What goes wrong:** Chart renders blank with no user feedback when athlete has no training_loads data.
**Why it happens:** The API correctly returns empty arrays, but the chart component may not handle the empty state.
**How to avoid:** Always check for empty `daily_load` array before rendering the chart. Show "No training data" placeholder with guidance to log workouts.
**Warning signs:** Blank chart area with axis labels but no data.

### Pitfall 3: Coach Readiness N+1 Query Problem
**What goes wrong:** The existing `/coach/readiness` endpoint loops through each athlete and makes a separate Supabase query per athlete (lines 218-275 in wellbeing.py). With many athletes, this becomes slow.
**Why it happens:** Simple implementation prioritized correctness over performance.
**How to avoid:** For new coach endpoints, batch queries where possible. Use `.in_("athlete_id", athlete_ids)` to fetch data for all athletes in one query rather than looping.
**Warning signs:** Coach dashboard taking 3+ seconds to load with 10+ athletes.

### Pitfall 4: Training Load Not Written After Workout Completion
**What goes wrong:** PMC chart stays flat because completing a workout does not automatically write a row to `training_loads`.
**Why it happens:** The workout PATCH endpoint only updates `is_completed`, `rpe`, `notes`, `actual_load` on the `workouts` table. There is no trigger or service call that creates a corresponding `training_loads` entry.
**How to avoid:** When a workout is marked complete with an RPE, calculate sRPE (RPE x duration) and upsert into `training_loads` for that athlete + date. This is the critical data pipeline gap.
**Warning signs:** Workouts exist and are completed, but PMC chart shows no data.

### Pitfall 5: Coach Dashboard Making Direct Supabase Calls
**What goes wrong:** The `CoachDashboard.tsx` component queries `supabase.from("athlete_coaches")` directly (line 78). This uses the anon key and depends on RLS policies, which may not be set up for the `athlete_coaches` join table.
**Why it happens:** The component was built before backend coach APIs existed.
**How to avoid:** Route all coach data through backend API endpoints that use the service role key (bypasses RLS).
**Warning signs:** Empty athlete lists even when coach_athletes relationships exist in the database.

### Pitfall 6: Inconsistent Table Names
**What goes wrong:** Frontend references `athlete_coaches` table (CoachDashboard line 79), but the production schema has `coach_athletes` (coach_id, athlete_id as PK).
**Why it happens:** Schema evolved, frontend not updated.
**How to avoid:** Always reference the production schema (`coach_athletes`) as the source of truth.
**Warning signs:** Supabase query errors or empty results.

## Code Examples

### Training Load Auto-Calculation on Workout Completion

```python
# backend/app/services/training_load_service.py
async def upsert_training_load_from_workout(workout: dict) -> None:
    """Calculate and store training load when a workout is completed.

    Uses session-RPE method: training_load = RPE * duration_minutes
    Upserts to handle multiple workouts on the same day (sums loads).
    """
    if not workout.get("rpe") or not workout.get("duration_minutes"):
        return  # Can't calculate without RPE and duration

    athlete_id = workout["athlete_id"]
    workout_date = workout["date"]
    srpe = workout["rpe"] * workout["duration_minutes"]

    sb = get_supabase()

    # Check if a training_load entry already exists for this date
    existing = (
        sb.table("training_loads")
        .select("id, training_load")
        .eq("athlete_id", athlete_id)
        .eq("date", workout_date)
        .execute()
    )

    if existing.data:
        # Add to existing load (multiple sessions in one day)
        new_load = existing.data[0]["training_load"] + srpe
        sb.table("training_loads").update(
            {"training_load": new_load}
        ).eq("id", existing.data[0]["id"]).execute()
    else:
        # Insert new load entry
        sb.table("training_loads").insert({
            "athlete_id": athlete_id,
            "date": workout_date,
            "training_load": srpe,
            "rpe": workout["rpe"],
        }).execute()
```

### Coach Roster Endpoint

```python
# backend/app/api/endpoints/coach.py
@router.get("/roster")
async def get_coach_roster(user=Depends(get_current_user)):
    """Get all athletes assigned to the authenticated coach with current status."""
    role = _get_user_role(user)
    if role != "coach":
        raise HTTPException(status_code=403, detail="Coach role required")

    sb = get_supabase()
    coach_id = await _get_coach_id(user)

    # Get all assigned athletes in one query
    result = (
        sb.table("coach_athletes")
        .select("athlete_id, relationship_type, access_level, started_at, athletes(id, first_name, last_name, email, is_active)")
        .eq("coach_id", coach_id)
        .is_("ended_at", "null")
        .execute()
    )

    return result.data
```

### Coach PMC Overview (Multi-Athlete)

```python
@router.get("/athletes/pmc-summary")
async def get_athletes_pmc_summary(user=Depends(get_current_user)):
    """Get current PMC snapshot for all coached athletes."""
    role = _get_user_role(user)
    if role != "coach":
        raise HTTPException(status_code=403, detail="Coach role required")

    coach_id = await _get_coach_id(user)
    athlete_ids = await _get_coach_athlete_ids(coach_id)

    pmc_service = PMCService()
    summaries = []

    for athlete_id in athlete_ids:
        pmc_data = await pmc_service.calculate_pmc_for_athlete(athlete_id, days=14)
        if pmc_data["dates"]:
            summaries.append({
                "athlete_id": athlete_id,
                "current_ctl": round(pmc_data["ctl"][-1], 1),
                "current_atl": round(pmc_data["atl"][-1], 1),
                "current_tsb": round(pmc_data["tsb"][-1], 1),
                "last_load_date": pmc_data["dates"][-1],
            })
        else:
            summaries.append({
                "athlete_id": athlete_id,
                "current_ctl": 0.0,
                "current_atl": 0.0,
                "current_tsb": 0.0,
                "last_load_date": None,
            })

    return summaries
```

### Performance API Hook Fix (Type Correction)

```typescript
// frontend/src/hooks/usePerformance.ts -- corrected types
export function usePerformanceMetrics(athleteId: string) {
  return useQuery({
    queryKey: ["performance", "metrics", athleteId],
    queryFn: () => performanceAPI.getMetrics(athleteId).then((res) => res.data),
    enabled: !!athleteId,
    staleTime: 60 * 60 * 1000,
  });
}

export function useTrainingLoad(athleteId: string, days = 90) {
  return useQuery({
    queryKey: ["performance", "load", athleteId, days],
    queryFn: () => performanceAPI.getTrainingLoad(athleteId, days).then((res) => res.data),
    enabled: !!athleteId,
    staleTime: 5 * 60 * 1000,  // 5 min for coach PMC views
  });
}
```

### Full PMC Time Series Response (Backend Extension)

```python
# Extend PerformanceService.get_training_load to return full time series
# Currently it only returns last 8 days of daily_load (line 112-122 of performance_service.py)
# Should return ALL data points for chart rendering

return {
    "athlete_id": athlete_id,
    "date": datetime.now().strftime("%Y-%m-%d"),
    "ctl": pmc_data["ctl"][-1] if pmc_data["ctl"] else 0.0,
    "atl": pmc_data["atl"][-1] if pmc_data["atl"] else 0.0,
    "tsb": pmc_data["tsb"][-1] if pmc_data["tsb"] else 0.0,
    "daily_load": [
        {"date": d, "load": load, "ctl": ctl, "atl": atl, "tsb": tsb}
        for d, load, ctl, atl, tsb in zip(
            pmc_data["dates"],    # ALL dates, not [-8:]
            pmc_data["loads"],
            pmc_data["ctl"],
            pmc_data["atl"],
            pmc_data["tsb"],
        )
    ],
    "recommendations": recommendations,
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Power-meter-based TSS only | sRPE (RPE x duration) validated for all modalities | Foster 2001, validated 2017+ | Makes PMC applicable to strength/power athletes without specialized equipment |
| Fixed 42/7 constants for all athletes | Configurable ATL constant (3-12 days based on athlete) | Ongoing research | ATL of 5-7d recommended for power athletes (current default of 7 is fine) |
| Hardcoded mock data in React components | React Query hooks + backend API | Existing pattern in the codebase | Must complete the migration for performance components |
| Direct Supabase queries in components | API-mediated queries (backend service role) | Established in Phase 1-4 | CoachDashboard still has direct queries that need migration |

**Deprecated/outdated in this codebase:**
- `PerformanceMetrics.tsx`: Contains entirely hardcoded data (lines 7-18). Must be rewired.
- `PerformanceTrends.tsx`: Contains entirely hardcoded/placeholder data (lines 33-87). Must be rewired.
- `PerformanceChart.tsx`: Uses generated mock data (lines 34-53). Must use `useTrainingLoad` hook.
- `performanceAPI` uses `number` for athleteId -- must be `string` (UUID).

## PMC for Bobsleigh: Domain-Specific Guidance

### Time Constants

| Parameter | Default | Bobsleigh Recommendation | Rationale |
|-----------|---------|-------------------------|-----------|
| CTL constant | 42 days | **42 days (keep as-is)** | Coggan: PMC insensitive to CTL constant changes |
| ATL constant | 7 days | **5-7 days (keep as-is)** | Power athletes with low CTL may benefit from 5d; 7d is conservative and safe |

### Training Load Formula

Use session-RPE (sRPE) for all workout types:
- **sRPE = RPE (1-10) x duration (minutes)**
- Produces load in "arbitrary units" (AU)
- Validated for: aerobic, intermittent, speed, plyometric, and resistance training

### Bobsleigh-Specific Load Ranges

| Workout Type | Typical RPE | Duration | Typical sRPE |
|-------------|-------------|----------|-------------|
| Heavy strength | 8-9 | 75-90 min | 600-810 AU |
| Sprint training | 8-9 | 45-60 min | 360-540 AU |
| Power/plyometrics | 7-8 | 60-75 min | 420-600 AU |
| Technique/sled drills | 5-6 | 45-60 min | 225-360 AU |
| Recovery session | 2-3 | 30-45 min | 60-135 AU |

### Existing RPE-to-Intensity Mapping (From Codebase)

Already established: RPE 1-3 = Low, RPE 4-6 = Medium, RPE 7-10 = High.

## Open Questions

Things that couldn't be fully resolved:

1. **Training loads table population strategy**
   - What we know: `training_loads` table exists, PMC service queries it, but no automatic pipeline writes to it when workouts are completed.
   - What's unclear: Are there any existing training_loads rows in production from previous data imports?
   - Recommendation: Build the auto-upsert pipeline from workout completion. Also provide a backfill script for historical workouts that have RPE and duration data.

2. **Coach-athlete table name inconsistency**
   - What we know: Production schema uses `coach_athletes`. Frontend CoachDashboard references `athlete_coaches`. These are different tables.
   - What's unclear: Does `athlete_coaches` exist as an alias or view in production?
   - Recommendation: Use `coach_athletes` (matches production_schema.sql, the FK constraints are defined there). Update frontend to route through backend API instead of direct Supabase queries.

3. **Performance metrics table schema differences**
   - What we know: Production `performance_metrics` has `date` column. Fresh schema has `test_date` column. Frontend `PerformanceAssessment` queries a `performance_assessments` table (not `performance_metrics`).
   - What's unclear: Which table(s) actually exist in the live Supabase instance?
   - Recommendation: Use the production schema column names (`date`, not `test_date`). Verify whether `performance_assessments` is a separate table or the same as `performance_metrics`.

4. **Workouts table schema differences**
   - What we know: Production workouts table has `duration` (integer), `type` (text). Fresh schema has `duration_minutes`, `workout_type`, `rpe` columns.
   - What's unclear: Which column names are live?
   - Recommendation: Verify against production. The sRPE calculation needs both `rpe` and `duration`/`duration_minutes`.

## Sources

### Primary (HIGH confidence)
- Existing codebase: `backend/app/services/pmc_service.py` -- verified PMC exponential decay implementation
- Existing codebase: `backend/sql/production_schema.sql` -- live database schema
- Existing codebase: `backend/app/api/endpoints/wellbeing.py` -- coach readiness pattern
- Existing codebase: `backend/app/api/endpoints/training.py` -- coach workout status pattern

### Secondary (MEDIUM confidence)
- [TrainingPeaks: The Science of the Performance Manager](https://www.trainingpeaks.com/learn/articles/the-science-of-the-performance-manager/) -- Time constant guidance (42d CTL, 3-7d ATL, shorter for power athletes)
- [TrainingPeaks: Estimating TSS](https://www.trainingpeaks.com/learn/articles/estimating-training-stress-score-tss/) -- RPE-based TSS estimation method
- [FasCat Coaching: PMC Guide](https://fascatcoaching.com/blogs/training-tips/performance-manager-chart/) -- ATL constant 3-7 days, younger athletes use shorter
- [Frontiers in Neuroscience: Session-RPE Validity](https://www.frontiersin.org/journals/neuroscience/articles/10.3389/fnins.2017.00612/full) -- sRPE validated for strength, speed, plyometric, resistance training
- [Recharts Performance Guide](https://recharts.github.io/en-US/guide/performance/) -- Memoization, animation control, data aggregation for large datasets

### Tertiary (LOW confidence)
- [Slowtwitch Forum: Customizing CTL/ATL constants](https://forum.slowtwitch.com/t/customizing-the-ctl-atl-constants-in-the-pmc-in-trainingpeaks/726034) -- Coggan personally uses 10d ATL at age 57, notes PMC insensitive to CTL changes
- Mantine Charts: exists as `@mantine/charts` (v9.0.0 on npm) but project uses recharts directly -- not worth switching

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all libraries already installed and in use
- PMC math / time constants: HIGH - existing implementation correct, domain research confirms no changes needed
- Architecture patterns: HIGH - following established codebase patterns
- Training load calculation (sRPE): HIGH - well-validated method with published research
- Alert system design: MEDIUM - computed-on-read approach inferred from existing patterns, no direct precedent in codebase
- Schema column names: MEDIUM - production schema documented but may have evolved since export date
- Coach-athlete relationship: MEDIUM - tables exist in schema but no backend CRUD endpoints yet

**Research date:** 2026-05-03
**Valid until:** 2026-06-03 (stable domain, no fast-moving dependencies)
