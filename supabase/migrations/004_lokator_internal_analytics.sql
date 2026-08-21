-- ============================================================================
-- LOKATOR.NG — PHASE 6.0 MIGRATION: INTERNAL ANALYTICS & RETENTION LIFECYCLE
-- Migration: 004_lokator_internal_analytics.sql
-- Security: SECURITY DEFINER Protected Aggregations, Server-Side is_admin() Auth,
--           k-Anonymity (k >= 5) Suppression, Zero Raw Event Exposure,
--           Dual-Tier Retention (60-day Raw / 365-day Daily Rollup)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ANALYTICS DAILY SUMMARY TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.analytics_daily_summary (
    summary_date DATE NOT NULL,
    event_name VARCHAR(64) NOT NULL,
    event_count INT NOT NULL DEFAULT 0,
    unique_sessions_approx INT NOT NULL DEFAULT 0,
    p50_numeric_ms NUMERIC(10,2) DEFAULT NULL,
    p75_numeric_ms NUMERIC(10,2) DEFAULT NULL,
    p90_numeric_ms NUMERIC(10,2) DEFAULT NULL,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT pk_analytics_daily_summary PRIMARY KEY (summary_date, event_name),
    CONSTRAINT check_summary_event_name CHECK (event_name ~ '^[a-z0-9_]{3,64}$'),
    CONSTRAINT check_summary_event_count CHECK (event_count >= 0),
    CONSTRAINT check_summary_unique_sessions CHECK (unique_sessions_approx >= 0)
);

-- Performance Indexes for Dashboard Queries and Timeseries Range Slices
CREATE INDEX IF NOT EXISTS idx_analytics_daily_summary_date 
    ON public.analytics_daily_summary (summary_date DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_daily_summary_name_date 
    ON public.analytics_daily_summary (event_name, summary_date DESC);

-- Enable Row-Level Security & Strict Revocation (Zero Public Read Access)
ALTER TABLE public.analytics_daily_summary ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.analytics_daily_summary FROM PUBLIC, anon, authenticated;

-- ----------------------------------------------------------------------------
-- 2. DAILY AGGREGATION ROLLUP ENGINE
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.generate_daily_analytics_summary(
    p_target_date DATE DEFAULT (CURRENT_DATE - INTERVAL '1 day')::DATE
)
RETURNS INT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_rows_processed INT := 0;
    v_k_threshold CONSTANT INT := 5; -- k-anonymity policy constant
BEGIN
    -- Server-side admin authorization guard
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    -- Aggregate raw events into daily summary
    INSERT INTO public.analytics_daily_summary (
        summary_date,
        event_name,
        event_count,
        unique_sessions_approx,
        p50_numeric_ms,
        p75_numeric_ms,
        p90_numeric_ms,
        metadata,
        updated_at
    )
    SELECT
        p_target_date AS summary_date,
        e.event_name,
        COUNT(*)::INT AS event_count,
        COUNT(DISTINCT e.session_id)::INT AS unique_sessions_approx,
        -- Aggregate percentile for performance events
        CASE 
            WHEN e.event_name = 'web_vitals_summary' THEN 
                PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY (e.properties->>'lcp_ms')::numeric)
            ELSE NULL 
        END AS p50_numeric_ms,
        CASE 
            WHEN e.event_name = 'web_vitals_summary' THEN 
                PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (e.properties->>'lcp_ms')::numeric)
            ELSE NULL 
        END AS p75_numeric_ms,
        CASE 
            WHEN e.event_name = 'web_vitals_summary' THEN 
                PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY (e.properties->>'lcp_ms')::numeric)
            ELSE NULL 
        END AS p90_numeric_ms,
        jsonb_build_object(
            'routes_count', (
                SELECT jsonb_object_agg(page_path, cnt)
                FROM (
                    SELECT page_path, COUNT(*) AS cnt
                    FROM public.analytics_events
                    WHERE event_name = e.event_name 
                      AND created_at >= p_target_date::TIMESTAMPTZ 
                      AND created_at < (p_target_date + INTERVAL '1 day')::TIMESTAMPTZ
                    GROUP BY page_path
                    HAVING COUNT(*) >= v_k_threshold -- k-anonymity suppression
                ) sub_routes
            ),
            'generated_at', now()
        ) AS metadata,
        now() AS updated_at
    FROM public.analytics_events e
    WHERE e.created_at >= p_target_date::TIMESTAMPTZ
      AND e.created_at < (p_target_date + INTERVAL '1 day')::TIMESTAMPTZ
    GROUP BY e.event_name
    ON CONFLICT (summary_date, event_name) DO UPDATE SET
        event_count = EXCLUDED.event_count,
        unique_sessions_approx = EXCLUDED.unique_sessions_approx,
        p50_numeric_ms = EXCLUDED.p50_numeric_ms,
        p75_numeric_ms = EXCLUDED.p75_numeric_ms,
        p90_numeric_ms = EXCLUDED.p90_numeric_ms,
        metadata = EXCLUDED.metadata,
        updated_at = now();

    GET DIAGNOSTICS v_rows_processed = ROW_COUNT;
    RETURN v_rows_processed;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. SECURE ADMIN AGGREGATION RPC FUNCTIONS
