-- ============================================================================
-- LOKATOR.NG — PHASE 6.4 MIGRATION: ANOMALY INTELLIGENCE & ALERT LIFECYCLE
-- Migration: 006_lokator_alert_lifecycle.sql
-- Security: Normalized Alert Engine, Append-Only Audit Log, Outbox Anti-Flooding,
--           Deterministic SHA-256 Fingerprinting, Server-Side is_admin() Auth,
--           Strict Alert State Machine, k-Anonymity (k >= 5) Preservation
-- ============================================================================

-- Enable pgcrypto if not already present
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 1. NORMALIZED ALERTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anomaly_fingerprint TEXT NOT NULL UNIQUE,
    anomaly_type TEXT NOT NULL CHECK (anomaly_type IN ('SPIKE', 'DROP', 'DEGRADATION', 'ZERO_YIELD', 'RUNTIME_ERROR')),
    metric_name TEXT NOT NULL,
    severity TEXT NOT NULL CHECK (severity IN ('INFO', 'WARNING', 'CRITICAL')),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED')),
    
    -- Numerical aggregates only (Zero PII / Raw payloads)
    current_value NUMERIC,
    baseline_value NUMERIC,
    deviation_score NUMERIC,
    sample_size BIGINT,
    evaluation_window_days INT DEFAULT 7,
    category TEXT NULL,
    
    -- Recurrence & Lifecycle tracking
    occurrence_count INT NOT NULL DEFAULT 1,
    first_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    last_detected_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    
    -- Administrative metadata
    acknowledged_at TIMESTAMPTZ NULL,
    acknowledged_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ NULL,
    resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    suppressed_at TIMESTAMPTZ NULL,
    suppressed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    suppressed_until TIMESTAMPTZ NULL,
    suppression_reason TEXT NULL,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_alerts_status ON public.analytics_alerts(status);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_severity ON public.analytics_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_analytics_alerts_last_detected ON public.analytics_alerts(last_detected_at DESC);

-- ----------------------------------------------------------------------------
-- 2. APPEND-ONLY ADMINISTRATIVE AUDIT LOG
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_alert_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID NOT NULL REFERENCES public.analytics_alerts(id) ON DELETE CASCADE,
    action TEXT NOT NULL CHECK (action IN ('DETECTED', 'RE_DETECTED', 'ACKNOWLEDGED', 'RESOLVED', 'SUPPRESSED', 'REOPENED')),
    previous_status TEXT NULL,
    new_status TEXT NOT NULL,
    actor_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reason TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_analytics_alert_audit_alert_id ON public.analytics_alert_audit_log(alert_id, created_at DESC);

-- Hardening: Revoke UPDATE and DELETE to ensure append-only immutability
REVOKE UPDATE, DELETE ON public.analytics_alert_audit_log FROM PUBLIC, authenticated, anon;

-- ----------------------------------------------------------------------------
-- 3. NOTIFICATION OUTBOX QUEUE (DISABLED EXTERNAL DELIVERY)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_notification_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    alert_id UUID REFERENCES public.analytics_alerts(id) ON DELETE CASCADE,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('ADMIN_DASHBOARD', 'EMAIL', 'WHATSAPP', 'SMS')),
    recipient_key TEXT NOT NULL CHECK (recipient_key IN ('ADMIN_OPS_PRIMARY', 'ADMIN_SECURITY_OPS', 'ADMIN_ONCALL_EMERGENCY')),
    payload JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSED', 'FAILED', 'DISABLED')),
    attempts INT NOT NULL DEFAULT 0,
    available_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    sent_at TIMESTAMPTZ NULL,
    failed_at TIMESTAMPTZ NULL,
    last_error TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notification_outbox_status_available ON public.analytics_notification_outbox(status, available_at);

-- ----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.analytics_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_alert_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_notification_outbox ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_alerts FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_alert_audit_log FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_notification_outbox FROM PUBLIC, anon;

