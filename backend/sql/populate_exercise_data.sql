-- Populate Exercise Library with Joshua Hudson's Training Data
-- This script populates the comprehensive exercise library with real-world training data

-- Insert Exercise Categories
INSERT INTO exercise_categories (name, description) VALUES
('olympic_lifts', 'Olympic weightlifting movements and variations'),
('strength', 'Traditional strength training exercises'),
('power', 'Explosive power development exercises'),
('sprint', 'Sprint and speed development exercises'),
('aerobic', 'Aerobic conditioning exercises'),
('technique', 'Sport-specific technique development'),
('recovery', 'Recovery and mobility exercises'),
('core', 'Core stability and strength exercises'),
('bobsleigh_specific', 'Bobsleigh-specific training exercises'),
('general', 'General fitness and conditioning exercises')
ON CONFLICT (name) DO NOTHING;

-- Insert Equipment
INSERT INTO equipment (name, description, category, required_space, cost_category) VALUES
('barbell', 'Olympic barbell for weightlifting', 'barbell', 'medium', 'high'),
('plates', 'Weight plates for barbell', 'barbell', 'medium', 'high'),
('squat_rack', 'Squat rack or power rack', 'barbell', 'large', 'high'),
('lifting_platform', 'Olympic lifting platform', 'barbell', 'large', 'high'),
('running_shoes', 'Athletic running shoes', 'footwear', 'small', 'low'),
('track', 'Running track or suitable surface', 'surface', 'large', 'medium'),
('starting_blocks', 'Sprint starting blocks', 'sprint', 'small', 'medium'),
('hurdles', 'Training hurdles', 'sprint', 'medium', 'medium'),
('stairs', 'Stairs for stair running', 'surface', 'large', 'free'),
('mat', 'Exercise mat for floor exercises', 'accessory', 'small', 'low'),
('sled', 'Training sled for pushing/pulling', 'sled', 'medium', 'high'),
('push_track', 'Bobsled push track', 'bobsleigh', 'large', 'high'),
('bodyweight', 'No equipment needed', 'bodyweight', 'small', 'free'),
('open_space', 'Open area for movement', 'space', 'medium', 'free')
ON CONFLICT (name) DO NOTHING;

-- Insert Muscle Groups
INSERT INTO muscle_groups (name, description, region) VALUES
('quadriceps', 'Quadriceps muscles', 'lower_body'),
('hamstrings', 'Hamstring muscles', 'lower_body'),
('glutes', 'Gluteal muscles', 'lower_body'),
('calves', 'Calf muscles', 'lower_body'),
('hip_flexors', 'Hip flexor muscles', 'lower_body'),
('chest', 'Pectoral muscles', 'upper_body'),
('shoulders', 'Deltoid muscles', 'upper_body'),
('back', 'Latissimus dorsi and rhomboids', 'upper_body'),
('traps', 'Trapezius muscles', 'upper_body'),
('biceps', 'Bicep muscles', 'upper_body'),
('triceps', 'Tricep muscles', 'upper_body'),
('forearms', 'Forearm muscles', 'upper_body'),
('core', 'Core stabilizing muscles', 'core'),
('abdominals', 'Abdominal muscles', 'core'),
('obliques', 'Oblique muscles', 'core'),
('lower_back', 'Lower back muscles', 'core'),
('full_body', 'Multiple muscle groups', 'full_body')
ON CONFLICT (name) DO NOTHING;

