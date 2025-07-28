-- FRESH CLEAN BOBSLEIGH COACH AI SCHEMA
-- Run this in a NEW Supabase project or after resetting the database
-- Optimized for Joshua Hudson ML training but multi-sport capable

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- CORE REFERENCE DATA
-- ========================================

-- Sports table - support multiple sports
CREATE TABLE public.sports (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    category text NOT NULL, -- 'winter', 'summer', 'indoor', etc.
    description text,
    training_focus text[], -- ['power', 'speed', 'strength', 'endurance']
    has_ice_training boolean DEFAULT false,
    has_off_ice_training boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- Exercise library - generic across sports
CREATE TABLE public.exercises (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    name text NOT NULL UNIQUE,
    description text,
    category text NOT NULL, -- 'olympic_lifts', 'squats', 'sprints', etc.
    sport_id uuid REFERENCES public.sports(id),
    measurement_type text NOT NULL, -- 'weight', 'time', 'distance', 'reps'
    equipment_needed text[],
    muscle_groups text[],
    difficulty_level integer CHECK (difficulty_level BETWEEN 1 AND 5),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- USER MANAGEMENT (SIMPLIFIED)
-- ========================================

-- Athletes table - links to auth.users but handles missing users gracefully
CREATE TABLE public.athletes (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid, -- nullable to avoid auth constraints initially
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text UNIQUE NOT NULL,
    sport_id uuid REFERENCES public.sports(id),
    
    -- Physical characteristics
    height_cm integer,
    weight_kg numeric(5,2),
    birth_date date,
    
    -- Training profile
    training_level text DEFAULT 'intermediate', -- 'beginner', 'intermediate', 'advanced', 'elite'
    training_frequency integer DEFAULT 4, -- sessions per week
    
    -- JSON fields for flexibility
    physical_profile jsonb, -- detailed body composition, injury history, etc.
    training_preferences jsonb, -- preferred times, focus areas, etc.
    performance_targets jsonb, -- goals and benchmarks
    
    -- Status
    onboarding_completed boolean DEFAULT false,
    is_active boolean DEFAULT true,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- TRAINING DATA
-- ========================================

-- Workouts - training sessions
CREATE TABLE public.workouts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id uuid NOT NULL REFERENCES public.athletes(id),
    
    -- Basic info
    name text NOT NULL,
    date date NOT NULL,
    duration_minutes integer,
    
    -- Classification
    workout_type text NOT NULL, -- 'strength', 'power', 'speed', 'endurance', 'recovery'
    training_phase text, -- 'prep', 'build', 'peak', 'recovery', 'off_season'
    intensity_level integer CHECK (intensity_level BETWEEN 1 AND 10),
    
    -- Load and feedback
    planned_load numeric(5,2),
    actual_load numeric(5,2),
    rpe integer CHECK (rpe BETWEEN 1 AND 10), -- Rate of Perceived Exertion
    effectiveness_score numeric(3,2), -- 0.0 to 10.0
    
    -- Notes and metrics
    notes text,
    environmental_conditions jsonb, -- weather, altitude, etc.
    
    -- Status
    is_completed boolean DEFAULT false,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Workout exercises - what was done in each workout
CREATE TABLE public.workout_exercises (
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
    intensity_percent numeric(5,2), -- % of 1RM or max effort
    
    -- Performance data (flexible for different exercise types)
    performance_data jsonb, -- sets: [{reps: 5, weight: 100, rest: 120}]
    
    -- Notes
    notes text,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- PERFORMANCE TRACKING
-- ========================================

-- Performance metrics - test results and PRs
CREATE TABLE public.performance_metrics (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id uuid NOT NULL REFERENCES public.athletes(id),
    
    -- What was tested
    test_date date NOT NULL,
    metric_type text NOT NULL, -- 'max_strength', 'power', 'speed', 'endurance'
    metric_name text NOT NULL, -- '1rm_squat', '30m_sprint', 'broad_jump'
    exercise_id uuid REFERENCES public.exercises(id), -- link to exercise if applicable
    
    -- Results
    value numeric(10,4) NOT NULL,
    unit text NOT NULL, -- 'kg', 'seconds', 'meters', 'watts'
    
    -- Context
    test_conditions jsonb, -- environment, equipment, protocol
    previous_best numeric(10,4), -- for calculating improvements
    improvement_percent numeric(5,2),
    is_personal_best boolean DEFAULT false,
    
    -- Classification
    training_phase text,
    confidence_level text DEFAULT 'high', -- 'low', 'medium', 'high'
    
    -- Notes
    notes text,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- TRAINING LOAD & PMC MODEL DATA
-- ========================================

-- Training loads - daily training stress for PMC model
CREATE TABLE public.training_loads (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id uuid NOT NULL REFERENCES public.athletes(id),
    date date NOT NULL,
    
    -- Core PMC metrics
    training_load numeric(6,2) NOT NULL, -- Training Stress Score (TSS)
    ctl numeric(6,2), -- Chronic Training Load (fitness)
    atl numeric(6,2), -- Acute Training Load (fatigue)
    tsb numeric(6,2), -- Training Stress Balance (form)
    
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
    readiness_score numeric(5,2), -- composite score 0-100
    
    -- Notes
    notes text,
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    UNIQUE(athlete_id, date)
);

-- ========================================
-- WELLBEING & RECOVERY
-- ========================================

-- Daily wellbeing assessments
CREATE TABLE public.wellbeing_assessments (
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
    readiness_score numeric(5,2), -- 0-100 composite score
    recovery_status text, -- 'poor', 'fair', 'good', 'excellent'
    
    -- Additional data
    notes text,
    symptoms text[], -- ['headache', 'nausea', 'dizziness']
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now(),
    
    -- Constraints
    UNIQUE(athlete_id, assessment_date)
);

-- ========================================
-- AI/ML TRAINING DATA
-- ========================================

-- Training recommendations generated by AI
CREATE TABLE public.training_recommendations (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id uuid NOT NULL REFERENCES public.athletes(id),
    
    -- Recommendation details
    recommendation_date date NOT NULL,
    target_date date NOT NULL, -- when to do the recommended workout
    
    -- Workout specification
    workout_type text NOT NULL,
    focus_area text NOT NULL, -- 'power', 'strength', 'speed', 'recovery'
    intensity_level integer CHECK (intensity_level BETWEEN 1 AND 10),
    duration_minutes integer,
    
    -- AI model info
    model_version text,
    confidence_score numeric(4,3) CHECK (confidence_score BETWEEN 0 AND 1),
    basis_factors text[], -- ['recent_performance', 'fatigue_level', 'training_phase']
    
    -- Recommendation content
    exercises_recommended jsonb, -- detailed workout structure
    coaching_notes text,
    expected_outcomes text[],
    
    -- Status and feedback
    is_completed boolean DEFAULT false,
    athlete_feedback jsonb, -- how the athlete felt about the recommendation
    actual_outcome jsonb, -- what actually happened
    effectiveness_rating integer CHECK (effectiveness_rating BETWEEN 1 AND 10),
    
    -- Timestamps
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ========================================
-- INDEXES FOR PERFORMANCE
-- ========================================

-- Athletes
CREATE INDEX idx_athletes_email ON public.athletes(email);
CREATE INDEX idx_athletes_sport ON public.athletes(sport_id);
CREATE INDEX idx_athletes_active ON public.athletes(is_active);

-- Workouts
CREATE INDEX idx_workouts_athlete_date ON public.workouts(athlete_id, date);
CREATE INDEX idx_workouts_type ON public.workouts(workout_type);
CREATE INDEX idx_workouts_phase ON public.workouts(training_phase);

-- Performance metrics
CREATE INDEX idx_performance_athlete_date ON public.performance_metrics(athlete_id, test_date);
CREATE INDEX idx_performance_metric_type ON public.performance_metrics(metric_type, metric_name);
CREATE INDEX idx_performance_exercise ON public.performance_metrics(exercise_id);

-- Training loads
CREATE INDEX idx_training_loads_athlete_date ON public.training_loads(athlete_id, date);

-- Wellbeing
CREATE INDEX idx_wellbeing_athlete_date ON public.wellbeing_assessments(athlete_id, assessment_date);

-- Training recommendations
CREATE INDEX idx_recommendations_athlete_target ON public.training_recommendations(athlete_id, target_date);
CREATE INDEX idx_recommendations_completed ON public.training_recommendations(is_completed);

-- ========================================
-- ROW LEVEL SECURITY (BASIC)
-- ========================================

-- Enable RLS on all tables
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athletes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workout_exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wellbeing_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_recommendations ENABLE ROW LEVEL SECURITY;

-- Basic policies - public read for reference data, athlete owns their data
CREATE POLICY "Public read sports" ON public.sports FOR SELECT USING (true);
CREATE POLICY "Public read exercises" ON public.exercises FOR SELECT USING (is_active = true);

-- Athletes can manage their own data (simplified - no auth.uid() dependency)
CREATE POLICY "Athletes manage own data" ON public.athletes FOR ALL USING (true); -- Simplified for now
CREATE POLICY "Athletes manage workouts" ON public.workouts FOR ALL USING (true);
CREATE POLICY "Athletes manage workout_exercises" ON public.workout_exercises FOR ALL USING (true);
CREATE POLICY "Athletes manage performance" ON public.performance_metrics FOR ALL USING (true);
CREATE POLICY "Athletes manage loads" ON public.training_loads FOR ALL USING (true);
CREATE POLICY "Athletes manage wellbeing" ON public.wellbeing_assessments FOR ALL USING (true);
CREATE POLICY "Athletes manage recommendations" ON public.training_recommendations FOR ALL USING (true);

-- ========================================
-- SEED DATA
-- ========================================

-- Insert Bobsleigh sport
INSERT INTO public.sports (name, category, description, training_focus, has_ice_training, has_off_ice_training) VALUES
('Bobsleigh', 'winter', 'Team sliding sport requiring explosive power and technical precision', 
 ARRAY['power', 'speed', 'strength'], true, true);

-- Insert core bobsleigh exercises
INSERT INTO public.exercises (name, description, category, sport_id, measurement_type, equipment_needed, muscle_groups, difficulty_level) VALUES
('Power Clean', 'Explosive lift from floor to rack position - primary power developer', 'olympic_lifts', 
 (SELECT id FROM sports WHERE name = 'Bobsleigh'), 'weight', 
 ARRAY['barbell', 'plates'], ARRAY['legs', 'back', 'shoulders'], 4),

('Power Snatch', 'Explosive overhead lift - rate of force development', 'olympic_lifts',
 (SELECT id FROM sports WHERE name = 'Bobsleigh'), 'weight',
 ARRAY['barbell', 'plates'], ARRAY['legs', 'back', 'shoulders'], 5),

('Front Squat', 'Front-loaded squat - quad strength foundation', 'squats',
 (SELECT id FROM sports WHERE name = 'Bobsleigh'), 'weight',
 ARRAY['barbell', 'plates'], ARRAY['legs', 'core'], 3),

('Back Squat', 'Maximum strength foundation for all power movements', 'squats',
 (SELECT id FROM sports WHERE name = 'Bobsleigh'), 'weight',
 ARRAY['barbell', 'plates'], ARRAY['legs', 'core'], 3),

('30m Sprint', 'Primary bobsleigh distance - acceleration benchmark', 'sprints',
 (SELECT id FROM sports WHERE name = 'Bobsleigh'), 'time',
 ARRAY['track'], ARRAY['legs'], 2),

('100m Sprint', 'Speed endurance for bobsleigh track length', 'sprints',
 (SELECT id FROM sports WHERE name = 'Bobsleigh'), 'time',
 ARRAY['track'], ARRAY['legs'], 3),

('Broad Jump', 'Horizontal power test - correlates to push performance', 'jumps',
 (SELECT id FROM sports WHERE name = 'Bobsleigh'), 'distance',
 ARRAY['field'], ARRAY['legs'], 2),

('Triple Broad Jump', 'Repeated horizontal power - mimics push steps', 'jumps',
 (SELECT id FROM sports WHERE name = 'Bobsleigh'), 'distance',
 ARRAY['field'], ARRAY['legs'], 3),

('Sled Push', 'Sport-specific pushing power development', 'sport_specific',
 (SELECT id FROM sports WHERE name = 'Bobsleigh'), 'weight',
 ARRAY['sled', 'plates'], ARRAY['legs', 'core'], 3),

('Romanian Deadlift', 'Posterior chain strength for sled pushing', 'strength',
 (SELECT id FROM sports WHERE name = 'Bobsleigh'), 'weight',
 ARRAY['barbell', 'plates'], ARRAY['hamstrings', 'glutes'], 3);

-- Success message
SELECT 'Fresh clean schema created successfully! Ready for Joshua Hudson data insertion.' as status;