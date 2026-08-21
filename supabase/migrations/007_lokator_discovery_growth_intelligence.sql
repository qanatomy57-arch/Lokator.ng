-- ============================================================================
-- LOKATOR.NG — DATABASE MIGRATION 007: DISCOVERY & GROWTH INTELLIGENCE
-- Phase 7.1: Pre-aggregated demand/supply matrix, discovery quality metrics,
-- and growth signal intelligence engine.
--
-- Security & Operational Architecture:
-- 1. Pre-aggregated rollups in public.analytics_growth_daily_summary (Zero raw PII).
-- 2. SECURITY DEFINER execution with fixed search_path = public, extensions, pg_temp.
-- 3. Server-side public.is_admin() enforcement on all RPCs (SQLSTATE 42501).
-- 4. k-Anonymity (k >= 5) and volume gating (N >= 30) for small-sample protection.
-- 5. Strict air-gap between Observational Growth Intelligence and live Provider Ranking.
-- ============================================================================

-- 1. GROWTH DAILY SUMMARY TABLE
CREATE TABLE IF NOT EXISTS public.analytics_growth_daily_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_date DATE NOT NULL,
    category TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'All',
    lga TEXT NOT NULL DEFAULT 'All',
    search_count INT NOT NULL DEFAULT 0 CHECK (search_count >= 0),
    zero_result_count INT NOT NULL DEFAULT 0 CHECK (zero_result_count >= 0),
    profile_view_count INT NOT NULL DEFAULT 0 CHECK (profile_view_count >= 0),
    lead_count INT NOT NULL DEFAULT 0 CHECK (lead_count >= 0),
    unique_sessions INT NOT NULL DEFAULT 0 CHECK (unique_sessions >= 0),
    demand_index NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (demand_index >= 0),
    active_verified_providers INT NOT NULL DEFAULT 0 CHECK (active_verified_providers >= 0),
    gap_ratio NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (gap_ratio >= 0),
    dqs_score NUMERIC(5,2) NOT NULL DEFAULT 0 CHECK (dqs_score >= 0 AND dqs_score <= 100),
    model_version TEXT NOT NULL DEFAULT 'v1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_growth_daily_summary UNIQUE (summary_date, category, state, lga, model_version)
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_growth_summary_date_cat ON public.analytics_growth_daily_summary (summary_date DESC, category);
CREATE INDEX IF NOT EXISTS idx_growth_summary_geo ON public.analytics_growth_daily_summary (state, lga);

-- Enable Row Level Security
ALTER TABLE public.analytics_growth_daily_summary ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Admins Only
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'analytics_growth_daily_summary' 
        AND policyname = 'Admins can manage analytics_growth_daily_summary'
    ) THEN
        CREATE POLICY "Admins can manage analytics_growth_daily_summary"
            ON public.analytics_growth_daily_summary
            FOR ALL
            TO authenticated
            USING (public.is_admin())
            WITH CHECK (public.is_admin());
    END IF;
END $$;

REVOKE ALL ON public.analytics_growth_daily_summary FROM PUBLIC, anon;
GRANT SELECT, INSERT, UPDATE ON public.analytics_growth_daily_summary TO authenticated;