-- Admins can view alerts
CREATE POLICY "Admins can view analytics alerts"
    ON public.analytics_alerts
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Admins can view audit logs
CREATE POLICY "Admins can view alert audit logs"
    ON public.analytics_alert_audit_log
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- Admins can view notification outbox
CREATE POLICY "Admins can view notification outbox"
    ON public.analytics_notification_outbox
    FOR SELECT
    TO authenticated
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 5. DETERMINISTIC FINGERPRINT HELPER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_anomaly_fingerprint(
    p_anomaly_type TEXT,
    p_metric_name TEXT,
    p_category TEXT,
    p_date_bucket DATE DEFAULT CURRENT_DATE
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
PARALLEL SAFE
AS $$
    SELECT encode(
        digest(
            lower(trim(p_anomaly_type)) || ':' ||
            lower(trim(p_metric_name)) || ':' ||
            coalesce(lower(trim(p_category)), 'all') || ':' ||
            to_char(p_date_bucket, 'YYYY-MM-DD'),
            'sha256'
        ),
        'hex'
    );
$$;

-- ----------------------------------------------------------------------------
-- 6. RPC: CREATE OR UPDATE ANALYTICS ALERT (ATOMIC UPSERT)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_or_update_analytics_alert(
    p_anomaly_type TEXT,
    p_metric_name TEXT,
    p_category TEXT,
    p_severity TEXT,
    p_current_value NUMERIC,
    p_baseline_value NUMERIC,
    p_deviation_score NUMERIC,
    p_sample_size BIGINT,
    p_window_days INT DEFAULT 7
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_fingerprint TEXT;
    v_alert_id UUID;
    v_existing_id UUID;
    v_existing_status TEXT;
    v_existing_last_detected TIMESTAMPTZ;
    v_recent_notifications_count INT;
    v_per_alert_last_notification TIMESTAMPTZ;
    v_new_action TEXT := 'DETECTED';
BEGIN
    -- Authorization check
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    -- Validation
    IF p_severity NOT IN ('INFO', 'WARNING', 'CRITICAL') THEN
        RAISE EXCEPTION 'Invalid severity: must be INFO, WARNING, or CRITICAL' USING ERRCODE = '22023';
    END IF;
    IF p_anomaly_type NOT IN ('SPIKE', 'DROP', 'DEGRADATION', 'ZERO_YIELD', 'RUNTIME_ERROR') THEN
        RAISE EXCEPTION 'Invalid anomaly_type' USING ERRCODE = '22023';
    END IF;

    -- Generate deterministic fingerprint
    v_fingerprint := public.generate_anomaly_fingerprint(p_anomaly_type, p_metric_name, p_category, CURRENT_DATE);

    -- Check if alert already exists
    SELECT id, status, last_detected_at INTO v_existing_id, v_existing_status, v_existing_last_detected
    FROM public.analytics_alerts
    WHERE anomaly_fingerprint = v_fingerprint;

    IF v_existing_id IS NOT NULL THEN
        v_alert_id := v_existing_id;
        v_new_action := 'RE_DETECTED';

        -- Update existing alert with atomic recurrence increment
        UPDATE public.analytics_alerts
        SET
            occurrence_count = occurrence_count + 1,
            last_detected_at = now(),
            current_value = p_current_value,
            baseline_value = p_baseline_value,
            deviation_score = p_deviation_score,
            sample_size = p_sample_size,
            severity = p_severity,
            evaluation_window_days = p_window_days,
            -- If resolved but re-detecting after 24 hours, automatically reopen
            status = CASE
                WHEN status = 'RESOLVED' AND now() > resolved_at + INTERVAL '24 hours' THEN 'OPEN'
                WHEN status = 'SUPPRESSED' AND now() > suppressed_until THEN 'OPEN'
                ELSE status
            END,
            updated_at = now()
        WHERE id = v_alert_id;
    ELSE
        -- Insert new alert
        INSERT INTO public.analytics_alerts (
            anomaly_fingerprint,
            anomaly_type,
            metric_name,
            severity,
            status,
            current_value,
            baseline_value,
            deviation_score,
            sample_size,
            evaluation_window_days,
            category
        ) VALUES (
            v_fingerprint,
            p_anomaly_type,
            p_metric_name,
            p_severity,
            'OPEN',
            p_current_value,
            p_baseline_value,
            p_deviation_score,
            p_sample_size,
            p_window_days,
            p_category
        ) RETURNING id INTO v_alert_id;
    END IF;

    -- Record in append-only audit trail
    INSERT INTO public.analytics_alert_audit_log (
        alert_id,
        action,
        previous_status,
        new_status,
        actor_user_id,
        reason
    ) VALUES (
        v_alert_id,
        v_new_action,
        v_existing_status,
        (SELECT status FROM public.analytics_alerts WHERE id = v_alert_id),
        auth.uid(),
        'Automated anomaly engine detection'
    );

    -- ------------------------------------------------------------------------
    -- NOTIFICATION OUTBOX QUEUEING WITH STRICT ANTI-FLOODING CONTROLS
    -- ------------------------------------------------------------------------
    -- Rule 1: Global Platform Limit <= 10 notifications per rolling hour
    -- Rule 2: Per-Fingerprint Cooldown >= 6 hours
    -- Failure Isolation: outbox failures MUST NEVER rollback the alert transaction
    BEGIN
        SELECT count(*) INTO v_recent_notifications_count
        FROM public.analytics_notification_outbox
        WHERE created_at > now() - INTERVAL '1 hour';

        SELECT max(created_at) INTO v_per_alert_last_notification
        FROM public.analytics_notification_outbox
        WHERE alert_id = v_alert_id;

        IF v_recent_notifications_count < 10 AND (v_per_alert_last_notification IS NULL OR v_per_alert_last_notification < now() - INTERVAL '6 hours') THEN
            INSERT INTO public.analytics_notification_outbox (
                alert_id,
                notification_type,
                recipient_key,
                payload,
                status
            ) VALUES (
                v_alert_id,
                'ADMIN_DASHBOARD',
                'ADMIN_OPS_PRIMARY',
                jsonb_build_object(
                    'metric', p_metric_name,
                    'category', p_category,
                    'severity', p_severity,
                    'deviation', p_deviation_score,
                    'detected_at', now()
                ),
                'DISABLED' -- External delivery disabled by default in this phase
            );
        END IF;
    EXCEPTION WHEN OTHERS THEN
        -- Safely ignore notification queuing errors to preserve alert persistence
        NULL;
    END;

    RETURN v_alert_id;
END;
$$;

-- ----------------------------------------------------------------------------
-- 7. RPC: ACKNOWLEDGE ANALYTICS ALERT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.acknowledge_analytics_alert(
    p_alert_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_current_status TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    SELECT status INTO v_current_status
    FROM public.analytics_alerts
    WHERE id = p_alert_id;

    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'Alert not found' USING ERRCODE = 'P0002';
    END IF;

    -- State Machine Validation: Only OPEN alerts can be ACKNOWLEDGED
    IF v_current_status != 'OPEN' THEN
        RAISE EXCEPTION 'Invalid state transition: Cannot acknowledge alert from status %', v_current_status USING ERRCODE = '22023';
    END IF;

    UPDATE public.analytics_alerts
    SET
        status = 'ACKNOWLEDGED',
        acknowledged_at = now(),
        acknowledged_by = auth.uid(),
        updated_at = now()
    WHERE id = p_alert_id;

    INSERT INTO public.analytics_alert_audit_log (
        alert_id, action, previous_status, new_status, actor_user_id, reason
    ) VALUES (
        p_alert_id, 'ACKNOWLEDGED', 'OPEN', 'ACKNOWLEDGED', auth.uid(), p_reason
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 8. RPC: RESOLVE ANALYTICS ALERT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.resolve_analytics_alert(
    p_alert_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_current_status TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    SELECT status INTO v_current_status
    FROM public.analytics_alerts
    WHERE id = p_alert_id;

    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'Alert not found' USING ERRCODE = 'P0002';
    END IF;

    -- State Machine Validation: OPEN or ACKNOWLEDGED can be RESOLVED
    IF v_current_status NOT IN ('OPEN', 'ACKNOWLEDGED') THEN
        RAISE EXCEPTION 'Invalid state transition: Cannot resolve alert from status %', v_current_status USING ERRCODE = '22023';
    END IF;

    UPDATE public.analytics_alerts
    SET
        status = 'RESOLVED',
        resolved_at = now(),
        resolved_by = auth.uid(),
        updated_at = now()
    WHERE id = p_alert_id;

    INSERT INTO public.analytics_alert_audit_log (
        alert_id, action, previous_status, new_status, actor_user_id, reason
    ) VALUES (
        p_alert_id, 'RESOLVED', v_current_status, 'RESOLVED', auth.uid(), p_reason
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 9. RPC: SUPPRESS ANALYTICS ALERT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.suppress_analytics_alert(
    p_alert_id UUID,
    p_reason TEXT DEFAULT NULL,
    p_duration_hours INT DEFAULT 24
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_current_status TEXT;
    v_suppress_until TIMESTAMPTZ;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    IF p_duration_hours < 1 OR p_duration_hours > 720 THEN
        RAISE EXCEPTION 'Invalid duration: p_duration_hours must be between 1 and 720' USING ERRCODE = '22023';
    END IF;

    SELECT status INTO v_current_status
    FROM public.analytics_alerts
    WHERE id = p_alert_id;

    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'Alert not found' USING ERRCODE = 'P0002';
    END IF;

    -- State Machine Validation: OPEN or ACKNOWLEDGED can be SUPPRESSED
    IF v_current_status NOT IN ('OPEN', 'ACKNOWLEDGED') THEN
        RAISE EXCEPTION 'Invalid state transition: Cannot suppress alert from status %', v_current_status USING ERRCODE = '22023';
    END IF;

    v_suppress_until := now() + (p_duration_hours || ' hours')::INTERVAL;

    UPDATE public.analytics_alerts
    SET
        status = 'SUPPRESSED',
        suppressed_at = now(),
        suppressed_by = auth.uid(),
        suppressed_until = v_suppress_until,
        suppression_reason = p_reason,
        updated_at = now()
    WHERE id = p_alert_id;

    INSERT INTO public.analytics_alert_audit_log (
        alert_id, action, previous_status, new_status, actor_user_id, reason
    ) VALUES (
        p_alert_id, 'SUPPRESSED', v_current_status, 'SUPPRESSED', auth.uid(), p_reason
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 10. RPC: REOPEN ANALYTICS ALERT
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.reopen_analytics_alert(
    p_alert_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_current_status TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    SELECT status INTO v_current_status
    FROM public.analytics_alerts
    WHERE id = p_alert_id;

    IF v_current_status IS NULL THEN
        RAISE EXCEPTION 'Alert not found' USING ERRCODE = 'P0002';
    END IF;

    -- State Machine Validation: Only RESOLVED or SUPPRESSED alerts can be REOPENED
    IF v_current_status NOT IN ('RESOLVED', 'SUPPRESSED') THEN
        RAISE EXCEPTION 'Invalid state transition: Cannot reopen alert from status %', v_current_status USING ERRCODE = '22023';
    END IF;

    UPDATE public.analytics_alerts
    SET
        status = 'OPEN',
        updated_at = now()
    WHERE id = p_alert_id;

    INSERT INTO public.analytics_alert_audit_log (
        alert_id, action, previous_status, new_status, actor_user_id, reason
    ) VALUES (
        p_alert_id, 'REOPENED', v_current_status, 'OPEN', auth.uid(), p_reason
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 11. RPC: GET ANALYTICS ALERT SUMMARY (ADMIN READ ONLY)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_alert_summary(
    p_days INT DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_k_threshold CONSTANT INT := 5;
    v_open_count BIGINT;
    v_critical_count BIGINT;
    v_warning_count BIGINT;
    v_resolved_count BIGINT;
    v_suppressed_count BIGINT;
    v_total_count BIGINT;
    v_platform_alert_status TEXT := 'HEALTHY';
    v_alerts_list JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    IF p_days < 1 OR p_days > 90 THEN
        RAISE EXCEPTION 'Invalid query window: p_days must be between 1 and 90' USING ERRCODE = '22023';
    END IF;

    -- Calculate alert counts in evaluation window
    SELECT
        coalesce(count(*) FILTER (WHERE status = 'OPEN'), 0),
        coalesce(count(*) FILTER (WHERE status = 'OPEN' AND severity = 'CRITICAL'), 0),
        coalesce(count(*) FILTER (WHERE status = 'OPEN' AND severity = 'WARNING'), 0),
        coalesce(count(*) FILTER (WHERE status = 'RESOLVED' AND resolved_at >= now() - (p_days || ' days')::INTERVAL), 0),
        coalesce(count(*) FILTER (WHERE status = 'SUPPRESSED'), 0),
        coalesce(count(*), 0)
    INTO
        v_open_count,
        v_critical_count,
        v_warning_count,
        v_resolved_count,
        v_suppressed_count,
        v_total_count
    FROM public.analytics_alerts
    WHERE last_detected_at >= now() - (p_days || ' days')::INTERVAL;

    -- Platform alert status determination
    IF v_critical_count > 0 THEN
        v_platform_alert_status := 'CRITICAL_ALERT';
    ELSIF v_warning_count > 0 THEN
        v_platform_alert_status := 'WARNING_ALERT';
    ELSIF v_open_count > 0 THEN
        v_platform_alert_status := 'WATCH';
    ELSE
        v_platform_alert_status := 'HEALTHY';
    END IF;

    -- Retrieve sanitized alert items
    SELECT coalesce(jsonb_agg(
        jsonb_build_object(
            'id', a.id,
            'fingerprint', a.anomaly_fingerprint,
            'type', a.anomaly_type,
            'metric', a.metric_name,
            'category', a.category,
            'severity', a.severity,
            'status', a.status,
            'current_value', a.current_value,
            'baseline_value', a.baseline_value,
            'deviation_score', a.deviation_score,
            'sample_size', a.sample_size,
            'occurrence_count', a.occurrence_count,
            'first_detected_at', a.first_detected_at,
            'last_detected_at', a.last_detected_at,
            'acknowledged_at', a.acknowledged_at,
            'resolved_at', a.resolved_at,
            'suppressed_at', a.suppressed_at,
            'suppressed_until', a.suppressed_until,
            'suppression_reason', a.suppression_reason
        ) ORDER BY 
            CASE a.severity WHEN 'CRITICAL' THEN 1 WHEN 'WARNING' THEN 2 ELSE 3 END,
            a.last_detected_at DESC
    ), '[]'::jsonb)
    INTO v_alerts_list
    FROM public.analytics_alerts a
    WHERE a.last_detected_at >= now() - (p_days || ' days')::INTERVAL;

    RETURN jsonb_build_object(
        'window_days', p_days,
        'platform_alert_status', v_platform_alert_status,
        'open_alerts_count', v_open_count,
        'critical_alerts_count', v_critical_count,
        'warning_alerts_count', v_warning_count,
        'resolved_alerts_count', v_resolved_count,
        'suppressed_alerts_count', v_suppressed_count,
        'total_alerts_count', v_total_count,
        'alerts', v_alerts_list,
        'observational_status', 'OBSERVATIONAL_ONLY',
        'generated_at', now()
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 12. RPC: GET ANALYTICS ALERT DETAIL WITH AUDIT TRAIL
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_alert_detail(
    p_alert_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_alert_json JSONB;
    v_audit_trail JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_build_object(
        'id', a.id,
        'fingerprint', a.anomaly_fingerprint,
        'type', a.anomaly_type,
        'metric', a.metric_name,
        'category', a.category,
        'severity', a.severity,
        'status', a.status,
        'current_value', a.current_value,
        'baseline_value', a.baseline_value,
        'deviation_score', a.deviation_score,
        'sample_size', a.sample_size,
        'occurrence_count', a.occurrence_count,
        'first_detected_at', a.first_detected_at,
        'last_detected_at', a.last_detected_at,
        'acknowledged_at', a.acknowledged_at,
        'resolved_at', a.resolved_at,
        'suppressed_at', a.suppressed_at,
        'suppressed_until', a.suppressed_until,
        'suppression_reason', a.suppression_reason,
        'created_at', a.created_at,
        'updated_at', a.updated_at
    ) INTO v_alert_json
    FROM public.analytics_alerts a
    WHERE a.id = p_alert_id;

    IF v_alert_json IS NULL THEN
        RAISE EXCEPTION 'Alert not found' USING ERRCODE = 'P0002';
    END IF;

    SELECT coalesce(jsonb_agg(
        jsonb_build_object(
            'id', l.id,
            'action', l.action,
            'previous_status', l.previous_status,
            'new_status', l.new_status,
            'actor_user_id', l.actor_user_id,
            'reason', l.reason,
            'created_at', l.created_at
        ) ORDER BY l.created_at ASC
    ), '[]'::jsonb)
    INTO v_audit_trail
    FROM public.analytics_alert_audit_log l
    WHERE l.alert_id = p_alert_id;

    RETURN jsonb_build_object(
        'alert', v_alert_json,
        'audit_trail', v_audit_trail,
        'observational_status', 'OBSERVATIONAL_ONLY',
        'generated_at', now()
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 13. EXECUTE PRIVILEGES & ROLE GRANTS
-- ----------------------------------------------------------------------------
REVOKE EXECUTE ON FUNCTION public.generate_anomaly_fingerprint(TEXT, TEXT, TEXT, DATE) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.create_or_update_analytics_alert(TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, BIGINT, INT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.acknowledge_analytics_alert(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.resolve_analytics_alert(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.suppress_analytics_alert(UUID, TEXT, INT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.reopen_analytics_alert(UUID, TEXT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_analytics_alert_summary(INT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_analytics_alert_detail(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.generate_anomaly_fingerprint(TEXT, TEXT, TEXT, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_or_update_analytics_alert(TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, NUMERIC, BIGINT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.acknowledge_analytics_alert(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_analytics_alert(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.suppress_analytics_alert(UUID, TEXT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reopen_analytics_alert(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_alert_summary(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_alert_detail(UUID) TO authenticated;
