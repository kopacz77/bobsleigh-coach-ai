# Phase 6: AI Training Engine - Research

**Researched:** 2026-05-04
**Domain:** Rule-based training plan generation, bobsleigh periodization, coach approval workflows, morning adaptation, injury risk prediction
**Confidence:** MEDIUM (strong codebase understanding + domain research, but bobsleigh-specific periodization details are sparse in literature)

## Summary

Phase 6 requires building a system that generates personalized 7-day training plans (Mon-Sun), implements a coach approve/reject workflow, adapts daily loads based on morning wellness, and surfaces injury risk warnings. The existing codebase already contains substantial scaffolding: an `ml/models/weekly_plan_generator.py` with ~1000 lines of plan generation logic, an `ml/models/injury_risk_model.py` with a trained GradientBoosting classifier, PMC service with CTL/ATL/TSB calculations, coach service with alerts infrastructure, training templates, exercise library, and training protocols. However, all of these are prototype-quality and not integrated into the actual backend API workflow.

The critical constraint is **~21 days of real training data** for one athlete (Joshua Hudson). This rules out ML-based plan generation and mandates a **rule-based approach** with sport science-informed defaults. The existing `WeeklyPlanGenerator` class provides a solid foundation but needs to be refactored from the `ml/` module into the backend service layer, simplified to match the CONTEXT.md decisions (approve/reject only, no inline editing), and connected to real database queries.

**Primary recommendation:** Build a rule-based plan generation engine as a backend service (not in the `ml/` module), using the existing training templates and protocols as configuration, with the existing PMC service providing load/fatigue inputs. Use APScheduler for weekly auto-generation. Store plans in a new `weekly_plans` table with approval state machine. Morning adaptation is a thin layer that multiplies planned weights/volumes by a readiness-derived coefficient.

## Standard Stack

### Core (Already in Project)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | existing | API endpoints for plan generation, approval, adaptation | Already the backend framework |
| Supabase (PostgREST) | existing | Database for plans, approval state, feedback | Already the database |
| scikit-learn | existing | Injury risk model (GradientBoostingClassifier) | Already implemented in `ml/models/injury_risk_model.py` |
| NumPy | existing | PMC calculations, load computations | Already used in PMC service |
| React Query | existing | Frontend data fetching for plans, approval UI | Already the data layer |
| Mantine UI v7 | existing | Frontend components for plan review, approval | Already the UI framework |

### New (To Add)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| APScheduler | 3.10+ | Weekly auto-generation cron job (Saturday night) | Schedule plan generation for all athletes |
| pydantic | existing (via FastAPI) | Validate plan generation inputs/outputs | Type-safe plan structures |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| APScheduler | Celery + Redis | Celery is overkill for a single weekly cron job; APScheduler runs in-process, no broker needed |
| APScheduler | OS-level cron | Less portable, harder to manage from within the app |
| Rule-based engine | ML-based generation | Not enough data (~21 days); rule-based is deterministic, debuggable, and can be tuned by coach feedback |
| In-process plan gen | Background worker | Plans generate fast (seconds per athlete); no need for async worker infrastructure |

**Installation:**
```bash
pip install apscheduler
```

## Architecture Patterns

### Recommended Backend Structure

```
backend/app/
  services/
    plan_generation_service.py    # Core plan generation engine (rule-based)
    plan_approval_service.py      # Approve/reject workflow + feedback storage
    morning_adaptation_service.py # Readiness-based load adjustment
    injury_risk_service.py        # Injury risk prediction wrapper
    exercise_selection_service.py # Exercise picker from library
  api/endpoints/
    plans.py                      # /api/plans/* endpoints
  scheduler/
    weekly_plan_scheduler.py      # APScheduler setup for auto-generation
  config/
    periodization.py              # Bobsleigh periodization phase templates
    training_rules.py             # Rule-based logic configuration
```

### Recommended Frontend Structure

```
frontend/src/
  components/
    plans/
      CoachPlanQueue.tsx          # List of pending plans for review
      PlanReviewCard.tsx          # Single plan detail with approve/reject
      PlanDayView.tsx             # Day-by-day exercise detail
      RejectFeedbackModal.tsx     # Modal for rejection notes
      GenerateAllButton.tsx       # "Generate All Plans" button
    training/
      AdaptedWorkoutView.tsx      # Athlete's view with adapted loads
      InjuryRiskBanner.tsx        # Warning banner for high risk
  hooks/
    usePlans.ts                   # React Query hooks for plan CRUD
```

### Pattern 1: Rule-Based Plan Generation Pipeline

**What:** A deterministic pipeline that takes athlete state as input and produces a structured 7-day plan.

**When to use:** When data is insufficient for ML training (< 6 months of data), and decisions need to be explainable and adjustable.