-- Insert Core High-Relevance Exercises from Joshua Hudson's Data
WITH exercise_data AS (
    SELECT 
        'Front Squat' as name,
        (SELECT id FROM exercise_categories WHERE name = 'strength') as category_id,
        'squat_variations' as subcategory,
        'very_high' as bobsleigh_relevance,
        'squat_pattern' as movement_pattern,
        'phosphocreatine' as energy_system,
        3 as typical_sets_min, 5 as typical_sets_max,
        3 as typical_reps_min, 8 as typical_reps_max,
        70 as intensity_min_percent, 90 as intensity_max_percent,
        120 as rest_seconds_min, 240 as rest_seconds_max,
        2 as frequency_per_week_min, 3 as frequency_per_week_max,
        'progressive_overload' as progression_type,
        ARRAY['Elbows high', 'Chest up', 'Drive through heels', 'Knees track over toes'] as coaching_cues,
        ARRAY['Use safety bars when possible', 'Ensure proper spotting', 'Progress weight gradually'] as safety_considerations,
        ARRAY['1RM', '3RM', 'Depth Quality', 'Tempo Control'] as assessment_metrics,
        'Front squat with barbell in front rack position' as description
    UNION ALL
    SELECT 
        'Front Squat (Slow Tempo)',
        (SELECT id FROM exercise_categories WHERE name = 'strength'),
        'squat_variations',
        'very_high',
        'squat_pattern',
        'phosphocreatine',
        3, 5, 5, 8, 60, 80, 120, 240, 2, 3,
        'progressive_overload',
        ARRAY['Control the descent', 'Pause at bottom', 'Elbows high throughout'],
        ARRAY['Reduce weight for tempo work', 'Focus on control'],
        ARRAY['Tempo consistency', 'Depth quality', 'Control'],
        'Front squat performed with slow controlled tempo'
    UNION ALL
    SELECT 
        'Back Squat',
        (SELECT id FROM exercise_categories WHERE name = 'strength'),
        'squat_variations',
        'very_high',
        'squat_pattern', 
        'phosphocreatine',
        3, 5, 3, 8, 70, 90, 120, 240, 2, 3,
        'progressive_overload',
        ARRAY['Chest up', 'Drive through heels', 'Hip hinge back', 'Neutral spine'],
        ARRAY['Use safety bars', 'Proper bar position', 'Full depth only'],
        ARRAY['1RM', 'Depth', 'Bar path', 'Speed'],
        'Back squat with barbell on upper back'
    UNION ALL
    SELECT 
        'Power Clean',
        (SELECT id FROM exercise_categories WHERE name = 'olympic_lifts'),
        'clean_variations',
        'very_high',
        'triple_extension',
        'phosphocreatine',
        3, 6, 1, 3, 70, 95, 180, 300, 2, 3,
        'load_and_technique',
        ARRAY['Aggressive second pull', 'Fast elbows', 'Receive in quarter squat', 'Bar close to body'],
        ARRAY['Proper warm-up essential', 'Use qualified spotters', 'Master technique first'],
        ARRAY['1RM', '3RM', 'Bar Speed', 'Technique Score'],
        'Power clean from floor to front rack position'
    UNION ALL
    SELECT 
        'Power Clean from Blocks',
        (SELECT id FROM exercise_categories WHERE name = 'olympic_lifts'),
        'clean_variations',
        'very_high',
        'triple_extension',
        'phosphocreatine',
        3, 6, 1, 3, 70, 95, 180, 300, 2, 3,
        'load_and_technique',
        ARRAY['Explosive hip extension', 'Fast elbows', 'Active shoulders', 'Quick feet'],
        ARRAY['Blocks at mid-thigh height', 'Focus on acceleration', 'Perfect position'],
        ARRAY['Power output', 'Technique', 'Consistency'],
        'Power clean starting from blocks at mid-thigh height'
    UNION ALL
    SELECT 
        'Power Snatch',
        (SELECT id FROM exercise_categories WHERE name = 'olympic_lifts'),
        'snatch_variations',
        'high',
        'triple_extension',
        'phosphocreatine',
        3, 5, 1, 3, 70, 90, 180, 300, 2, 3,
        'load_and_technique',
        ARRAY['Wide grip', 'Aggressive pull', 'Fast turnover', 'Receive overhead'],
        ARRAY['Master overhead position', 'Progress load gradually', 'Use lifting platform'],
        ARRAY['1RM', 'Technique', 'Overhead stability'],
        'Power snatch from floor to overhead position'
    UNION ALL
    SELECT 
        'Power Snatch from Blocks',
        (SELECT id FROM exercise_categories WHERE name = 'olympic_lifts'),
        'snatch_variations',
        'high',
        'triple_extension',
        'phosphocreatine',
        3, 5, 1, 3, 70, 90, 180, 300, 2, 3,
        'load_and_technique',
        ARRAY['Powerful hip extension', 'Quick turnover', 'Strong overhead'],
        ARRAY['Blocks at mid-thigh', 'Perfect starting position'],
        ARRAY['Power', 'Speed', 'Consistency'],
        'Power snatch from blocks starting at mid-thigh'
    UNION ALL
    SELECT 
        '30m Sprint',
        (SELECT id FROM exercise_categories WHERE name = 'sprint'),
        'acceleration',
        'very_high',
        'horizontal_propulsion',
        'phosphocreatine',
        4, 8, 1, 1, 95, 100, 120, 300, 2, 4,
        'speed_and_distance',
        ARRAY['Powerful first step', 'Stay low initially', 'Pump arms aggressively', 'Gradual rise'],
        ARRAY['Adequate warm-up required', 'Proper footwear essential', 'Allow full recovery'],
        ARRAY['Time', 'Split Times', 'Acceleration Curve', 'Start Reaction'],
        'Maximum effort 30 meter sprint'
    UNION ALL
    SELECT 
        '60m Sprint',
        (SELECT id FROM exercise_categories WHERE name = 'sprint'),
        'speed_development',
        'high',
        'horizontal_propulsion',
        'phosphocreatine',
        4, 6, 1, 1, 95, 100, 180, 300, 2, 3,
        'speed_and_distance',
        ARRAY['Strong start', 'Transition to upright', 'Maintain speed', 'Relaxed finish'],
        ARRAY['Full warm-up', 'Track conditions', 'Complete recovery'],
        ARRAY['Time', 'Splits', 'Top speed'],
        'Maximum effort 60 meter sprint'
    UNION ALL
    SELECT 
        '100m Sprint',
        (SELECT id FROM exercise_categories WHERE name = 'sprint'),
        'speed_endurance',
        'medium',
        'horizontal_propulsion',
        'phosphocreatine',
        3, 5, 1, 1, 95, 100, 240, 360, 1, 2,
        'speed_and_endurance',
        ARRAY['Acceleration phase', 'Maintain form', 'Speed endurance', 'Strong finish'],
        ARRAY['Complete warm-up', 'Pacing strategy', 'Full recovery'],
        ARRAY['Time', 'Splits', 'Speed maintenance'],
        'Maximum effort 100 meter sprint'
    UNION ALL
    SELECT 
        '30m Flying Sprint',
        (SELECT id FROM exercise_categories WHERE name = 'sprint'),
        'max_velocity',
        'medium',
        'horizontal_propulsion',
        'phosphocreatine',
        3, 5, 1, 1, 100, 100, 180, 300, 2, 3,
        'max_velocity',
        ARRAY['Build up speed', 'Relaxed at top speed', 'Maintain form'],
        ARRAY['Proper build-up distance', 'Mark zones clearly'],
        ARRAY['Flying time', 'Top speed', 'Efficiency'],
        '30m sprint with flying start after 20m buildup'
    UNION ALL
    SELECT 
        'Broad Jump',
        (SELECT id FROM exercise_categories WHERE name = 'power'),
        'jumping',
        'very_high',
        'explosive_extension',
        'phosphocreatine',
        3, 5, 3, 6, NULL, NULL, 120, 300, 2, 3,
        'complexity_and_speed',
        ARRAY['Arm swing', 'Hip hinge load', 'Explosive takeoff', 'Land safely'],
        ARRAY['Safe landing area', 'Proper takeoff technique'],
        ARRAY['Distance', 'Takeoff Angle', 'Landing Quality'],
        'Standing broad jump for maximum distance'
    UNION ALL
    SELECT 
        'Triple Broad Jump',
        (SELECT id FROM exercise_categories WHERE name = 'power'),
        'jumping',
        'very_high',
        'explosive_extension',
        'phosphocreatine',
        3, 5, 3, 5, NULL, NULL, 120, 300, 2, 3,
        'complexity_and_speed',
        ARRAY['Consistent rhythm', 'Maintain forward momentum', 'Each jump maximal'],
        ARRAY['Clear landing area', 'Progressive loading'],
        ARRAY['Total Distance', 'Consistency', 'Rhythm'],
        'Three consecutive broad jumps for maximum total distance'
    UNION ALL
    SELECT 
        'Bounding',
        (SELECT id FROM exercise_categories WHERE name = 'power'),
        'bounding',
        'high',
        'explosive_extension',
        'phosphocreatine',
        3, 5, 6, 12, NULL, NULL, 90, 240, 2, 3,
        'complexity_and_speed',
        ARRAY['Alternate leg bounds', 'Maximum distance per bound', 'Arm drive'],
        ARRAY['Safe surface', 'Progressive volume'],
        ARRAY['Distance per bound', 'Rhythm', 'Ground contact'],
        'Alternating leg bounds for distance and power'
    UNION ALL
    SELECT 
        'Hurdles',
        (SELECT id FROM exercise_categories WHERE name = 'power'),
        'plyometric',
        'high',
        'explosive_extension',
        'phosphocreatine',
        3, 5, 6, 10, NULL, NULL, 90, 180, 2, 3,
        'complexity_and_speed',
        ARRAY['Quick ground contact', 'Lead with knee', 'Maintain rhythm'],
        ARRAY['Appropriate hurdle height', 'Clear pathway'],
        ARRAY['Contact time', 'Clearance', 'Rhythm'],
        'Hurdle training for power and coordination'
    UNION ALL
    SELECT 
        'Running',
        (SELECT id FROM exercise_categories WHERE name = 'aerobic'),
        'steady_state',
        'medium',
        'cyclical_locomotion',
        'aerobic',
        NULL, NULL, NULL, NULL, 60, 85, NULL, NULL, 2, 4,
        'duration_and_intensity',
        ARRAY['Relaxed form', 'Consistent pace', 'Nasal breathing'],
        ARRAY['Appropriate footwear', 'Safe route', 'Hydration'],
        ARRAY['Distance', 'Time', 'Heart rate', 'Perceived effort'],
        'Continuous running for aerobic conditioning'
    UNION ALL
    SELECT 
        'Jogging',
        (SELECT id FROM exercise_categories WHERE name = 'aerobic'),
        'recovery',
        'low',
        'cyclical_locomotion',
        'aerobic',
        NULL, NULL, NULL, NULL, 50, 70, NULL, NULL, 1, 3,
        'active_recovery',
        ARRAY['Very easy pace', 'Conversation pace', 'Relaxed'],
        ARRAY['Comfortable pace only', 'Proper footwear'],
        ARRAY['Duration', 'Comfort level'],
        'Easy jogging for active recovery'
    UNION ALL
    SELECT 
        'Stair Running',
        (SELECT id FROM exercise_categories WHERE name = 'aerobic'),
        'power_endurance',
        'medium',
        'vertical_locomotion',
        'mixed',
        3, 5, 1, 1, 80, 95, 180, 300, 1, 2,
        'power_endurance',
        ARRAY['Drive through legs', 'Use arms', 'Consistent rhythm'],
        ARRAY['Safe stairs', 'Check conditions', 'Controlled descent'],
        ARRAY['Time', 'Power output', 'Consistency'],
        'Stair running for power and conditioning'
    UNION ALL
    SELECT 
        'Technique Drills',
        (SELECT id FROM exercise_categories WHERE name = 'technique'),
        'skill_development',
        'high',
        'skill_based',
        'skill_based',
        3, 5, 5, 15, NULL, NULL, 60, 180, 2, 4,
        'skill_refinement',
        ARRAY['Focus on quality', 'Slow to fast progression', 'Perfect practice'],
        ARRAY['Master basics first', 'Quality over quantity'],
        ARRAY['Technique quality', 'Consistency', 'Transfer to performance'],
        'Sport-specific skill development drills'
    UNION ALL
    SELECT 
        'Stretching',
        (SELECT id FROM exercise_categories WHERE name = 'recovery'),
        'flexibility',
        'low',
        'range_of_motion',
        'parasympathetic',
        NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 1, 7,
        'range_of_motion',
        ARRAY['Hold for 30+ seconds', 'Breathe deeply', 'No bouncing', 'Gentle progression'],
        ARRAY['No forced stretching', 'Warm muscles first'],
        ARRAY['Range of Motion', 'Flexibility Score', 'Asymmetry Check'],
        'Static stretching for flexibility and recovery'
    UNION ALL
    SELECT 
        'Adductor Stretching',
        (SELECT id FROM exercise_categories WHERE name = 'recovery'),
        'flexibility',
        'medium',
        'range_of_motion',
        'parasympathetic',
        2, 4, NULL, NULL, NULL, NULL, NULL, NULL, 1, 7,
        'range_of_motion',
        ARRAY['Gentle progression', 'Hold stretch', 'Breathe normally'],
        ARRAY['No forcing', 'Progress gradually'],
        ARRAY['Range of motion', 'Symmetry'],
        'Specific stretching for adductor muscles - emphasized by Joshua Hudson'
)
INSERT INTO exercise_library (
    name, category_id, subcategory, bobsleigh_relevance, movement_pattern, energy_system,
    typical_sets_min, typical_sets_max, typical_reps_min, typical_reps_max,
    intensity_min_percent, intensity_max_percent, rest_seconds_min, rest_seconds_max,
    frequency_per_week_min, frequency_per_week_max, progression_type,
    coaching_cues, safety_considerations, assessment_metrics, description
)
SELECT * FROM exercise_data
ON CONFLICT (name) DO UPDATE SET
    bobsleigh_relevance = EXCLUDED.bobsleigh_relevance,
    updated_at = CURRENT_TIMESTAMP;