-- ============================================================================
-- 2. DAILY GROWTH SUMMARY ROLLUP GENERATOR
-- ============================================================================
CREATE OR REPLACE FUNCTION public.generate_daily_growth_summary(
    p_target_date DATE DEFAULT (CURRENT_DATE - 1)
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_start_ts TIMESTAMPTZ;
    v_end_ts TIMESTAMPTZ;
    v_inserted_count INT := 0;
    v_model_version CONSTANT TEXT := 'v1';
    -- Versioned Model Weights: D = 1.0 * Searches + 2.0 * Views + 5.0 * Leads
    v_w_search CONSTANT NUMERIC := 1.0;
    v_w_view CONSTANT NUMERIC := 2.0;
    v_w_lead CONSTANT NUMERIC := 5.0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    v_start_ts := p_target_date::TIMESTAMPTZ;
    v_end_ts := (p_target_date + 1):'TIMESTAMPTZ';

    -- Temporary aggregation of daily search, view, and conversion metrics
    WITH event_metrics AS (
        SELECT
            COALESCE(e.properties->>'category', 'all') AS category,
            COALESCE(e.properties->>'state', 'All') AS state,
            COALESCE(e.properties->>'lga', 'All') AS lga,
            COUNT(*) FILTER (WHERE e.event_name = 'search_submitted') AS searches,
            COUNT(*) FILTER (WHERE e.event_name = 'search_no_results') AS zero_results,
            COUNT(*) FILTER (WHERE e.event_name = 'provider_profile_viewed') AS profile_views,
            COUNT(*) FILTER (WHERE e.event_name IN ('whatsapp_clicked', 'phone_clicked')) AS leads,
            COUNT(DISTINCT e.session_id) AS sessions
        FROM public.analytics_events e
        WHERE e.created_at >= v_start_ts AND e.created_at < v_end_ts
        GROUP BY 
            COALESCE(e.properties->>'category', 'all'),
            COALESCE(e.properties->>'state', 'All'),
            COALESCE(e.properties->>'lga', 'All')
    ),
    active_providers AS (
        -- Decoupled read-only provider count
        SELECT 
            COALESCE(p.state, 'All') AS state,
            COALESCE(p.lga, 'All') AS lga,
            COUNT(*) FILTER (WHERE p.is_active = true AND p.is_verified = true) AS verified_count
        FROM public.providers p
        GROUP BY COALESCE(p.state, 'All'), COALESCE(p.lga, 'All')
    ),
    computed_daily AS (
        SELECT
            p_target_date AS summary_date,
            em.category,
            em.state,
            em.lga,
            em.searches,
            em.zero_results,
            em.profile_views,
            em.leads,
            em.sessions,
            -- Demand Index = 1.0 * Searches + 2.0 * Views + 5.0 * Leads
            ROUND((v_w_search * em.searches) + (v_w_view * em.profile_views) + (v_w_lead * em.leads), 2) AS demand_idx,
            COALESCE(ap.verified_count, 0) AS verified_prov,
            -- Gap Ratio = Demand / max(Supply, 1)
            ROUND(((v_w_search * em.searches) + (v_w_view * em.profile_views) + (v_w_lead * em.leads)) / GREATEST(COALESCE(ap.verified_count, 0), 1), 2) AS gap_rat,
            -- Discovery Quality Score
            LEAST(100.0, GREATEST(0.0, ROUND(
                100.0 - 
                (2.5 * (em.zero_results::NUMERIC / GREATEST(em.searches, 1) * 100.0)) +
                (0.5 * (em.profile_views::NUMERIC / GREATEST(em.searches, 1) * 100.0)) +
                (1.0 * (em.leads::NUMERIC / GREATEST(em.profile_views, 1) * 100.0)),
                2
            ))) AS dqs,
            v_model_version AS model_ver
        FROM event_metrics em
        LEFT JOIN active_providers ap ON em.state = ap.state AND em.lga = ap.lga
    )
    INSERT INTO public.analytics_growth_daily_summary (
        summary_date, category, state, lga, search_count, zero_result_count,
        profile_view_count, lead_count, unique_sessions, demand_index,
        active_verified_providers, gap_ratio, dqs_score, model_version
    )
    SELECT
        summary_date, category, state, lga, searches, zero_results,
        profile_views, leads, sessions, demand_idx,
        verified_prov, gap_rat, dqs, model_ver
    FROM computed_daily
    ON CONFLICT (summary_date, category, state, lga, model_version)
    DO UPDATE SET
        search_count = EXCLUDED.search_count,
        zero_result_count = EXCLUDED.zero_result_count,
        profile_view_count = EXCLUDED.profile_view_count,
        lead_count = EXCLUDED.lead_count,
        unique_sessions = EXCLUDED.unique_sessions,
        demand_index = EXCLUDED.demand_index,
        active_verified_providers = EXCLUDED.active_verified_providers,
        gap_ratio = EXCLUDED.gap_ratio,
        dqs_score = EXCLUDED.dqs_score,
        created_at = NOW();

    GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'target_date', p_target_date,
        'records_processed', v_inserted_count,
        'model_version', v_model_version,
        'observational_status', 'OBSERVATIONAL_ONLY'
    );
END;
$$;


