-- =====================================================
-- ADAPTIVE TRAINING PREDICTION SYSTEM
-- =====================================================
-- Extension to the base schema for real-time training adaptation
-- Based on Joshua Hudson Template analysis

-- =====================================================
-- FEEDBACK CAPTURE SYSTEM
-- =====================================================

-- Daily feedback collection (replaces/extends wellbeing_assessments)
CREATE TABLE daily_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE,
    feedback_date DATE NOT NULL,
    feedback_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Immediate post-session feedback
    session_rpe INTEGER CHECK (session_rpe >= 1 AND session_rpe <= 10),
    session_difficulty INTEGER CHECK (session_difficulty >= 1 AND session_difficulty <= 10),
    session_enjoyment INTEGER CHECK (session_enjoyment >= 1 AND session_enjoyment <= 10),
    
    -- Physical state indicators
    muscle_soreness INTEGER CHECK (muscle_soreness >= 1 AND muscle_soreness <= 10),
    energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
    motivation_level INTEGER CHECK (motivation_level >= 1 AND motivation_level <= 10),
    
    -- Specific body parts soreness
    lower_back_soreness INTEGER CHECK (lower_back_soreness >= 1 AND lower_back_soreness <= 10),
    legs_soreness INTEGER CHECK (legs_soreness >= 1 AND legs_soreness <= 10),
    shoulders_soreness INTEGER CHECK (shoulders_soreness >= 1 AND shoulders_soreness <= 10),
    
    -- Qualitative feedback
    what_felt_good TEXT,
    what_felt_difficult TEXT,
    suggested_changes TEXT,
    
    -- Adaptive flags
    request_easier_session BOOLEAN DEFAULT FALSE,
    request_harder_session BOOLEAN DEFAULT FALSE,
    request_exercise_change BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise-specific feedback
