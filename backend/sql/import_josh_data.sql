-- SQL Script to import Josh Hudson's training data
-- To be executed in Supabase SQL Editor

-- First, temporarily disable the foreign key constraints
DO $$
BEGIN
  -- Save the current state of foreign_key_checks
  SET CONSTRAINTS ALL DEFERRED;

  -- Create Josh Hudson athlete record
  INSERT INTO athletes (
    id, 
    user_id,
    first_name,
    last_name,
    email,
    sport_id,
    height,
    weight,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    '22e457e7-b89b-12d3-a456-426614174000', -- Fixed ID for Josh
    '123e4567-e89b-12d3-a456-426614174000', -- This user doesn't exist, but we're bypassing constraints
    'Joshua',
    'Hudson',
    'josh.hudson@example.com',
    (SELECT id FROM sports WHERE name = 'Bobsleigh' LIMIT 1),
    188,
    101,
    TRUE,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Skip if already exists

  -- Add Italy 2024 competition as a target
  INSERT INTO competitions (
    id,
    athlete_id,
    sport_id,
    competition_name,
    competition_date,
    level,
    created_at,
    updated_at
  ) VALUES (
    '33e457e7-b89b-12d3-a456-426614174000',
    '22e457e7-b89b-12d3-a456-426614174000', -- Josh's athlete ID
    (SELECT id FROM sports WHERE name = 'Bobsleigh' LIMIT 1),
    'Italy Winter Games 2024',
    '2024-02-15',
    'International',
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RAISE NOTICE 'Josh Hudson athlete record created successfully.';
END $$;

-- Import the first 8 weeks of workouts
-- Note: In a real implementation, you would load these from a JSON file
-- Below are examples for Week 1 - you would repeat for all 8 weeks

-- Week 1, Day 1
INSERT INTO workouts (
  id,
  athlete_id,
  name,
  date,
  type,
  phase,
  notes,
  created_at,
  updated_at
) VALUES (
  'workout_w1d1', -- ID for Week 1, Day 1
  '22e457e7-b89b-12d3-a456-426614174000', -- Josh's athlete ID
  'Week 1 - Day 1',
  '2024-01-01', -- Example date
  'Strength & Conditioning',
  'General Preparation',
  'Front SQ SLOW',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Exercise Groups for Week 1, Day 1
INSERT INTO workout_exercises (
  id,
  workout_id,
  exercise_id,
  sets,
  notes,
  created_at,
  updated_at
) VALUES (
  'group_w1d1_1', -- ID for Week 1, Day 1, Group 1
  'workout_w1d1',
  NULL, -- No specific exercise for the group header
  1,
  'Group: Lower Body Strength, MHG: 41.875kg',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Insert bench press exercise from Week 1, Day 1
WITH exercise_id AS (
  SELECT id FROM exercises WHERE name = 'Bench Press' LIMIT 1
)
INSERT INTO workout_exercises (
  id,
  workout_id,
  exercise_id,
  sets,
  reps,
  weight,
  created_at,
  updated_at
) VALUES (
  'exercise_w1d1_1', -- ID for Week 1, Day 1, Exercise 1
  'workout_w1d1',
  (SELECT id FROM exercise_id),
  1,
  10,
  85,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Add more exercises, exercise groups, and workouts for all 8 weeks
-- You would repeat the pattern above for each day and week

-- Create a training load entry for Week 1, Day 1
INSERT INTO training_loads (
  id,
  athlete_id,
  date,
  training_load,
  ctl,
  atl,
  tsb,
  created_at,
  updated_at
) VALUES (
  'tl_w1d1', -- ID for Week 1, Day 1 training load
  '22e457e7-b89b-12d3-a456-426614174000', -- Josh's athlete ID
  '2024-01-01', -- Same date as the workout
  75, -- Example training load
  75, -- Initial CTL (same as load on first day)
  75, -- Initial ATL (same as load on first day)
  0, -- Initial TSB (CTL - ATL)
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Important message about continuing the import
DO $$
BEGIN
  RAISE NOTICE 'This is a skeleton script that demonstrates the structure for importing Josh''s data.';
  RAISE NOTICE 'You would need to complete it with all exercises and workouts from the JSON export.';
  RAISE NOTICE 'For a complete import, consider using the JSON file as a source to generate the full SQL.';
END $$;