**Pipeline steps:**
```python
# Conceptual pipeline - not runnable code
def generate_weekly_plan(athlete_id, week_start):
    # 1. Gather athlete context
    athlete = get_athlete_profile(athlete_id)          # maxes, preferences, level
    pmc = calculate_current_pmc(athlete_id)            # CTL, ATL, TSB
    recent_workouts = get_recent_workouts(athlete_id, weeks=4)
    wellbeing = get_recent_wellbeing(athlete_id, days=7)
    feedback_history = get_coach_feedback_history(athlete_id, weeks=8)

    # 2. Determine training phase
    phase = determine_phase(athlete, competition_calendar)  # prep/build/peak/recovery

    # 3. Select weekly template based on phase + fatigue state
    template = select_weekly_template(phase, pmc.tsb, athlete.training_frequency)

    # 4. Fill template with exercises
    plan = fill_exercises(template, athlete, recent_workouts)

    # 5. Calculate weights (history-first, profile-fallback)
    plan = assign_weights(plan, recent_workouts, athlete.performance_metrics)

    # 6. Apply coach preference adjustments (learned from feedback)
    plan = apply_coach_preferences(plan, feedback_history)

    # 7. Compute injury risk and attach warnings
    risk = predict_injury_risk(athlete_id, plan)
    plan.injury_risk = risk

    # 8. Store as draft (status: "pending_review")
    save_plan(plan, status="pending_review")
    return plan
```

### Pattern 2: Plan Approval State Machine

**What:** Plans move through defined states: `draft` -> `pending_review` -> `approved` | `rejected` -> (if rejected) `regenerating` -> `pending_review`

**States and transitions:**
```
draft              -- System auto-generates on schedule
  |
pending_review     -- Visible to coach in review queue
  |           \
approved       rejected (with feedback_notes)
  |               |
visible_to_      regenerating (system creates new plan
athlete          incorporating feedback)
                   |
                pending_review (new version)
```

**Database design:**
```sql
CREATE TABLE weekly_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id),
    coach_id UUID REFERENCES coaches(id),           -- NULL until assigned
    week_start DATE NOT NULL,                        -- Always a Monday
    week_end DATE NOT NULL,                          -- Always the following Sunday

    -- Plan content
    plan_data JSONB NOT NULL,                        -- Full structured plan
    training_phase TEXT NOT NULL,                     -- prep/build/peak/recovery/transition

    -- State machine
    status TEXT NOT NULL DEFAULT 'pending_review',   -- pending_review/approved/rejected
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    rejected_at TIMESTAMPTZ,
    rejected_by UUID,
    rejection_notes TEXT,                             -- Coach feedback for regeneration

    -- Versioning
    version INTEGER NOT NULL DEFAULT 1,              -- Increments on regeneration
    parent_plan_id UUID REFERENCES weekly_plans(id), -- Links to rejected plan

    -- Generation metadata
    generation_metadata JSONB,                       -- PMC state, inputs used
    injury_risk_score NUMERIC(4,3),                  -- 0-1 risk at generation time
    injury_risk_factors JSONB,                       -- Top contributing factors

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(athlete_id, week_start, version)
);

-- Index for coach review queue
CREATE INDEX idx_plans_status ON weekly_plans(status, week_start);
CREATE INDEX idx_plans_athlete_week ON weekly_plans(athlete_id, week_start);
```

### Pattern 3: Morning Adaptation (Load Modifier)

**What:** A function that takes today's approved plan + morning wellness check-in and returns adjusted loads. Does NOT change exercises, sets, or structure -- only weights and potentially reps.

**When to use:** Every time an athlete views their workout for the day, if they have submitted a morning check-in.

```python
# Conceptual - adaptation logic
def adapt_todays_workout(plan_day, morning_checkin):
    """Adjust planned loads based on morning readiness."""
    readiness = calculate_readiness_score(morning_checkin)  # 0-100 scale

    # Determine adjustment multiplier
    if readiness >= 80:
        multiplier = 1.0    # Fully ready, no change
    elif readiness >= 60:
        multiplier = 0.90   # Slight reduction (10%)
    elif readiness >= 40:
        multiplier = 0.80   # Moderate reduction (20%)
    elif readiness >= 20:
        multiplier = 0.65   # Significant reduction (35%)
    else:
        multiplier = 0.50   # Major reduction (50%), flag for coach

    # Apply to all weight-based exercises
    for exercise in plan_day.exercises:
        if exercise.planned_weight:
            exercise.adapted_weight = round_to_plate(
                exercise.planned_weight * multiplier
            )
        # Optionally reduce reps at very low readiness
        if readiness < 40 and exercise.planned_reps:
            exercise.adapted_reps = max(1, int(exercise.planned_reps * 0.75))

    return plan_day, {"multiplier": multiplier, "readiness": readiness}
```

### Pattern 4: Coach Feedback Learning Loop

**What:** Store rejection reasons and approval patterns per athlete. Use them to bias future plan generation.

