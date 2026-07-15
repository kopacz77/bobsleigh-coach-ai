-- ============================================================
-- Role-Based Access Control Migration
-- ============================================================
-- Run this in the Supabase SQL Editor (Dashboard > SQL Editor).
-- It sets up automatic role assignment for new users and
-- provides a helper function for RLS policies.
-- ============================================================

-- 1. Trigger function: set default role on new user signup
-- Uses app_metadata (not user_metadata) because app_metadata
-- is NOT writable by the client -- only by service_role or
-- database triggers with SECURITY DEFINER.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Set default role to 'athlete' in app_metadata
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) || '{"role": "athlete"}'::jsonb
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 2. Helper function: get current user's role from JWT
-- Useful in RLS policies (Plan 02-04) to gate access by role.
-- Falls back to 'athlete' when no role is set.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'role'),
    'athlete'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- 3. Helper function: check if current user is a coach
-- Convenience wrapper for RLS policies.
-- ============================================================

CREATE OR REPLACE FUNCTION public.is_coach()
RETURNS boolean AS $$
  SELECT public.get_user_role() = 'coach';
$$ LANGUAGE sql STABLE SECURITY DEFINER;


-- ============================================================
-- Manual role promotion
-- ============================================================
-- To promote a user to coach, run one of:
--
--   UPDATE auth.users
--   SET raw_app_meta_data = raw_app_meta_data || '{"role": "coach"}'::jsonb
--   WHERE id = '<user-uuid>';
--
-- Or use the Supabase dashboard:
--   Authentication > Users > Select user > Edit > App metadata
--   Set: {"role": "coach"}
--
-- To promote to admin:
--   UPDATE auth.users
--   SET raw_app_meta_data = raw_app_meta_data || '{"role": "admin"}'::jsonb
--   WHERE id = '<user-uuid>';
-- ============================================================
