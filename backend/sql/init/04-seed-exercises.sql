-- ============================================================================
-- SEED: EXERCISE LIBRARY
-- ============================================================================
-- Bobsleigh-focused exercise library combining:
--   * Joshua Hudson's documented training exercises
--   * Cyrus Gray methodology exercises (knowledge graph entries)
--   * Standard strength & conditioning movements
-- ============================================================================

INSERT INTO public.exercises (
    name, description, category, sport_id,
    measurement_type, equipment_needed, muscle_groups, difficulty_level, is_active
)
VALUES
    ('Power Clean', 'Explosive lift from floor to rack position', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['legs', 'back', 'shoulders']::text[], 4, TRUE),
    ('Power Snatch', 'Explosive overhead lift', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['legs', 'back', 'shoulders']::text[], 5, TRUE),
    ('Hang Power Clean', 'Power clean starting from hang position (Cyrus Gray)', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['legs', 'back']::text[], 4, TRUE),
    ('Hang Power Snatch', 'Power snatch from hang position', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['legs', 'back', 'shoulders']::text[], 4, TRUE),
    ('Hang Snatch', 'Snatch from hang position (Cyrus Gray)', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['legs', 'back', 'shoulders']::text[], 5, TRUE),
    ('Power Clean from Blocks', 'Power clean starting from blocks at mid-thigh', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates', 'blocks']::text[], ARRAY['legs', 'back']::text[], 4, TRUE),
    ('Power Snatch from Blocks', 'Power snatch from blocks at mid-thigh', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates', 'blocks']::text[], ARRAY['legs', 'back', 'shoulders']::text[], 4, TRUE),
    ('Clean from Block', 'Full clean from blocks (Cyrus Gray)', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates', 'blocks']::text[], ARRAY['legs', 'back']::text[], 5, TRUE),
    ('Split Jerk', 'Overhead jerk with split stance (Cyrus Gray)', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['shoulders', 'legs']::text[], 4, TRUE),
    ('Push Press', 'Standing overhead press with leg drive', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['shoulders', 'legs']::text[], 3, TRUE),
    ('Push Jerk', 'Overhead jerk with quarter squat catch (Cyrus Gray)', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['shoulders', 'legs']::text[], 4, TRUE),
    ('Dumbbell Hang Clean', 'Hang clean with dumbbells (Cyrus Gray)', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['dumbbells']::text[], ARRAY['legs', 'back']::text[], 3, TRUE),
    ('Dumbbell Snatch', 'Single-arm dumbbell snatch (Cyrus Gray)', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['dumbbells']::text[], ARRAY['legs', 'back', 'shoulders']::text[], 3, TRUE),
    ('Kettlebell Swing', 'Russian or American kettlebell swing (Cyrus Gray)', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['kettlebell']::text[], ARRAY['posterior_chain', 'core']::text[], 2, TRUE),
    ('Muscle Snatch', 'Snatch without leg rebend, all upper body (Cyrus Gray)', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['shoulders', 'back']::text[], 4, TRUE),
    ('High Pull from Hang', 'Olympic pull variation from hang (Cyrus Gray)', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['back', 'traps']::text[], 3, TRUE),
    ('Snatch-Grip High Pull', 'Wide-grip high pull (Cyrus Gray)', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['back', 'traps']::text[], 3, TRUE),
    ('Snatch-Grip Deadlift + Overhead Press', 'Compound snatch-grip pull and press (Cyrus Gray)', 'olympic_lifts', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['back', 'shoulders', 'legs']::text[], 4, TRUE),
    ('Front Squat', 'Front-loaded squat - quad strength foundation', 'squats', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['legs', 'core']::text[], 3, TRUE),
    ('Front Squat (Slow Tempo)', 'Front squat with controlled tempo (Cyrus Gray methodology)', 'squats', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['legs', 'core']::text[], 3, TRUE),
    ('Back Squat', 'Maximum strength foundation for all power movements', 'squats', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['legs', 'core']::text[], 3, TRUE),
    ('Box Squat', 'Squat to box for depth control (Cyrus Gray)', 'squats', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates', 'box']::text[], ARRAY['legs']::text[], 3, TRUE),
    ('Safety Bar Squat', 'Squat using safety bar (Cyrus Gray)', 'squats', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['safety_bar', 'plates']::text[], ARRAY['legs', 'upper_back']::text[], 3, TRUE),
    ('Goblet Squat', 'Dumbbell/kettlebell front-rack squat (Cyrus Gray)', 'squats', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['dumbbells']::text[], ARRAY['legs', 'core']::text[], 2, TRUE),
    ('Leg Press', 'Machine leg press (Cyrus Gray)', 'squats', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['leg_press']::text[], ARRAY['legs']::text[], 2, TRUE),
    ('Bulgarian Split Squat', 'Single-leg rear-foot-elevated split squat', 'squats', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['dumbbells', 'bench']::text[], ARRAY['legs', 'core']::text[], 3, TRUE),
    ('30m Sprint', 'Primary bobsleigh distance - acceleration benchmark', 'sprints', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['track']::text[], ARRAY['legs']::text[], 2, TRUE),
    ('60m Sprint', 'Speed development distance', 'sprints', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['track']::text[], ARRAY['legs']::text[], 3, TRUE),
    ('100m Sprint', 'Speed endurance for bobsleigh track length', 'sprints', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['track']::text[], ARRAY['legs']::text[], 3, TRUE),
    ('30m Flying Sprint', '30m sprint with flying start after 20m buildup', 'sprints', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['track']::text[], ARRAY['legs']::text[], 3, TRUE),
    ('Resisted Sprints', 'Sled or band-resisted acceleration work', 'sprints', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['sled', 'track']::text[], ARRAY['legs']::text[], 3, TRUE),
    ('Fartlek Training', 'Variable-pace running intervals (Joshua Hudson template)', 'sprints', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['track']::text[], ARRAY['legs']::text[], 2, TRUE),
    ('Broad Jump', 'Horizontal power test - correlates to push performance', 'jumps', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'distance', ARRAY['field']::text[], ARRAY['legs']::text[], 2, TRUE),
    ('Triple Broad Jump', 'Repeated horizontal power - mimics push steps', 'jumps', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'distance', ARRAY['field']::text[], ARRAY['legs']::text[], 3, TRUE),
    ('Box Jump', 'Vertical jump onto box', 'jumps', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'distance', ARRAY['box']::text[], ARRAY['legs']::text[], 2, TRUE),
    ('Bounding', 'Alternating leg bounds for distance and power', 'plyometrics', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'distance', ARRAY['field']::text[], ARRAY['legs']::text[], 3, TRUE),
    ('Hurdle Jumps', 'Bilateral hurdle clearance for power', 'plyometrics', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'reps', ARRAY['hurdles']::text[], ARRAY['legs']::text[], 3, TRUE),
    ('Depth Jumps', 'Step-off plyometric reactive jump', 'plyometrics', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'reps', ARRAY['box']::text[], ARRAY['legs']::text[], 4, TRUE),
    ('Sled Push', 'Sport-specific pushing power development', 'sport_specific', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['sled', 'plates']::text[], ARRAY['legs', 'core']::text[], 3, TRUE),
    ('Push Practice', 'Bobsleigh push start mechanics', 'sport_specific', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['push_track']::text[], ARRAY['legs', 'core']::text[], 4, TRUE),
    ('Ice Push', 'Live bobsleigh push starts', 'sport_specific', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['sled', 'ice_track']::text[], ARRAY['full_body']::text[], 5, TRUE),
    ('Heavy Sled Drag', 'Resistance sled drag for strength endurance', 'sport_specific', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['sled', 'plates']::text[], ARRAY['legs', 'core']::text[], 3, TRUE),
    ('Romanian Deadlift', 'Posterior chain strength for sled pushing', 'strength', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['hamstrings', 'glutes']::text[], 3, TRUE),
    ('Conventional Deadlift', 'Floor pull for max strength', 'strength', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['posterior_chain', 'back']::text[], 4, TRUE),
    ('Snatch-Grip Deadlift', 'Wide-grip deadlift (Cyrus Gray)', 'strength', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['back', 'legs']::text[], 4, TRUE),
    ('Bench Press', 'Horizontal upper body push', 'strength', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates', 'bench']::text[], ARRAY['chest', 'triceps', 'shoulders']::text[], 2, TRUE),
    ('Incline Bench Press', 'Upper chest emphasis bench', 'strength', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates', 'incline_bench']::text[], ARRAY['chest', 'shoulders']::text[], 3, TRUE),
    ('Overhead Press', 'Standing strict press', 'strength', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['shoulders', 'core']::text[], 3, TRUE),
    ('Weighted Pull-up', 'Loaded vertical pull', 'strength', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['pullup_bar', 'weight_belt']::text[], ARRAY['back', 'biceps']::text[], 4, TRUE),
    ('Barbell Row', 'Bent-over row for back thickness', 'strength', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates']::text[], ARRAY['back', 'biceps']::text[], 3, TRUE),
    ('Hip Thrust', 'Loaded glute extension', 'strength', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'weight', ARRAY['barbell', 'plates', 'bench']::text[], ARRAY['glutes', 'hamstrings']::text[], 2, TRUE),
    ('Plank', 'Isometric core stability hold', 'core', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['mat']::text[], ARRAY['core']::text[], 1, TRUE),
    ('Ab Wheel Rollout', 'Anti-extension core exercise', 'core', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'reps', ARRAY['ab_wheel']::text[], ARRAY['core']::text[], 3, TRUE),
    ('Hanging Leg Raise', 'Hanging hip flexion for core', 'core', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'reps', ARRAY['pullup_bar']::text[], ARRAY['core', 'hip_flexors']::text[], 2, TRUE),
    ('Pallof Press', 'Anti-rotation core exercise', 'core', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'reps', ARRAY['cable', 'band']::text[], ARRAY['core']::text[], 2, TRUE),
    ('Running', 'Continuous aerobic running', 'aerobic', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['track', 'running_shoes']::text[], ARRAY['legs', 'cardiovascular']::text[], 1, TRUE),
    ('Jogging', 'Easy aerobic recovery jog', 'aerobic', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['running_shoes']::text[], ARRAY['legs']::text[], 1, TRUE),
    ('Stair Running', 'Stair running for power endurance', 'aerobic', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['stairs']::text[], ARRAY['legs']::text[], 3, TRUE),
    ('Cycling', 'Stationary or road cycling for aerobic base', 'aerobic', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['bike']::text[], ARRAY['legs', 'cardiovascular']::text[], 1, TRUE),
    ('Rowing', 'Erg rowing for aerobic/anaerobic mix', 'aerobic', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['rower']::text[], ARRAY['full_body']::text[], 2, TRUE),
    ('Stretching', 'Static stretching for flexibility and recovery', 'recovery', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['mat']::text[], ARRAY['full_body']::text[], 1, TRUE),
    ('Adductor Stretching', 'Specific adductor stretching (Joshua Hudson focus)', 'recovery', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['mat']::text[], ARRAY['adductors']::text[], 1, TRUE),
    ('Foam Rolling', 'Self-myofascial release', 'recovery', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['foam_roller']::text[], ARRAY['full_body']::text[], 1, TRUE),
    ('Mobility Drills', 'Active range of motion work', 'recovery', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'time', ARRAY['mat']::text[], ARRAY['full_body']::text[], 1, TRUE),
    ('Technique Drills', 'Sport-specific skill development drills', 'sport_specific', (SELECT id FROM public.sports WHERE name = 'Bobsleigh'), 'reps', ARRAY['track']::text[], ARRAY['coordination']::text[], 2, TRUE)
ON CONFLICT (name) DO NOTHING;

SELECT 'Exercise library seeded' as status, 65 as count;
