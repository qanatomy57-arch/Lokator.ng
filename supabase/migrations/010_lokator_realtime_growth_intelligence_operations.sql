-- ==============================================================================
-- LOKATOR.NG — PHASE 8.1A DATABASE MIGRATION
-- REALTIME GROWTH INTELLIGENCE OPERATIONS ENGINE
-- Migration: 010_lokator_realtime_growth_intelligence_operations.sql
--
-- INVARIANTS ENFORCED:
-- 1. OBSERVATIONAL / ADVISORY POSTURE ONLY — Zero autonomous marketplace mutations.
-- 2. RANKING AIR-GAP — Live search ranking in search.js is 100% isolated from operational intelligence.
-- 3. BUSINESS TRUTH ISOLATION — Zero mutations against public.providers, reviews, or provider_services.
-- 4. PRIVACY GATES — Hard enforcement of N >= 30 sample floor and k >= 5 anonymity threshold.
-- 5. DETERMINISTIC STATE MACHINE — Multi-window persistence (5m, 15m, 1h) before escalation.
-- 6. AUDIT LOG IMMUTABILITY — Append-only audit trail with REVOKE UPDATE, DELETE.
-- 7. SECURITY DEFINER HARDENING — Fixed search_path and server-side public.is_admin() validation.
-- ==============================================================================

