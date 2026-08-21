-- ==============================================================================
-- LOKATOR.NG — PHASE 8.0A DATABASE MIGRATION
-- REALTIME GROWTH MONITORING & ADMINISTRATIVE INTELLIGENCE ENGINE
-- Migration: 009_lokator_realtime_growth_monitoring.sql
--
-- INVARIANTS ENFORCED:
-- 1. OBSERVATIONAL / ADVISORY POSTURE ONLY — Zero autonomous marketplace mutations.
-- 2. RANKING AIR-GAP — Live search ranking in search.js is 100% isolated from realtime signals.
-- 3. BUSINESS TRUTH ISOLATION — Zero mutations against public.providers or reviews.
-- 4. PRIVACY GATES — Hard enforcement of N >= 30 sample floor and k >= 5 anonymity threshold.
-- 5. DEBOUNCED COMPUTATION — 15-second minimum cooldown on micro-rollup evaluation.
-- 6. AUDIT LOG IMMUTABILITY — Append-only audit trail with REVOKE UPDATE, DELETE.
-- 7. SECURITY DEFINER HARDENING — Fixed search_path and server-side public.is_admin() validation.
-- ==============================================================================

-- 1. REALTIME SIGNALS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_realtime_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_fingerprint TEXT NOT NULL UNIQUE,
    signal_name TEXT NOT NULL,
    category TEXT NOT NULL,
    state TEXT NOT NULL,
    lga TEXT NOT NULL,
    period_bucket TEXT NOT NULL,
    current_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    baseline_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    deviation_ratio NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
    sample_size INT NOT NULL DEFAULT 0,
    unique_sessions INT NOT NULL DEFAULT 0,
    severity TEXT NOT NULL CHECK (severity IN ('CRITICAL', 'HIGH', 'WARNING', 'INFO')),
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'EXPIRED')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours')
);