**Not ML -- just weighted preference tracking:**
```python
# Conceptual
class CoachPreferenceLearner:
    """Track what coaches approve/reject to bias future plans."""

    def get_preferences(self, athlete_id):
        # Query rejection notes and approved plan patterns
        rejections = get_rejections(athlete_id, weeks=12)
        approvals = get_approvals(athlete_id, weeks=12)

        preferences = {
            "volume_bias": 0,       # -1 = less volume preferred, +1 = more
            "intensity_bias": 0,    # -1 = less intense, +1 = more intense
            "exercise_avoid": [],   # Exercises coach keeps rejecting
            "exercise_prefer": [],  # Exercises in approved plans
            "session_type_bias": {} # e.g., {"speed": +1, "recovery": -1}
        }

        # Parse rejection notes for volume/intensity keywords
        for r in rejections:
            if "too much volume" in r.notes.lower():
                preferences["volume_bias"] -= 0.5
            if "too heavy" in r.notes.lower():
                preferences["intensity_bias"] -= 0.5
            if "more sprint" in r.notes.lower():
                preferences["session_type_bias"]["speed"] = \
                    preferences["session_type_bias"].get("speed", 0) + 0.5

        return preferences
```

### Anti-Patterns to Avoid

- **Over-engineering the ML pipeline for plan generation:** With ~21 days of data, any ML model will overfit or produce nonsense. Rule-based with sensible sport science defaults is correct.
- **Storing adapted loads in the plan:** Morning adaptation should be computed on read, not written back to the plan. The plan itself stays immutable after approval.
- **Putting plan generation in the `ml/` module:** It belongs in `backend/app/services/` because it is business logic that queries the database, not a trainable model.
- **Auto-approving plans:** CONTEXT.md explicitly forbids this. Every plan must wait for coach sign-off.
- **Letting athletes see pending plans:** CONTEXT.md says athletes see nothing until approved. No "pending" badge, no draft preview.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron scheduling | Custom timer loop or sleep-based scheduler | APScheduler with CronTrigger | Battle-tested, handles missed fires, timezone-aware |
| PMC calculations | New PMC implementation | Existing `PMCService` in `backend/app/services/pmc_service.py` | Already implemented and tested with real data |
| Injury risk prediction | New model from scratch | Existing `InjuryRiskModel` in `ml/models/injury_risk_model.py` | Already has GBM classifier, feature importance, risk levels |
| Training templates | Hardcoded day structures | Existing `training_templates.json` and `training_protocols.json` | Already encode session structures (warm-up, main, accessory, cool-down) |
| Exercise library | New exercise database | Existing `exercises` table + `refined_exercises_library.json` | 912 exercises already catalogued with categories, muscle groups, equipment |
| Weight rounding | Floating point weight values | Round to nearest 2.5kg increment | Standard plate increment; existing WeeklyPlanGenerator already does this |
| Readiness calculation | New readiness formula | Existing `_calculate_readiness()` in `coach_service.py` | Already established: average of sleep_quality, inverted stress, nutrition_quality, physical_readiness, mental_clarity |

**Key insight:** The codebase already contains ~80% of the building blocks. The challenge is integration and workflow, not algorithm invention.

## Common Pitfalls

### Pitfall 1: Over-Specifying Weights for Unknown Exercises
**What goes wrong:** System assigns a weight for an exercise the athlete has never performed, and it is dangerously high or uselessly low.
**Why it happens:** Falling back to generic percentages of 1RM without considering the specific movement.
**How to avoid:** Three-tier weight determination: (1) Recent history for this exercise (last 4 weeks), (2) Profile max if 1RM tested, (3) Conservative estimate at 50-60% of a related exercise. Flag "estimated" weights visually so coach can verify.
**Warning signs:** Plan contains weight values for exercises with no training history and no 1RM test.

### Pitfall 2: Ignoring Rest Day Placement
**What goes wrong:** System generates 5 training days in a row with no recovery, or puts two high-intensity sessions back-to-back.
**Why it happens:** Algorithm fills days without considering cumulative fatigue within the generated week.
**How to avoid:** Weekly templates must encode rest day placement as a hard constraint. For bobsleigh: never more than 3 consecutive training days. High-intensity sessions (power, speed) must have a lower-intensity or rest day between them.
**Warning signs:** Monday=Power, Tuesday=Speed, Wednesday=Strength (three consecutive high-CNS days).

### Pitfall 3: Plan Generation Timeout on Batch
**What goes wrong:** "Generate All Plans" for 10+ athletes takes > 30 seconds, request times out.
**Why it happens:** Each plan requires multiple DB queries (workouts, wellbeing, PMC, exercises).
**How to avoid:** Use FastAPI BackgroundTasks for batch generation. Return immediately with a job ID. Frontend polls for completion. Or better: the weekly auto-generation runs asynchronously via APScheduler, so batch is already handled.
**Warning signs:** Coach clicks "Generate All" and gets a timeout error.

