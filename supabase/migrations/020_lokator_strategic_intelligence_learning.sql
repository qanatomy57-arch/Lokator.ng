-- ====================================================================
-- LOKATOR.NG — PHASE 9.8 DATABASE MIGRATION
-- STRATEGIC INTELLIGENCE LEARNING, CALIBRATION & CONTINUOUS IMPROVEMENT ENGINE (SILCCIE)
--
-- Migration: 020_lokator_strategic_intelligence_learning.sql
-- Model Version: SILCCIE-1.0.0
-- Dependencies: 001-019 (Preserves Phase 9.0-9.7 Invariants)
-- Invariants:
--   - 100% Ranking Air-Gap (Zero imports/calls in search/discovery)
--   - Business Truth Immutability (0 mutations on providers/reviews/services)
--   - Zero Autonomous Execution (No triggers, webhooks, outbound network, background jobs)
--   - Strict Server-Side Security (SECURITY DEFINER, auth.uid(), public.is_admin())
--   - Strict Causality Distinction (OBSERVED_ASSOCIATION vs CAUSAL_EVIDENCE)
-- ====================================================================

-- 1. MODEL EVALUATIONS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_learning_model_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    target_model_version TEXT NOT NULL,
    learning_engine_version TEXT NOT NULL DEFAULT 'SILCCIE-1.0.0',
    cohort_definition JSONB NOT NULL DEFAULT '{}'::jsonb,
    sample_count INT NOT NULL CHECK (sample_count >= 0),
    brier_score NUMERIC(6,4),
    expected_calibration_error NUMERIC(6,4),
    mean_forecast_error_ev NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    mean_forecast_error_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    model_health_score NUMERIC(5,2) NOT NULL CHECK (model_health_score BETWEEN 0.00 AND 100.00),
    drift_status TEXT NOT NULL CHECK (drift_status IN ('STABLE', 'WATCH', 'DRIFTING', 'DEGRADED', 'UNTRUSTWORTHY')),
    evaluation_metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    evaluated_by UUID NOT NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STRATEGIC ASSUMPTION LEARNING SIGNALS
CREATE TABLE IF NOT EXISTS public.analytics_learning_assumption_signals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assumption_category TEXT NOT NULL CHECK (assumption_category IN (
        'DEMAND_GROWTH', 'PROVIDER_ACQUISITION', 'CAMPAIGN_CONVERSION',
        'GEOGRAPHIC_EXPANSION', 'RESOURCE_CONSUMPTION', 'RESILIENCE_SURVIVAL'
    )),
    signal_type TEXT NOT NULL CHECK (signal_type IN ('OVERESTIMATION', 'UNDERESTIMATION', 'HIGH_VOLATILITY', 'STABLE')),
    bias_magnitude_pct NUMERIC(6,2) NOT NULL,
    observation_count INT NOT NULL CHECK (observation_count >= 0),
    confidence_tier TEXT NOT NULL CHECK (confidence_tier IN ('HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT_SAMPLE')),
    evidence_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CALIBRATION SIMULATION RUNS
CREATE TABLE IF NOT EXISTS public.analytics_learning_calibration_simulations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    evaluation_id UUID NOT NULL REFERENCES public.analytics_learning_model_evaluations(id) ON DELETE CASCADE,
    simulation_name TEXT NOT NULL,
    proposed_confidence_scale NUMERIC(4,2) NOT NULL CHECK (proposed_confidence_scale BETWEEN 0.10 AND 2.00),
    proposed_ev_bias_offset NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    projected_health_score NUMERIC(5,2) NOT NULL CHECK (projected_health_score BETWEEN 0.00 AND 100.00),
    projected_ece NUMERIC(6,4),
    simulation_status TEXT NOT NULL DEFAULT 'SIMULATED_ONLY',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. LEARNING AUDIT LOG (Strictly Append-Only)
CREATE TABLE IF NOT EXISTS public.analytics_learning_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) & REVOCATIONS
-- ====================================================================

ALTER TABLE public.analytics_learning_model_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_learning_assumption_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_learning_calibration_simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_learning_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_learning_model_evaluations FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_learning_assumption_signals FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_learning_calibration_simulations FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_learning_audit_log FROM PUBLIC, anon;

-- Revoke mutation privileges on append-only audit structures
REVOKE UPDATE, DELETE ON public.analytics_learning_model_evaluations FROM authenticated;
REVOKE UPDATE, DELETE ON public.analytics_learning_assumption_signals FROM authenticated;
REVOKE UPDATE, DELETE ON public.analytics_learning_audit_log FROM authenticated;

CREATE POLICY admin_manage_evaluations ON public.analytics_learning_model_evaluations
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_assumption_signals ON public.analytics_learning_assumption_signals
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_simulations ON public.analytics_learning_calibration_simulations
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_learning_audit ON public.analytics_learning_audit_log
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ====================================================================
-- PRIVILEGED RPC CONTRACTS (SECURITY DEFINER / FIXED SEARCH PATH)
-- ====================================================================

