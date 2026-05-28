-- ============================================================================
-- BOBSLEIGH COACH AI — CONSOLIDATED LOCAL SCHEMA
-- ============================================================================
-- This is the SINGLE source of truth for the local Docker Postgres schema.
-- It consolidates fresh_clean_schema.sql + coaches/coach_athletes
-- (production_schema.sql) + weekly_plans_migration.sql.
--
-- Differences vs production:
--   * No references to a Supabase-only auth schema (local Postgres
--     has none). All user references go through public.users.
--   * No RLS policies / ALTER TABLE ... ENABLE ROW LEVEL SECURITY
--     (backend uses a direct service connection)
--   * public.users table replaces Supabase auth for local dev
--   * All tables use CREATE TABLE IF NOT EXISTS (idempotent re-run safe)
--   * All seed inserts are wrapped with ON CONFLICT DO NOTHING
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- UPDATED_AT TRIGGER FUNCTION (shared by multiple tables)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- USERS (replaces Supabase auth for local dev)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    email text NOT NULL UNIQUE,
    role text NOT NULL DEFAULT 'athlete',  -- 'athlete' | 'coach' | 'admin'
    app_metadata jsonb DEFAULT '{}'::jsonb,
    user_metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- CORE REFERENCE DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    category text NOT NULL,
    description text,
    training_focus text[],
    has_ice_training boolean DEFAULT false,
    has_off_ice_training boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.exercises (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    description text,
    category text NOT NULL,
    sport_id uuid REFERENCES public.sports(id),
    measurement_type text NOT NULL,
    equipment_needed text[],
    muscle_groups text[],
    difficulty_level integer CHECK (difficulty_level BETWEEN 1 AND 5),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- USERS: ATHLETES & COACHES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.athletes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid,  -- no FK to Supabase auth in local dev
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text UNIQUE NOT NULL,
    sport_id uuid REFERENCES public.sports(id),

    -- Physical characteristics
    height_cm integer,
    weight_kg numeric(5,2),
    birth_date date,

    -- Training profile
    training_level text DEFAULT 'intermediate',
    training_frequency integer DEFAULT 4,

    -- JSON fields for flexibility
    physical_profile jsonb,
    training_preferences jsonb,
    performance_targets jsonb,

    -- Status
    onboarding_completed boolean DEFAULT false,
    is_active boolean DEFAULT true,

    -- Timestamps
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coaches (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL,  -- no FK to Supabase auth
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL UNIQUE,
    phone_number text,
    specialization text[],
    bio text,
    certification text[],
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.coach_athletes (
    coach_id uuid NOT NULL REFERENCES public.coaches(id),
    athlete_id uuid NOT NULL REFERENCES public.athletes(id),
    relationship_type text,
    access_level text,
    started_at date NOT NULL DEFAULT CURRENT_DATE,
    ended_at date,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (coach_id, athlete_id)
);

-- ============================================================================
-- TRAINING DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.workouts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id uuid NOT NULL REFERENCES public.athletes(id),

    -- Basic info
    name text NOT NULL,
    date date NOT NULL,
    duration_minutes integer,

    -- Classification
    workout_type text NOT NULL,
    training_phase text,
    intensity_level integer CHECK (intensity_level BETWEEN 1 AND 10),

    -- Load and feedback
    planned_load numeric(5,2),
    actual_load numeric(5,2),
    rpe integer CHECK (rpe BETWEEN 1 AND 10),
    effectiveness_score numeric(3,2),

    -- Notes and metrics
    notes text,
    environmental_conditions jsonb,

    -- Status
    is_completed boolean DEFAULT false,

    -- Timestamps
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workout_exercises (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id uuid NOT NULL REFERENCES public.workouts(id) ON DELETE CASCADE,
    exercise_id uuid NOT NULL REFERENCES public.exercises(id),

    -- Order within workout
    exercise_order integer NOT NULL,

    -- Planned vs actual performance
    planned_sets integer,
    actual_sets integer,
    planned_reps integer,
    actual_reps integer,
    planned_weight numeric(6,2),
    actual_weight numeric(6,2),
    planned_distance numeric(8,2),
    actual_distance numeric(8,2),
    planned_time_seconds numeric(8,2),
    actual_time_seconds numeric(8,2),

    -- Rest and intensity
    rest_seconds integer,
    intensity_percent numeric(5,2),

    -- Performance data (flexible for different exercise types)
    performance_data jsonb,

    -- Notes
    notes text,

    -- Timestamps
    created_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- PERFORMANCE METRICS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id uuid NOT NULL REFERENCES public.athletes(id),

    test_date date NOT NULL,
    metric_type text NOT NULL,
    metric_name text NOT NULL,
    exercise_id uuid REFERENCES public.exercises(id),

    value numeric(10,4) NOT NULL,
    unit text NOT NULL,

    test_conditions jsonb,
    previous_best numeric(10,4),
    improvement_percent numeric(5,2),
    is_personal_best boolean DEFAULT false,

    training_phase text,
    confidence_level text DEFAULT 'high',

    notes text,
    created_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- TRAINING LOAD & PMC MODEL DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_loads (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id uuid NOT NULL REFERENCES public.athletes(id),
    date date NOT NULL,

    -- Core PMC metrics
    training_load numeric(6,2) NOT NULL,
    ctl numeric(6,2),
    atl numeric(6,2),
    tsb numeric(6,2),

    -- Subjective metrics
    rpe numeric(3,1) CHECK (rpe BETWEEN 1 AND 10),
    fatigue_level numeric(3,1) CHECK (fatigue_level BETWEEN 1 AND 10),
    soreness_level numeric(3,1) CHECK (soreness_level BETWEEN 1 AND 10),
    motivation_level numeric(3,1) CHECK (motivation_level BETWEEN 1 AND 10),

    -- Recovery metrics
    sleep_hours numeric(4,2),
    sleep_quality numeric(3,1) CHECK (sleep_quality BETWEEN 1 AND 10),
    stress_level numeric(3,1) CHECK (stress_level BETWEEN 1 AND 10),

    -- Calculated readiness
    readiness_score numeric(5,2),

    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),

    UNIQUE(athlete_id, date)
);

-- ============================================================================
-- WELLBEING & RECOVERY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.wellbeing_assessments (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id uuid NOT NULL REFERENCES public.athletes(id),
    assessment_date date NOT NULL,

    -- Sleep metrics
    sleep_hours numeric(4,2),
    sleep_quality integer CHECK (sleep_quality BETWEEN 1 AND 10),
    sleep_disruptions integer DEFAULT 0,

    -- Stress and mood
    stress_level integer CHECK (stress_level BETWEEN 1 AND 10),
    mood_rating integer CHECK (mood_rating BETWEEN 1 AND 10),
    motivation_level integer CHECK (motivation_level BETWEEN 1 AND 10),

    -- Physical state
    energy_level integer CHECK (energy_level BETWEEN 1 AND 10),
    muscle_soreness integer CHECK (muscle_soreness BETWEEN 1 AND 10),
    joint_stiffness integer CHECK (joint_stiffness BETWEEN 1 AND 10),
    overall_health integer CHECK (overall_health BETWEEN 1 AND 10),

    -- Lifestyle factors
    nutrition_quality integer CHECK (nutrition_quality BETWEEN 1 AND 10),
    hydration_level integer CHECK (hydration_level BETWEEN 1 AND 10),

    -- Calculated metrics
    readiness_score numeric(5,2),
    recovery_status text,

    -- Additional data
    notes text,
    symptoms text[],

    created_at timestamp with time zone DEFAULT now(),

    UNIQUE(athlete_id, assessment_date)
);

-- ============================================================================
-- AI/ML TRAINING DATA
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.training_recommendations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id uuid NOT NULL REFERENCES public.athletes(id),

    recommendation_date date NOT NULL,
    target_date date NOT NULL,

    workout_type text NOT NULL,
    focus_area text NOT NULL,
    intensity_level integer CHECK (intensity_level BETWEEN 1 AND 10),
    duration_minutes integer,

    model_version text,
    confidence_score numeric(4,3) CHECK (confidence_score BETWEEN 0 AND 1),
    basis_factors text[],

    exercises_recommended jsonb,
    coaching_notes text,
    expected_outcomes text[],

    is_completed boolean DEFAULT false,
    athlete_feedback jsonb,
    actual_outcome jsonb,
    effectiveness_rating integer CHECK (effectiveness_rating BETWEEN 1 AND 10),

    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ============================================================================
-- WEEKLY PLANS (AI-generated, coach-approved)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.weekly_plans (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id uuid NOT NULL REFERENCES public.athletes(id),
    coach_id uuid REFERENCES public.coaches(id),
    week_start date NOT NULL,
    week_end date NOT NULL,

    -- Plan content
    plan_data jsonb NOT NULL,
    training_phase text NOT NULL,

    -- State machine: pending_review -> approved | rejected
    status text NOT NULL DEFAULT 'pending_review',
    approved_at timestamptz,
    approved_by uuid,
    rejected_at timestamptz,
    rejected_by uuid,
    rejection_notes text,

    -- Versioning
    version integer NOT NULL DEFAULT 1,
    parent_plan_id uuid REFERENCES public.weekly_plans(id),

    -- Generation metadata
    generation_metadata jsonb,
    injury_risk_score numeric(4,3),
    injury_risk_factors jsonb,

    created_at timestamptz DEFAULT NOW(),
    updated_at timestamptz DEFAULT NOW(),

    UNIQUE(athlete_id, week_start, version),

    CONSTRAINT chk_weekly_plans_status
        CHECK (status IN ('pending_review', 'approved', 'rejected')),

    CONSTRAINT chk_weekly_plans_week_start_monday
        CHECK (EXTRACT(DOW FROM week_start) = 1)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Athletes
CREATE INDEX IF NOT EXISTS idx_athletes_email ON public.athletes(email);
CREATE INDEX IF NOT EXISTS idx_athletes_sport ON public.athletes(sport_id);
CREATE INDEX IF NOT EXISTS idx_athletes_active ON public.athletes(is_active);
CREATE INDEX IF NOT EXISTS idx_athletes_user ON public.athletes(user_id);

-- Coaches
CREATE INDEX IF NOT EXISTS idx_coaches_user ON public.coaches(user_id);
CREATE INDEX IF NOT EXISTS idx_coaches_email ON public.coaches(email);

-- Coach-athlete relationships
CREATE INDEX IF NOT EXISTS idx_coach_athletes_coach ON public.coach_athletes(coach_id);
CREATE INDEX IF NOT EXISTS idx_coach_athletes_athlete ON public.coach_athletes(athlete_id);

-- Workouts
CREATE INDEX IF NOT EXISTS idx_workouts_athlete_date ON public.workouts(athlete_id, date);
CREATE INDEX IF NOT EXISTS idx_workouts_type ON public.workouts(workout_type);
CREATE INDEX IF NOT EXISTS idx_workouts_phase ON public.workouts(training_phase);

-- Workout exercises
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON public.workout_exercises(workout_id);

-- Performance metrics
CREATE INDEX IF NOT EXISTS idx_performance_athlete_date ON public.performance_metrics(athlete_id, test_date);
CREATE INDEX IF NOT EXISTS idx_performance_metric_type ON public.performance_metrics(metric_type, metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_exercise ON public.performance_metrics(exercise_id);

-- Training loads
CREATE INDEX IF NOT EXISTS idx_training_loads_athlete_date ON public.training_loads(athlete_id, date);

-- Wellbeing
CREATE INDEX IF NOT EXISTS idx_wellbeing_athlete_date ON public.wellbeing_assessments(athlete_id, assessment_date);

-- Training recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_athlete_target ON public.training_recommendations(athlete_id, target_date);
CREATE INDEX IF NOT EXISTS idx_recommendations_completed ON public.training_recommendations(is_completed);

-- Weekly plans
CREATE INDEX IF NOT EXISTS idx_plans_status ON public.weekly_plans(status, week_start);
CREATE INDEX IF NOT EXISTS idx_plans_athlete_week ON public.weekly_plans(athlete_id, week_start);

-- ============================================================================
-- UPDATED_AT TRIGGERS
-- ============================================================================

DO $$
BEGIN
    -- athletes
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'athletes_updated_at') THEN
        CREATE TRIGGER athletes_updated_at
            BEFORE UPDATE ON public.athletes
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    -- coaches
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'coaches_updated_at') THEN
        CREATE TRIGGER coaches_updated_at
            BEFORE UPDATE ON public.coaches
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    -- coach_athletes
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'coach_athletes_updated_at') THEN
        CREATE TRIGGER coach_athletes_updated_at
            BEFORE UPDATE ON public.coach_athletes
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    -- workouts
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'workouts_updated_at') THEN
        CREATE TRIGGER workouts_updated_at
            BEFORE UPDATE ON public.workouts
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    -- training_loads
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'training_loads_updated_at') THEN
        CREATE TRIGGER training_loads_updated_at
            BEFORE UPDATE ON public.training_loads
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    -- training_recommendations
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'training_recommendations_updated_at') THEN
        CREATE TRIGGER training_recommendations_updated_at
            BEFORE UPDATE ON public.training_recommendations
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    -- weekly_plans
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'weekly_plans_updated_at') THEN
        CREATE TRIGGER weekly_plans_updated_at
            BEFORE UPDATE ON public.weekly_plans
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;

    -- users
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'users_updated_at') THEN
        CREATE TRIGGER users_updated_at
            BEFORE UPDATE ON public.users
            FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
    END IF;
END$$;

-- ============================================================================
-- SEED: SPORTS (must run before exercises and athletes that reference sport_id)
-- ============================================================================

INSERT INTO public.sports (id, name, category, description, training_focus, has_ice_training, has_off_ice_training)
VALUES
    ('00000000-0000-0000-0000-0000000000a1', 'Bobsleigh', 'winter',
     'Team sliding sport requiring explosive power and technical precision',
     ARRAY['power', 'speed', 'strength'], true, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- DONE
-- ============================================================================

SELECT 'Schema initialized successfully' as status;
