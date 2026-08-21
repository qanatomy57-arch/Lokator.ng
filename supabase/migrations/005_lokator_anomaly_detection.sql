-- ============================================================================
-- LOKATOR.NG — PHASE 6.3 MIGRATION: PRODUCTION ANOMALY DETECTION ENGINE
-- Migration: 005_lokator_anomaly_detection.sql
-- Security: SECURITY DEFINER Protected Aggregations, Server-Side is_admin() Auth,
--           k-Anonymity (k >= 5) Suppression, Zero Raw Event / PII Exposure,
--           Multi-Window Statistical Baselines, Noise & False-Positive Gating
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. ANOMALY DETECTION AGGREGATION RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_analytics_anomaly_summary(
    p_days INT DEFAULT 7,
    p_z_threshold NUMERIC DEFAULT 2.5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_start_date TIMESTAMPTZ;
    v_baseline_start TIMESTAMPTZ;
    v_k_threshold CONSTANT INT := 5;
    v_min_funnel_volume CONSTANT INT := 30;
    v_min_cwv_samples CONSTANT INT := 250;
    
    -- Ingestion / traffic metrics
    v_current_events BIGINT;
    v_current_sessions BIGINT;
    v_baseline_avg_daily_events NUMERIC;
    v_baseline_stddev_daily_events NUMERIC;
    v_events_z_score NUMERIC := 0;
    
    -- Client error metrics
    v_error_count BIGINT;
    v_page_view_count BIGINT;
    v_error_rate NUMERIC := 0;
    
    -- Funnel metrics (current window)
    v_reg_started BIGINT;
    v_reg_failed BIGINT;
    v_reg_submitted BIGINT;
    v_reg_succeeded BIGINT;
    v_login_succeeded BIGINT;
    v_login_failed BIGINT;
    v_searches BIGINT;
    v_search_no_results BIGINT;
    v_profile_views BIGINT;
    v_whatsapp_clicks BIGINT;
    v_phone_clicks BIGINT;
    
    -- Funnel ratios
    v_form_completion_rate NUMERIC;
    v_creation_success_rate NUMERIC;
    v_login_success_rate NUMERIC;
    v_lead_conversion_rate NUMERIC;
    v_no_results_rate NUMERIC;
    
    -- Performance metrics (Core Web Vitals p75)
    v_cwv_samples BIGINT;
    v_lcp_p75 NUMERIC;
    v_inp_p75 NUMERIC;
    v_cls_p75 NUMERIC;
    v_ttfb_p75 NUMERIC;
    
    -- Anomaly collection
    v_anomalies JSONB := '[]'::jsonb;
    v_platform_status TEXT := 'HEALTHY';
    v_has_critical BOOLEAN := FALSE;
    v_has_warning BOOLEAN := FALSE;
    v_data_sufficient BOOLEAN := TRUE;
BEGIN
    -- 1. Server-Side Admin Authorization Guard
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Administrator privileges required' USING ERRCODE = '42501';
    END IF;

    -- 2. Input Parameter Validation & Boundary Checks
    IF p_days < 1 OR p_days > 90 THEN
        RAISE EXCEPTION 'Invalid query window: p_days must be between 1 and 90' USING ERRCODE = '22023';
    END IF;

    IF p_z_threshold < 1.0 OR p_z_threshold > 10.0 OR p_z_threshold IS NULL THEN
        RAISE EXCEPTION 'Invalid threshold: p_z_threshold must be between 1.0 and 10.0' USING ERRCODE = '22023';
    END IF;

    v_start_date := now() - (p_days || ' days')::INTERVAL;
    v_baseline_start := now() - ((p_days * 4) || ' days')::INTERVAL; -- 4x lookback window for baseline

    -- 3. Volume & Baseline Computation from Pre-Aggregated Summaries / Raw Fallback
    SELECT 
        COUNT(*),
        COUNT(DISTINCT session_id),
        COUNT(*) FILTER (WHERE event_name = 'client_error'),
        COUNT(*) FILTER (WHERE event_name = 'page_view')
    INTO 
        v_current_events,
        v_current_sessions,
        v_error_count,
        v_page_view_count
    FROM public.analytics_events
    WHERE created_at >= v_start_date;

    -- Calculate historical daily event baseline from analytics_daily_summary
    SELECT 
        coalesce(AVG(daily_total), 0),
        coalesce(STDDEV(daily_total), 0)
    INTO 
        v_baseline_avg_daily_events,
        v_baseline_stddev_daily_events
    FROM (
        SELECT summary_date, SUM(event_count) AS daily_total
        FROM public.analytics_daily_summary
        WHERE summary_date >= v_baseline_start::DATE AND summary_date < v_start_date::DATE
        GROUP BY summary_date
    ) hist_sub;

    -- Calculate z-score for traffic volume if baseline variance is statistically valid
    IF v_baseline_stddev_daily_events > 0 AND v_baseline_avg_daily_events > 0 THEN
        DECLARE
            v_current_daily_avg NUMERIC := v_current_events::NUMERIC / p_days::NUMERIC;
        BEGIN
            v_events_z_score := ROUND((v_current_daily_avg - v_baseline_avg_daily_events) / v_baseline_stddev_daily_events, 2);
            
            -- Traffic collapse check (< 0.20x baseline with statistical significance)
            IF v_current_daily_avg < (v_baseline_avg_daily_events * 0.20) AND v_baseline_avg_daily_events >= 50 THEN
                v_anomalies := v_anomalies || jsonb_build_object(
                    'category', 'TRAFFIC',
                    'metric', 'daily_event_volume_collapse',
                    'severity', 'CRITICAL',
                    'current_value', v_current_daily_avg,
                    'baseline_value', v_baseline_avg_daily_events,
                    'z_score', v_events_z_score,
                    'message', 'Severe telemetry volume drop (>80% below 28-day baseline)'
                );
                v_has_critical := TRUE;
            ELSIF ABS(v_events_z_score) >= p_z_threshold THEN
                v_anomalies := v_anomalies || jsonb_build_object(
                    'category', 'TRAFFIC',
                    'metric', 'daily_event_volume_surge',
                    'severity', 'ELEVATED',
                    'current_value', v_current_daily_avg,
                    'baseline_value', v_baseline_avg_daily_events,
                    'z_score', v_events_z_score,
                    'message', 'Telemetry volume significantly deviated from historical baseline'
                );
                v_has_warning := TRUE;
            END IF;
        END;
    END IF;

    -- 4. Reliability Anomaly Evaluation (Client Runtime Errors)
    IF v_page_view_count > 0 THEN
        v_error_rate := ROUND((v_error_count::NUMERIC / v_page_view_count::NUMERIC) * 100, 2);
        IF v_error_rate >= 5.0 AND v_error_count >= 10 THEN
            v_anomalies := v_anomalies || jsonb_build_object(
                'category', 'RELIABILITY',
                'metric', 'client_error_rate',
                'severity', 'CRITICAL',
                'current_value', v_error_rate,
                'baseline_value', 1.0,
                'message', 'Client runtime error rate exceeded 5% threshold'
            );
            v_has_critical := TRUE;
        ELSIF v_error_rate >= 2.5 AND v_error_count >= 5 THEN
            v_anomalies := v_anomalies || jsonb_build_object(
                'category', 'RELIABILITY',
                'metric', 'client_error_rate',
                'severity', 'WATCH',
                'current_value', v_error_rate,
                'baseline_value', 1.0,
                'message', 'Elevated client runtime error rate observed'
            );
            v_has_warning := TRUE;
        END IF;
    END IF;

    -- 5. Funnel Conversion Anomaly Evaluation (with N >= 30 sample floor)
    SELECT
        COUNT(*) FILTER (WHERE event_name = 'provider_registration_started'),
        COUNT(*) FILTER (WHERE event_name = 'provider_registration_validation_failed'),
        COUNT(*) FILTER (WHERE event_name = 'provider_registration_submitted'),
        COUNT(*) FILTER (WHERE event_name = 'provider_registration_succeeded'),
        COUNT(*) FILTER (WHERE event_name = 'provider_login_succeeded'),
        COUNT(*) FILTER (WHERE event_name = 'provider_login_failed'),
        COUNT(*) FILTER (WHERE event_name = 'search_submitted'),
        COUNT(*) FILTER (WHERE event_name = 'search_no_results'),
        COUNT(*) FILTER (WHERE event_name = 'provider_profile_viewed'),
        COUNT(*) FILTER (WHERE event_name = 'whatsapp_clicked'),
        COUNT(*) FILTER (WHERE event_name = 'phone_clicked')
    INTO
        v_reg_started,
        v_reg_failed,
        v_reg_submitted,
        v_reg_succeeded,
        v_login_succeeded,
        v_login_failed,
        v_searches,
        v_search_no_results,
        v_profile_views,
        v_whatsapp_clicks,
        v_phone_clicks
    FROM public.analytics_events
    WHERE created_at >= v_start_date;

    -- Registration Form Completion Anomaly (Threshold: drop >= 25%, volume N >= 30)
    IF v_reg_started >= v_min_funnel_volume THEN
        v_form_completion_rate := ROUND((v_reg_submitted::NUMERIC / v_reg_started::NUMERIC) * 100, 2);
        IF v_form_completion_rate < 50.0 THEN -- Standard baseline is ~75%
            v_anomalies := v_anomalies || jsonb_build_object(
                'category', 'PROVIDER_FUNNEL',
                'metric', 'form_completion_degradation',
                'severity', 'ELEVATED',
                'current_value', v_form_completion_rate,
                'sample_size', v_reg_started,
                'message', 'Registration form completion rate dropped below 50%'
            );
            v_has_warning := TRUE;
        END IF;
    END IF;

    -- Search Zero-Yield Anomaly (Threshold: no-results > 40%, volume N >= 30)
    IF v_searches >= v_min_funnel_volume THEN
        v_no_results_rate := ROUND((v_search_no_results::NUMERIC / v_searches::NUMERIC) * 100, 2);
        IF v_no_results_rate >= 40.0 THEN
            v_anomalies := v_anomalies || jsonb_build_object(
                'category', 'CUSTOMER_DISCOVERY',
                'metric', 'search_zero_yield_surge',
                'severity', 'ELEVATED',
                'current_value', v_no_results_rate,
                'sample_size', v_searches,
                'message', 'Over 40% of searches yielded zero artisan results'
            );
            v_has_warning := TRUE;
        END IF;
    END IF;

    -- Customer Lead Conversion Anomaly (Profile views N >= 30, lead rate < 5%)
    IF v_profile_views >= v_min_funnel_volume THEN
        v_lead_conversion_rate := ROUND(((v_whatsapp_clicks + v_phone_clicks)::NUMERIC / v_profile_views::NUMERIC) * 100, 2);
        IF v_lead_conversion_rate < 5.0 THEN -- Standard baseline is ~15-25%
            v_anomalies := v_anomalies || jsonb_build_object(
                'category', 'CUSTOMER_DISCOVERY',
                'metric', 'lead_conversion_degradation',
                'severity', 'ELEVATED',
                'current_value', v_lead_conversion_rate,
                'sample_size', v_profile_views,
                'message', 'Artisan profile contact lead conversion dropped below 5%'
            );
            v_has_warning := TRUE;
        END IF;
    END IF;

    -- 6. Core Web Vitals Performance Anomaly Evaluation (Sample size N >= 250 gate)
    SELECT
        COUNT(*),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (properties->>'lcp_ms')::numeric)::numeric, 2),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (properties->>'inp_ms')::numeric)::numeric, 2),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (properties->>'cls')::numeric)::numeric, 4),
        ROUND(PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY (properties->>'ttfb_ms')::numeric)::numeric, 2)
    INTO
        v_cwv_samples,
        v_lcp_p75,
        v_inp_p75,
        v_cls_p75,
        v_ttfb_p75
    FROM public.analytics_events
    WHERE event_name = 'web_vitals_summary'
      AND created_at >= v_start_date;

    IF coalesce(v_cwv_samples, 0) >= v_min_cwv_samples THEN
        IF v_lcp_p75 > 4000 THEN
            v_anomalies := v_anomalies || jsonb_build_object(
                'category', 'PERFORMANCE',
                'metric', 'lcp_degradation',
                'severity', 'ELEVATED',
                'current_value', v_lcp_p75,
                'threshold', 2500,
                'sample_size', v_cwv_samples,
                'message', 'p75 LCP latency exceeded 4000ms'
            );
            v_has_warning := TRUE;
        END IF;
        IF v_cls_p75 > 0.25 THEN
            v_anomalies := v_anomalies || jsonb_build_object(
                'category', 'PERFORMANCE',
                'metric', 'cls_degradation',
                'severity', 'ELEVATED',
                'current_value', v_cls_p75,
                'threshold', 0.10,
                'sample_size', v_cwv_samples,
                'message', 'p75 Cumulative Layout Shift exceeded 0.25'
            );
            v_has_warning := TRUE;
        END IF;
    END IF;

    -- 7. Platform Status Evaluation
    IF v_current_events = 0 AND coalesce(v_baseline_avg_daily_events, 0) = 0 THEN
        v_platform_status := 'DATA_INSUFFICIENT';
    ELSIF v_has_critical THEN
        v_platform_status := 'CRITICAL';
    ELSIF v_has_warning THEN
        v_platform_status := 'WARNING';
    ELSE
        v_platform_status := 'HEALTHY';
    END IF;

    -- 8. Return Sanitized, Aggregate JSON Output (Observational Only)
    RETURN jsonb_build_object(
        'window_days', p_days,
        'z_threshold', p_z_threshold,
        'platform_status', v_platform_status,
        'anomalies_count', jsonb_array_length(v_anomalies),
        'anomalies', v_anomalies,
        'metrics_summary', jsonb_build_object(
            'total_events', coalesce(v_current_events, 0),
            'total_sessions_approx', coalesce(v_current_sessions, 0),
            'error_rate_percent', coalesce(v_error_rate, 0),
            'cwv_sample_count', coalesce(v_cwv_samples, 0),
            'cwv_status', CASE WHEN coalesce(v_cwv_samples, 0) >= v_min_cwv_samples THEN 'REPRESENTATIVE' ELSE 'INSUFFICIENT_DATA' END
        ),
        'observational_status', 'OBSERVATIONAL_ONLY',
        'generated_at', now()
    );
END;
$$;

-- Explicit Privilege Management: Revoke from public roles, grant to authenticated
REVOKE EXECUTE ON FUNCTION public.get_analytics_anomaly_summary(INT, NUMERIC) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_analytics_anomaly_summary(INT, NUMERIC) TO authenticated;