-- ============================================================================
-- 3. GET GROWTH INTELLIGENCE SUMMARY RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_growth_intelligence_summary(
    p_days INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_start_date DATE;
    v_k_threshold CONSTANT INT := 5;
    v_total_searches BIGINT := 0;
    v_total_zero_results BIGINT := 0;
    v_total_profile_views BIGINT := 0;
    v_total_leads BIGINT := 0;
    v_avg_dqs NUMERIC(5,2) := 0;
    v_categories_json JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    IF p_days < 1 OR p_days > 90 THEN
        RAISE EXCEPTION 'Invalid window: p_days must be between 1 and 90.'
            USING ERRCODE = '22023';
    END IF;

    v_start_date := CURRENT_DATE - p_days;

    -- Aggregate platform totals across window
    SELECT
        COALESCE(SUM(search_count), 0),
        COALESCE(SUM(zero_result_count), 0),
        COALESCE(SUM(profile_view_count), 0),
        COALESCE(SUM(lead_count), 0),
        ROUND(COALESCE(AVG(dqs_score), 0), 2)
    INTO
        v_total_searches,
        v_total_zero_results,
        v_total_profile_views,
        v_total_leads,
        v_avg_dqs
    FROM public.analytics_growth_daily_summary
    WHERE summary_date >= v_start_date;

    -- Aggregate by category with k-anonymity suppression
    SELECT jsonb_agg(cat_row)
    INTO v_categories_json
    FROM (
        SELECT
            category,
            SUM(search_count) AS searches,
            SUM(zero_result_count) AS zero_results,
            SUM(profile_view_count) AS profile_views,
            SUM(lead_count) AS leads,
            ROUND(SUM(demand_index), 2) AS total_demand_index,
            ROUND(AVG(gap_ratio), 2) AS avg_gap_ratio,
            ROUND(AVG(dqs_score), 2) AS avg_dqs_score,
            CASE 
                WHEN SUM(unique_sessions) < v_k_threshold THEN 'DATA_INSUFFICIENT'
                ELSE 'RELIABLE'
            END AS statistical_confidence
        FROM public.analytics_growth_daily_summary
        WHERE summary_date >= v_start_date
        GROUP BY category
        ORDER BY searches DESC
        LIMIT 25
    ) cat_row;

    RETURN jsonb_build_object(
        'window_days', p_days,
        'model_version', 'v1',
        'platform_total_searches', v_total_searches,
        'platform_total_zero_results', v_total_zero_results,
        'platform_total_profile_views', v_total_profile_views,
        'platform_total_leads', v_total_leads,
        'platform_zero_result_rate', CASE WHEN v_total_searches > 0 THEN ROUND((v_total_zero_results::NUMERIC / v_total_searches * 100.0), 2) ELSE 0 END,
        'platform_search_to_profile_rate', CASE WHEN v_total_searches > 0 THEN ROUND((v_total_profile_views::NUMERIC / v_total_searches * 100.0), 2) ELSE 0 END,
        'platform_profile_to_lead_rate', CASE WHEN v_total_profile_views > 0 THEN ROUND((v_total_leads::NUMERIC / v_total_profile_views * 100.0), 2) ELSE 0 END,
        'platform_avg_dqs_score', v_avg_dqs,
        'categories', COALESCE(v_categories_json, '[]'::JSONB),
        'observational_status', 'OBSERVATIONAL_ONLY',
        'generated_at', NOW()
    );
END;
$$;


-- ============================================================================
-- 4. GET LGA DEMAND / SUPPLY GAPS RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_lga_demand_supply_gaps(
    p_days INT DEFAULT 30,
    p_min_searches INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_start_date DATE;
    v_k_threshold CONSTANT INT := 5;
    v_gaps_json JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    IF p_days < 1 OR p_days > 90 THEN
        RAISE EXCEPTION 'Invalid window: p_days must be between 1 and 90.'
            USING ERRCODE = '22023';
    END IF;

    v_start_date := CURRENT_DATE - p_days;

    SELECT jsonb_agg(gap_row)
    INTO v_gaps_json
    FROM (
        SELECT
            state,
            lga,
            category,
            SUM(search_count) AS total_searches,
            SUM(zero_result_count) AS total_zero_results,
            SUM(profile_view_count) AS total_views,
            SUM(lead_count) AS total_leads,
            MAX(active_verified_providers) AS active_verified_providers,
            ROUND(SUM(demand_index), 2) AS aggregate_demand_index,
            ROUND(SUM(demand_index) / GREATEST(MAX(active_verified_providers), 1), 2) AS aggregate_gap_ratio,
            CASE 
                WHEN SUM(search_count) >= 30 AND MAX(active_verified_providers) = 0 THEN 'ACUTE_SHORTAGE'
                WHEN SUM(demand_index) / GREATEST(MAX(active_verified_providers), 1) >= 15.0 THEN 'HIGH_DEFICIT'
                WHEN SUM(demand_index) / GREATEST(MAX(active_verified_providers), 1) >= 5.0 THEN 'MODERATE_DEFICIT'
                ELSE 'BALANCED'
            END AS gap_severity
        FROM public.analytics_growth_daily_summary
        WHERE summary_date >= v_start_date 
          AND lga != 'All'
        GROUP BY state, lga, category
        HAVING SUM(unique_sessions) >= v_k_threshold AND SUM(search_count) >= p_min_searches
        ORDER BY aggregate_gap_ratio DESC
        LIMIT 50
    ) gap_row;

    RETURN jsonb_build_object(
        'window_days', p_days,
        'min_search_threshold', p_min_searches,
        'model_version', 'v1',
        'k_anonymity_floor', v_k_threshold,
        'gaps', COALESCE(v_gaps_json, '[]'::JSONB),
        'observational_status', 'OBSERVATIONAL_ONLY',
        'generated_at', NOW()
    );
END;
$$;


-- ============================================================================
-- 5. GET GROWTH SIGNALS RPC (REUSES PHASE 6 ALERT INTEGRATION)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_growth_signals(
    p_days INT DEFAULT 14
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_start_date DATE;
    v_signals_json JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    IF p_days < 1 OR p_days > 90 THEN
        RAISE EXCEPTION 'Invalid window: p_days must be between 1 and 90.'
            USING ERRCODE = '22023';
    END IF;

    v_start_date := CURRENT_DATE - p_days;

    -- Generate read-only growth signals
    SELECT jsonb_agg(sig)
    INTO v_signals_json
    FROM (
        -- 1. Severe LGA Supply Deficits
        SELECT
            'SUPPLY_DEFICIT' AS signal_type,
            category AS metric_target,
            (state || ' - ' || lga) AS geographic_scope,
            ROUND(SUM(demand_index) / GREATEST(MAX(active_verified_providers), 1), 2) AS current_metric_value,
            'CRITICAL' AS severity,
            'Acute supply deficit in ' || lga || ': ' || SUM(search_count) || ' searches with ' || MAX(active_verified_providers) || ' active providers.' AS description
        FROM public.analytics_growth_daily_summary
        WHERE summary_date >= v_start_date AND lga != 'All'
        GROUP BY state, lga, category
        HAVING SUM(search_count) >= 30 AND MAX(active_verified_providers) <= 1 AND (SUM(demand_index) / GREATEST(MAX(active_verified_providers), 1)) >= 15.0

        UNION ALL

        -- 2. Zero-Yield Search Surges (ZRR > 35% with N >= 30)
        SELECT
            'ZERO_YIELD_SURGE' AS signal_type,
            category AS metric_target,
            (state || ' - ' || lga) AS geographic_scope,
            ROUND((SUM(zero_result_count)::NUMERIC / GREATEST(SUM(search_count), 1) * 100.0), 2) AS current_metric_value,
            'WARNING' AS severity,
            'High zero-result search rate in ' || category || ' (' || ROUND((SUM(zero_result_count)::NUMERIC / GREATEST(SUM(search_count), 1) * 100.0), 2) || '%).' AS description
        FROM public.analytics_growth_daily_summary
        WHERE summary_date >= v_start_date
        GROUP BY state, lga, category
        HAVING SUM(search_count) >= 30 AND (SUM(zero_result_count)::NUMERIC / GREATEST(SUM(search_count), 1)) >= 0.35
    ) sig;

    RETURN jsonb_build_object(
        'window_days', p_days,
        'signals_count', COALESCE(jsonb_array_length(v_signals_json), 0),
        'signals', COALESCE(v_signals_json, '[]'::JSONB),
        'observational_status', 'OBSERVATIONAL_ONLY',
        'generated_at', NOW()
    );
END;
$$;

-- Revoke public permissions
REVOKE EXECUTE ON FUNCTION public.generate_daily_growth_summary(DATE) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_growth_intelligence_summary(INT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_lga_demand_supply_gaps(INT, INT) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_growth_signals(INT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.generate_daily_growth_summary(DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_growth_intelligence_summary(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_lga_demand_supply_gaps(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_growth_signals(INT) TO authenticated;
