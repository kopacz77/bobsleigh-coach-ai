-- INSERT JOSHUA HUDSON DATA INTO FRESH CLEAN SCHEMA
-- Run this AFTER running fresh_clean_schema.sql
-- This populates Joshua's training data for ML model training

-- ========================================
-- INSERT JOSHUA AS ATHLETE
-- ========================================

INSERT INTO public.athletes (
    first_name, last_name, email, sport_id,
    height_cm, weight_kg, birth_date,
    training_level, training_frequency,
    physical_profile, training_preferences, performance_targets,
    onboarding_completed, is_active
) VALUES (
    'Joshua', 'Hudson', 'joshua.hudson@bobsleigh.com',
    (SELECT id FROM sports WHERE name = 'Bobsleigh'),
    180, 101.0, '1995-01-01',
    'elite', 6,
    '{
        "body_fat_percent": 8,
        "muscle_fiber_type": "fast_twitch_dominant",
        "training_experience_years": 8,
        "injury_history": [],
        "dominant_side": "right",
        "anthropometrics": {
            "arm_span_cm": 185,
            "leg_length_cm": 95,
            "torso_length_cm": 85
        }
    }'::jsonb,
    '{
        "preferred_training_times": ["morning"],
        "focus_areas": ["power", "speed", "strength"],
        "recovery_preferences": ["active_recovery", "massage", "ice_bath"],
        "training_location": "indoor_gym",
        "coaching_style": "data_driven"
    }'::jsonb,
    '{
        "2024_goals": {
            "30m_sprint": {"target": 3.85, "current": 3.95},
            "power_clean_1rm": {"target": 150, "current": 140},
            "front_squat_1rm": {"target": 190, "current": 180},
            "broad_jump": {"target": 3.25, "current": 3.15}
        },
        "competition_targets": ["World Championships 2024", "Olympics 2026"]
    }'::jsonb,
    true, true
);

-- ========================================
-- INSERT JOSHUA'S BASELINE PERFORMANCE METRICS
-- ========================================

INSERT INTO public.performance_metrics (
    athlete_id, test_date, metric_type, metric_name, exercise_id, 
    value, unit, test_conditions, is_personal_best, training_phase, notes
) VALUES 
-- Get Joshua's athlete ID for all inserts
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-15', 'speed', '30m_sprint', 
 (SELECT id FROM exercises WHERE name = '30m Sprint'), 3.95, 'seconds', 
 '{"surface": "track", "conditions": "indoor", "timing": "electronic"}'::jsonb, true, 'baseline', 'Personal best time'),

