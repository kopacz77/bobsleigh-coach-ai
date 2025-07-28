-- PRODUCTION SUPABASE SCHEMA
-- This is the current live schema in Supabase (as of 2025-07-25)
-- DO NOT MODIFY - This is for documentation purposes only

-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_log (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  action text NOT NULL,
  resource_type text NOT NULL,
  resource_id uuid,
  details jsonb,
  ip_address text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_log_pkey PRIMARY KEY (id),
  CONSTRAINT activity_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.athletes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone_number text,
  sport_id uuid,
  height double precision,
  weight double precision,
  birth_date date,
  physical_profile jsonb,
  training_preferences jsonb,
  settings jsonb,
  onboarding_completed boolean DEFAULT false,
  is_active boolean DEFAULT true,
  role text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT athletes_pkey PRIMARY KEY (id),
  CONSTRAINT athletes_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.coach_athletes (
  coach_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  relationship_type text,
  access_level text,
  started_at date NOT NULL DEFAULT CURRENT_DATE,
  ended_at date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coach_athletes_pkey PRIMARY KEY (coach_id, athlete_id),
  CONSTRAINT coach_athletes_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id),
  CONSTRAINT coach_athletes_coach_id_fkey FOREIGN KEY (coach_id) REFERENCES public.coaches(id)
);

CREATE TABLE public.coaches (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone_number text,
  specialization ARRAY,
  bio text,
  certification ARRAY,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coaches_pkey PRIMARY KEY (id),
  CONSTRAINT coaches_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.competitions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  athlete_id uuid NOT NULL,
  sport_id uuid,
  competition_name text NOT NULL,
  competition_date date NOT NULL,
  level text,
  result jsonb,
  performance_metrics jsonb,
  feedback text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT competitions_pkey PRIMARY KEY (id),
  CONSTRAINT competitions_sport_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id),
  CONSTRAINT competitions_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id)
);

CREATE TABLE public.daily_metrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  athlete_id uuid,
  date date NOT NULL,
  metrics jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT daily_metrics_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id),
  CONSTRAINT daily_metrics_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.exercises (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  category text,
  measurement_type text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT exercises_pkey PRIMARY KEY (id)
);

CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  created_by uuid,
  title text,
  message text,
  type text,
  content jsonb,
  is_read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.performance_metrics (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  athlete_id uuid NOT NULL,
  date date NOT NULL,
  metric_type text NOT NULL,
  metric_name text NOT NULL,
  value double precision NOT NULL,
  unit text,
  confidence_interval jsonb,
  progression_rate double precision,
  comparison_to_baseline double precision,
  phase text,
  contributing_factors ARRAY,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT performance_metrics_pkey PRIMARY KEY (id),
  CONSTRAINT performance_metrics_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id)
);

CREATE TABLE public.permissions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  resource text NOT NULL,
  action text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT permissions_pkey PRIMARY KEY (id)
);

CREATE TABLE public.role_permissions (
  role_id uuid NOT NULL,
  permission_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id),
  CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id),
  CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id)
);

CREATE TABLE public.roles (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT roles_pkey PRIMARY KEY (id)
);

CREATE TABLE public.sessions (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  device_info jsonb,
  location_info jsonb,
  ip_address text,
  is_active boolean DEFAULT true,
  last_activity timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sessions_pkey PRIMARY KEY (id),
  CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.sport_knowledge_base (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  sport_id uuid,
  topic text NOT NULL,
  content text NOT NULL,
  source_type text,
  source_reference text,
  confidence_score double precision,
  validated_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sport_knowledge_base_pkey PRIMARY KEY (id),
  CONSTRAINT sport_knowledge_base_sport_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id),
  CONSTRAINT sport_knowledge_base_validated_by_fkey FOREIGN KEY (validated_by) REFERENCES auth.users(id)
);

CREATE TABLE public.sports (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  category text NOT NULL,
  description text,
  training_focus ARRAY,
  has_ice_training boolean DEFAULT false,
  has_off_ice_training boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT sports_pkey PRIMARY KEY (id)
);

CREATE TABLE public.team_members (
  team_id uuid NOT NULL,
  athlete_id uuid NOT NULL,
  role text,
  joined_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT team_members_pkey PRIMARY KEY (team_id, athlete_id),
  CONSTRAINT team_members_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id),
  CONSTRAINT team_members_team_id_fkey FOREIGN KEY (team_id) REFERENCES public.teams(id)
);