-- Insert Equipment Relationships for Key Exercises
WITH equipment_relationships AS (
    SELECT 
        el.id as exercise_id,
        eq.id as equipment_id,
        true as is_required
    FROM exercise_library el
    CROSS JOIN equipment eq
    WHERE 
        (el.name LIKE '%Squat%' AND eq.name IN ('barbell', 'plates', 'squat_rack')) OR
        (el.name LIKE '%Clean%' AND eq.name IN ('barbell', 'plates', 'lifting_platform')) OR
        (el.name LIKE '%Snatch%' AND eq.name IN ('barbell', 'plates', 'lifting_platform')) OR
        (el.name LIKE '%Sprint%' AND eq.name IN ('running_shoes', 'track')) OR
        (el.name LIKE '%Jump%' AND eq.name IN ('open_space')) OR
        (el.name = 'Bounding' AND eq.name IN ('running_shoes', 'open_space')) OR
        (el.name = 'Hurdles' AND eq.name IN ('hurdles', 'running_shoes')) OR
        (el.name = 'Running' AND eq.name = 'running_shoes') OR
        (el.name = 'Jogging' AND eq.name = 'running_shoes') OR
        (el.name = 'Stair Running' AND eq.name IN ('stairs', 'running_shoes')) OR
        (el.name = 'Stretching' AND eq.name = 'mat') OR
        (el.name = 'Adductor Stretching' AND eq.name = 'mat')
)
INSERT INTO exercise_equipment (exercise_id, equipment_id, is_required)
SELECT exercise_id, equipment_id, is_required
FROM equipment_relationships
ON CONFLICT (exercise_id, equipment_id) DO NOTHING;

