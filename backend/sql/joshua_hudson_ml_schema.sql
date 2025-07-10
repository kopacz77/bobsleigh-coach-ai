-- =====================================================
-- Joshua Hudson Training Template - ML-Optimized Schema
-- =====================================================
-- This schema is designed to normalize the complex Excel structure
-- into a relational database optimized for machine learning analysis

-- Enable UUID extension for better ID management
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CORE ENTITIES
-- =====================================================

-- Athletes table (extensible for multiple athletes)
CREATE TABLE athletes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE,
    date_of_birth DATE,
    body_weight_start DECIMAL(5,2), -- Starting body weight in kg
    height_cm INTEGER,
    discipline VARCHAR(100) DEFAULT 'bobsleigh',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training seasons/cycles
CREATE TABLE training_seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    season_name VARCHAR(255) NOT NULL, -- e.g., "Road to Italy 2023"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    target_competition VARCHAR(255), -- e.g., "Italy 2023"
    season_type VARCHAR(50) DEFAULT 'preparation', -- preparation, competition, recovery
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training phases within seasons (macrocycles)
CREATE TABLE training_phases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    season_id UUID NOT NULL REFERENCES training_seasons(id) ON DELETE CASCADE,
    phase_name VARCHAR(255) NOT NULL, -- e.g., "Base Phase", "Power Phase"
    phase_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    primary_focus VARCHAR(255), -- e.g., "Strength Building", "Power Development"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training weeks (mesocycles)