CREATE TABLE exercise_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_feedback_id UUID NOT NULL REFERENCES daily_feedback(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    
    -- Exercise-specific ratings
    technique_quality INTEGER CHECK (technique_quality >= 1 AND technique_quality <= 10),
    exercise_difficulty INTEGER CHECK (exercise_difficulty >= 1 AND exercise_difficulty <= 10),
    exercise_enjoyment INTEGER CHECK (exercise_enjoyment >= 1 AND exercise_enjoyment <= 10),
    
    -- Specific feedback
    felt_heavy BOOLEAN DEFAULT FALSE,
    felt_light BOOLEAN DEFAULT FALSE,
    form_breakdown BOOLEAN DEFAULT FALSE,
    pain_during_exercise BOOLEAN DEFAULT FALSE,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADAPTIVE ALGORITHM COMPONENTS
-- =====================================================

-- Training load targets (dynamic, not static)
CREATE TABLE dynamic_load_targets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    
    -- Calculated targets
    target_weekly_volume_kg DECIMAL(10,2),
    target_daily_tss DECIMAL(8,2),
    target_intensity_percentage DECIMAL(5,2),
    
    -- Adaptation factors
    fatigue_coefficient DECIMAL(5,3) DEFAULT 1.0,
    motivation_coefficient DECIMAL(5,3) DEFAULT 1.0,
    performance_coefficient DECIMAL(5,3) DEFAULT 1.0,
    
    -- Confidence in targets
    prediction_confidence DECIMAL(3,2) CHECK (prediction_confidence >= 0 AND prediction_confidence <= 1),
    
    -- Source of calculation
    calculation_method VARCHAR(100), -- 'ml_model', 'rule_based', 'coach_override'
    model_version VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Adaptation rules engine
CREATE TABLE adaptation_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL,
    rule_description TEXT,
    
    -- Trigger conditions
    trigger_condition JSONB NOT NULL, -- JSON conditions for rule activation
    
    -- Actions to take
    load_adjustment_percentage DECIMAL(5,2), -- +/- percentage adjustment
    exercise_substitution_map JSONB, -- Exercise replacement suggestions
    volume_adjustment_sets INTEGER, -- +/- sets adjustment
    
    -- Rule priority and activation
    priority_level INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise substitution matrix
CREATE TABLE exercise_substitutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    primary_exercise_id UUID NOT NULL REFERENCES exercises(id),
    substitute_exercise_id UUID NOT NULL REFERENCES exercises(id),
    
    -- Substitution context
    substitution_reason VARCHAR(255), -- 'injury', 'fatigue', 'equipment', 'variety'
    load_adjustment_factor DECIMAL(5,3) DEFAULT 1.0,
    difficulty_adjustment INTEGER DEFAULT 0, -- -2 to +2 scale
    
    -- Effectiveness metrics
    substitution_success_rate DECIMAL(3,2), -- Historical success rate
    athlete_preference_score DECIMAL(3,2), -- Athlete preference (1-10)
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PREDICTION FEATURES TABLE
-- =====================================================

-- Daily features for ML model
CREATE TABLE ml_prediction_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    feature_date DATE NOT NULL,
    
    -- Training load history (7-day rolling)
    avg_load_7d DECIMAL(8,2),
    max_load_7d DECIMAL(8,2),
    load_trend_7d DECIMAL(6,3), -- slope of load over 7 days
    
    -- Training load history (28-day rolling)
    avg_load_28d DECIMAL(8,2),
    load_variability_28d DECIMAL(8,2), -- coefficient of variation
    
    -- Acute:Chronic ratios
    acwr_load DECIMAL(5,3),
    acwr_volume DECIMAL(5,3),
    acwr_intensity DECIMAL(5,3),
    
    -- Feedback trends (7-day rolling)
    avg_rpe_7d DECIMAL(3,1),
    avg_soreness_7d DECIMAL(3,1),
    avg_energy_7d DECIMAL(3,1),
    avg_motivation_7d DECIMAL(3,1),
    
    -- Performance trends
    performance_trend_7d DECIMAL(6,3),
    technique_quality_trend_7d DECIMAL(6,3),
    
    -- Temporal features
    days_since_last_rest INTEGER,
    days_since_last_heavy_session INTEGER,
    days_until_competition INTEGER,
    
    -- Calculated at feature extraction time
    calculated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PREDICTIVE MODEL OUTPUTS
-- =====================================================

-- Next session recommendations
CREATE TABLE session_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    target_date DATE NOT NULL,
    
    -- Recommended session structure
    recommended_session_type VARCHAR(100),
    recommended_duration_minutes INTEGER,
    recommended_intensity_level INTEGER CHECK (recommended_intensity_level >= 1 AND recommended_intensity_level <= 10),
    
    -- Load recommendations
    recommended_total_volume_kg DECIMAL(10,2),
    recommended_exercise_count INTEGER,
    recommended_max_weight_kg DECIMAL(6,2),
    
    -- Confidence and reasoning
    recommendation_confidence DECIMAL(3,2),
    reasoning TEXT,
    
    -- Model metadata
    model_version VARCHAR(50),
    prediction_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exercise recommendations for sessions
CREATE TABLE exercise_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_recommendation_id UUID NOT NULL REFERENCES session_recommendations(id) ON DELETE CASCADE,
    exercise_id UUID NOT NULL REFERENCES exercises(id),
    
    -- Exercise prescription
    recommended_sets INTEGER,
    recommended_reps INTEGER,
    recommended_weight_kg DECIMAL(6,2),
    recommended_rest_seconds INTEGER,
    
    -- Exercise order and importance
    exercise_priority INTEGER DEFAULT 1,
    is_optional BOOLEAN DEFAULT FALSE,
    
    -- Adaptation reason
    selection_reason TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly plan recommendations
CREATE TABLE weekly_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES athletes(id) ON DELETE CASCADE,
    target_week_start DATE NOT NULL,
    
    -- Weekly structure
    recommended_training_days INTEGER,
    recommended_weekly_volume_kg DECIMAL(10,2),
    recommended_weekly_tss DECIMAL(8,2),
    
    -- Weekly focus
    primary_focus VARCHAR(255), -- 'strength', 'power', 'speed', 'recovery'
    secondary_focus VARCHAR(255),
    
    -- Adaptation strategy
    load_progression_strategy VARCHAR(100), -- 'increase', 'maintain', 'decrease', 'peak'
    deload_recommendation BOOLEAN DEFAULT FALSE,
    
    -- Confidence and metadata
    recommendation_confidence DECIMAL(3,2),
    model_version VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADAPTIVE FUNCTIONS
-- =====================================================

-- Function to calculate adaptive load adjustment
CREATE OR REPLACE FUNCTION calculate_adaptive_load_adjustment(
    athlete_uuid UUID,
    target_date DATE,
    base_load_kg DECIMAL
) RETURNS DECIMAL AS $$
DECLARE
    recent_feedback RECORD;
    acwr_value DECIMAL;
    adjustment_factor DECIMAL DEFAULT 1.0;
    final_load DECIMAL;
BEGIN
    -- Get recent feedback
    SELECT AVG(session_rpe) as avg_rpe, AVG(muscle_soreness) as avg_soreness, AVG(energy_level) as avg_energy
    INTO recent_feedback
    FROM daily_feedback
    WHERE athlete_id = athlete_uuid 
    AND feedback_date >= target_date - INTERVAL '7 days';
    
    -- Calculate ACWR
    SELECT calculate_acwr(athlete_uuid, target_date) INTO acwr_value;
    
    -- Apply adjustment rules
    -- High RPE -> reduce load
    IF recent_feedback.avg_rpe > 7 THEN
        adjustment_factor := adjustment_factor * 0.85;
    END IF;
    
    -- High soreness -> reduce load
    IF recent_feedback.avg_soreness > 7 THEN
        adjustment_factor := adjustment_factor * 0.9;
    END IF;
    
    -- Low energy -> reduce load
    IF recent_feedback.avg_energy < 4 THEN
        adjustment_factor := adjustment_factor * 0.8;
    END IF;
    
    -- High ACWR -> reduce load
    IF acwr_value > 1.5 THEN
        adjustment_factor := adjustment_factor * 0.7;
    END IF;
    
    -- Low ACWR -> potentially increase load
    IF acwr_value < 0.8 AND recent_feedback.avg_energy > 7 THEN
        adjustment_factor := adjustment_factor * 1.1;
    END IF;
    
    final_load := base_load_kg * adjustment_factor;
    
    RETURN final_load;
END;
$$ LANGUAGE plpgsql;

-- Function to recommend exercise substitutions
CREATE OR REPLACE FUNCTION recommend_exercise_substitution(
    original_exercise_id UUID,
    athlete_uuid UUID,
    substitution_reason VARCHAR
) RETURNS TABLE (
    substitute_id UUID,
    substitute_name VARCHAR,
    load_adjustment DECIMAL,
    confidence_score DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        es.substitute_exercise_id,
        e.name,
        es.load_adjustment_factor,
        es.substitution_success_rate
    FROM exercise_substitutions es
    JOIN exercises e ON es.substitute_exercise_id = e.id
    WHERE es.primary_exercise_id = original_exercise_id
    AND es.substitution_reason = substitution_reason
    ORDER BY es.substitution_success_rate DESC, es.athlete_preference_score DESC
    LIMIT 3;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS FOR REAL-TIME ADAPTATION
-- =====================================================

-- Trigger to update prediction features when feedback is added
CREATE OR REPLACE FUNCTION update_prediction_features() RETURNS TRIGGER AS $$
BEGIN
    -- Delete existing features for this date
    DELETE FROM ml_prediction_features 
    WHERE athlete_id = NEW.athlete_id AND feature_date = NEW.feedback_date;
    
    -- Calculate new features
    INSERT INTO ml_prediction_features (
        athlete_id, feature_date, avg_load_7d, avg_rpe_7d, avg_soreness_7d, avg_energy_7d
    )
    SELECT 
        NEW.athlete_id,
        NEW.feedback_date,
        AVG(tlm.total_volume_kg) as avg_load_7d,
        AVG(df.session_rpe) as avg_rpe_7d,
        AVG(df.muscle_soreness) as avg_soreness_7d,
        AVG(df.energy_level) as avg_energy_7d
    FROM daily_feedback df
    LEFT JOIN training_sessions ts ON df.session_id = ts.id
    LEFT JOIN training_load_metrics tlm ON ts.id = tlm.session_id
    WHERE df.athlete_id = NEW.athlete_id
    AND df.feedback_date >= NEW.feedback_date - INTERVAL '7 days'
    GROUP BY NEW.athlete_id, NEW.feedback_date;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_prediction_features
    AFTER INSERT OR UPDATE ON daily_feedback
    FOR EACH ROW EXECUTE FUNCTION update_prediction_features();

-- =====================================================
-- SAMPLE ADAPTATION RULES
-- =====================================================

-- Insert sample adaptation rules
INSERT INTO adaptation_rules (rule_name, rule_description, trigger_condition, load_adjustment_percentage, priority_level) VALUES
('High RPE Reduction', 'Reduce load when RPE > 8 for 3 consecutive days', 
 '{"consecutive_high_rpe": 3, "rpe_threshold": 8}', -20, 1),
('Low Energy Adjustment', 'Reduce load when energy < 4 for 2 consecutive days',
 '{"consecutive_low_energy": 2, "energy_threshold": 4}', -15, 2),
('High Soreness Protocol', 'Reduce load when soreness > 7',
 '{"soreness_threshold": 7}', -25, 1),
('ACWR Overreaching', 'Significant load reduction when ACWR > 1.5',
 '{"acwr_threshold": 1.5}', -30, 1),
('Good Recovery Boost', 'Slight load increase when all metrics are good',
 '{"rpe_max": 6, "energy_min": 7, "soreness_max": 4}', 10, 3);

-- =====================================================
-- MATERIALIZED VIEW FOR REAL-TIME DASHBOARD
-- =====================================================

CREATE MATERIALIZED VIEW athlete_adaptation_dashboard AS
SELECT 
    a.id as athlete_id,
    a.name as athlete_name,
    
    -- Current state
    CURRENT_DATE as dashboard_date,
    
    -- Recent feedback (last 7 days)
    AVG(df.session_rpe) as avg_rpe_7d,
    AVG(df.muscle_soreness) as avg_soreness_7d,
    AVG(df.energy_level) as avg_energy_7d,
    AVG(df.motivation_level) as avg_motivation_7d,
    
    -- Training load (last 7 days)
    AVG(tlm.total_volume_kg) as avg_volume_7d,
    AVG(tlm.average_intensity) as avg_intensity_7d,
    
    -- Adaptation indicators
    calculate_acwr(a.id, CURRENT_DATE) as current_acwr,
    
    -- Recommendations needed
    CASE 
        WHEN AVG(df.session_rpe) > 7 THEN 'Reduce Load'
        WHEN AVG(df.energy_level) < 4 THEN 'Recovery Focus'
        WHEN calculate_acwr(a.id, CURRENT_DATE) > 1.5 THEN 'Deload Recommended'
        ELSE 'Continue Current Plan'
    END as adaptation_recommendation

FROM athletes a
LEFT JOIN daily_feedback df ON a.id = df.athlete_id 
    AND df.feedback_date >= CURRENT_DATE - INTERVAL '7 days'
LEFT JOIN training_sessions ts ON df.session_id = ts.id
LEFT JOIN training_load_metrics tlm ON ts.id = tlm.session_id
GROUP BY a.id, a.name;

-- Refresh the materialized view
REFRESH MATERIALIZED VIEW athlete_adaptation_dashboard;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_daily_feedback_athlete_date ON daily_feedback (athlete_id, feedback_date);
CREATE INDEX idx_exercise_feedback_daily_feedback ON exercise_feedback (daily_feedback_id);
CREATE INDEX idx_ml_prediction_features_athlete_date ON ml_prediction_features (athlete_id, feature_date);
CREATE INDEX idx_session_recommendations_athlete_date ON session_recommendations (athlete_id, target_date);
CREATE INDEX idx_weekly_recommendations_athlete_date ON weekly_recommendations (athlete_id, target_week_start);

COMMENT ON TABLE daily_feedback IS 'Real-time feedback collection for adaptive training';
COMMENT ON TABLE ml_prediction_features IS 'Features engineered for ML prediction models';
COMMENT ON TABLE session_recommendations IS 'AI-generated session recommendations';
COMMENT ON TABLE adaptation_rules IS 'Rule-based adaptation system';
COMMENT ON FUNCTION calculate_adaptive_load_adjustment IS 'Calculate load adjustments based on feedback';
COMMENT ON MATERIALIZED VIEW athlete_adaptation_dashboard IS 'Real-time dashboard for adaptation monitoring';