((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-15', 'speed', '100m_sprint',
 (SELECT id FROM exercises WHERE name = '100m Sprint'), 11.8, 'seconds',
 '{"surface": "track", "conditions": "indoor", "timing": "electronic"}'::jsonb, true, 'baseline', 'Season best'),

((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-15', 'max_strength', 'power_clean_1rm',
 (SELECT id FROM exercises WHERE name = 'Power Clean'), 140.0, 'kg',
 '{"equipment": "olympic_barbell", "technique": "verified", "rest": "5min"}'::jsonb, true, 'baseline', 'Competition prep maximum'),

((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-15', 'max_strength', 'power_snatch_1rm',
 (SELECT id FROM exercises WHERE name = 'Power Snatch'), 90.0, 'kg',
 '{"equipment": "olympic_barbell", "technique": "verified", "rest": "5min"}'::jsonb, true, 'baseline', 'Technical maximum'),

((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-15', 'max_strength', 'front_squat_1rm',
 (SELECT id FROM exercises WHERE name = 'Front Squat'), 180.0, 'kg',
 '{"equipment": "olympic_barbell", "depth": "full", "rest": "5min"}'::jsonb, true, 'baseline', 'Competition weight'),

((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-15', 'max_strength', 'back_squat_1rm',
 (SELECT id FROM exercises WHERE name = 'Back Squat'), 220.0, 'kg',
 '{"equipment": "olympic_barbell", "depth": "full", "rest": "5min"}'::jsonb, true, 'baseline', 'Off-season maximum'),

((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-15', 'power', 'broad_jump_max',
 (SELECT id FROM exercises WHERE name = 'Broad Jump'), 3.15, 'meters',
 '{"surface": "gym_mat", "attempts": 3, "best_of": 3}'::jsonb, true, 'baseline', 'Power output benchmark'),

((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-15', 'power', 'triple_broad_jump_max',
 (SELECT id FROM exercises WHERE name = 'Triple Broad Jump'), 8.45, 'meters',
 '{"surface": "gym_mat", "attempts": 3, "best_of": 3}'::jsonb, true, 'baseline', 'Repeated power output');

-- ========================================
-- INSERT TRAINING LOAD DATA (21 days for PMC model)
-- ========================================

INSERT INTO public.training_loads (
    athlete_id, date, training_load, ctl, atl, tsb,
    rpe, fatigue_level, soreness_level, motivation_level,
    sleep_hours, sleep_quality, stress_level, readiness_score, notes
) VALUES 
-- Joshua's athlete ID will be used for all records
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-01', 85.0, 60.0, 65.0, -5.0, 7.0, 4.0, 3.0, 8.0, 7.5, 8.0, 3.0, 75.5, 'New year training restart'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-02', 90.0, 62.0, 68.0, -6.0, 8.0, 5.0, 4.0, 8.0, 8.0, 9.0, 2.0, 78.0, 'Power development session'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-03', 75.0, 63.0, 67.0, -4.0, 6.0, 3.0, 2.0, 9.0, 7.0, 7.0, 4.0, 72.0, 'Active recovery day'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-04', 95.0, 65.0, 71.0, -6.0, 8.0, 6.0, 5.0, 8.0, 8.5, 9.0, 2.0, 80.0, 'High intensity sprint work'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-05', 80.0, 66.0, 70.0, -4.0, 7.0, 4.0, 3.0, 9.0, 7.5, 8.0, 3.0, 76.5, 'Strength maintenance'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-06', 100.0, 68.0, 74.0, -6.0, 9.0, 7.0, 6.0, 7.0, 8.0, 8.0, 3.0, 74.0, 'Peak power session'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-07', 0.0, 67.0, 67.0, 0.0, 2.0, 1.0, 1.0, 10.0, 9.0, 9.0, 1.0, 90.0, 'Complete rest day'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-08', 85.0, 68.0, 69.0, -1.0, 7.0, 3.0, 2.0, 9.0, 8.0, 8.0, 2.0, 82.0, 'Return to training'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-09', 110.0, 70.0, 76.0, -6.0, 9.0, 8.0, 7.0, 8.0, 7.0, 7.0, 4.0, 70.0, 'Maximum intensity session'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-10', 90.0, 71.0, 75.0, -4.0, 8.0, 5.0, 4.0, 8.0, 7.5, 8.0, 3.0, 76.0, 'Power development'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-11', 95.0, 73.0, 77.0, -4.0, 8.0, 6.0, 5.0, 9.0, 8.0, 8.0, 3.0, 78.0, 'Speed work'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-12', 75.0, 73.0, 76.0, -3.0, 6.0, 3.0, 2.0, 8.0, 7.0, 7.0, 4.0, 74.0, 'Recovery session'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-13', 95.0, 75.0, 78.0, -3.0, 8.0, 6.0, 5.0, 9.0, 8.5, 9.0, 2.0, 82.0, 'Competition simulation'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-14', 80.0, 75.0, 77.0, -2.0, 7.0, 4.0, 3.0, 8.0, 7.5, 8.0, 3.0, 78.5, 'Strength work'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-15', 100.0, 77.0, 81.0, -4.0, 9.0, 7.0, 6.0, 9.0, 8.0, 8.0, 3.0, 80.0, 'Performance testing day'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-16', 0.0, 76.0, 73.0, 3.0, 2.0, 1.0, 1.0, 10.0, 9.0, 9.0, 1.0, 95.0, 'Full recovery'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-17', 85.0, 76.0, 74.0, 2.0, 7.0, 3.0, 2.0, 9.0, 8.0, 8.0, 2.0, 85.0, 'Fresh training return'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-18', 110.0, 78.0, 80.0, -2.0, 9.0, 8.0, 7.0, 8.0, 7.0, 7.0, 4.0, 72.0, 'High volume session'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-19', 90.0, 79.0, 79.0, 0.0, 8.0, 5.0, 4.0, 8.0, 7.5, 8.0, 3.0, 78.0, 'Balanced training'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-20', 95.0, 80.0, 81.0, -1.0, 8.0, 6.0, 5.0, 8.0, 8.0, 8.0, 3.0, 79.0, 'Power endurance'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-21', 85.0, 81.0, 80.0, 1.0, 7.0, 4.0, 3.0, 9.0, 8.0, 8.0, 2.0, 82.0, 'Maintenance session');

-- ========================================
-- INSERT WELLBEING ASSESSMENTS
-- ========================================

INSERT INTO public.wellbeing_assessments (
    athlete_id, assessment_date, sleep_hours, sleep_quality, sleep_disruptions,
    stress_level, mood_rating, motivation_level, energy_level, muscle_soreness, joint_stiffness,
    overall_health, nutrition_quality, hydration_level, readiness_score, recovery_status, notes
) VALUES 
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-01', 7.5, 8, 0, 3, 8, 8, 8, 3, 2, 9, 8, 8, 78.5, 'good', 'Fresh start to training block'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-02', 8.0, 9, 0, 2, 9, 9, 9, 4, 2, 9, 9, 9, 85.0, 'excellent', 'Feeling strong and ready'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-03', 7.0, 7, 1, 4, 7, 8, 7, 2, 1, 8, 7, 8, 72.0, 'good', 'Recovery day - needed it'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-04', 8.5, 9, 0, 2, 9, 10, 9, 5, 3, 9, 9, 9, 88.0, 'excellent', 'Peak readiness for speed work'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-05', 7.5, 8, 0, 3, 8, 8, 8, 3, 2, 8, 8, 8, 78.0, 'good', 'Solid training day'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-06', 8.0, 8, 0, 3, 8, 9, 8, 6, 4, 8, 8, 8, 80.0, 'good', 'Ready for high intensity'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-07', 9.0, 9, 0, 1, 9, 10, 9, 1, 1, 10, 9, 9, 95.0, 'excellent', 'Perfect recovery day'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-08', 8.0, 8, 0, 2, 8, 9, 8, 2, 1, 9, 8, 8, 82.0, 'good', 'Refreshed and ready'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-09', 7.0, 7, 1, 5, 7, 8, 6, 7, 5, 7, 7, 7, 68.0, 'fair', 'Heavy session took its toll'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-10', 7.5, 8, 0, 3, 8, 8, 7, 4, 3, 8, 8, 8, 75.0, 'good', 'Recovering well'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-11', 8.0, 8, 0, 3, 8, 9, 8, 5, 3, 8, 8, 8, 78.0, 'good', 'Good for speed work'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-12', 7.0, 7, 1, 4, 7, 7, 7, 2, 2, 8, 7, 7, 70.0, 'good', 'Light day helped'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-13', 8.5, 9, 0, 2, 9, 10, 9, 5, 3, 9, 9, 9, 87.0, 'excellent', 'Competition ready'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-14', 7.5, 8, 0, 3, 8, 8, 8, 3, 2, 8, 8, 8, 78.0, 'good', 'Consistent performance'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-15', 8.0, 8, 0, 3, 8, 9, 8, 6, 4, 8, 8, 8, 80.0, 'good', 'Testing day - performed well'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-16', 9.0, 9, 0, 1, 9, 10, 9, 1, 1, 10, 9, 9, 95.0, 'excellent', 'Complete recovery achieved'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-17', 8.0, 8, 0, 2, 8, 9, 8, 2, 1, 9, 8, 8, 82.0, 'good', 'Back to training fresh'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-18', 7.0, 7, 1, 5, 6, 7, 6, 8, 6, 6, 7, 7, 65.0, 'fair', 'High volume session fatigue'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-19', 7.5, 8, 0, 3, 7, 8, 7, 4, 3, 8, 8, 8, 74.0, 'good', 'Bouncing back'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-20', 8.0, 8, 0, 3, 8, 8, 8, 5, 3, 8, 8, 8, 77.0, 'good', 'Steady training state'),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), '2024-01-21', 8.0, 8, 0, 2, 8, 9, 8, 3, 2, 8, 8, 8, 80.0, 'good', 'Maintaining good form');

-- ========================================
-- INSERT SAMPLE WORKOUTS
-- ========================================

INSERT INTO public.workouts (
    athlete_id, name, date, duration_minutes, workout_type, training_phase,
    intensity_level, planned_load, actual_load, rpe, effectiveness_score, notes, is_completed
) VALUES 
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), 'Power Development', '2024-01-10', 90, 'power', 'build', 8, 85.0, 85.0, 7, 8.5, 'Olympic lifts focus - felt strong', true),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), 'Sprint Acceleration', '2024-01-11', 60, 'speed', 'build', 9, 90.0, 95.0, 8, 9.0, 'Excellent sprint times - new season best', true),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), 'Strength Foundation', '2024-01-12', 75, 'strength', 'build', 7, 75.0, 75.0, 6, 7.5, 'Squat variations - building base', true),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), 'Competition Simulation', '2024-01-13', 85, 'power', 'build', 9, 95.0, 95.0, 8, 9.5, 'Peak power work - competition ready', true),
((SELECT id FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'), 'Performance Testing', '2024-01-15', 120, 'testing', 'build', 10, 100.0, 100.0, 9, 10.0, 'Baseline testing - all PRs achieved', true);

-- ========================================
-- INSERT WORKOUT EXERCISES
-- ========================================

-- Power Development workout exercises
INSERT INTO public.workout_exercises (
    workout_id, exercise_id, exercise_order, actual_sets, actual_reps, actual_weight, 
    performance_data, notes
) VALUES 
((SELECT w.id FROM workouts w JOIN athletes a ON w.athlete_id = a.id WHERE a.email = 'joshua.hudson@bobsleigh.com' AND w.name = 'Power Development'),
 (SELECT id FROM exercises WHERE name = 'Power Clean'), 1, 5, 3, 120.0,
 '[{"set": 1, "reps": 3, "weight": 100}, {"set": 2, "reps": 3, "weight": 110}, {"set": 3, "reps": 3, "weight": 120}, {"set": 4, "reps": 3, "weight": 120}, {"set": 5, "reps": 3, "weight": 120}]'::jsonb,
 'Building to 85% 1RM - felt explosive'),

((SELECT w.id FROM workouts w JOIN athletes a ON w.athlete_id = a.id WHERE a.email = 'joshua.hudson@bobsleigh.com' AND w.name = 'Power Development'),
 (SELECT id FROM exercises WHERE name = 'Front Squat'), 2, 4, 5, 150.0,
 '[{"set": 1, "reps": 5, "weight": 140}, {"set": 2, "reps": 5, "weight": 150}, {"set": 3, "reps": 5, "weight": 150}, {"set": 4, "reps": 5, "weight": 150}]'::jsonb,
 'Strength endurance work - solid base'),

((SELECT w.id FROM workouts w JOIN athletes a ON w.athlete_id = a.id WHERE a.email = 'joshua.hudson@bobsleigh.com' AND w.name = 'Power Development'),
 (SELECT id FROM exercises WHERE name = 'Power Snatch'), 3, 4, 3, 75.0,
 '[{"set": 1, "reps": 3, "weight": 70}, {"set": 2, "reps": 3, "weight": 75}, {"set": 3, "reps": 3, "weight": 75}, {"set": 4, "reps": 3, "weight": 75}]'::jsonb,
 'Technical work - rate of force development');

-- Sprint Acceleration workout exercises  
INSERT INTO public.workout_exercises (
    workout_id, exercise_id, exercise_order, actual_sets, actual_reps, actual_time_seconds,
    performance_data, notes
) VALUES 
((SELECT w.id FROM workouts w JOIN athletes a ON w.athlete_id = a.id WHERE a.email = 'joshua.hudson@bobsleigh.com' AND w.name = 'Sprint Acceleration'),
 (SELECT id FROM exercises WHERE name = '30m Sprint'), 1, 6, 1, 3.95,
 '[{"set": 1, "time": 4.02}, {"set": 2, "time": 3.98}, {"set": 3, "time": 3.95}, {"set": 4, "time": 3.97}, {"set": 5, "time": 3.99}, {"set": 6, "time": 4.01}]'::jsonb,
 'Best time of 3.95s - season best performance');

-- ========================================
-- VERIFICATION QUERY
-- ========================================

-- Show summary of inserted data
SELECT 
    'Joshua Hudson Training Data Insertion Summary' as summary
UNION ALL
SELECT CONCAT('✅ Athlete: ', first_name, ' ', last_name, ' (', email, ')') 
    FROM athletes WHERE email = 'joshua.hudson@bobsleigh.com'
UNION ALL
SELECT CONCAT('✅ Performance Metrics: ', count(*), ' records') 
    FROM performance_metrics pm JOIN athletes a ON pm.athlete_id = a.id 
    WHERE a.email = 'joshua.hudson@bobsleigh.com'
UNION ALL
SELECT CONCAT('✅ Training Loads: ', count(*), ' days of data') 
    FROM training_loads tl JOIN athletes a ON tl.athlete_id = a.id 
    WHERE a.email = 'joshua.hudson@bobsleigh.com'
UNION ALL
SELECT CONCAT('✅ Wellbeing Assessments: ', count(*), ' days of data') 
    FROM wellbeing_assessments wa JOIN athletes a ON wa.athlete_id = a.id 
    WHERE a.email = 'joshua.hudson@bobsleigh.com'
UNION ALL
SELECT CONCAT('✅ Workouts: ', count(*), ' training sessions') 
    FROM workouts w JOIN athletes a ON w.athlete_id = a.id 
    WHERE a.email = 'joshua.hudson@bobsleigh.com'
UNION ALL
SELECT CONCAT('✅ Workout Exercises: ', count(*), ' exercise records') 
    FROM workout_exercises we 
    JOIN workouts w ON we.workout_id = w.id
    JOIN athletes a ON w.athlete_id = a.id 
    WHERE a.email = 'joshua.hudson@bobsleigh.com'
UNION ALL
SELECT '🎯 Database ready for ML model training!' as status;