### Pitfall 4: Stale Morning Adaptation After Plan Update
**What goes wrong:** Athlete views adapted workout, then coach approves a different plan version, but athlete still sees the old adapted version.
**Why it happens:** Caching of adapted plan on frontend without invalidation.
**How to avoid:** Adaptation is computed on every fetch (it is cheap). The API returns both the planned and adapted values. React Query's `staleTime` should be short (30s-1min) for today's workout.
**Warning signs:** Athlete sees different plan than what coach approved.

### Pitfall 5: Unbounded Coach Feedback Text Parsing
**What goes wrong:** System tries to parse coach rejection notes with keyword matching and misinterprets ambiguous feedback.
**Why it happens:** Natural language is ambiguous; "too much sprinting" could mean volume or frequency.
**How to avoid:** V1 should use simple keyword matching with limited categories: volume_high, volume_low, intensity_high, intensity_low, more_X, less_X. Only adjust preferences when confidence is high (multiple rejections with similar notes). Log all unmatched feedback for future review.
**Warning signs:** System reduces sprint volume when coach meant "too many sprint sessions per week" (frequency, not volume per session).

### Pitfall 6: Injury Risk Model Not Usable Without Training
**What goes wrong:** `InjuryRiskModel.predict_risk()` throws because no model has been trained/saved.
**Why it happens:** The model exists in code but requires `model.train()` with sufficient data.
**How to avoid:** Implement a fallback rule-based injury risk assessment that uses ACWR thresholds directly (no ML). Only use ML model if a saved checkpoint exists. Existing alert thresholds (TSB < -20 fatigue spike, TSB < -30 overtraining) already provide good injury risk signals.
**Warning signs:** 500 error when generating a plan because injury risk model file does not exist.

## Bobsleigh-Specific Periodization Model

### Annual Training Cycle (Confidence: MEDIUM -- synthesized from multiple sources)

Bobsleigh has a distinct annual cycle driven by ice availability (October-March in Northern Hemisphere):

| Phase | Months | Duration | Focus | Volume | Intensity |
|-------|--------|----------|-------|--------|-----------|
| General Prep | Apr-Jun | 12 weeks | Hypertrophy, base strength, aerobic capacity | High | Moderate (65-80% 1RM) |
| Specific Prep | Jul-Sep | 12 weeks | Max strength, power, sprint acceleration | Moderate | High (80-95% 1RM) |
| Pre-Competition | Oct | 4 weeks | Peaking, sport-specific, push starts | Low | Very High (90-100%) |
| Competition | Nov-Mar | 20 weeks | Maintenance, race prep, ice training | Low | Sport-specific |
| Transition | Mar-Apr | 2-4 weeks | Active recovery, general fitness | Low | Low |

### Weekly Template by Phase

**General Preparation (4-5 sessions/week):**
- Mon: Lower Body Strength (Squat focus)
- Tue: Speed/Acceleration (short sprints 15-30m)
- Wed: Upper Body / Active Recovery
- Thu: Power Development (Olympic lifts)
- Fri: Speed Endurance / Conditioning
- Sat: Optional: Light technique or rest
- Sun: Rest

**Specific Preparation (4-5 sessions/week):**
- Mon: Acceleration Day (15-30m sprints, block starts)
- Tue: Max Strength (Heavy squats, deadlifts, 3-5 rep range)
- Wed: Recovery / Mobility
- Thu: Power (Cleans, snatches, plyometrics)
- Fri: Speed (Flying sprints, push practice)
- Sat: Light strength or rest
- Sun: Rest

**Pre-Competition/Peaking (3-4 sessions/week):**
- Mon: Speed (race-pace efforts, push starts)
- Tue: Power Maintenance (reduced volume, high intensity)
- Wed: Rest
- Thu: Light technique / activation
- Fri: Rest or very light movement
- Sat-Sun: Competition or rest

### Key Bobsleigh Training Principles (for plan generation rules)

1. **Push start is everything:** The 5-second push start determines race outcome. Sprint acceleration (15-30m) is the most sport-specific training.
2. **Power-to-weight matters:** Athletes need maximum power at ~100-105kg bodyweight. Training must build strength without excessive mass.
3. **Hip extension dominant:** Push biomechanics are hip-extensor dominant. Prioritize exercises: Power Clean, Squat, RDL, Hip Thrust.
4. **Double bodyweight squat benchmark:** 200kg squat is a baseline standard. Plans should track progress toward this.
5. **Sprint under 11s for 100m:** Speed benchmarks inform training emphasis.
6. **High CNS demand:** Olympic lifts + sprinting = high neural fatigue. Never program both at maximum on the same day.
7. **3-week cycles with deload:** Two heavy weeks followed by a deload week. This maps to a 3:1 or 2:1 loading pattern.

### Exercise Categories for Plan Generation