-- ----------------------------------------------------------------------------

-- A. Executive Platform Health Summary
CREATE OR REPLACE FUNCTION public.get_analytics_executive_summary(
    p_days INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_total_events BIGINT;
    v_total_sessions BIGINT;
    v_error_count BIGINT;
    v_search_count BIGINT;
    v_no_result_count BIGINT;
    v_daily_volume JSONB;
BEGIN
    -- Server-side admin authorization guard
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    -- Parameter bounds validation (1 to 90 days)
    IF p_days < 1 OR p_days > 90 THEN
        RAISE EXCEPTION 'Invalid query window: p_days must be between 1 and 90' USING ERRCODE = '22023';
    END IF;

    v_start_date := now() - (p_days || ' days')::INTERVAL;

    -- Aggregate totals
    SELECT 
        COUNT(*),
        COUNT(DISTINCT session_id),
        COUNT(*) FILTER (WHERE event_name = 'client_error'),
        COUNT(*) FILTER (WHERE event_name = 'search_submitted'),
        COUNT(*) FILTER (WHERE event_name = 'search_no_results')
    INTO 
        v_total_events,
        v_total_sessions,
        v_error_count,
        v_search_count,
        v_no_result_count
    FROM public.analytics_events
    WHERE created_at >= v_start_date;

    -- Aggregate daily volume timeseries
    SELECT jsonb_agg(d ORDER BY d->>'date' ASC)
    INTO v_daily_volume
    FROM (
        SELECT 
            jsonb_build_object(
                'date', (created_at::DATE)::TEXT,
                'events', COUNT(*),
                'sessions', COUNT(DISTINCT session_id)
            ) AS d
        FROM public.analytics_events
        WHERE created_at >= v_start_date
        GROUP BY (created_at::DATE)
    ) daily_sub;

    RETURN jsonb_build_object(
        'window_days', p_days,
        'total_events', coalesce(v_total_events, 0),
        'total_sessions_approx', coalesce(v_total_sessions, 0),
        'client_error_count', coalesce(v_error_count, 0),
        'search_count', coalesce(v_search_count, 0),
        'search_no_results_count', coalesce(v_no_result_count, 0),
        'no_results_rate', CASE WHEN coalesce(v_search_count, 0) > 0 THEN ROUND((coalesce(v_no_result_count, 0)::NUMERIC / v_search_count::NUMERIC) * 100, 2) ELSE 0 END,
        'daily_volume', coalesce(v_daily_volume, '[]'::jsonb),
        'generated_at', now()
    );
END;
$$;

-- B. Funnel Intelligence Summary (Provider & Customer Funnels)
CREATE OR REPLACE FUNCTION public.get_analytics_funnel_summary(
    p_days INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
    -- Provider counts
    v_reg_started BIGINT;
    v_reg_validation_failed BIGINT;
    v_reg_submitted BIGINT;
    v_reg_succeeded BIGINT;
    v_login_submitted BIGINT;
    v_login_succeeded BIGINT;
    v_login_failed BIGINT;
    v_dashboard_engagements BIGINT;
    -- Customer counts
    v_category_browses BIGINT;
    v_searches BIGINT;
    v_search_no_results BIGINT;
    v_profile_views BIGINT;
    v_whatsapp_clicks BIGINT;
    v_phone_clicks BIGINT;
    v_reviews_submitted BIGINT;
    v_reg_cta_clicks BIGINT;
BEGIN
    -- Server-side admin authorization guard
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    -- Parameter bounds validation
    IF p_days < 1 OR p_days > 90 THEN
        RAISE EXCEPTION 'Invalid query window: p_days must be between 1 and 90' USING ERRCODE = '22023';
    END IF;

    v_start_date := now() - (p_days || ' days')::INTERVAL;

    -- Provider funnel aggregation
    SELECT
        COUNT(*) FILTER (WHERE event_name = 'provider_registration_started'),
        COUNT(*) FILTER (WHERE event_name = 'provider_registration_validation_failed'),
        COUNT(*) FILTER (WHERE event_name = 'provider_registration_submitted'),
        COUNT(*) FILTER (WHERE event_name = 'provider_registration_succeeded'),
        COUNT(*) FILTER (WHERE event_name = 'provider_login_submitted'),
        COUNT(*) FILTER (WHERE event_name = 'provider_login_succeeded'),
        COUNT(*) FILTER (WHERE event_name = 'provider_login_failed'),
        COUNT(*) FILTER (WHERE event_name IN ('provider_services_updated', 'provider_pricing_updated', 'provider_hours_updated', 'provider_portfolio_uploaded', 'provider_availability_toggled'))
    INTO
        v_reg_started,
        v_reg_validation_failed,
        v_reg_submitted,
        v_reg_succeeded,
        v_login_submitted,
        v_login_succeeded,
        v_login_failed,
        v_dashboard_engagements
    FROM public.analytics_events
    WHERE created_at >= v_start_date;

    -- Customer funnel aggregation
    SELECT
        COUNT(*) FILTER (WHERE event_name = 'category_browse_clicked'),
        COUNT(*) FILTER (WHERE event_name = 'search_submitted'),
        COUNT(*) FILTER (WHERE event_name = 'search_no_results'),
        COUNT(*) FILTER (WHERE event_name = 'provider_profile_viewed'),
        COUNT(*) FILTER (WHERE event_name = 'whatsapp_clicked'),
        COUNT(*) FILTER (WHERE event_name = 'phone_clicked'),
        COUNT(*) FILTER (WHERE event_name = 'provider_review_submitted'),
        COUNT(*) FILTER (WHERE event_name = 'registration_cta_clicked')
    INTO
        v_category_browses,
        v_searches,
        v_search_no_results,
        v_profile_views,
        v_whatsapp_clicks,
        v_phone_clicks,
        v_reviews_submitted,
        v_reg_cta_clicks
    FROM public.analytics_events
    WHERE created_at >= v_start_date;

    RETURN jsonb_build_object(
        'window_days', p_days,
        'provider_funnel', jsonb_build_object(
            'registration_started', coalesce(v_reg_started, 0),
            'validation_failed', coalesce(v_reg_validation_failed, 0),
            'registration_submitted', coalesce(v_reg_submitted, 0),
            'registration_succeeded', coalesce(v_reg_succeeded, 0),
            'login_submitted', coalesce(v_login_submitted, 0),
            'login_succeeded', coalesce(v_login_succeeded, 0),
            'login_failed', coalesce(v_login_failed, 0),
            'dashboard_engagements', coalesce(v_dashboard_engagements, 0),
            'form_completion_rate', CASE WHEN coalesce(v_reg_started, 0) > 0 THEN ROUND((coalesce(v_reg_submitted, 0)::NUMERIC / v_reg_started::NUMERIC) * 100, 2) ELSE 0 END,
            'creation_success_rate', CASE WHEN coalesce(v_reg_submitted, 0) > 0 THEN ROUND((coalesce(v_reg_succeeded, 0)::NUMERIC / v_reg_submitted::NUMERIC) * 100, 2) ELSE 0 END,
            'login_success_rate', CASE WHEN (coalesce(v_login_succeeded, 0) + coalesce(v_login_failed, 0)) > 0 THEN ROUND((coalesce(v_login_succeeded, 0)::NUMERIC / (v_login_succeeded + v_login_failed)::NUMERIC) * 100, 2) ELSE 0 END
        ),
        'customer_funnel', jsonb_build_object(
            'category_browses', coalesce(v_category_browses, 0),
            'searches', coalesce(v_searches, 0),
            'search_no_results', coalesce(v_search_no_results, 0),
            'profile_views', coalesce(v_profile_views, 0),
            'whatsapp_clicks', coalesce(v_whatsapp_clicks, 0),
            'phone_clicks', coalesce(v_phone_clicks, 0),
            'total_contact_leads', coalesce(v_whatsapp_clicks, 0) + coalesce(v_phone_clicks, 0),
            'reviews_submitted', coalesce(v_reviews_submitted, 0),
            'registration_cta_clicks', coalesce(v_reg_cta_clicks, 0),
            'profile_lead_conversion_rate', CASE WHEN coalesce(v_profile_views, 0) > 0 THEN ROUND(((coalesce(v_whatsapp_clicks, 0) + coalesce(v_phone_clicks, 0))::NUMERIC / v_profile_views::NUMERIC) * 100, 2) ELSE 0 END,
            'whatsapp_preference_ratio', CASE WHEN (coalesce(v_whatsapp_clicks, 0) + coalesce(v_phone_clicks, 0)) > 0 THEN ROUND((coalesce(v_whatsapp_clicks, 0)::NUMERIC / (v_whatsapp_clicks + v_phone_clicks)::NUMERIC) * 100, 2) ELSE 0 END
        ),
        'observational_status', 'OBSERVATIONAL_ONLY',
        'generated_at', now()
    );
END;
$$;

-- C. Core Web Vitals Percentile Performance Summary
CREATE OR REPLACE FUNCTION public.get_analytics_performance_summary(
    p_days INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_sample_count BIGINT;
    v_lcp_p50 NUMERIC;
    v_lcp_p75 NUMERIC;
    v_lcp_p90 NUMERIC;
    v_inp_p75 NUMERIC;
    v_cls_p75 NUMERIC;
    v_ttfb_p75 NUMERIC;
    v_fcp_p75 NUMERIC;
    v_dom_p75 NUMERIC;
    v_splash_p75 NUMERIC;
    v_status TEXT;
BEGIN
    -- Server-side admin authorization guard
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    -- Parameter bounds validation
    IF p_days < 1 OR p_days > 90 THEN
        RAISE EXCEPTION 'Invalid query window: p_days must be between 1 and 90' USING ERRCODE = '22023';
    END IF;

    v_start_date := now() - (p_days || ' days')::INTERVAL;

    SELECT
        COUNT(*),
        ROUND(PERCENTILE_CONT(0.50) WITHIN GROUP (ORDER BY (properties->>'lcp_ms')::numeric), 0),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (properties->>'lcp_ms')::numeric), 0),
        ROUND(PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY (properties->>'lcp_ms')::numeric), 0),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (properties->>'inp_ms')::numeric), 0),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (properties->>'cls')::numeric), 3),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (properties->>'ttfb_ms')::numeric), 0),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (properties->>'fcp_ms')::numeric), 0),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (properties->>'dom_ready_ms')::numeric), 0),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (properties->>'pwa_splash_ms')::numeric), 0)
    INTO
        v_sample_count,
        v_lcp_p50,
        v_lcp_p75,
        v_lcp_p90,
        v_inp_p75,
        v_cls_p75,
        v_ttfb_p75,
        v_fcp_p75,
        v_dom_p75,
        v_splash_p75
    FROM public.analytics_events
    WHERE event_name = 'web_vitals_summary'
      AND created_at >= v_start_date;

    -- Minimum real-user sample check (threshold = 250)
    IF coalesce(v_sample_count, 0) < 250 THEN
        v_status := 'INSTRUMENTATION_ONLY';
    ELSE
        v_status := 'REPRESENTATIVE_PRODUCTION';
    END IF;

    RETURN jsonb_build_object(
        'window_days', p_days,
        'sample_count', coalesce(v_sample_count, 0),
        'status', v_status,
        'p75_metrics', jsonb_build_object(
            'lcp_ms', v_lcp_p75,
            'lcp_p50_ms', v_lcp_p50,
            'lcp_p90_ms', v_lcp_p90,
            'inp_ms', v_inp_p75,
            'cls', v_cls_p75,
            'ttfb_ms', v_ttfb_p75,
            'fcp_ms', v_fcp_p75,
            'dom_ready_ms', v_dom_p75,
            'pwa_splash_ms', v_splash_p75
        ),
        'thresholds', jsonb_build_object(
            'lcp_good', '<= 2500ms',
            'inp_good', '<= 200ms',
            'cls_good', '<= 0.10',
            'ttfb_target', '<= 800ms'
        ),
        'generated_at', now()
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. BOUNDED TELEMETRY RETENTION & PRUNING WORKER
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prune_old_analytics_events(
    p_retention_days INT DEFAULT 60,
    p_batch_size INT DEFAULT 5000
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_raw_deleted INT := 0;
    v_summaries_deleted INT := 0;
    v_cutoff_raw TIMESTAMPTZ;
    v_cutoff_summary DATE;
BEGIN
    -- Server-side admin authorization guard
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    -- Safety check: prevent accidental deletion of recent telemetry (< 30 days)
    IF p_retention_days < 30 THEN
        RAISE EXCEPTION 'Retention policy violation: p_retention_days must be at least 30' USING ERRCODE = '22023';
    END IF;

    -- Batch size upper limit to prevent excessive locks
    IF p_batch_size < 1 OR p_batch_size > 50000 THEN
        RAISE EXCEPTION 'Invalid batch size: p_batch_size must be between 1 and 50000' USING ERRCODE = '22023';
    END IF;

    v_cutoff_raw := now() - (p_retention_days || ' days')::INTERVAL;
    v_cutoff_summary := (CURRENT_DATE - INTERVAL '365 days')::DATE;

    -- 1. Bounded batch deletion of raw events older than retention cutoff
    WITH target_rows AS (
        SELECT id 
        FROM public.analytics_events
        WHERE created_at < v_cutoff_raw
        ORDER BY created_at ASC
        LIMIT p_batch_size
    )
    DELETE FROM public.analytics_events
    WHERE id IN (SELECT id FROM target_rows);

    GET DIAGNOSTICS v_raw_deleted = ROW_COUNT;

    -- 2. Prune daily summary rollups older than 365 days
    DELETE FROM public.analytics_daily_summary
    WHERE summary_date < v_cutoff_summary;

    GET DIAGNOSTICS v_summaries_deleted = ROW_COUNT;

    RETURN jsonb_build_object(
        'raw_events_deleted', v_raw_deleted,
        'daily_summaries_deleted', v_summaries_deleted,
        'retention_cutoff_raw', v_cutoff_raw,
        'retention_cutoff_summary', v_cutoff_summary,
        'completed_at', now()
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. FUNCTION PERMISSION GRANTS
-- ----------------------------------------------------------------------------
-- Explicitly revoke execute privileges from PUBLIC and anonymous visitors
REVOKE ALL ON FUNCTION public.generate_daily_analytics_summary(DATE) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_analytics_executive_summary(INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_analytics_funnel_summary(INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_analytics_performance_summary(INT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.prune_old_analytics_events(INT, INT) FROM PUBLIC, anon;

-- Grant execution to authenticated users (functions enforce server-side is_admin() inside)
GRANT EXECUTE ON FUNCTION public.generate_daily_analytics_summary(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_executive_summary(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_funnel_summary(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_analytics_performance_summary(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.prune_old_analytics_events(INT, INT) TO authenticated;

-- Document Schema Posture
COMMENT ON TABLE public.analytics_daily_summary IS 'Secure, pre-aggregated daily telemetry summaries with k-anonymity suppression and zero raw session exposure.';
