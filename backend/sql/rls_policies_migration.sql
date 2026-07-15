-- RLS POLICIES MIGRATION
-- =====================
-- Replaces the permissive USING (true) policies from fresh_clean_schema.sql
-- with proper auth.uid()-based policies that enforce data isolation.
--
-- PREREQUISITES:
--   1. fresh_clean_schema.sql must be deployed (tables exist, RLS enabled)
--   2. auth_roles_migration.sql from Plan 02-03 should be deployed first
--      (creates handle_new_user trigger and get_user_role helper function)
--
-- HOW IT WORKS:
--   - The backend uses the SERVICE_ROLE_KEY via get_supabase(), which
--     BYPASSES RLS entirely. Backend handles its own authorization in Python.
--   - These RLS policies protect against direct Supabase client access from
--     the frontend, which uses the anon key and respects RLS.
--   - Athletes can only see/modify their own data.
--   - Coaches can read data for athletes assigned to them (via coach_athletes).
--   - Reference data (sports, exercises) remains publicly readable.
--
-- TO TEST:
--   Use the Supabase SQL editor with a specific user JWT, or use the
--   Supabase client library with the anon key and a logged-in session.

-- ========================================
-- STEP 1: DROP PERMISSIVE POLICIES
-- ========================================
-- Remove the overly permissive USING (true) policies from fresh_clean_schema

DROP POLICY IF EXISTS "Athletes manage own data" ON public.athletes;
DROP POLICY IF EXISTS "Athletes manage workouts" ON public.workouts;
DROP POLICY IF EXISTS "Athletes manage workout_exercises" ON public.workout_exercises;
DROP POLICY IF EXISTS "Athletes manage performance" ON public.performance_metrics;
DROP POLICY IF EXISTS "Athletes manage loads" ON public.training_loads;
DROP POLICY IF EXISTS "Athletes manage wellbeing" ON public.wellbeing_assessments;
DROP POLICY IF EXISTS "Athletes manage recommendations" ON public.training_recommendations;

-- ========================================
-- STEP 2: ATHLETES TABLE POLICIES
-- ========================================

-- Athletes can read their own profile
CREATE POLICY "athletes_select_own" ON public.athletes
  FOR SELECT USING (user_id = auth.uid());

-- Athletes can update their own profile
CREATE POLICY "athletes_update_own" ON public.athletes
  FOR UPDATE USING (user_id = auth.uid());

-- Coaches can read profiles of their assigned athletes
CREATE POLICY "coaches_select_athletes" ON public.athletes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coaches c
      JOIN public.coach_athletes ca ON ca.coach_id = c.id
      WHERE c.user_id = auth.uid()
      AND ca.athlete_id = athletes.id
    )
  );

-- Note: Service role key automatically bypasses RLS, so no explicit
-- policy is needed for backend/admin operations.

-- ========================================
-- STEP 3: WORKOUTS TABLE POLICIES
-- ========================================

-- Athletes can read their own workouts
CREATE POLICY "athletes_select_own_workouts" ON public.workouts
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Athletes can create workouts for themselves
CREATE POLICY "athletes_insert_own_workouts" ON public.workouts
  FOR INSERT WITH CHECK (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Athletes can update their own workouts
CREATE POLICY "athletes_update_own_workouts" ON public.workouts
  FOR UPDATE USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Coaches can read workouts of their assigned athletes
CREATE POLICY "coaches_select_workouts" ON public.workouts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coaches c
      JOIN public.coach_athletes ca ON ca.coach_id = c.id
      WHERE c.user_id = auth.uid()
      AND ca.athlete_id = workouts.athlete_id
    )
  );

-- ========================================
-- STEP 4: WORKOUT EXERCISES TABLE POLICIES
-- ========================================

-- Athletes can read exercises in their own workouts
CREATE POLICY "athletes_select_own_workout_exercises" ON public.workout_exercises
  FOR SELECT USING (
    workout_id IN (
      SELECT w.id FROM public.workouts w
      JOIN public.athletes a ON a.id = w.athlete_id
      WHERE a.user_id = auth.uid()
    )
  );

-- Athletes can add exercises to their own workouts
CREATE POLICY "athletes_insert_own_workout_exercises" ON public.workout_exercises
  FOR INSERT WITH CHECK (
    workout_id IN (
      SELECT w.id FROM public.workouts w
      JOIN public.athletes a ON a.id = w.athlete_id
      WHERE a.user_id = auth.uid()
    )
  );

-- Athletes can update exercises in their own workouts
CREATE POLICY "athletes_update_own_workout_exercises" ON public.workout_exercises
  FOR UPDATE USING (
    workout_id IN (
      SELECT w.id FROM public.workouts w
      JOIN public.athletes a ON a.id = w.athlete_id
      WHERE a.user_id = auth.uid()
    )
  );