CREATE TABLE training_weeks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    phase_id UUID NOT NULL REFERENCES training_phases(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    weekly_theme VARCHAR(255), -- Optional theme for the week
    notes TEXT, -- Weekly notes or observations
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- EXERCISE MANAGEMENT
-- =====================================================

-- Exercise categories for ML feature engineering
CREATE TABLE exercise_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE, -- e.g., "Olympic Lifts", "Squats", "Sprints"
    description TEXT,
    movement_pattern VARCHAR(100), -- e.g., "Hip Hinge", "Knee Dominant", "Push"
    energy_system VARCHAR(50), -- e.g., "Power", "Strength", "Endurance"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Master exercise database
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category_id UUID NOT NULL REFERENCES exercise_categories(id),
    description TEXT,
    technique_cues TEXT[], -- Array of technique cues
    equipment_required VARCHAR(255), -- e.g., "Barbell", "Running Shoes"
    difficulty_level INTEGER CHECK (difficulty_level >= 1 AND difficulty_level <= 5),
    biomechanical_focus VARCHAR(255), -- e.g., "Triple Extension", "Deceleration"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise variations (e.g., "Cleans from block" vs "Cleans from floor")
CREATE TABLE exercise_variations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
    variation_name VARCHAR(255) NOT NULL, -- e.g., "from block", "with chains"
    modifier_type VARCHAR(100), -- e.g., "starting_position", "equipment", "tempo"
    difficulty_modifier INTEGER DEFAULT 0, -- -2 to +2 scale
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRAINING SESSIONS
-- =====================================================

-- Daily training sessions
CREATE TABLE training_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    week_id UUID NOT NULL REFERENCES training_weeks(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 1 AND day_of_week <= 7),
    session_type VARCHAR(100), -- e.g., "Strength", "Power", "Speed", "Recovery"
    session_focus VARCHAR(255), -- Primary focus of the session
    planned_duration_minutes INTEGER,
    actual_duration_minutes INTEGER,
    session_rpe INTEGER CHECK (session_rpe >= 1 AND session_rpe <= 10), -- Rate of Perceived Exertion
    session_notes TEXT,
    weather_conditions VARCHAR(100), -- For outdoor sessions
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual exercises within sessions
CREATE TABLE session_exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    variation_id UUID REFERENCES exercise_variations(id),
    exercise_order INTEGER NOT NULL, -- Order within the session
    is_main_exercise BOOLEAN DEFAULT FALSE, -- Primary exercise vs accessory
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- TRAINING LOAD DATA (ML-OPTIMIZED)
-- =====================================================

-- Sets and reps data (normalized for ML analysis)
CREATE TABLE exercise_sets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_exercise_id UUID NOT NULL REFERENCES session_exercises(id) ON DELETE CASCADE,
    set_number INTEGER NOT NULL,
    reps_planned INTEGER,
    reps_actual INTEGER,
    weight_kg DECIMAL(6,2), -- Weight in kilograms
    load_percentage DECIMAL(5,2), -- Percentage of 1RM if known
    rest_seconds INTEGER, -- Rest between sets
    set_rpe INTEGER CHECK (set_rpe >= 1 AND set_rpe <= 10), -- RPE per set
    tempo VARCHAR(20), -- e.g., "3-1-1-1" (eccentric-pause-concentric-pause)
    is_failure BOOLEAN DEFAULT FALSE, -- Set taken to failure
    set_notes TEXT, -- Additional notes for the set
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Training load calculations for ML (computed fields)
CREATE TABLE training_load_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    
    -- Volume metrics
    total_volume_kg DECIMAL(10,2), -- Total volume (sets × reps × weight)
    total_reps INTEGER, -- Total repetitions
    total_sets INTEGER, -- Total sets
    average_intensity DECIMAL(5,2), -- Average weight as % of max
    
    -- Training stress calculations
    training_stress_score DECIMAL(8,2), -- TSS calculation
    monotony_score DECIMAL(6,2), -- Training monotony
    strain_index DECIMAL(8,2), -- Training strain
    
    -- Power/velocity metrics (if available)
    average_power_watts DECIMAL(8,2),
    peak_power_watts DECIMAL(8,2),
    average_velocity_ms DECIMAL(6,3),
    
    -- Calculated at session level
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE TESTING
-- =====================================================

-- Performance test types
CREATE TABLE performance_tests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    test_name VARCHAR(255) NOT NULL, -- e.g., "30m Sprint", "Triple Broad Jump"
    test_category VARCHAR(100), -- e.g., "Speed", "Power", "Strength"
    unit_of_measurement VARCHAR(50), -- e.g., "seconds", "meters", "kg"
    test_protocol TEXT, -- Detailed testing protocol
    normative_data JSONB, -- Normative values for comparison
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance test results
CREATE TABLE performance_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    test_id UUID NOT NULL REFERENCES performance_tests(id),
    test_date DATE NOT NULL,
    result_value DECIMAL(10,4) NOT NULL, -- The measured result
    percentile_rank DECIMAL(5,2), -- Percentile compared to normative data
    personal_best BOOLEAN DEFAULT FALSE, -- Is this a PB?
    testing_conditions VARCHAR(255), -- Environmental conditions
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track performance (bobsleigh-specific)
CREATE TABLE track_performances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    track_name VARCHAR(255) NOT NULL, -- e.g., "Lillehammer", "Sigulda"
    event_name VARCHAR(255), -- e.g., "European Cup", "World Cup"
    event_date DATE NOT NULL,
    position VARCHAR(50), -- "PILOT" or "BRAKEMAN"
    start_time DECIMAL(6,3), -- Start time in seconds
    finish_time DECIMAL(8,3), -- Finish time in seconds
    final_rank INTEGER, -- Final ranking
    track_conditions VARCHAR(255), -- Weather, ice conditions
    sled_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- WELLBEING & RECOVERY
-- =====================================================

-- Daily wellbeing assessments
CREATE TABLE wellbeing_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    
    -- Subjective metrics (1-10 scale)
    sleep_quality INTEGER CHECK (sleep_quality >= 1 AND sleep_quality <= 10),
    sleep_duration_hours DECIMAL(3,1),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    mood_score INTEGER CHECK (mood_score >= 1 AND mood_score <= 10),
    motivation_level INTEGER CHECK (motivation_level >= 1 AND motivation_level <= 10),
    stress_level INTEGER CHECK (stress_level >= 1 AND stress_level <= 10),
    muscle_soreness INTEGER CHECK (muscle_soreness >= 1 AND muscle_soreness <= 10),
    
    -- Objective metrics
    resting_heart_rate INTEGER,
    body_weight_kg DECIMAL(5,2),
    hydration_level INTEGER CHECK (hydration_level >= 1 AND hydration_level <= 10),
    
    -- Qualitative data
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Injury tracking
CREATE TABLE injuries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    injury_date DATE NOT NULL,
    injury_type VARCHAR(255) NOT NULL, -- e.g., "Acute", "Overuse"
    body_part VARCHAR(255) NOT NULL, -- e.g., "Lower Back", "Shoulder"
    severity_level INTEGER CHECK (severity_level >= 1 AND severity_level <= 5),
    description TEXT,
    mechanism_of_injury TEXT, -- How it happened
    treatment_plan TEXT,
    return_to_training_date DATE,
    days_missed_training INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PROJECTED TARGETS & PERIODIZATION
-- =====================================================

-- Strength progression targets
CREATE TABLE strength_projections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    season_id UUID NOT NULL REFERENCES training_seasons(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    
    -- Progression parameters
    starting_weight_kg DECIMAL(6,2),
    target_weight_kg DECIMAL(6,2),
    progression_slope DECIMAL(6,3), -- Weekly increase
    session_frequency INTEGER, -- Sessions per week
    
    -- Timeline
    projection_start_date DATE NOT NULL,
    projection_end_date DATE NOT NULL,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly target progressions
CREATE TABLE weekly_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    projection_id UUID NOT NULL REFERENCES strength_projections(id) ON DELETE CASCADE,
    week_number INTEGER NOT NULL,
    target_weight_kg DECIMAL(6,2),
    target_reps INTEGER,
    target_sets INTEGER,
    achieved_weight_kg DECIMAL(6,2), -- Actual achievement
    achievement_percentage DECIMAL(5,2), -- % of target achieved
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ML FEATURE ENGINEERING VIEWS
-- =====================================================

-- Create materialized views for ML features
CREATE MATERIALIZED VIEW ml_daily_features AS
SELECT 
    ts.session_date,
    ts.id as session_id,
    a.id as athlete_id,
    a.name as athlete_name,
    
    -- Training load features
    SUM(tlm.total_volume_kg) as daily_volume_kg,
    AVG(tlm.average_intensity) as avg_intensity,
    SUM(tlm.training_stress_score) as daily_tss,
    COUNT(DISTINCT tlm.exercise_id) as exercises_performed,
    
    -- Session characteristics
    ts.session_type,
    ts.session_rpe,
    ts.actual_duration_minutes,
    
    -- Wellbeing features
    wb.sleep_quality,
    wb.energy_level,
    wb.mood_score,
    wb.muscle_soreness,
    wb.resting_heart_rate,
    wb.body_weight_kg,
    
    -- Temporal features
    EXTRACT(DOW FROM ts.session_date) as day_of_week,
    EXTRACT(WEEK FROM ts.session_date) as week_of_year,
    EXTRACT(MONTH FROM ts.session_date) as month_of_year

FROM training_sessions ts
JOIN training_weeks tw ON ts.week_id = tw.id
JOIN training_phases tp ON tw.phase_id = tp.id
JOIN training_seasons tsn ON tp.season_id = tsn.id
JOIN athletes a ON tsn.athlete_id = a.id
LEFT JOIN training_load_metrics tlm ON ts.id = tlm.session_id
LEFT JOIN wellbeing_assessments wb ON a.id = wb.athlete_id AND ts.session_date = wb.assessment_date
GROUP BY ts.session_date, ts.id, a.id, a.name, ts.session_type, ts.session_rpe, 
         ts.actual_duration_minutes, wb.sleep_quality, wb.energy_level, wb.mood_score, 
         wb.muscle_soreness, wb.resting_heart_rate, wb.body_weight_kg;

-- Create indexes for ML queries
CREATE INDEX idx_ml_daily_features_athlete_date ON ml_daily_features (athlete_id, session_date);
CREATE INDEX idx_ml_daily_features_session_type ON ml_daily_features (session_type);
CREATE INDEX idx_training_load_metrics_session ON training_load_metrics (session_id);
CREATE INDEX idx_training_load_metrics_exercise ON training_load_metrics (exercise_id);
CREATE INDEX idx_performance_results_athlete_date ON performance_results (athlete_id, test_date);
CREATE INDEX idx_wellbeing_assessments_athlete_date ON wellbeing_assessments (athlete_id, assessment_date);

-- =====================================================
-- FUNCTIONS FOR ML CALCULATIONS
-- =====================================================

-- Function to calculate Training Stress Score (TSS)
CREATE OR REPLACE FUNCTION calculate_tss(
    volume_kg DECIMAL,
    intensity_percent DECIMAL,
    duration_minutes INTEGER
) RETURNS DECIMAL AS $$
BEGIN
    -- TSS = (Duration × Intensity^2 × 100) / (FTP × 3600)
    -- Adapted for strength training
    RETURN (duration_minutes * POWER(intensity_percent/100, 2) * 100) / 60;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate Acute:Chronic Workload Ratio (ACWR)
CREATE OR REPLACE FUNCTION calculate_acwr(
    athlete_uuid UUID,
    calculation_date DATE
) RETURNS DECIMAL AS $$
DECLARE
    acute_load DECIMAL;
    chronic_load DECIMAL;
BEGIN
    -- Calculate 7-day acute load
    SELECT AVG(daily_tss) INTO acute_load
    FROM ml_daily_features
    WHERE athlete_id = athlete_uuid
    AND session_date BETWEEN calculation_date - INTERVAL '7 days' AND calculation_date;
    
    -- Calculate 28-day chronic load
    SELECT AVG(daily_tss) INTO chronic_load
    FROM ml_daily_features
    WHERE athlete_id = athlete_uuid
    AND session_date BETWEEN calculation_date - INTERVAL '28 days' AND calculation_date;
    
    -- Return ACWR
    IF chronic_load > 0 THEN
        RETURN acute_load / chronic_load;
    ELSE
        RETURN NULL;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR AUTOMATED CALCULATIONS
-- =====================================================

-- Trigger to update training load metrics when sets are added
CREATE OR REPLACE FUNCTION update_training_load_metrics() RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate metrics for the affected session
    DELETE FROM training_load_metrics 
    WHERE session_id = (
        SELECT ts.id FROM training_sessions ts
        JOIN session_exercises se ON ts.id = se.session_id
        WHERE se.id = NEW.session_exercise_id
    );
    
    -- Insert updated metrics
    INSERT INTO training_load_metrics (
        session_id, exercise_id, total_volume_kg, total_reps, total_sets, average_intensity
    )
    SELECT 
        ts.id,
        se.exercise_id,
        SUM(es.reps_actual * es.weight_kg) as total_volume_kg,
        SUM(es.reps_actual) as total_reps,
        COUNT(es.id) as total_sets,
        AVG(es.load_percentage) as average_intensity
    FROM training_sessions ts
    JOIN session_exercises se ON ts.id = se.session_id
    JOIN exercise_sets es ON se.id = es.session_exercise_id
    WHERE ts.id = (
        SELECT ts2.id FROM training_sessions ts2
        JOIN session_exercises se2 ON ts2.id = se2.session_id
        WHERE se2.id = NEW.session_exercise_id
    )
    GROUP BY ts.id, se.exercise_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_training_load_metrics
    AFTER INSERT OR UPDATE OR DELETE ON exercise_sets
    FOR EACH ROW EXECUTE FUNCTION update_training_load_metrics();

-- =====================================================
-- SAMPLE DATA POPULATION
-- =====================================================

-- Insert sample exercise categories
INSERT INTO exercise_categories (name, description, movement_pattern, energy_system) VALUES
('Olympic Lifts', 'Snatch, Clean & Jerk variations', 'Triple Extension', 'Power'),
('Squats', 'Squat variations', 'Knee Dominant', 'Strength'),
('Sprints', 'Sprint training', 'Linear Speed', 'Power'),
('Jumps', 'Jumping exercises', 'Plyometric', 'Power'),
('Pulls', 'Pulling exercises', 'Hip Hinge', 'Strength');

-- Insert sample exercises
INSERT INTO exercises (name, category_id, description, difficulty_level) VALUES
('Clean', (SELECT id FROM exercise_categories WHERE name = 'Olympic Lifts'), 'Power clean exercise', 4),
('Snatch', (SELECT id FROM exercise_categories WHERE name = 'Olympic Lifts'), 'Snatch exercise', 5),
('Box Squat', (SELECT id FROM exercise_categories WHERE name = 'Squats'), 'Squat to box', 3),
('Jump Squats', (SELECT id FROM exercise_categories WHERE name = 'Squats'), 'Explosive squat jumps', 3),
('30m Sprint', (SELECT id FROM exercise_categories WHERE name = 'Sprints'), '30 meter sprint', 2),
('Triple Broad Jump', (SELECT id FROM exercise_categories WHERE name = 'Jumps'), 'Three consecutive broad jumps', 3);

-- Insert sample performance tests
INSERT INTO performance_tests (test_name, test_category, unit_of_measurement, test_protocol) VALUES
('30m Sprint', 'Speed', 'seconds', 'Sprint 30 meters from standing start'),
('60m Sprint', 'Speed', 'seconds', 'Sprint 60 meters from standing start'),
('100m Sprint', 'Speed', 'seconds', 'Sprint 100 meters from standing start'),
('Triple Broad Jump', 'Power', 'meters', 'Three consecutive broad jumps for distance'),
('Broad Jump', 'Power', 'meters', 'Single broad jump for distance');

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW ml_daily_features;

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE athletes IS 'Core athlete information for the training system';
COMMENT ON TABLE training_seasons IS 'Training seasons/cycles (macrocycles) - typically 6-month periods';
COMMENT ON TABLE training_phases IS 'Training phases within seasons (mesocycles) - typically 2-4 week periods';
COMMENT ON TABLE training_weeks IS 'Weekly training blocks (microcycles)';
COMMENT ON TABLE training_sessions IS 'Individual training sessions';
COMMENT ON TABLE exercise_sets IS 'Individual sets within exercises - core training load data';
COMMENT ON TABLE training_load_metrics IS 'Computed training load metrics for ML analysis';
COMMENT ON TABLE performance_results IS 'Performance test results over time';
COMMENT ON TABLE wellbeing_assessments IS 'Daily wellbeing and recovery metrics';
COMMENT ON TABLE ml_daily_features IS 'Materialized view combining daily training and wellbeing data for ML';

COMMENT ON FUNCTION calculate_tss IS 'Calculate Training Stress Score for strength training sessions';
COMMENT ON FUNCTION calculate_acwr IS 'Calculate Acute:Chronic Workload Ratio for injury risk assessment';