-- Insert Muscle Group Relationships
WITH muscle_group_relationships AS (
    SELECT 
        el.id as exercise_id,
        mg.id as muscle_group_id,
        CASE 
            WHEN el.name LIKE '%Squat%' AND mg.name IN ('quadriceps', 'glutes') THEN 'primary'
            WHEN el.name LIKE '%Squat%' AND mg.name IN ('hamstrings', 'core') THEN 'secondary'
            WHEN el.name LIKE '%Clean%' AND mg.name IN ('hamstrings', 'glutes', 'traps') THEN 'primary'
            WHEN el.name LIKE '%Clean%' AND mg.name IN ('quadriceps', 'shoulders', 'core') THEN 'secondary'
            WHEN el.name LIKE '%Snatch%' AND mg.name IN ('hamstrings', 'glutes', 'shoulders') THEN 'primary'
            WHEN el.name LIKE '%Snatch%' AND mg.name IN ('traps', 'core', 'back') THEN 'secondary'
            WHEN el.name LIKE '%Sprint%' AND mg.name IN ('quadriceps', 'glutes', 'hamstrings') THEN 'primary'
            WHEN el.name LIKE '%Sprint%' AND mg.name IN ('calves', 'hip_flexors') THEN 'secondary'
            WHEN el.name LIKE '%Jump%' AND mg.name IN ('quadriceps', 'glutes') THEN 'primary'
            WHEN el.name LIKE '%Jump%' AND mg.name IN ('hamstrings', 'calves') THEN 'secondary'
            WHEN el.name = 'Bounding' AND mg.name IN ('quadriceps', 'glutes', 'hamstrings') THEN 'primary'
            WHEN el.name = 'Hurdles' AND mg.name IN ('quadriceps', 'hip_flexors') THEN 'primary'
            WHEN el.name IN ('Running', 'Jogging', 'Stair Running') AND mg.name = 'full_body' THEN 'primary'
            WHEN el.name LIKE '%Stretch%' AND mg.name = 'full_body' THEN 'primary'
            ELSE 'stabilizer'
        END as involvement_level
    FROM exercise_library el
    CROSS JOIN muscle_groups mg
    WHERE 
        (el.name LIKE '%Squat%' AND mg.name IN ('quadriceps', 'glutes', 'hamstrings', 'core')) OR
        (el.name LIKE '%Clean%' AND mg.name IN ('hamstrings', 'glutes', 'traps', 'quadriceps', 'shoulders', 'core')) OR
        (el.name LIKE '%Snatch%' AND mg.name IN ('hamstrings', 'glutes', 'shoulders', 'traps', 'core', 'back')) OR
        (el.name LIKE '%Sprint%' AND mg.name IN ('quadriceps', 'glutes', 'hamstrings', 'calves', 'hip_flexors')) OR
        (el.name LIKE '%Jump%' AND mg.name IN ('quadriceps', 'glutes', 'hamstrings', 'calves')) OR
        (el.name = 'Bounding' AND mg.name IN ('quadriceps', 'glutes', 'hamstrings')) OR
        (el.name = 'Hurdles' AND mg.name IN ('quadriceps', 'hip_flexors')) OR
        (el.name IN ('Running', 'Jogging', 'Stair Running') AND mg.name = 'full_body') OR
        (el.name LIKE '%Stretch%' AND mg.name = 'full_body')
)
INSERT INTO exercise_muscle_groups (exercise_id, muscle_group_id, involvement_level)
SELECT exercise_id, muscle_group_id, involvement_level
FROM muscle_group_relationships
ON CONFLICT (exercise_id, muscle_group_id) DO NOTHING;