| Category | Examples | When to Use | Priority |
|----------|----------|-------------|----------|
| Olympic Lifts | Power Clean, Power Snatch | Power days, 2x/week max | Primary |
| Heavy Compound | Back Squat, Front Squat, Deadlift | Strength days, 2-3x/week | Primary |
| Sprint | 10-30m sprints, Block starts, Flying sprints | Speed days, 2-3x/week | Primary |
| Plyometric | Broad Jump, Triple Jump, Box Jump | Power days, 1-2x/week | Secondary |
| Posterior Chain | RDL, Hip Thrust, Glute Ham Raise | Strength days, 2x/week | Secondary |
| Push-Specific | Sled Push, Weighted Starts | Pre-comp, 1-2x/week | Sport-Specific |
| Core/Stability | Plank variations, Anti-rotation | Every session, accessory | Accessory |
| Mobility/Recovery | Foam rolling, Stretching, Light cardio | Recovery days, cool-downs | Recovery |

## Morning Adaptation Thresholds

Based on established readiness research and the existing readiness calculation in the codebase:

### Readiness Score Calculation (existing in codebase)
```python
readiness = (sleep_quality + (10 - stress_level) + nutrition_quality +
             physical_readiness + mental_clarity) / 5
# Result: 1-10 scale
```

### Adaptation Multipliers

| Readiness Score | Adaptation | Weight Multiplier | Rep Adjustment | Athlete Sees |
|----------------|------------|-------------------|----------------|-------------|
| 8-10 | None | 1.00 | No change | "You're ready - go as planned" |
| 6-7.9 | Mild | 0.90 | No change | "Slightly lighter today - listen to your body" |
| 4-5.9 | Moderate | 0.80 | -1 rep per set | "Reduced load today - focus on quality" |
| 2-3.9 | Significant | 0.65 | -2 reps per set | "Light session recommended - recovery priority" |
| 1-1.9 | Severe | 0.50 | Switch to recovery | "Recovery day strongly recommended" + coach notified |

### Rules for Adaptation

1. **Weights round to nearest 2.5kg** after multiplier application
2. **Minimum 1 rep per set** regardless of reduction
3. **Session structure (exercises) never changes** -- only loads and reps
4. **Readiness < 2 triggers an automatic coach notification** (out-of-band alert)
5. **Adapted values shown alongside planned values** so athlete can see both

## Injury Risk Thresholds

### ACWR-Based Risk (Confidence: HIGH -- well-established in literature)

| ACWR Range | Risk Level | Action |
|------------|-----------|--------|
| 0.80 - 1.30 | Low (sweet spot) | Continue as planned |
| 0.60 - 0.79 | Moderate (under-prepared) | Flag: athlete may not be ready for planned load |
| 1.31 - 1.50 | Moderate (rising load) | Warning: monitor closely, consider reducing next week |
| > 1.50 | High (danger zone) | Alert: 2-4x injury risk increase, recommend load reduction |
| < 0.60 | Moderate (detraining) | Flag: significant detraining, gradual ramp-up needed |

### TSB-Based Risk (Already established in codebase)

| TSB Value | Risk Level | Alert Type | Already Implemented |
|-----------|-----------|------------|---------------------|
| > 0 | Low | None | Yes (PMC service) |
| -10 to 0 | Low-Moderate | None | Yes |
| -20 to -10 | Moderate | "Slight fatigue" | Yes |
| -30 to -20 | High | "fatigue_spike" alert | Yes (coach_service.py) |
| < -30 | Very High | "overtraining_risk" alert | Yes (coach_service.py) |

### Combined Risk Assessment

```python
def assess_injury_risk(pmc_data, acwr, wellbeing_trend):
    """Combine multiple signals into overall risk."""
    risk_score = 0
    risk_factors = []

    # TSB component (0-0.3)
    tsb = pmc_data["tsb"][-1]
    if tsb < -30:
        risk_score += 0.3
        risk_factors.append("Severe fatigue (TSB < -30)")
    elif tsb < -20:
        risk_score += 0.2
        risk_factors.append("High fatigue (TSB < -20)")
    elif tsb < -10:
        risk_score += 0.1
        risk_factors.append("Moderate fatigue")

    # ACWR component (0-0.3)
    if acwr > 1.5:
        risk_score += 0.3
        risk_factors.append("ACWR > 1.5 (danger zone)")
    elif acwr > 1.3:
        risk_score += 0.15
        risk_factors.append("ACWR rising (1.3-1.5)")
    elif acwr < 0.8:
        risk_score += 0.1
        risk_factors.append("Under-prepared (ACWR < 0.8)")

    # Wellbeing trend component (0-0.2)
    if wellbeing_trend.avg_readiness_3d < 4:
        risk_score += 0.2
        risk_factors.append("Poor readiness (3-day avg < 4)")
    elif wellbeing_trend.avg_readiness_3d < 6:
        risk_score += 0.1
        risk_factors.append("Below-average readiness")

    # Sleep component (0-0.2)
    if wellbeing_trend.avg_sleep_quality_3d < 4:
        risk_score += 0.2
        risk_factors.append("Poor sleep quality")

    # Classify
    if risk_score >= 0.6:
        level = "high"
    elif risk_score >= 0.3:
        level = "moderate"
    else:
        level = "low"

    return {"score": min(risk_score, 1.0), "level": level, "factors": risk_factors}
```