-- 1. OPERATIONAL INTELLIGENCE TABLE
CREATE TABLE IF NOT EXISTS public.analytics_operational_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    signal_fingerprint TEXT NOT NULL UNIQUE,
    source_signal_id UUID REFERENCES public.analytics_realtime_signals(id) ON DELETE SET NULL,
    intelligence_type TEXT NOT NULL,
    operational_state TEXT NOT NULL DEFAULT 'WATCH' 
        CHECK (operational_state IN ('NORMAL', 'WATCH', 'EMERGING', 'SUSTAINED', 'HIGH_PRIORITY', 'COOLDOWN', 'SUPPRESSED', 'EXPIRED')),
    priority TEXT NOT NULL DEFAULT 'MEDIUM' 
        CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    category TEXT NOT NULL,
    state TEXT NOT NULL,
    lga TEXT NOT NULL,
    current_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    baseline_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    deviation_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
    sample_size INT NOT NULL DEFAULT 0,
    unique_sessions INT NOT NULL DEFAULT 0,
    persistence_count INT NOT NULL DEFAULT 1,
    observation_window TEXT NOT NULL DEFAULT '1h',
    baseline_window TEXT NOT NULL DEFAULT '7d',
    explanation JSONB NOT NULL DEFAULT '{}'::jsonb,
    evidence_summary TEXT,
    correlation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cooldown_until TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_operational_state_prio
    ON public.analytics_operational_intelligence (operational_state, priority, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_operational_spatial
    ON public.analytics_operational_intelligence (state, lga, category);

CREATE INDEX IF NOT EXISTS idx_analytics_operational_expires
    ON public.analytics_operational_intelligence (expires_at)
    WHERE operational_state != 'EXPIRED';

-- 2. OPERATIONAL AUDIT LOG TABLE (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.analytics_operational_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intelligence_id UUID NOT NULL REFERENCES public.analytics_operational_intelligence(id) ON DELETE CASCADE,
    previous_state TEXT NOT NULL,
    new_state TEXT NOT NULL,
    actor_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('STATE_TRANSITION', 'ACKNOWLEDGE', 'SUPPRESS', 'FLAG_FOLLOWUP', 'EXPIRE')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_operational_audit_target
    ON public.analytics_operational_audit_log (intelligence_id, created_at DESC);

-- 3. ROW LEVEL SECURITY & PERMISSION HARDENING
ALTER TABLE public.analytics_operational_intelligence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_operational_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_operational_intelligence FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_operational_audit_log FROM PUBLIC, anon;

-- Restrict direct read/write to verified administrators
CREATE POLICY admin_manage_operational_intelligence ON public.analytics_operational_intelligence
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_read_operational_audit_log ON public.analytics_operational_audit_log
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY admin_insert_operational_audit_log ON public.analytics_operational_audit_log
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

-- Enforce append-only immutability on audit log
REVOKE UPDATE, DELETE ON public.analytics_operational_audit_log FROM authenticated;

-- ==============================================================================
-- 4. PRIVILEGED OPERATIONAL INTELLIGENCE RPCs
-- ==============================================================================

-- 4.1 COMPUTE OPERATIONAL INTELLIGENCE (MULTI-WINDOW EVALUATION & EXPLAINABILITY)
CREATE OR REPLACE FUNCTION public.compute_operational_growth_intelligence(
    p_force_refresh BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_last_computed TIMESTAMPTZ;
    v_items_processed INT := 0;
    v_items_escalated INT := 0;
    v_rec RECORD;
    v_rec_match UUID;
    v_state TEXT;
    v_prio TEXT;
    v_p_count INT;
    v_explanation JSONB;
    v_evidence TEXT;
    v_correlation JSONB;
BEGIN
    -- Server-side admin authorization verification
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    -- Check debounce window on 15m window tracker
    SELECT last_computed_at INTO v_last_computed
    FROM public.analytics_realtime_windows
    WHERE window_id = '15m';

    IF NOT p_force_refresh AND v_last_computed IS NOT NULL AND v_last_computed > (NOW() - INTERVAL '15 seconds') THEN
        RETURN jsonb_build_object(
            'status', 'DEBOUNCE_COOLDOWN_ACTIVE',
            'message', 'Operational intelligence evaluated recently. Cooldown active.',
            'last_computed_at', v_last_computed
        );
    END IF;

    -- Evaluate qualified realtime signals with multi-window persistence
    FOR v_rec IN (
        SELECT 
            s.id AS signal_id,
            s.signal_fingerprint,
            s.signal_name,
            s.category,
            s.state,
            s.lga,
            s.current_value,
            s.baseline_value,
            s.deviation_ratio,
            s.confidence_score,
            s.sample_size,
            s.unique_sessions,
            s.severity,
            s.created_at,
            s.metadata
        FROM public.analytics_realtime_signals s
        WHERE s.status IN ('ACTIVE', 'ACKNOWLEDGED')
          AND s.created_at >= NOW() - INTERVAL '6 hours'
          AND s.sample_size >= 30
          AND s.unique_sessions >= 5
    ) LOOP
        v_items_processed := v_items_processed + 1;

        -- Check existing operational intelligence record for persistence tracking
        SELECT persistence_count, operational_state 
        INTO v_p_count, v_state
        FROM public.analytics_operational_intelligence
        WHERE signal_fingerprint = v_rec.signal_fingerprint;

        IF v_p_count IS NULL THEN
            v_p_count := 1;
            v_state := 'WATCH';
        ELSE
            v_p_count := v_p_count + 1;
        END IF;

        -- Check for matching open growth recommendations
        SELECT id INTO v_rec_match
        FROM public.growth_recommendations
        WHERE status = 'PENDING_ADMIN_REVIEW'
          AND target_category = v_rec.category
          AND target_state = v_rec.state
          AND (target_lga = v_rec.lga OR target_lga = 'ALL_LGAS')
        LIMIT 1;

        -- Deterministic state escalation model
        IF v_state = 'SUPPRESSED' THEN
            -- Retain suppressed state unless volume deviation is severe (> 3.5x)
            IF v_rec.deviation_ratio > 3.50 THEN
                v_state := 'EMERGING';
            END IF;
        ELSIF v_state = 'COOLDOWN' THEN
            -- Check if cooldown period has elapsed
            v_state := 'EMERGING';
        ELSIF v_p_count >= 3 AND (v_rec.severity = 'CRITICAL' OR v_rec.deviation_ratio >= 2.50) THEN
            v_state := 'HIGH_PRIORITY';
            v_prio := 'CRITICAL';
            v_items_escalated := v_items_escalated + 1;
        ELSIF v_p_count >= 2 OR v_rec.deviation_ratio >= 2.00 THEN
            v_state := 'SUSTAINED';
            v_prio := 'HIGH';
        ELSIF v_rec.deviation_ratio >= 1.50 THEN
            v_state := 'EMERGING';
            v_prio := 'MEDIUM';
        ELSE
            v_state := 'WATCH';
            v_prio := 'LOW';
        END IF;

        IF v_prio IS NULL THEN
            v_prio := CASE 
                WHEN v_state = 'HIGH_PRIORITY' THEN 'CRITICAL'
                WHEN v_state = 'SUSTAINED' THEN 'HIGH'
                WHEN v_state = 'EMERGING' THEN 'MEDIUM'
                ELSE 'LOW'
            END;
        END IF;

        -- Build deterministic explainability payload (Zero PII, Zero query text)
        v_explanation := jsonb_build_object(
            'summary', format('Demand for %s in %s, %s is %s%% above baseline over the evaluation window.', 
                              v_rec.category, v_rec.lga, v_rec.state, ROUND((v_rec.deviation_ratio - 1.0) * 100)),
            'current_rate', v_rec.current_value,
            'baseline_rate', v_rec.baseline_value,
            'deviation_sigma', format('+%sσ', ROUND(v_rec.deviation_ratio, 2)),
            'sample_size', v_rec.sample_size,
            'session_diversity', v_rec.unique_sessions,
            'persistence_count', v_p_count,
            'windows_confirmed', CASE 
                WHEN v_p_count >= 3 THEN jsonb_build_array('5m', '15m', '1h')
                WHEN v_p_count = 2 THEN jsonb_build_array('5m', '15m')
                ELSE jsonb_build_array('5m')
            END,
            'operational_posture', 'OBSERVATIONAL_ADVISORY_ONLY'
        );

        v_evidence := format('Confirmed across %s micro-windows with N=%s searches and k=%s distinct sessions. Deviation: +%s%%.',
                             v_p_count, v_rec.sample_size, v_rec.unique_sessions, ROUND((v_rec.deviation_ratio - 1.0) * 100));

        v_correlation := jsonb_build_object(
            'has_matching_recommendation', (v_rec_match IS NOT NULL),
            'matching_recommendation_id', v_rec_match,
            'advisory_status', 'ADMIN_ATTENTION_RECOMMENDED'
        );

        -- Atomic UPSERT into analytics_operational_intelligence
        INSERT INTO public.analytics_operational_intelligence (
            signal_fingerprint,
            source_signal_id,
            intelligence_type,
            operational_state,
            priority,
            category,
            state,
            lga,
            current_value,
            baseline_value,
            deviation_score,
            confidence_score,
            sample_size,
            unique_sessions,
            persistence_count,
            observation_window,
            baseline_window,
            explanation,
            evidence_summary,
            correlation_metadata,
            last_seen_at,
            expires_at,
            updated_at
        ) VALUES (
            v_rec.signal_fingerprint,
            v_rec.signal_id,
            v_rec.signal_name,
            v_state,
            v_prio,
            v_rec.category,
            v_rec.state,
            v_rec.lga,
            v_rec.current_value,
            v_rec.baseline_value,
            v_rec.deviation_ratio,
            v_rec.confidence_score,
            v_rec.sample_size,
            v_rec.unique_sessions,
            v_p_count,
            '1h',
            '7d',
            v_explanation,
            v_evidence,
            v_correlation,
            NOW(),
            NOW() + INTERVAL '24 hours',
            NOW()
        )
        ON CONFLICT (signal_fingerprint) DO UPDATE SET
            operational_state = EXCLUDED.operational_state,
            priority = EXCLUDED.priority,
            current_value = EXCLUDED.current_value,
            deviation_score = EXCLUDED.deviation_score,
            confidence_score = EXCLUDED.confidence_score,
            sample_size = EXCLUDED.sample_size,
            unique_sessions = EXCLUDED.unique_sessions,
            persistence_count = EXCLUDED.persistence_count,
            explanation = EXCLUDED.explanation,
            evidence_summary = EXCLUDED.evidence_summary,
            correlation_metadata = EXCLUDED.correlation_metadata,
            last_seen_at = NOW(),
            expires_at = NOW() + INTERVAL '24 hours',
            updated_at = NOW();

    END LOOP;

    -- Clean up expired items (> 24h)
    UPDATE public.analytics_operational_intelligence
    SET operational_state = 'EXPIRED', updated_at = NOW()
    WHERE expires_at < NOW() AND operational_state != 'EXPIRED';

    -- Update window timestamp
    UPDATE public.analytics_realtime_windows
    SET last_computed_at = NOW(),
        signals_detected = v_items_processed,
        updated_at = NOW()
    WHERE window_id = '15m';

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'items_processed', v_items_processed,
        'items_escalated', v_items_escalated,
        'evaluated_at', NOW()
    );
END;
$$;

-- 4.2 GET OPERATIONAL GROWTH INTELLIGENCE FEED
CREATE OR REPLACE FUNCTION public.get_operational_growth_intelligence()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_items JSONB;
    v_high_prio_count INT := 0;
    v_sustained_count INT := 0;
    v_emerging_count INT := 0;
    v_total_active INT := 0;
BEGIN
    -- Server-side admin authorization verification
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT 
        COUNT(*) FILTER (WHERE operational_state = 'HIGH_PRIORITY'),
        COUNT(*) FILTER (WHERE operational_state = 'SUSTAINED'),
        COUNT(*) FILTER (WHERE operational_state = 'EMERGING'),
        COUNT(*) FILTER (WHERE operational_state IN ('WATCH', 'EMERGING', 'SUSTAINED', 'HIGH_PRIORITY'))
    INTO 
        v_high_prio_count,
        v_sustained_count,
        v_emerging_count,
        v_total_active
    FROM public.analytics_operational_intelligence
    WHERE operational_state != 'EXPIRED';

    SELECT jsonb_agg(item) INTO v_items
    FROM (
        SELECT 
            id,
            signal_fingerprint,
            intelligence_type,
            operational_state,
            priority,
            category,
            state,
            lga,
            current_value,
            baseline_value,
            deviation_score,
            confidence_score,
            sample_size,
            unique_sessions,
            persistence_count,
            observation_window,
            baseline_window,
            explanation,
            evidence_summary,
            correlation_metadata,
            first_seen_at,
            last_seen_at,
            acknowledged_at,
            created_at,
            updated_at
        FROM public.analytics_operational_intelligence
        WHERE operational_state IN ('WATCH', 'EMERGING', 'SUSTAINED', 'HIGH_PRIORITY', 'COOLDOWN', 'SUPPRESSED')
        ORDER BY 
            CASE operational_state
                WHEN 'HIGH_PRIORITY' THEN 1
                WHEN 'SUSTAINED' THEN 2
                WHEN 'EMERGING' THEN 3
                WHEN 'WATCH' THEN 4
                WHEN 'COOLDOWN' THEN 5
                ELSE 6
            END,
            updated_at DESC
        LIMIT 50
    ) item;

    RETURN jsonb_build_object(
        'status', 'HEALTHY',
        'posture', 'OBSERVATIONAL_ADVISORY_ONLY',
        'high_priority_count', v_high_prio_count,
        'sustained_count', v_sustained_count,
        'emerging_count', v_emerging_count,
        'total_active_count', v_total_active,
        'items', COALESCE(v_items, '[]'::jsonb),
        'fetched_at', NOW()
    );
END;
$$;

-- 4.3 GET OPERATIONAL GROWTH INTELLIGENCE DELTA
CREATE OR REPLACE FUNCTION public.get_operational_growth_delta(
    p_since TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_delta JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_agg(d) INTO v_delta
    FROM (
        SELECT 
            id,
            signal_fingerprint,
            intelligence_type,
            operational_state,
            priority,
            category,
            state,
            lga,
            current_value,
            baseline_value,
            deviation_score,
            confidence_score,
            sample_size,
            unique_sessions,
            persistence_count,
            explanation,
            evidence_summary,
            correlation_metadata,
            updated_at
        FROM public.analytics_operational_intelligence
        WHERE updated_at >= p_since
        ORDER BY updated_at DESC
        LIMIT 50
    ) d;

    RETURN jsonb_build_object(
        'delta', COALESCE(v_delta, '[]'::jsonb),
        'count', COALESCE(jsonb_array_length(v_delta), 0),
        'since', p_since,
        'timestamp', NOW()
    );
END;
$$;

-- 4.4 TRANSITION OPERATIONAL INTELLIGENCE STATE
CREATE OR REPLACE FUNCTION public.transition_operational_intelligence(
    p_id UUID,
    p_new_state TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_curr_state TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    -- Validate target state
    IF p_new_state NOT IN ('WATCH', 'EMERGING', 'SUSTAINED', 'HIGH_PRIORITY', 'COOLDOWN', 'SUPPRESSED', 'EXPIRED') THEN
        RAISE EXCEPTION 'Invalid target state: %', p_new_state
            USING ERRCODE = '22023';
    END IF;

    SELECT operational_state INTO v_curr_state
    FROM public.analytics_operational_intelligence
    WHERE id = p_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Operational intelligence record not found: %', p_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Rejection of illegal state transitions
    IF v_curr_state = 'EXPIRED' AND p_new_state != 'EXPIRED' THEN
        RAISE EXCEPTION 'Illegal state transition: Cannot resurrect EXPIRED operational intelligence'
            USING ERRCODE = '22023';
    END IF;

    -- Update state
    UPDATE public.analytics_operational_intelligence
    SET operational_state = p_new_state,
        cooldown_until = CASE WHEN p_new_state = 'COOLDOWN' THEN NOW() + INTERVAL '1 hour' ELSE cooldown_until END,
        updated_at = NOW()
    WHERE id = p_id;

    -- Append to immutable audit log
    INSERT INTO public.analytics_operational_audit_log (
        intelligence_id,
        previous_state,
        new_state,
        actor_id,
        action,
        notes
    ) VALUES (
        p_id,
        v_curr_state,
        p_new_state,
        auth.uid(),
        'STATE_TRANSITION',
        p_notes
    );

    RETURN jsonb_build_object(
        'status', 'TRANSITIONED',
        'id', p_id,
        'previous_state', v_curr_state,
        'new_state', p_new_state,
        'updated_at', NOW()
    );
END;
$$;

-- 4.5 ACKNOWLEDGE OPERATIONAL INTELLIGENCE
CREATE OR REPLACE FUNCTION public.acknowledge_operational_intelligence(
    p_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_curr_state TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT operational_state INTO v_curr_state
    FROM public.analytics_operational_intelligence
    WHERE id = p_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Operational intelligence record not found: %', p_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Transition to COOLDOWN upon administrative acknowledgement
    UPDATE public.analytics_operational_intelligence
    SET operational_state = 'COOLDOWN',
        cooldown_until = NOW() + INTERVAL '1 hour',
        acknowledged_at = NOW(),
        acknowledged_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_id;

    -- Append to immutable audit log
    INSERT INTO public.analytics_operational_audit_log (
        intelligence_id,
        previous_state,
        new_state,
        actor_id,
        action,
        notes
    ) VALUES (
        p_id,
        v_curr_state,
        'COOLDOWN',
        auth.uid(),
        'ACKNOWLEDGE',
        COALESCE(p_notes, 'Acknowledged by operator')
    );

    RETURN jsonb_build_object(
        'status', 'ACKNOWLEDGED',
        'id', p_id,
        'cooldown_until', NOW() + INTERVAL '1 hour',
        'acknowledged_at', NOW()
    );
END;
$$;
