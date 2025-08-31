-- FIX NUMERIC FIELD PRECISION ERRORS
-- Run this after fresh_clean_schema.sql but before insert_joshua_data.sql

-- Fix training_loads table numeric precision issues
ALTER TABLE public.training_loads 
    ALTER COLUMN rpe TYPE numeric(4,2),
    ALTER COLUMN fatigue_level TYPE numeric(4,2),
    ALTER COLUMN soreness_level TYPE numeric(4,2),
    ALTER COLUMN motivation_level TYPE numeric(4,2),
    ALTER COLUMN sleep_hours TYPE numeric(5,2),
    ALTER COLUMN sleep_quality TYPE numeric(4,2),
    ALTER COLUMN stress_level TYPE numeric(4,2);

-- Fix wellbeing_assessments table numeric precision issues  
ALTER TABLE public.wellbeing_assessments
    ALTER COLUMN sleep_hours TYPE numeric(5,2),
    ALTER COLUMN readiness_score TYPE numeric(6,2);

-- Fix workouts table numeric precision issues
ALTER TABLE public.workouts
    ALTER COLUMN planned_load TYPE numeric(6,2),
    ALTER COLUMN actual_load TYPE numeric(6,2),
    ALTER COLUMN effectiveness_score TYPE numeric(4,2);

-- Fix workout_exercises table numeric precision issues
ALTER TABLE public.workout_exercises
    ALTER COLUMN planned_weight TYPE numeric(7,2),
    ALTER COLUMN actual_weight TYPE numeric(7,2),
    ALTER COLUMN planned_distance TYPE numeric(8,2),
    ALTER COLUMN actual_distance TYPE numeric(8,2),
    ALTER COLUMN planned_time_seconds TYPE numeric(8,2),
    ALTER COLUMN actual_time_seconds TYPE numeric(8,2),
    ALTER COLUMN intensity_percent TYPE numeric(6,2);

-- Fix performance_metrics table numeric precision issues
ALTER TABLE public.performance_metrics
    ALTER COLUMN value TYPE numeric(12,4),
    ALTER COLUMN previous_best TYPE numeric(12,4),
    ALTER COLUMN improvement_percent TYPE numeric(6,2);

SELECT 'Numeric field precision fixed! Now run insert_joshua_data.sql' as status;