## Weight Progression Logic

### Safe Weekly Progression Rules (Confidence: HIGH)

| Exercise Type | Weekly Increase | Max Increase | Method |
|--------------|----------------|-------------|--------|
| Squat variations | 2.5-5kg | 5kg | If all planned reps completed with good RPE (< 9) |
| Olympic lifts | 1-2.5kg | 2.5kg | If technique maintained (coach-confirmed) |
| Deadlift variations | 2.5-5kg | 5kg | If all planned reps completed |
| Upper body compound | 1-2.5kg | 2.5kg | If all planned reps completed |
| Accessory exercises | 0-2.5kg | 2.5kg | Only when reps consistently hit upper range |
| Sprint (no weight) | N/A | N/A | Volume/distance progression, not weight |

### Algorithm for Next Week's Weight

```python
def calculate_next_weight(exercise_name, athlete_id, current_plan_weight):
    """Determine weight for next week based on performance."""
    # 1. Get last 4 weeks of this exercise
    history = get_exercise_history(athlete_id, exercise_name, weeks=4)

    if not history:
        # No history -- use conservative estimate
        return current_plan_weight  # Don't increase unknown exercises

    last_session = history[-1]
    planned = last_session.planned_weight
    actual = last_session.actual_weight
    planned_reps = last_session.planned_reps
    actual_reps = last_session.actual_reps
    rpe = last_session.rpe

    # 2. Did athlete complete the prescribed work?
    if actual_reps >= planned_reps and rpe and rpe <= 8:
        # Completed with room to spare -- progress
        increment = get_exercise_increment(exercise_name)  # 2.5 or 5kg
        return round_to_plate(actual_weight + increment)
    elif actual_reps >= planned_reps and (not rpe or rpe > 8):
        # Completed but was very hard -- maintain
        return actual_weight
    else:
        # Did not complete -- reduce slightly
        return round_to_plate(actual_weight * 0.95)

def round_to_plate(weight_kg):
    """Round to nearest 2.5kg (standard plate increment)."""
    return round(weight_kg / 2.5) * 2.5
```

## Code Examples

### Plan Data Structure (JSONB stored in weekly_plans.plan_data)

```json
{
  "week_start": "2026-05-04",
  "week_end": "2026-05-10",
  "training_phase": "specific_preparation",
  "phase_week": 3,
  "loading_pattern": "heavy",
  "days": [
    {
      "day_number": 1,
      "day_name": "Monday",
      "date": "2026-05-04",
      "is_rest_day": false,
      "session_type": "speed",
      "title": "Acceleration Development",
      "estimated_duration_minutes": 75,
      "target_intensity": "high",
      "target_rpe": 8,
      "sections": [
        {
          "name": "warm_up",
          "exercises": [
            {
              "exercise_id": "uuid-here",
              "exercise_name": "Dynamic Mobility Routine",
              "sets": 1,
              "duration_minutes": 10,
              "notes": "Progressive warm-up"
            },
            {
              "exercise_id": "uuid-here",
              "exercise_name": "Sprint Drills",
              "sets": 2,
              "reps": 5,
              "rest_seconds": 30,
              "notes": "A-skips, B-skips, high knees"
            }
          ]
        },
        {
          "name": "main",
          "exercises": [
            {
              "exercise_id": "uuid-here",
              "exercise_name": "30m Sprint",
              "sets": 6,
              "rest_seconds": 120,
              "notes": "From standing start, 100% effort",
              "weight_source": "none",
              "measurement_type": "time"
            },
            {
              "exercise_id": "uuid-here",
              "exercise_name": "Block Starts",
              "sets": 8,
              "distance_meters": 15,
              "rest_seconds": 120,
              "notes": "Focus on first-step explosiveness"
            }
          ]
        },
        {
          "name": "accessory",
          "exercises": [
            {
              "exercise_id": "uuid-here",
              "exercise_name": "Broad Jump",
              "sets": 4,
              "reps": 3,
              "rest_seconds": 90,
              "notes": "Max effort each rep"
            }
          ]
        },
        {
          "name": "cool_down",
          "exercises": [
            {
              "exercise_id": "uuid-here",
              "exercise_name": "Static Stretching",
              "sets": 1,
              "duration_minutes": 10,
              "notes": "Focus on hip flexors and hamstrings"
            }
          ]
        }
      ]
    },
    {
      "day_number": 2,
      "day_name": "Tuesday",
      "date": "2026-05-05",
      "is_rest_day": false,
      "session_type": "strength",
      "title": "Max Strength - Lower Body",
      "estimated_duration_minutes": 90,
      "target_intensity": "high",
      "target_rpe": 8,
      "sections": [
        {
          "name": "warm_up",
          "exercises": [
            {
              "exercise_id": "uuid-here",
              "exercise_name": "General Mobility",
              "sets": 1,
              "duration_minutes": 10
            }
          ]
        },
        {
          "name": "main",
          "exercises": [
            {
              "exercise_id": "uuid-here",
              "exercise_name": "Back Squat",
              "sets": 5,
              "reps": 3,
              "planned_weight_kg": 180,
              "intensity_percent": 85,
              "rest_seconds": 240,
              "weight_source": "history",
              "last_performed_weight": 175,
              "notes": "Focus on depth and drive"
            },
            {
              "exercise_id": "uuid-here",
              "exercise_name": "Romanian Deadlift",
              "sets": 4,
              "reps": 6,
              "planned_weight_kg": 120,
              "intensity_percent": 70,
              "rest_seconds": 180,
              "weight_source": "history"
            }
          ]
        },
        {
          "name": "accessory",
          "exercises": [
            {
              "exercise_id": "uuid-here",
              "exercise_name": "Bulgarian Split Squat",
              "sets": 3,
              "reps": 8,
              "planned_weight_kg": 40,
              "rest_seconds": 120,
              "weight_source": "estimate",
              "notes": "Per leg, DBs"
            }
          ]
        },
        {
          "name": "cool_down",
          "exercises": [
            {
              "exercise_id": "uuid-here",
              "exercise_name": "Foam Rolling",
              "sets": 1,
              "duration_minutes": 10
            }
          ]
        }
      ]
    }
  ]
}
```