-- Insert Training Protocols from Joshua Hudson's Data
INSERT INTO training_protocols (name, protocol_type, category, description, protocol_data, equipment_required, bobsleigh_relevance, purpose) VALUES
(
    'Standard Fartlek Protocol',
    'fartlek_standard',
    'aerobic',
    'Progressive interval training with varying work-rest periods based on Joshua Hudson''s training',
    '{"intervals": [
        {"run_seconds": 30, "walk_seconds": 30, "work_rest_ratio": 1.0},
        {"run_seconds": 60, "walk_seconds": 60, "work_rest_ratio": 1.0},
        {"run_seconds": 90, "walk_seconds": 90, "work_rest_ratio": 1.0},
        {"run_seconds": 90, "walk_seconds": 90, "work_rest_ratio": 1.0},
        {"run_seconds": 60, "walk_seconds": 60, "work_rest_ratio": 1.0},
        {"run_seconds": 30, "walk_seconds": 30, "work_rest_ratio": 1.0},
        {"run_seconds": 30, "walk_seconds": 30, "work_rest_ratio": 1.0},
        {"run_seconds": 60, "walk_seconds": 60, "work_rest_ratio": 1.0},
        {"run_seconds": 90, "walk_seconds": 90, "work_rest_ratio": 1.0},
        {"run_seconds": 90, "walk_seconds": 90, "work_rest_ratio": 1.0},
        {"run_seconds": 60, "walk_seconds": 60, "work_rest_ratio": 1.0},
        {"run_seconds": 30, "walk_seconds": 30, "work_rest_ratio": 1.0},
        {"run_seconds": 30, "walk_seconds": 30, "work_rest_ratio": 1.0},
        {"run_seconds": 60, "walk_seconds": 60, "work_rest_ratio": 1.0},
        {"run_seconds": 90, "walk_seconds": 90, "work_rest_ratio": 1.0}
    ], "total_intervals": 15, "total_duration_minutes": 30.0, "intensity": "moderate_to_high"}',
    ARRAY['running_shoes'],
    'high',
    'Aerobic capacity and recovery development'
),
(
    'Sprint Acceleration Protocol', 
    'sprint_acceleration',
    'anaerobic',
    'Short distance sprint training for acceleration development',
    '{"distances": ["10m", "20m", "30m"], "purpose": "Start and early acceleration", "rest_periods": "90-120 seconds between reps", "volume": "6-10 reps", "intensity": "100% effort"}',
    ARRAY['running_shoes', 'track', 'starting_blocks'],
    'very_high',
    'Acceleration and start development for bobsleigh'
),
(
    'Max Strength Protocol',
    'max_strength',
    'strength', 
    'Maximum strength development protocol',
    '{"intensity": "85-100% 1RM", "sets": "3-6", "reps": "1-5", "rest": "3-5 minutes", "exercises": ["Back Squat", "Front Squat"]}',
    ARRAY['barbell', 'plates', 'squat_rack'],
    'very_high',
    'Maximum strength development for power foundation'
),
(
    'Olympic Lift Power Protocol',
    'olympic_power',
    'power',
    'Power development through Olympic lifting variations',
    '{"intensity": "70-85% 1RM", "sets": "3-5", "reps": "1-3", "rest": "3-4 minutes", "exercises": ["Power Clean", "Power Snatch"]}',
    ARRAY['barbell', 'plates', 'lifting_platform'],
    'very_high',
    'Explosive power development for bobsleigh starts'
)
ON CONFLICT DO NOTHING;