CREATE TABLE public.teams (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  sport_id uuid,
  captain_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT teams_pkey PRIMARY KEY (id),
  CONSTRAINT teams_captain_id_fkey FOREIGN KEY (captain_id) REFERENCES public.athletes(id),
  CONSTRAINT teams_sport_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id)
);

CREATE TABLE public.training_components (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  category text NOT NULL,
  importance_level integer,
  progression_path jsonb,
  sport_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT training_components_pkey PRIMARY KEY (id),
  CONSTRAINT training_components_sport_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id)
);

CREATE TABLE public.training_loads (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  athlete_id uuid NOT NULL,
  date date NOT NULL,
  training_load double precision NOT NULL,
  ctl double precision,
  atl double precision,
  tsb double precision,
  rpe double precision,
  fatigue double precision,
  soreness double precision,
  sleep_quality double precision,
  sleep_hours double precision,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT training_loads_pkey PRIMARY KEY (id),
  CONSTRAINT training_loads_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id)
);

CREATE TABLE public.training_locations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  address text,
  coordinates jsonb,
  facilities jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT training_locations_pkey PRIMARY KEY (id)
);

CREATE TABLE public.training_phases (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  description text,
  sport_id uuid,
  duration_weeks integer,
  sequence_order integer,
  focus_areas ARRAY,
  mhg_target_range jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT training_phases_pkey PRIMARY KEY (id),
  CONSTRAINT training_phases_sport_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id)
);

CREATE TABLE public.training_recommendations (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  athlete_id uuid NOT NULL,
  sport_id uuid,
  date date NOT NULL,
  recommendation_date date NOT NULL,
  workout_type text NOT NULL,
  focus text NOT NULL,
  duration integer,
  intensity text,
  exercises jsonb,
  content text,
  basis ARRAY,
  recommendation_type text,
  priority integer,
  confidence_score double precision,
  effectiveness_feedback jsonb,
  phase text,
  notes text,
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT training_recommendations_pkey PRIMARY KEY (id),
  CONSTRAINT training_recommendations_sport_id_fkey FOREIGN KEY (sport_id) REFERENCES public.sports(id),
  CONSTRAINT training_recommendations_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id)
);

CREATE TABLE public.user_locations (
  user_id uuid NOT NULL,
  location_id uuid NOT NULL,
  is_favorite boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_locations_pkey PRIMARY KEY (user_id, location_id),
  CONSTRAINT user_locations_location_id_fkey FOREIGN KEY (location_id) REFERENCES public.training_locations(id),
  CONSTRAINT user_locations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.user_roles (
  user_id uuid NOT NULL,
  role_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id),
  CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.user_settings (
  user_id uuid NOT NULL,
  theme text DEFAULT 'light'::text,
  notification_preferences jsonb DEFAULT '{"sms": false, "push": true, "email": true}'::jsonb,
  dashboard_layout jsonb,
  language text DEFAULT 'en'::text,
  timezone text DEFAULT 'UTC'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT user_settings_pkey PRIMARY KEY (user_id),
  CONSTRAINT user_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.wellbeing_assessments (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  sleep_quality integer,
  stress_level integer,
  nutrition_quality integer,
  physical_readiness integer,
  mental_clarity integer,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wellbeing_assessments_pkey PRIMARY KEY (id),
  CONSTRAINT wellbeing_assessments_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);

CREATE TABLE public.workout_exercises (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  workout_id uuid NOT NULL,
  exercise_id uuid NOT NULL,
  sets integer,
  reps integer,
  weight double precision,
  distance double precision,
  time double precision,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workout_exercises_pkey PRIMARY KEY (id),
  CONSTRAINT workout_exercises_exercise_id_fkey FOREIGN KEY (exercise_id) REFERENCES public.exercises(id),
  CONSTRAINT workout_exercises_workout_id_fkey FOREIGN KEY (workout_id) REFERENCES public.workouts(id)
);

CREATE TABLE public.workouts (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  athlete_id uuid NOT NULL,
  name text NOT NULL,
  date date NOT NULL,
  duration integer,
  type text NOT NULL,
  notes text,
  phase text,
  intensity_level integer,
  effectiveness_score double precision,
  recovery_metrics jsonb,
  performance_metrics jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT workouts_pkey PRIMARY KEY (id),
  CONSTRAINT workouts_athlete_id_fkey FOREIGN KEY (athlete_id) REFERENCES public.athletes(id)
);