-- 1. EVALUATE MODEL HEALTH & DRIFT RPC
CREATE OR REPLACE FUNCTION public.evaluate_strategic_model_health(
    p_model_version TEXT DEFAULT 'SDGRLE-1.0.0',
    p_lookback_days INT DEFAULT 90
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_sample_count INT := 0;
    v_avg_fe_ev NUMERIC(10,2) := 0.00;
    v_avg_fe_cost NUMERIC(12,2) := 0.00;
    v_avg_vrr NUMERIC(6,4) := 1.0000;
    v_effective_count INT := 0;
    v_brier NUMERIC(6,4) := 0.0500;
    v_ece NUMERIC(6,4) := 0.0400;
    v_health_score NUMERIC(5,2) := 85.00;
    v_drift TEXT := 'STABLE';
    v_eval_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF p_lookback_days <= 0 OR p_lookback_days > 365 THEN
        RAISE EXCEPTION 'Lookback horizon must be between 1 and 365 days.' USING ERRCODE = '22023';
    END IF;

    -- Aggregate outcomes within lookback window
    SELECT COUNT(*),
           COALESCE(AVG(o.forecast_error_ev), 0.00),
           COALESCE(AVG(o.forecast_error_cost), 0.00),
           COALESCE(AVG(o.value_realization_ratio), 1.0000),
           COUNT(*) FILTER (WHERE o.effectiveness_tier IN ('HIGHLY_EFFECTIVE', 'EFFECTIVE'))
    INTO v_sample_count, v_avg_fe_ev, v_avg_fe_cost, v_avg_vrr, v_effective_count
    FROM public.analytics_strategic_recommendation_outcomes o
    JOIN public.analytics_strategic_recommendations r ON o.recommendation_id = r.id
    WHERE r.model_version = p_model_version
      AND o.observed_at >= NOW() - (p_lookback_days || ' days')::INTERVAL;

    -- Compute statistical health & drift metrics
    IF v_sample_count >= 5 THEN
        -- Brier score approximation from realization variance
        v_brier := ROUND(LEAST(1.0000, GREATEST(0.0000, ABS(1.0000 - v_avg_vrr) * 0.25)), 4);
        v_ece := ROUND(LEAST(1.0000, GREATEST(0.0000, ABS(1.0000 - v_avg_vrr) * 0.20)), 4);

        -- Drift tier determination
        IF ABS(1.0000 - v_avg_vrr) < 0.1000 THEN
            v_drift := 'STABLE';
        ELSIF ABS(1.0000 - v_avg_vrr) < 0.2000 THEN
            v_drift := 'WATCH';
        ELSIF ABS(1.0000 - v_avg_vrr) < 0.3500 THEN
            v_drift := 'DRIFTING';
        ELSIF ABS(1.0000 - v_avg_vrr) < 0.5000 THEN
            v_drift := 'DEGRADED';
        ELSE
            v_drift := 'UNTRUSTWORTHY';
        END IF;

        -- Health score: 30% calibration + 30% accuracy + 20% stability + 20% effectiveness
        v_health_score := ROUND(LEAST(100.00, GREATEST(0.00,
            100.0 * (
                0.30 * (1.0000 - v_ece) +
                0.30 * (1.0000 - LEAST(1.0000, ABS(1.0000 - v_avg_vrr))) +
                0.20 * (CASE WHEN v_drift = 'STABLE' THEN 1.00 WHEN v_drift = 'WATCH' THEN 0.80 WHEN v_drift = 'DRIFTING' THEN 0.50 WHEN v_drift = 'DEGRADED' THEN 0.25 ELSE 0.00 END) +
                0.20 * (v_effective_count::NUMERIC / v_sample_count)
            )
        )), 2);
    ELSE
        v_brier := 0.0000;
        v_ece := 0.0000;
        v_health_score := 75.00;
        v_drift := 'STABLE';
    END IF;

    INSERT INTO public.analytics_learning_model_evaluations (
        target_model_version, learning_engine_version, cohort_definition,
        sample_count, brier_score, expected_calibration_error,
        mean_forecast_error_ev, mean_forecast_error_cost, model_health_score,
        drift_status, evaluation_metadata, evaluated_by
    ) VALUES (
        p_model_version, 'SILCCIE-1.0.0',
        jsonb_build_object('lookback_days', p_lookback_days, 'cohort_type', 'GLOBAL_EVALUATION'),
        v_sample_count, v_brier, v_ece,
        v_avg_fe_ev, v_avg_fe_cost, v_health_score,
        v_drift, jsonb_build_object('effective_rate', CASE WHEN v_sample_count > 0 THEN ROUND((v_effective_count::NUMERIC / v_sample_count) * 100.0, 2) ELSE 100.00 END),
        v_actor_id
    )
    RETURNING id INTO v_eval_id;

    -- Audit log
    INSERT INTO public.analytics_learning_audit_log (
        actor_id, action, details
    ) VALUES (
        v_actor_id, 'EVALUATE_MODEL_HEALTH',
        jsonb_build_object('evaluation_id', v_eval_id, 'target_model', p_model_version, 'health_score', v_health_score, 'drift_status', v_drift)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'evaluation_id', v_eval_id,
        'target_model_version', p_model_version,
        'learning_engine_version', 'SILCCIE-1.0.0',
        'sample_count', v_sample_count,
        'brier_score', v_brier,
        'expected_calibration_error', v_ece,
        'model_health_score', v_health_score,
        'drift_status', v_drift,
        'causality_label', 'OBSERVED_ASSOCIATION'
    );
END;
$$;

-- 2. SIMULATE CALIBRATION ADJUSTMENT RPC (Strictly Simulated Tuning)
CREATE OR REPLACE FUNCTION public.simulate_calibration_adjustment(
    p_evaluation_id UUID,
    p_confidence_scale NUMERIC DEFAULT 0.90,
    p_ev_bias_offset NUMERIC DEFAULT 0.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_eval RECORD;
    v_proj_ece NUMERIC(6,4);
    v_proj_health NUMERIC(5,2);
    v_sim_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF p_confidence_scale < 0.10 OR p_confidence_scale > 2.00 THEN
        RAISE EXCEPTION 'Confidence scale must be within [0.10, 2.00].' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_eval FROM public.analytics_learning_model_evaluations WHERE id = p_evaluation_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Evaluation record % not found.', p_evaluation_id USING ERRCODE = 'P0002';
    END IF;

    -- Simulated calibration improvement
    v_proj_ece := ROUND(LEAST(1.0000, GREATEST(0.0000, COALESCE(v_eval.expected_calibration_error, 0.0500) * (p_confidence_scale / 1.00))), 4);
    v_proj_health := ROUND(LEAST(100.00, GREATEST(0.00, v_eval.model_health_score + (1.0000 - v_proj_ece) * 5.0)), 2);

    INSERT INTO public.analytics_learning_calibration_simulations (
        evaluation_id, simulation_name, proposed_confidence_scale,
        proposed_ev_bias_offset, projected_health_score, projected_ece,
        simulation_status, created_by
    ) VALUES (
        p_evaluation_id, 'SIMULATED_CALIBRATION_ADJUSTMENT',
        p_confidence_scale, p_ev_bias_offset, v_proj_health,
        v_proj_ece, 'SIMULATED_ONLY', v_actor_id
    )
    RETURNING id INTO v_sim_id;

    -- Audit log
    INSERT INTO public.analytics_learning_audit_log (
        actor_id, action, details
    ) VALUES (
        v_actor_id, 'SIMULATE_CALIBRATION',
        jsonb_build_object('simulation_id', v_sim_id, 'evaluation_id', p_evaluation_id, 'status', 'SIMULATED_ONLY')
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'simulation_id', v_sim_id,
        'simulation_status', 'SIMULATED_ONLY',
        'proposed_confidence_scale', p_confidence_scale,
        'projected_health_score', v_proj_health,
        'projected_ece', v_proj_ece,
        'action_guidance', 'SIMULATED_CALIBRATION_ADJUSTMENT — NO_PRODUCTION_CHANGE'
    );
END;
$$;

-- 3. GET STRATEGIC ASSUMPTION LEARNING SIGNALS RPC
CREATE OR REPLACE FUNCTION public.get_strategic_assumption_signals()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_signals JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_agg(row_to_json(s)) INTO v_signals
    FROM (
        SELECT assumption_category, signal_type, bias_magnitude_pct,
               observation_count, confidence_tier, evidence_summary, created_at
        FROM public.analytics_learning_assumption_signals
        ORDER BY bias_magnitude_pct DESC, created_at DESC
        LIMIT 20
    ) s;

    RETURN jsonb_build_object(
        'success', TRUE,
        'causality_label', 'OBSERVED_ASSOCIATION',
        'signals', COALESCE(v_signals, '[]'::jsonb)
    );
END;
$$;

-- 4. COMPARE STRATEGIC MODELS RPC
CREATE OR REPLACE FUNCTION public.compare_strategic_models(
    p_model_versions TEXT[],
    p_lookback_days INT DEFAULT 90
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_version TEXT;
    v_results JSONB := '[]'::jsonb;
    v_eval JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    IF array_length(p_model_versions, 1) < 1 OR array_length(p_model_versions, 1) > 10 THEN
        RAISE EXCEPTION 'Model comparison batch must contain between 1 and 10 models.' USING ERRCODE = '22023';
    END IF;

    FOREACH v_version IN ARRAY p_model_versions LOOP
        v_eval := public.evaluate_strategic_model_health(v_version, p_lookback_days);
        v_results := v_results || jsonb_build_array(v_eval);
    END LOOP;

    RETURN jsonb_build_object(
        'success', TRUE,
        'lookback_days', p_lookback_days,
        'model_count', array_length(p_model_versions, 1),
        'comparison_results', v_results
    );
END;
$$;