-- Insert Training Templates
INSERT INTO training_templates (name, template_type, duration_minutes_min, duration_minutes_max, frequency_per_week, intensity_level, volume_level, description, structure) VALUES
(
    'Strength Training Day',
    'strength_day',
    60, 90,
    '2-3',
    'high',
    'medium_high',
    'Strength focused training session based on Joshua Hudson''s protocols',
    '[
        {"phase": "warm_up", "duration": "10-15 min", "exercises": ["general_mobility", "dynamic_stretching"]},
        {"phase": "main_lifts", "duration": "30-40 min", "exercises": ["squat_variation", "olympic_lift"]},
        {"phase": "accessory", "duration": "15-20 min", "exercises": ["core", "stability"]},
        {"phase": "cool_down", "duration": "5-10 min", "exercises": ["static_stretching"]}
    ]'
),
(
    'Power Training Day',
    'power_day', 
    45, 75,
    '2-3',
    'very_high',
    'low_medium',
    'Power and explosiveness training session',
    '[
        {"phase": "warm_up", "duration": "15-20 min", "exercises": ["dynamic_warm_up", "activation"]},
        {"phase": "power_development", "duration": "25-35 min", "exercises": ["jumps", "throws", "olympic_lifts"]},
        {"phase": "speed_strength", "duration": "10-15 min", "exercises": ["light_resistance_sprints"]},
        {"phase": "recovery", "duration": "5-10 min", "exercises": ["light_mobility"]}
    ]'
),
(
    'Speed Training Day',
    'speed_day',
    45, 60, 
    '2-3',
    'very_high',
    'low',
    'Sprint and speed development session',
    '[
        {"phase": "warm_up", "duration": "20-25 min", "exercises": ["progressive_running", "drills"]},
        {"phase": "acceleration", "duration": "15-20 min", "exercises": ["short_sprints", "starts"]},
        {"phase": "max_velocity", "duration": "10-15 min", "exercises": ["flying_sprints"]},
        {"phase": "cool_down", "duration": "10 min", "exercises": ["easy_jogging", "stretching"]}
    ]'
),
(
    'Recovery Training Day',
    'recovery_day',
    30, 60,
    '1-2', 
    'very_low',
    'low',
    'Active recovery and mobility session',
    '[
        {"phase": "active_recovery", "duration": "20-30 min", "exercises": ["light_jogging", "easy_bike"]},
        {"phase": "mobility", "duration": "15-20 min", "exercises": ["stretching", "foam_rolling"]},
        {"phase": "corrective", "duration": "10-15 min", "exercises": ["activation", "stability"]}
    ]'
)
ON CONFLICT DO NOTHING;

