-- Weekly Plans Migration
-- Adds the weekly_plans table for AI-generated training plan storage
-- with approval state machine, versioning, and injury risk metadata.
--
-- Depends on: athletes table, coaches table (from production_schema.sql)
-- Run after: fresh_clean_schema.sql or production_schema.sql

-- Enable uuid extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ========================================
-- WEEKLY PLANS TABLE
-- ========================================

CREATE TABLE public.weekly_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    athlete_id UUID NOT NULL REFERENCES public.athletes(id),
    coach_id UUID REFERENCES public.coaches(id),
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,

    -- Plan content
    plan_data JSONB NOT NULL,
    training_phase TEXT NOT NULL,

    -- State machine: pending_review -> approved | rejected
    status TEXT NOT NULL DEFAULT 'pending_review',
    approved_at TIMESTAMPTZ,
    approved_by UUID,
    rejected_at TIMESTAMPTZ,
    rejected_by UUID,
    rejection_notes TEXT,

    -- Versioning (increments on regeneration after rejection)
    version INTEGER NOT NULL DEFAULT 1,
    parent_plan_id UUID REFERENCES public.weekly_plans(id),

    -- Generation metadata (PMC state, inputs used at generation time)
    generation_metadata JSONB,
    injury_risk_score NUMERIC(4,3),
    injury_risk_factors JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(athlete_id, week_start, version),

    -- Status must be one of the valid states
    CONSTRAINT chk_weekly_plans_status
        CHECK (status IN ('pending_review', 'approved', 'rejected')),

    -- week_start must be a Monday (DOW: 0=Sun, 1=Mon, ..., 6=Sat)
    CONSTRAINT chk_weekly_plans_week_start_monday
        CHECK (EXTRACT(DOW FROM week_start) = 1)
);

-- ========================================
-- INDEXES
-- ========================================

-- Coach review queue: find pending plans ordered by week
CREATE INDEX idx_plans_status ON public.weekly_plans(status, week_start);

-- Athlete plan lookup: find plans for an athlete in a given week
CREATE INDEX idx_plans_athlete_week ON public.weekly_plans(athlete_id, week_start);

-- ========================================
-- ROW LEVEL SECURITY
-- ========================================

ALTER TABLE public.weekly_plans ENABLE ROW LEVEL SECURITY;

-- Simplified policy matching other tables (backend uses service role key)
CREATE POLICY "Manage weekly plans" ON public.weekly_plans FOR ALL USING (true);

-- ========================================
-- UPDATED_AT TRIGGER
-- ========================================

-- Reuse the update trigger function if it exists, otherwise create it
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER weekly_plans_updated_at
    BEFORE UPDATE ON public.weekly_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