-- Coaches can read workout exercises of their assigned athletes
CREATE POLICY "coaches_select_workout_exercises" ON public.workout_exercises
  FOR SELECT USING (
    workout_id IN (
      SELECT w.id FROM public.workouts w
      JOIN public.coaches c ON c.user_id = auth.uid()
      JOIN public.coach_athletes ca ON ca.coach_id = c.id AND ca.athlete_id = w.athlete_id
    )
  );

-- ========================================
-- STEP 5: PERFORMANCE METRICS TABLE POLICIES
-- ========================================

-- Athletes can read their own performance metrics
CREATE POLICY "athletes_select_own_performance" ON public.performance_metrics
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Athletes can insert their own performance metrics
CREATE POLICY "athletes_insert_own_performance" ON public.performance_metrics
  FOR INSERT WITH CHECK (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Coaches can read performance metrics of their assigned athletes
CREATE POLICY "coaches_select_performance" ON public.performance_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coaches c
      JOIN public.coach_athletes ca ON ca.coach_id = c.id
      WHERE c.user_id = auth.uid()
      AND ca.athlete_id = performance_metrics.athlete_id
    )
  );

-- ========================================
-- STEP 6: TRAINING LOADS TABLE POLICIES
-- ========================================

-- Athletes can read their own training loads
CREATE POLICY "athletes_select_own_loads" ON public.training_loads
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Athletes can insert their own training loads
CREATE POLICY "athletes_insert_own_loads" ON public.training_loads
  FOR INSERT WITH CHECK (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Coaches can read training loads of their assigned athletes
CREATE POLICY "coaches_select_loads" ON public.training_loads
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coaches c
      JOIN public.coach_athletes ca ON ca.coach_id = c.id
      WHERE c.user_id = auth.uid()
      AND ca.athlete_id = training_loads.athlete_id
    )
  );

-- ========================================
-- STEP 7: WELLBEING ASSESSMENTS TABLE POLICIES
-- ========================================

-- Athletes can read their own wellbeing assessments
CREATE POLICY "athletes_select_own_wellbeing" ON public.wellbeing_assessments
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Athletes can insert their own wellbeing assessments
CREATE POLICY "athletes_insert_own_wellbeing" ON public.wellbeing_assessments
  FOR INSERT WITH CHECK (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Athletes can update their own wellbeing assessments
CREATE POLICY "athletes_update_own_wellbeing" ON public.wellbeing_assessments
  FOR UPDATE USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Coaches can read wellbeing assessments of their assigned athletes
CREATE POLICY "coaches_select_wellbeing" ON public.wellbeing_assessments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coaches c
      JOIN public.coach_athletes ca ON ca.coach_id = c.id
      JOIN public.athletes a ON a.id = ca.athlete_id
      WHERE c.user_id = auth.uid()
      AND wellbeing_assessments.athlete_id = a.id
    )
  );

-- ========================================
-- STEP 8: TRAINING RECOMMENDATIONS TABLE POLICIES
-- ========================================

-- Athletes can read their own recommendations
CREATE POLICY "athletes_select_own_recommendations" ON public.training_recommendations
  FOR SELECT USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Athletes can provide feedback on their recommendations
CREATE POLICY "athletes_update_own_recommendations" ON public.training_recommendations
  FOR UPDATE USING (
    athlete_id IN (SELECT id FROM public.athletes WHERE user_id = auth.uid())
  );

-- Coaches can read recommendations for their assigned athletes
CREATE POLICY "coaches_select_recommendations" ON public.training_recommendations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.coaches c
      JOIN public.coach_athletes ca ON ca.coach_id = c.id
      WHERE c.user_id = auth.uid()
      AND ca.athlete_id = training_recommendations.athlete_id
    )
  );

-- Coaches can create recommendations for their assigned athletes
CREATE POLICY "coaches_insert_recommendations" ON public.training_recommendations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.coaches c
      JOIN public.coach_athletes ca ON ca.coach_id = c.id
      WHERE c.user_id = auth.uid()
      AND ca.athlete_id = training_recommendations.athlete_id
    )
  );

-- ========================================
-- REFERENCE DATA (NO CHANGES NEEDED)
-- ========================================
-- Sports and exercises already have appropriate public read policies
-- from fresh_clean_schema.sql:
--   "Public read sports" ON public.sports FOR SELECT USING (true)
--   "Public read exercises" ON public.exercises FOR SELECT USING (is_active = true)
-- These are intentionally permissive since they are reference data.

-- ========================================
-- INDEX FOR RLS PERFORMANCE
-- ========================================
-- Add index on athletes.user_id since it is used in most RLS subqueries
CREATE INDEX IF NOT EXISTS idx_athletes_user_id ON public.athletes(user_id);

-- Add index on coaches.user_id for coach-based RLS lookups
CREATE INDEX IF NOT EXISTS idx_coaches_user_id ON public.coaches(user_id);

-- ========================================
-- VERIFICATION QUERY
-- ========================================
-- After running this migration, verify policies with:
-- SELECT tablename, policyname, permissive, cmd
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

SELECT 'RLS policies migration complete. Permissive policies replaced with auth.uid()-based policies.' AS status;