-- Insert some exercise variations
INSERT INTO exercise_variations (base_exercise_id, variation_name, difficulty_level, modification_type, description) VALUES
((SELECT id FROM exercise_library WHERE name = 'Front Squat'), 'Front Squat (Pause)', 'advanced', 'tempo', '3-second pause at bottom of squat'),
((SELECT id FROM exercise_library WHERE name = 'Front Squat'), 'Goblet Squat', 'beginner', 'load', 'Squat holding dumbbell at chest'),
((SELECT id FROM exercise_library WHERE name = 'Power Clean'), 'Hang Power Clean', 'intermediate', 'range_of_motion', 'Power clean starting from hang position'),
((SELECT id FROM exercise_library WHERE name = 'Power Clean'), 'Clean Pull', 'beginner', 'partial_movement', 'First pull of clean movement only'),
((SELECT id FROM exercise_library WHERE name = '30m Sprint'), 'Block Start 30m', 'advanced', 'starting_position', '30m sprint from starting blocks'),
((SELECT id FROM exercise_library WHERE name = '30m Sprint'), 'Standing Start 30m', 'intermediate', 'starting_position', '30m sprint from standing start')
ON CONFLICT DO NOTHING;

-- Insert exercise progressions  
INSERT INTO exercise_progressions (from_exercise_id, to_exercise_id, progression_type, order_sequence, criteria) VALUES
((SELECT id FROM exercise_library WHERE name = 'Stretching'), (SELECT id FROM exercise_library WHERE name = 'Technique Drills'), 'prerequisite', 1, 'Adequate mobility and flexibility'),
((SELECT id FROM exercise_library WHERE name = 'Technique Drills'), (SELECT id FROM exercise_library WHERE name = '30m Sprint'), 'prerequisite', 2, 'Basic movement competency'),
((SELECT id FROM exercise_library WHERE name = '30m Sprint'), (SELECT id FROM exercise_library WHERE name = '60m Sprint'), 'advancement', 3, 'Consistent 30m times and good technique'),
((SELECT id FROM exercise_library WHERE name = '60m Sprint'), (SELECT id FROM exercise_library WHERE name = '100m Sprint'), 'advancement', 4, 'Speed endurance development needed'),
((SELECT id FROM exercise_library WHERE name = 'Broad Jump'), (SELECT id FROM exercise_library WHERE name = 'Triple Broad Jump'), 'advancement', 2, 'Consistent broad jump technique and distance'),
((SELECT id FROM exercise_library WHERE name = 'Front Squat'), (SELECT id FROM exercise_library WHERE name = 'Power Clean'), 'prerequisite', 1, 'Front rack mobility and squatting strength')
ON CONFLICT DO NOTHING;