### Coach Approval API Pattern

```python
# Following existing codebase patterns: raw dicts from Supabase, no response_model
@router.post("/plans/{plan_id}/approve")
async def approve_plan(
    plan_id: str,
    current_user: dict = Depends(get_current_user),
):
    """Coach approves a pending plan."""
    role = _get_user_role(current_user)
    if role != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can approve plans")

    sb = get_supabase()

    # Verify plan exists and is pending
    result = sb.table("weekly_plans").select("*").eq("id", plan_id).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Plan not found")

    plan = result.data[0]
    if plan["status"] != "pending_review":
        raise HTTPException(status_code=400, detail=f"Plan is {plan['status']}, not pending_review")

    # Update plan status
    coach_id = current_user.get("coach_id") or current_user["id"]
    update_result = (
        sb.table("weekly_plans")
        .update({
            "status": "approved",
            "approved_at": datetime.utcnow().isoformat(),
            "approved_by": coach_id,
            "coach_id": coach_id,
        })
        .eq("id", plan_id)
        .execute()
    )

    return update_result.data[0] if update_result.data else {"message": "Plan approved"}


@router.post("/plans/{plan_id}/reject")
async def reject_plan(
    plan_id: str,
    rejection_notes: str = Body(..., embed=True),
    current_user: dict = Depends(get_current_user),
):
    """Coach rejects a plan with feedback notes."""
    role = _get_user_role(current_user)
    if role != "coach":
        raise HTTPException(status_code=403, detail="Only coaches can reject plans")

    sb = get_supabase()
    coach_id = current_user.get("coach_id") or current_user["id"]

    # Update plan status
    sb.table("weekly_plans").update({
        "status": "rejected",
        "rejected_at": datetime.utcnow().isoformat(),
        "rejected_by": coach_id,
        "rejection_notes": rejection_notes,
    }).eq("id", plan_id).execute()

    # Trigger regeneration with feedback incorporated
    # Use BackgroundTasks to avoid blocking the response
    # background_tasks.add_task(regenerate_plan, plan_id, rejection_notes)

    return {"message": "Plan rejected", "plan_id": plan_id}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Generic ACWR thresholds | Sport-specific ACWR ranges | 2024-2025 | Bobsleigh may need tighter ranges due to high-intensity nature |
| Static weekly templates | Adaptive templates with load modifiers | Ongoing | Templates + readiness multipliers is the current best practice for rule-based systems |
| Standalone ML injury model | Combined rule-based + ML ensemble | 2024 | ACWR debate means pure ML is not sufficient; combine with heuristics |
| Coach manual programming | AI-proposes, coach-disposes | 2024-2025 | The workflow pattern in CONTEXT.md reflects current industry direction |

**Deprecated/outdated:**
- The existing `ml/models/weekly_plan_generator.py` in the `ml/` module: Good reference code but should be rewritten as a backend service, not used directly. It has import dependencies on modules that do not exist (`exercise_library`, `training_templates`).
- The existing `generate_weekly_plan.py` API endpoint: References non-existent tables (`coach_athletes` with that schema, `competitions`, `workout_exercise_groups`, `workout_feedback`). Must be rewritten.
- `adaptive_training_extension.sql`: Over-engineered schema with tables that are not needed for v1 (`daily_feedback`, `exercise_feedback`, `dynamic_load_targets`, `adaptation_rules`, `exercise_substitutions`, `ml_prediction_features`). Cherry-pick the useful concepts but do not deploy this SQL as-is.

## Open Questions

1. **Competition calendar storage**
   - What we know: Periodization depends on competition dates. The athlete profile has `performance_targets` JSONB.
   - What's unclear: Is there a dedicated competitions table? (The existing `generate_weekly_plan.py` references one but it does not exist in the schema.)
   - Recommendation: Add a simple `competitions` table or store dates in athlete `performance_targets` JSONB for v1.

2. **Exercise selection depth**
   - What we know: The exercises table has ~10 seed exercises. The `refined_exercises_library.json` has a richer set with categories, muscle groups, and parameters.
   - What's unclear: How many exercises are actually in the database vs. JSON files? Is the exercises table populated from the library?
   - Recommendation: Ensure exercises table is populated. Plan generation should query the exercises table, not JSON files.

3. **Multi-athlete batch generation performance**
   - What we know: Each plan requires 4-6 DB queries per athlete (profile, PMC, workouts, wellbeing, feedback, exercises).
   - What's unclear: How many athletes will a coach have? 5? 50?
   - Recommendation: Design for 20 athletes. Batch-fetch athlete data where possible. Use BackgroundTasks for "Generate All" to avoid HTTP timeout.

4. **Notification for unsigned plans on Monday**
   - What we know: CONTEXT.md says "system sends urgent notifications (push/email)" if coach hasn't reviewed by Monday morning.
   - What's unclear: What notification infrastructure exists? Is push/email set up?
   - Recommendation: For v1, use in-app alert (add to coach alerts computed on read). Defer push/email to a later phase or polish phase.

## Sources

### Primary (HIGH confidence)
- Codebase analysis: `backend/app/services/pmc_service.py`, `backend/app/services/coach_service.py`, `backend/app/services/training_service.py` -- existing service patterns
- Codebase analysis: `ml/models/weekly_plan_generator.py` -- existing plan generation logic (~1000 lines)
- Codebase analysis: `ml/models/injury_risk_model.py` -- existing injury risk model
- Codebase analysis: `backend/sql/fresh_clean_schema.sql` -- database schema
- Codebase analysis: `backend/training_templates.json`, `backend/training_protocols.json` -- existing templates
- [Science for Sport - ACWR](https://www.scienceforsport.com/acutechronic-workload-ratio/) -- ACWR thresholds: sweet spot 0.80-1.30, danger zone > 1.50

### Secondary (MEDIUM confidence)
- [PMC ACWR Systematic Review 2025](https://pmc.ncbi.nlm.nih.gov/articles/PMC12487117/) -- 22 studies, ACWR > 1.5 increases risk 2-4x
- [Bobsleigh UK Training](https://bobsleigh.uk/athletes/bobsleigh-athlete-training/) -- 200kg squat benchmark, <11s 100m, sprint emphasis
- [NSCA Periodization](https://www.nsca.com/education/articles/kinetic-select/preparatory-period/) -- preparatory period structure
- [Wheeler Sports Tech - Periodization](https://www.wheelersportstech.com/2025/12/31/periodization-of-strength-training-theory-application-and-practice/) -- SPP model: hypertrophy -> strength -> power -> peak
- [SimpliFaster - Block Periodization](https://simplifaster.com/articles/evolving-block-periodization-models/) -- block periodization for power sports
- [Livity - Readiness Score](https://livity-app.com/en/blog/readiness-score-explained) -- readiness thresholds: >73 ready, <34 rest

### Tertiary (LOW confidence)
- [ELITETRACK Forum](https://www.elitetrack.com/forums/topic/training-ideas-for-the-bobsled-and-skeleton/) -- community discussion on bobsled training
- [Medium - FastAPI APScheduler](https://medium.com/@rasifrazak123/fastapi-scheduling-background-tasks-backgroundtasks-vs-apscheduler-vs-celery-complete-guide-ff90d6be524b) -- APScheduler vs Celery comparison
- [GymAware - Progressive Overload](https://gymaware.com/progressive-overload-the-ultimate-guide/) -- 2-5% weekly increase guideline

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- using existing project libraries plus one lightweight addition (APScheduler)
- Architecture: HIGH -- patterns follow established codebase conventions (services, Supabase queries, React Query hooks)
- Bobsleigh periodization: MEDIUM -- synthesized from multiple sources; no single authoritative bobsleigh-specific periodization paper found
- Injury risk thresholds: HIGH -- ACWR and TSB thresholds are well-established in literature and already partially implemented
- Morning adaptation: MEDIUM -- thresholds are reasonable but not validated against bobsleigh-specific data
- Weight progression: HIGH -- standard strength training principles, well-documented
- Coach feedback learning: MEDIUM -- simple keyword matching approach is pragmatic but not proven at scale

**Research date:** 2026-05-04
**Valid until:** 2026-06-04 (30 days -- stable domain, no fast-moving dependencies)