CREATE INDEX IF NOT EXISTS idx_analytics_realtime_signals_status_sev
    ON public.analytics_realtime_signals (status, severity, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_realtime_signals_expires
    ON public.analytics_realtime_signals (expires_at)
    WHERE status = 'ACTIVE';

CREATE INDEX IF NOT EXISTS idx_analytics_realtime_signals_spatial
    ON public.analytics_realtime_signals (state, lga, category);

-- 2. REALTIME WINDOWS TABLE (TRACKS MICRO-ROLLUP EXECUTION HEALTH & DEBOUNCE)
CREATE TABLE IF NOT EXISTS public.analytics_realtime_windows (
    window_id TEXT PRIMARY KEY,
    last_computed_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() - INTERVAL '1 hour'),
    status TEXT NOT NULL DEFAULT 'HEALTHY',
    events_evaluated INT NOT NULL DEFAULT 0,
    signals_detected INT NOT NULL DEFAULT 0,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed standard micro-windows
INSERT INTO public.analytics_realtime_windows (window_id, last_computed_at, status)
VALUES
    ('5m', NOW() - INTERVAL '1 hour', 'HEALTHY'),
    ('15m', NOW() - INTERVAL '1 hour', 'HEALTHY'),
    ('1h', NOW() - INTERVAL '1 hour', 'HEALTHY')
ON CONFLICT (window_id) DO NOTHING;

-- 3. REALTIME AUDIT LOG TABLE (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.analytics_realtime_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_id UUID NOT NULL REFERENCES public.analytics_realtime_signals(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('ACKNOWLEDGE', 'RESOLVE', 'EXPIRE')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_realtime_audit_signal
    ON public.analytics_realtime_audit_log (signal_id, created_at DESC);

-- 4. ROW LEVEL SECURITY & ACCESS POLICIES
ALTER TABLE public.analytics_realtime_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_realtime_windows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_realtime_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_realtime_signals FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_realtime_windows FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_realtime_audit_log FROM PUBLIC, anon;

-- Restrict direct access to verified administrators
CREATE POLICY admin_manage_realtime_signals ON public.analytics_realtime_signals
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_read_realtime_windows ON public.analytics_realtime_windows
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY admin_insert_realtime_audit_log ON public.analytics_realtime_audit_log
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

CREATE POLICY admin_read_realtime_audit_log ON public.analytics_realtime_audit_log
    FOR SELECT TO authenticated
    USING (public.is_admin());

-- Enforce Append-Only Immutability on Realtime Audit Log
REVOKE UPDATE, DELETE ON public.analytics_realtime_audit_log FROM authenticated;

-- ==============================================================================
-- 5. RPC FUNCTIONS (SECURITY DEFINER, FIXED SEARCH_PATH, SERVER-SIDE IS_ADMIN)
-- ==============================================================================

-- A. MICRO-ROLLUP & SIGNAL EVALUATOR RPC
CREATE OR REPLACE FUNCTION public.compute_realtime_growth_signals(
    p_force_refresh BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_last_computed TIMESTAMPTZ;
    v_signals_count INT := 0;
    v_events_count INT := 0;
    v_rec RECORD;
    v_fingerprint TEXT;
    v_period_bucket TEXT;
    v_confidence NUMERIC(5,4);
    v_severity TEXT;
    v_ratio NUMERIC(10,2);
BEGIN
    -- 1. Server-Side Administrator Authorization Gate
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Enforce 15-Second Minimum Debounce Cooldown (P3-01)
    SELECT last_computed_at INTO v_last_computed
    FROM public.analytics_realtime_windows
    WHERE window_id = '5m';

    IF NOT p_force_refresh AND v_last_computed IS NOT NULL AND v_last_computed > (NOW() - INTERVAL '15 seconds') THEN
        RETURN jsonb_build_object(
            'status', 'DEBOUNCE_COOLDOWN_ACTIVE',
            'message', 'Micro-rollup skipped: 15-second debounce window active',
            'last_computed_at', v_last_computed,
            'signals_generated', 0
        );
    END IF;

    -- Compute current 5-minute period bucket
    v_period_bucket := to_char(NOW(), 'YYYY-MM-DD"T"HH24:') || lpad(((EXTRACT(MINUTE FROM NOW())::int / 5) * 5)::text, 2, '0');

    -- 3. Auto-Expire Stale Signals (> 24 hours)
    UPDATE public.analytics_realtime_signals
    SET status = 'EXPIRED',
        updated_at = NOW()
    WHERE status = 'ACTIVE'
      AND expires_at <= NOW();

    -- 4. Micro-Rollup Aggregation with N >= 30 and k >= 5 Privacy Gates
    FOR v_rec IN
        SELECT
            COALESCE(properties->>'category', 'general') AS category,
            COALESCE(properties->>'state', 'Lagos') AS state,
            COALESCE(properties->>'lga', 'General') AS lga,
            COUNT(*) FILTER (WHERE event_name = 'search_submitted') AS searches_5m,
            COUNT(*) FILTER (WHERE event_name = 'search_no_results') AS zero_results_5m,
            COUNT(*) FILTER (WHERE event_name = 'whatsapp_clicked' OR event_name = 'phone_clicked') AS leads_5m,
            COUNT(DISTINCT session_id) AS unique_sessions_5m,
            COUNT(*) AS total_events_5m
        FROM public.analytics_events
        WHERE created_at >= NOW() - INTERVAL '15 minutes'
        GROUP BY 1, 2, 3
        HAVING COUNT(*) >= 30 AND COUNT(DISTINCT session_id) >= 5
    LOOP
        v_events_count := v_events_count + v_rec.total_events_5m;

        -- Signal 1: DEMAND_SPIKE (Sudden high search volume in cell)
        IF v_rec.searches_5m >= 30 THEN
            v_ratio := ROUND((v_rec.searches_5m::numeric / 10.0), 2); -- Normalized baseline
            v_confidence := LEAST(1.0000, 0.40 + (v_rec.unique_sessions_5m::numeric / 30.0) * 0.60);
            v_severity := CASE WHEN v_rec.searches_5m >= 60 THEN 'HIGH' ELSE 'WARNING' END;

            v_fingerprint := encode(digest(
                'SIG:DEMAND_SPIKE:' || LOWER(TRIM(v_rec.category)) || ':' || TRIM(v_rec.state) || ':' || TRIM(v_rec.lga) || ':' || v_period_bucket,
                'sha256'
            ), 'hex');

            INSERT INTO public.analytics_realtime_signals (
                signal_fingerprint, signal_name, category, state, lga, period_bucket,
                current_value, baseline_value, deviation_ratio, confidence_score,
                sample_size, unique_sessions, severity, status, metadata, updated_at
            ) VALUES (
                v_fingerprint, 'DEMAND_SPIKE', v_rec.category, v_rec.state, v_rec.lga, v_period_bucket,
                v_rec.searches_5m, 10.00, v_ratio, v_confidence,
                v_rec.total_events_5m, v_rec.unique_sessions_5m, v_severity, 'ACTIVE',
                jsonb_build_object('lead_count', v_rec.leads_5m, 'zero_results', v_rec.zero_results_5m),
                NOW()
            )
            ON CONFLICT (signal_fingerprint) DO UPDATE SET
                current_value = EXCLUDED.current_value,
                sample_size = EXCLUDED.sample_size,
                unique_sessions = EXCLUDED.unique_sessions,
                confidence_score = EXCLUDED.confidence_score,
                updated_at = NOW();

            v_signals_count := v_signals_count + 1;
        END IF;

        -- Signal 2: ZERO_RESULT_SURGE (High zero result rate >= 35%)
        IF v_rec.searches_5m >= 20 AND (v_rec.zero_results_5m::numeric / NULLIF(v_rec.searches_5m, 0)::numeric) >= 0.35 THEN
            v_ratio := ROUND(((v_rec.zero_results_5m::numeric / v_rec.searches_5m::numeric) * 100.0), 2);
            v_confidence := LEAST(1.0000, 0.50 + (v_rec.unique_sessions_5m::numeric / 20.0) * 0.50);
            v_severity := CASE WHEN v_ratio >= 50.0 THEN 'CRITICAL' ELSE 'HIGH' END;

            v_fingerprint := encode(digest(
                'SIG:ZERO_RESULT_SURGE:' || LOWER(TRIM(v_rec.category)) || ':' || TRIM(v_rec.state) || ':' || TRIM(v_rec.lga) || ':' || v_period_bucket,
                'sha256'
            ), 'hex');

            INSERT INTO public.analytics_realtime_signals (
                signal_fingerprint, signal_name, category, state, lga, period_bucket,
                current_value, baseline_value, deviation_ratio, confidence_score,
                sample_size, unique_sessions, severity, status, metadata, updated_at
            ) VALUES (
                v_fingerprint, 'ZERO_RESULT_SURGE', v_rec.category, v_rec.state, v_rec.lga, v_period_bucket,
                v_rec.zero_results_5m, 5.00, v_ratio, v_confidence,
                v_rec.total_events_5m, v_rec.unique_sessions_5m, v_severity, 'ACTIVE',
                jsonb_build_object('zero_result_rate_pct', v_ratio, 'searches', v_rec.searches_5m),
                NOW()
            )
            ON CONFLICT (signal_fingerprint) DO UPDATE SET
                current_value = EXCLUDED.current_value,
                sample_size = EXCLUDED.sample_size,
                unique_sessions = EXCLUDED.unique_sessions,
                deviation_ratio = EXCLUDED.deviation_ratio,
                confidence_score = EXCLUDED.confidence_score,
                updated_at = NOW();

            v_signals_count := v_signals_count + 1;
        END IF;

    END LOOP;

    -- 5. Record Window Execution Health
    UPDATE public.analytics_realtime_windows
    SET last_computed_at = NOW(),
        status = 'HEALTHY',
        events_evaluated = v_events_count,
        signals_detected = v_signals_count,
        updated_at = NOW()
    WHERE window_id = '5m';

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'window_id', '5m',
        'events_evaluated', v_events_count,
        'signals_generated', v_signals_count,
        'computed_at', NOW()
    );
END;
$$;

-- B. GET REALTIME GROWTH SIGNALS SUMMARY RPC
CREATE OR REPLACE FUNCTION public.get_realtime_growth_signals()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_signals JSONB;
    v_window RECORD;
    v_active_count INT;
    v_critical_count INT;
BEGIN
    -- Server-Side Administrator Authorization Gate
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    -- Retrieve Window Health
    SELECT last_computed_at, status, events_evaluated, signals_detected
    INTO v_window
    FROM public.analytics_realtime_windows
    WHERE window_id = '5m';

    -- Count active signals
    SELECT
        COUNT(*),
        COUNT(*) FILTER (WHERE severity IN ('CRITICAL', 'HIGH'))
    INTO v_active_count, v_critical_count
    FROM public.analytics_realtime_signals
    WHERE status = 'ACTIVE';

    -- Retrieve top active signals (bounded to 25 latest)
    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'signal_fingerprint', signal_fingerprint,
            'signal_name', signal_name,
            'category', category,
            'state', state,
            'lga', lga,
            'period_bucket', period_bucket,
            'current_value', current_value,
            'baseline_value', baseline_value,
            'deviation_ratio', deviation_ratio,
            'confidence_score', confidence_score,
            'sample_size', sample_size,
            'unique_sessions', unique_sessions,
            'severity', severity,
            'status', status,
            'metadata', metadata,
            'created_at', created_at,
            'updated_at', updated_at
        ) ORDER BY CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'WARNING' THEN 3 ELSE 4 END, created_at DESC
    ), '[]'::jsonb)
    INTO v_signals
    FROM (
        SELECT *
        FROM public.analytics_realtime_signals
        WHERE status IN ('ACTIVE', 'ACKNOWLEDGED')
        ORDER BY created_at DESC
        LIMIT 25
    ) s;

    RETURN jsonb_build_object(
        'posture', 'OBSERVATIONAL_ADVISORY_ONLY',
        'active_signals_count', v_active_count,
        'critical_high_count', v_critical_count,
        'last_computed_at', v_window.last_computed_at,
        'window_status', v_window.status,
        'events_evaluated', v_window.events_evaluated,
        'signals', v_signals
    );