-- Create summary view of the populated data
CREATE OR REPLACE VIEW v_exercise_library_summary AS
SELECT 
    ec.name as category,
    COUNT(*) as exercise_count,
    COUNT(CASE WHEN el.bobsleigh_relevance = 'very_high' THEN 1 END) as very_high_relevance,
    COUNT(CASE WHEN el.bobsleigh_relevance = 'high' THEN 1 END) as high_relevance,
    COUNT(CASE WHEN el.bobsleigh_relevance = 'medium' THEN 1 END) as medium_relevance,
    COUNT(CASE WHEN el.bobsleigh_relevance = 'low' THEN 1 END) as low_relevance
FROM exercise_library el
JOIN exercise_categories ec ON el.category_id = ec.id  
GROUP BY ec.name
ORDER BY exercise_count DESC;

-- Display summary
SELECT 
    'Exercise Library Population Complete' as status,
    (SELECT COUNT(*) FROM exercise_library) as total_exercises,
    (SELECT COUNT(*) FROM training_protocols) as total_protocols,
    (SELECT COUNT(*) FROM training_templates) as total_templates,
    (SELECT COUNT(*) FROM exercise_equipment) as equipment_relationships,
    (SELECT COUNT(*) FROM exercise_muscle_groups) as muscle_group_relationships;

-- Show high relevance exercises
SELECT 
    'High Relevance Exercises for Bobsleigh' as summary_title,
    el.name,
    ec.name as category,
    el.bobsleigh_relevance
FROM exercise_library el
JOIN exercise_categories ec ON el.category_id = ec.id
WHERE el.bobsleigh_relevance IN ('very_high', 'high')
ORDER BY 
    CASE el.bobsleigh_relevance 
        WHEN 'very_high' THEN 1 
        WHEN 'high' THEN 2 
    END,
    el.name;