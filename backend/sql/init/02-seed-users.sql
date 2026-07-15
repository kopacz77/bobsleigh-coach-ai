-- ============================================================================
-- SEED: DEV USERS (coach + athlete Joshua Hudson)
-- ============================================================================
-- These UUIDs are deterministic and must match DEV_USER_ID in the
-- backend container's environment (see docker-compose.yml).
--
-- Coach user:    00000000-0000-0000-0000-000000000001 (coach@dev.local)
-- Athlete user:  00000000-0000-0000-0000-000000000002 (josh@dev.local)
-- Coach row:     00000000-0000-0000-0000-000000000010
-- Athlete row:   00000000-0000-0000-0000-000000000020 (Joshua Hudson)
-- ============================================================================

-- ----- Users -----------------------------------------------------------------
INSERT INTO public.users (id, email, role, app_metadata)
VALUES
    ('00000000-0000-0000-0000-000000000001',
     'coach@dev.local', 'coach',
     '{"role": "coach"}'::jsonb),
    ('00000000-0000-0000-0000-000000000002',
     'josh@dev.local', 'athlete',
     '{"role": "athlete"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- ----- Coaches ---------------------------------------------------------------
INSERT INTO public.coaches (id, user_id, first_name, last_name, email, specialization, is_active)
VALUES
    ('00000000-0000-0000-0000-000000000010',
     '00000000-0000-0000-0000-000000000001',
     'Dev', 'Coach',
     'coach@dev.local',
     ARRAY['bobsleigh', 'strength_and_conditioning'],
     true)
ON CONFLICT (id) DO NOTHING;

-- ----- Athletes (Joshua Hudson) ---------------------------------------------
INSERT INTO public.athletes (
    id, user_id, first_name, last_name, email, sport_id,
    height_cm, weight_kg, birth_date,
    training_level, training_frequency,
    onboarding_completed, is_active
)
VALUES
    ('00000000-0000-0000-0000-000000000020',
     '00000000-0000-0000-0000-000000000002',
     'Joshua', 'Hudson',
     'josh@dev.local',
     (SELECT id FROM public.sports WHERE name = 'Bobsleigh'),
     180, 101, '1995-01-01',
     'elite', 6,
     true, true)
ON CONFLICT (id) DO NOTHING;

-- ----- Coach-athlete relationship -------------------------------------------
INSERT INTO public.coach_athletes (coach_id, athlete_id, relationship_type, access_level)
VALUES
    ('00000000-0000-0000-0000-000000000010',
     '00000000-0000-0000-0000-000000000020',
     'primary',
     'full')
ON CONFLICT (coach_id, athlete_id) DO NOTHING;

SELECT 'Dev users seeded successfully' as status;