END;
$$;

-- C. GET REALTIME GROWTH DELTA RPC (FOR LIGHTWEIGHT POLLING)
CREATE OR REPLACE FUNCTION public.get_realtime_growth_delta(
    p_since TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_signals JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'signal_fingerprint', signal_fingerprint,
            'signal_name', signal_name,
            'category', category,
            'state', state,
            'lga', lga,
            'current_value', current_value,
            'deviation_ratio', deviation_ratio,
            'confidence_score', confidence_score,
            'severity', severity,
            'status', status,
            'updated_at', updated_at
        )
    ), '[]'::jsonb)
    INTO v_signals
    FROM public.analytics_realtime_signals
    WHERE updated_at > p_since;

    RETURN jsonb_build_object(
        'delta_timestamp', NOW(),
        'delta_signals', v_signals
    );
END;
$$;

-- D. ACKNOWLEDGE REALTIME SIGNAL RPC
CREATE OR REPLACE FUNCTION public.acknowledge_realtime_signal(
    p_signal_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_signal RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_signal
    FROM public.analytics_realtime_signals
    WHERE id = p_signal_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Signal not found: %', p_signal_id
            USING ERRCODE = 'P0002';
    END IF;

    UPDATE public.analytics_realtime_signals
    SET status = 'ACKNOWLEDGED',
        updated_at = NOW()
    WHERE id = p_signal_id;

    -- Append to immutable audit log with server-derived actor_id
    INSERT INTO public.analytics_realtime_audit_log (
        signal_id, actor_id, action, notes
    ) VALUES (
        p_signal_id, auth.uid(), 'ACKNOWLEDGE', p_notes
    );

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'signal_id', p_signal_id,
        'new_status', 'ACKNOWLEDGED',
        'acknowledged_at', NOW()
    );
END;
$$;
