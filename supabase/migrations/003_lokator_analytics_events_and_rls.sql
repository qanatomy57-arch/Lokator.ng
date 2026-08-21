-- ============================================================================
-- LOKATOR.NG — PHASE 5.2D MIGRATION: REMOTE TELEMETRY SINK & RLS HARDENING
-- Migration: 003_lokator_analytics_events_and_rls.sql
-- Security: Append-Only, Zero Public Read, Case-Insensitive PII Rejection,
--           Server-Side Session Rate Throttling & Server Timestamp Enforcement
-- ============================================================================

-- 1. Create public.analytics_events table with strict schema validation
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    event_name VARCHAR(64) NOT NULL,
    page_path VARCHAR(128) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Database-level check constraints (Defense in Depth)
    CONSTRAINT check_event_name_format CHECK (event_name ~ '^[a-z0-9_]{3,64}$'),
    CONSTRAINT check_event_name_length CHECK (length(event_name) <= 64),
    CONSTRAINT check_page_path_length CHECK (length(page_path) <= 128),
    CONSTRAINT check_properties_size CHECK (octet_length(properties::text) <= 2048),
    
    -- Case-Insensitive & Deep-Inspection PII / Secret Rejection Constraint
    -- Rejects uppercase, lowercase, mixed-case, and nested occurrences of sensitive keys
    CONSTRAINT check_no_sensitive_keys_case_insensitive CHECK (
        properties::text !~* '"(password|pwd|token|access_token|refresh_token|jwt|auth|secret|service_role|api_key|apikey|key|nin|bvn|account_number|credit_card|phone|email|whatsapp_message|message|private_message)"\s*:'
    )
);

-- 2. Performance indexes for analytical aggregation, session rate-checks, and pruning
CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created 
    ON public.analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created 
    ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_created 
    ON public.analytics_events (session_id, created_at DESC);

-- 3. Server-Side Abuse Prevention & Timestamp Enforcement Trigger
CREATE OR REPLACE FUNCTION public.enforce_analytics_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_recent_count INT;
BEGIN
    -- Server-side timestamp enforcement: prevent client timestamp spoofing
    NEW.created_at := now();

    -- Server-side session rate throttling: max 30 events / session / 60 seconds
    SELECT count(*) INTO v_recent_count
    FROM public.analytics_events
    WHERE session_id = NEW.session_id
      AND created_at > (now() - INTERVAL '60 seconds');

    IF v_recent_count >= 30 THEN
        RAISE EXCEPTION 'Telemetry rate limit exceeded for session %', NEW.session_id
            USING ERRCODE = '23514'; -- check_violation
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_analytics_rate_limit ON public.analytics_events;
CREATE TRIGGER trg_enforce_analytics_rate_limit
    BEFORE INSERT ON public.analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_analytics_rate_limit();

-- 4. Enable Row-Level Security
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- 5. Revoke all default table privileges from public roles
REVOKE ALL ON public.analytics_events FROM PUBLIC, anon, authenticated;

-- Grant minimal necessary INSERT privilege
GRANT INSERT ON public.analytics_events TO anon, authenticated;

-- 6. Explicit Append-Only RLS Policy for anon & authenticated
DROP POLICY IF EXISTS "Allow append-only analytics event insert" ON public.analytics_events;
CREATE POLICY "Allow append-only analytics event insert"
    ON public.analytics_events
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(event_name) >= 3 AND
        length(event_name) <= 64 AND
        length(page_path) <= 128 AND
        octet_length(properties::text) <= 2048 AND
        properties::text !~* '"(password|pwd|token|access_token|refresh_token|jwt|auth|secret|service_role|api_key|apikey|key|nin|bvn|account_number|credit_card|phone|email|whatsapp_message|message|private_message)"\s*:'
    );

-- 7. Explicit Denial of SELECT, UPDATE, DELETE for Public Roles
DROP POLICY IF EXISTS "Deny public select" ON public.analytics_events;
DROP POLICY IF EXISTS "Deny public update" ON public.analytics_events;
DROP POLICY IF EXISTS "Deny public delete" ON public.analytics_events;

-- Document Security Posture
COMMENT ON TABLE public.analytics_events IS 'Secure, privacy-preserving, append-only client telemetry sink with case-insensitive PII exclusion, server-side session rate throttling, and zero public read access.';
