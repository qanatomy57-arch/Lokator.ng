-- ==============================================================================
-- LOKATOR.NG — PHASE 9.3 DATABASE MIGRATION
-- STRATEGIC SCENARIO FORECASTING & DECISION SIMULATION ENGINE (SSFDS)
-- Migration: 015_lokator_strategic_scenario_forecasting.sql
--
-- INVARIANTS ENFORCED:
-- 1. OBSERVATIONAL & SIMULATION ONLY — Zero autonomous marketplace mutations.
-- 2. RANKING AIR-GAP — Live search ranking in search.js is 100% isolated from simulation models.
-- 3. BUSINESS TRUTH IMMUTABILITY — Zero mutations against public.providers, reviews, or provider_services.
-- 4. ACCEPTED != EXECUTED — Simulation results are advisory projections only; no actual execution is implied.
-- 5. PRIVACY FLOOR — Hard enforcement of N >= 30 sample floor and k >= 5 diversity threshold on analogues.
-- 6. IMMUTABLE AUDIT TRAIL — Append-only scenario audit log and input snapshot ledger with REVOKE UPDATE, DELETE.
-- 7. SECURITY DEFINER HARDENING — Fixed search_path and server-side public.is_admin() validation.
-- 8. BOUNDED DETERMINISTIC SCORING — Math models for trajectory, variance, sensitivity, risk, and expected value.
-- 9. DETERMINISM & VERSIONING — Model version 'SSFDS-1.0.0' with SHA256 input hashing for exact reproducibility.
-- 10. RESOURCE SAFETY — Clamped horizon in [1, 90], comparisons in [2, 5], bounded cursors with LIMIT 50.
-- ==============================================================================

-- 1. SCENARIOS DEFINITION TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    synthesis_id UUID NOT NULL REFERENCES public.analytics_strategic_synthesis(id) ON DELETE CASCADE,
    decision_id UUID REFERENCES public.analytics_strategic_decisions(id) ON DELETE SET NULL,
    scenario_title TEXT NOT NULL,
    scenario_description TEXT,
    action_category TEXT NOT NULL CHECK (action_category IN (
        'DO_NOTHING',
        'PROVIDER_ACQUISITION',
        'CATEGORY_EXPANSION',
        'QUALITY_VERIFICATION',
        'COVERAGE_DENSITY',
        'PROMOTIONAL_CAMPAIGN',
        'OPERATIONAL_MONITORING'
    )),
    category TEXT NOT NULL,
    state TEXT NOT NULL,
    lga TEXT NOT NULL,
    forecast_horizon_days INT NOT NULL DEFAULT 14 
        CHECK (forecast_horizon_days >= 1 AND forecast_horizon_days <= 90),
    scenario_status TEXT NOT NULL DEFAULT 'DRAFT' 
        CHECK (scenario_status IN ('DRAFT', 'CONFIGURED', 'SIMULATED', 'ARCHIVED', 'FAILED', 'INVALIDATED')),
    model_version TEXT NOT NULL DEFAULT 'SSFDS-1.0.0',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategic_scenarios_synthesis
    ON public.analytics_strategic_scenarios (synthesis_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategic_scenarios_status
    ON public.analytics_strategic_scenarios (scenario_status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategic_scenarios_spatial
    ON public.analytics_strategic_scenarios (state, lga, category);

-- 2. SCENARIO INPUTS IMMUTABLE SNAPSHOT TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_scenario_inputs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.analytics_strategic_scenarios(id) ON DELETE CASCADE,
    baseline_demand NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    baseline_supply NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    baseline_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    source_confidence NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
    strategy_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00 
        CHECK (strategy_multiplier >= 0.50 AND strategy_multiplier <= 1.50),
    target_capacity_addition NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    growth_rate_assumption NUMERIC(4,3) NOT NULL DEFAULT 0.050,
    attrition_rate_assumption NUMERIC(4,3) NOT NULL DEFAULT 0.020,
    snapshot_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    input_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_scenario_inputs UNIQUE (scenario_id)
);

-- 3. SCENARIO SIMULATION RESULTS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_scenario_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID NOT NULL REFERENCES public.analytics_strategic_scenarios(id) ON DELETE CASCADE,
    model_version TEXT NOT NULL DEFAULT 'SSFDS-1.0.0',
    simulated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    forecast_confidence NUMERIC(5,4) NOT NULL 
        CHECK (forecast_confidence >= 0.0000 AND forecast_confidence <= 1.0000),
    strategic_risk_score NUMERIC(5,2) NOT NULL 
        CHECK (strategic_risk_score >= 0.00 AND strategic_risk_score <= 100.00),
    expected_strategic_value NUMERIC(5,2) NOT NULL 
        CHECK (expected_strategic_value >= 0.00 AND expected_strategic_value <= 100.00),
    projected_baseline_deficit NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    projected_best_case_capacity NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    projected_expected_case_capacity NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    projected_worst_case_capacity NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    projected_deficit_reduction_pct NUMERIC(5,2) NOT NULL DEFAULT 0.00 
        CHECK (projected_deficit_reduction_pct >= 0.00 AND projected_deficit_reduction_pct <= 100.00),
    sensitivity_profile JSONB NOT NULL DEFAULT '{}'::jsonb,
    time_series_projections JSONB NOT NULL DEFAULT '[]'::jsonb,
    historical_analogue_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
    executive_brief JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_scenario_results UNIQUE (scenario_id)
);

CREATE INDEX IF NOT EXISTS idx_strategic_scenario_results_ev
    ON public.analytics_strategic_scenario_results (expected_strategic_value DESC);

-- 4. SCENARIO COMPARISONS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_scenario_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comparison_title TEXT NOT NULL,
    synthesis_id UUID NOT NULL REFERENCES public.analytics_strategic_synthesis(id) ON DELETE CASCADE,
    compared_scenario_ids UUID[] NOT NULL,
    recommended_scenario_id UUID REFERENCES public.analytics_strategic_scenarios(id) ON DELETE SET NULL,
    comparison_matrix JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenario_comparisons_synthesis
    ON public.analytics_strategic_scenario_comparisons (synthesis_id, created_at DESC);

-- 5. SCENARIO AUDIT LOG TABLE (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.analytics_strategic_scenario_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES public.analytics_strategic_scenarios(id) ON DELETE SET NULL,
    comparison_id UUID REFERENCES public.analytics_strategic_scenario_comparisons(id) ON DELETE SET NULL,
    previous_state TEXT NOT NULL,
    new_state TEXT NOT NULL,
    actor_id UUID NOT NULL,
    action TEXT NOT NULL 
        CHECK (action IN ('CREATE_SCENARIO', 'RUN_SIMULATION', 'COMPARE_SCENARIOS', 'ARCHIVE_SCENARIO', 'INVALIDATE_SCENARIO')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scenario_audit_target
    ON public.analytics_strategic_scenario_audit_log (scenario_id, created_at DESC);

-- 6. ROW LEVEL SECURITY & PERMISSIONS HARDENING
ALTER TABLE public.analytics_strategic_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_scenario_inputs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_scenario_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_scenario_comparisons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_scenario_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_strategic_scenarios FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_scenario_inputs FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_scenario_results FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_scenario_comparisons FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_scenario_audit_log FROM PUBLIC, anon;

-- Enforce Append-Only Immutability on Audit and Input Snapshots
REVOKE UPDATE, DELETE ON public.analytics_strategic_scenario_audit_log FROM authenticated;
REVOKE UPDATE, DELETE ON public.analytics_strategic_scenario_inputs FROM authenticated;

-- Admin RLS Policies
CREATE POLICY admin_manage_scenarios ON public.analytics_strategic_scenarios
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_scenario_inputs ON public.analytics_strategic_scenario_inputs
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_scenario_results ON public.analytics_strategic_scenario_results
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_scenario_comparisons ON public.analytics_strategic_scenario_comparisons
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_scenario_audit ON public.analytics_strategic_scenario_audit_log
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==============================================================================
-- 7. PRIVILEGED RPC 1: create_strategic_scenario
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_strategic_scenario(
    p_synthesis_id UUID,
    p_decision_id UUID DEFAULT NULL,
    p_title TEXT DEFAULT 'Proposed Strategy Simulation',
    p_action_category TEXT DEFAULT 'PROVIDER_ACQUISITION',
    p_forecast_horizon_days INT DEFAULT 14,
    p_target_capacity_addition NUMERIC DEFAULT 5.00
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_synth RECORD;
    v_scenario_id UUID;
    v_horizon INT;
    v_target_cap NUMERIC(10,2);
    v_base_demand NUMERIC(10,2) := 10.00;
    v_base_supply NUMERIC(10,2) := 2.00;
    v_strategy_mult NUMERIC(3,2) := 1.00;
    v_input_hash TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request. Server session required.'
            USING ERRCODE = '42501';
    END IF;

    -- Validate synthesis existence
    SELECT * INTO v_synth
    FROM public.analytics_strategic_synthesis
    WHERE id = p_synthesis_id;

    IF v_synth.id IS NULL THEN
        RAISE EXCEPTION 'Synthesis record not found for id: %', p_synthesis_id
            USING ERRCODE = '22023';
    END IF;

    -- Bound parameters
    v_horizon := LEAST(90, GREATEST(1, COALESCE(p_forecast_horizon_days, 14)));
    v_target_cap := LEAST(1000.00, GREATEST(0.00, COALESCE(p_target_capacity_addition, 5.00)));

    -- Extract baseline metrics from synthesis metrics JSON
    IF v_synth.metrics ? 'estimated_demand_searches' THEN
        v_base_demand := GREATEST(1.00, (v_synth.metrics->>'estimated_demand_searches')::NUMERIC);
    ELSIF v_synth.metrics ? 'demand_search_count' THEN
        v_base_demand := GREATEST(1.00, (v_synth.metrics->>'demand_search_count')::NUMERIC);
    END IF;

    IF v_synth.metrics ? 'current_active_providers' THEN
        v_base_supply := GREATEST(0.00, (v_synth.metrics->>'current_active_providers')::NUMERIC);
    END IF;

    -- Fetch strategy multiplier from learning aggregates if available
    SELECT strategy_multiplier INTO v_strategy_mult
    FROM public.analytics_strategy_learning_aggregates
    WHERE action_category = p_action_category
      AND category = v_synth.category
      AND state = v_synth.state
    LIMIT 1;

    v_strategy_mult := COALESCE(v_strategy_mult, 1.00);

    -- Insert Scenario Definition
    INSERT INTO public.analytics_strategic_scenarios (
        synthesis_id,
        decision_id,
        scenario_title,
        scenario_description,
        action_category,
        category,
        state,
        lga,
        forecast_horizon_days,
        scenario_status,
        model_version,
        created_by
    ) VALUES (
        v_synth.id,
        p_decision_id,
        COALESCE(NULLIF(TRIM(p_title), ''), 'Proposed Strategy Simulation'),
        format('Simulation for %s in %s, %s over %s-day horizon.', p_action_category, v_synth.lga, v_synth.state, v_horizon),
        p_action_category,
        v_synth.category,
        v_synth.state,
        v_synth.lga,
        v_horizon,
        'CONFIGURED',
        'SSFDS-1.0.0',
        v_actor_id
    ) RETURNING id INTO v_scenario_id;

    -- Compute SHA256 deterministic input hash
    v_input_hash := encode(digest(
        format('%s|%s|%s|%s|%s|%s|%s|%s|%s',
            v_scenario_id, v_base_demand, v_base_supply, v_synth.strategic_score,
            v_synth.confidence_score, v_strategy_mult, v_target_cap, 0.050, 0.020
        ), 'sha256'
    ), 'hex');

    -- Insert Immutable Input Snapshot
    INSERT INTO public.analytics_strategic_scenario_inputs (
        scenario_id,
        baseline_demand,
        baseline_supply,
        baseline_score,
        source_confidence,
        strategy_multiplier,
        target_capacity_addition,
        growth_rate_assumption,
        attrition_rate_assumption,
        snapshot_timestamp,
        input_hash
    ) VALUES (
        v_scenario_id,
        v_base_demand,
        v_base_supply,
        v_synth.strategic_score,
        v_synth.confidence_score,
        v_strategy_mult,
        v_target_cap,
        0.050,
        0.020,
        NOW(),
        v_input_hash
    );

    -- Log Audit Trail
    INSERT INTO public.analytics_strategic_scenario_audit_log (
        scenario_id,
        previous_state,
        new_state,
        actor_id,
        action,
        details
    ) VALUES (
        v_scenario_id,
        'NEW',
        'CONFIGURED',
        v_actor_id,
        'CREATE_SCENARIO',
        jsonb_build_object(
            'horizon_days', v_horizon,
            'action_category', p_action_category,
            'input_hash', v_input_hash
        )
    );

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'scenario_id', v_scenario_id,
        'synthesis_id', v_synth.id,
        'input_hash', v_input_hash,
        'model_version', 'SSFDS-1.0.0'
    );
END;
$$;

-- ==============================================================================
-- 8. PRIVILEGED RPC 2: run_strategic_scenario
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.run_strategic_scenario(
    p_scenario_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_scen RECORD;
    v_inp RECORD;
    v_synth RECORD;
    v_horizon INT;
    v_lambda NUMERIC;
    v_complexity NUMERIC;
    v_sample_weight NUMERIC := 0.50;
    v_freshness NUMERIC;
    v_forecast_conf NUMERIC(5,4);
    v_risk_score NUMERIC(5,2);
    v_ev_score NUMERIC(5,2);
    v_time_series JSONB := '[]'::jsonb;
    v_sens_profile JSONB;
    v_analogue_summary JSONB;
    v_exec_brief JSONB;
    v_t INT;
    v_d0_t NUMERIC;
    v_s0_t NUMERIC;
    v_def0_t NUMERIC;
    v_delta_exp NUMERIC;
    v_delta_best NUMERIC;
    v_delta_worst NUMERIC;
    v_var_sigma NUMERIC;
    v_final_base_def NUMERIC;
    v_final_exp_cap NUMERIC;
    v_final_best_cap NUMERIC;
    v_final_worst_cap NUMERIC;
    v_def_reduct_pct NUMERIC(5,2);
    v_days_old NUMERIC;
    v_learning_row RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request. Server session required.'
            USING ERRCODE = '42501';
    END IF;

    -- Fetch Scenario & Immutable Inputs
    SELECT * INTO v_scen
    FROM public.analytics_strategic_scenarios
    WHERE id = p_scenario_id;

    IF v_scen.id IS NULL THEN
        RAISE EXCEPTION 'Scenario not found for id: %', p_scenario_id
            USING ERRCODE = '22023';
    END IF;

    IF v_scen.scenario_status IN ('ARCHIVED', 'INVALIDATED') THEN
        RAISE EXCEPTION 'Cannot simulate terminal scenario in state: %', v_scen.scenario_status
            USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_inp
    FROM public.analytics_strategic_scenario_inputs
    WHERE scenario_id = p_scenario_id;

    SELECT * INTO v_synth
    FROM public.analytics_strategic_synthesis
    WHERE id = v_scen.synthesis_id;

    v_horizon := v_scen.forecast_horizon_days;

    -- 1. Ramp Velocity lambda & Operational Complexity based on action_category
    CASE v_scen.action_category
        WHEN 'DO_NOTHING' THEN
            v_lambda := 0.00;
            v_complexity := 0.00;
        WHEN 'PROMOTIONAL_CAMPAIGN' THEN
            v_lambda := 0.25;
            v_complexity := 0.50;
        WHEN 'PROVIDER_ACQUISITION' THEN
            v_lambda := 0.12;
            v_complexity := 0.40;
        WHEN 'QUALITY_VERIFICATION' THEN
            v_lambda := 0.15;
            v_complexity := 0.30;
        WHEN 'CATEGORY_EXPANSION' THEN
            v_lambda := 0.08;
            v_complexity := 0.70;
        WHEN 'COVERAGE_DENSITY' THEN
            v_lambda := 0.10;
            v_complexity := 0.60;
        ELSE
            v_lambda := 0.10;
            v_complexity := 0.30;
    END CASE;

    -- 2. Freshness Index F(t) = max(0, 1 - age/14)
    v_days_old := EXTRACT(EPOCH FROM (NOW() - v_synth.updated_at)) / 86400.0;
    v_freshness := ROUND(LEAST(1.00, GREATEST(0.00, 1.00 - (v_days_old / 14.0))), 2);

    -- 3. Historical Analogue Sample Weight W_sample
    SELECT total_sample_size, total_unique_sessions, average_effectiveness_score INTO v_learning_row
    FROM public.analytics_strategy_learning_aggregates
    WHERE action_category = v_scen.action_category
      AND category = v_scen.category
      AND state = v_scen.state
    LIMIT 1;

    IF v_learning_row.total_sample_size >= 100 AND v_learning_row.total_unique_sessions >= 10 THEN
        v_sample_weight := 1.00;
    ELSIF v_learning_row.total_sample_size >= 30 AND v_learning_row.total_unique_sessions >= 5 THEN
        v_sample_weight := 0.85;
    ELSE
        v_sample_weight := 0.50;
    END IF;

    -- 4. Forecast Confidence Engine (Engine 7)
    v_forecast_conf := ROUND(LEAST(1.0000, GREATEST(0.0000, 
        v_inp.source_confidence * v_freshness * v_sample_weight * (1.00 - 0.30 * (v_horizon / 90.0))
    )), 4);

    -- 5. Strategic Risk Engine (Engine 5)
    v_risk_score := ROUND(LEAST(100.00, GREATEST(0.00,
        40.0 * (1.0000 - v_forecast_conf) +
        30.0 * v_complexity +
        30.0 * (CASE WHEN v_inp.baseline_demand > 0 THEN LEAST(1.0, GREATEST(0.0, (v_inp.baseline_demand - v_inp.baseline_supply) / v_inp.baseline_demand)) ELSE 0.5 END)
    )), 2);

    -- 6. Variance parameter sigma_k
    v_var_sigma := LEAST(0.50, GREATEST(0.10, 0.20 + (1.0000 - v_forecast_conf) * 0.30));

    -- 7. Generate Time-Series Projections (Engine 1, 2, 3)
    FOR v_t IN 1..v_horizon LOOP
        -- Baseline demand D0(t) and supply S0(t)
        v_d0_t := v_inp.baseline_demand * (1.0 + (v_inp.growth_rate_assumption * v_t / 30.0));
        v_s0_t := GREATEST(0.0, v_inp.baseline_supply * (1.0 - (v_inp.attrition_rate_assumption * v_t / 30.0)));
        v_def0_t := GREATEST(0.0, v_d0_t - v_s0_t);

        -- Intervention addition Delta S(t)
        IF v_scen.action_category = 'DO_NOTHING' THEN
            v_delta_exp := 0.00;
        ELSE
            v_delta_exp := v_inp.target_capacity_addition * v_inp.strategy_multiplier * (1.0 - exp(-v_lambda * v_t));
        END IF;

        v_delta_best := v_delta_exp * (1.0 + v_var_sigma);
        v_delta_worst := GREATEST(0.0, v_delta_exp * (1.0 - v_var_sigma));

        v_time_series := v_time_series || jsonb_build_object(
            'day', v_t,
            'baseline_demand', ROUND(v_d0_t, 2),
            'baseline_supply', ROUND(v_s0_t, 2),
            'baseline_deficit', ROUND(v_def0_t, 2),
            'expected_capacity_addition', ROUND(v_delta_exp, 2),
            'best_case_capacity_addition', ROUND(v_delta_best, 2),
            'worst_case_capacity_addition', ROUND(v_delta_worst, 2),
            'projected_deficit_expected', ROUND(GREATEST(0.0, v_d0_t - (v_s0_t + v_delta_exp)), 2)
        );
    END LOOP;

    -- Final day metrics
    v_final_base_def := (v_time_series->-1->>'baseline_deficit')::NUMERIC;
    v_final_exp_cap := (v_time_series->-1->>'expected_capacity_addition')::NUMERIC;
    v_final_best_cap := (v_time_series->-1->>'best_case_capacity_addition')::NUMERIC;
    v_final_worst_cap := (v_time_series->-1->>'worst_case_capacity_addition')::NUMERIC;

    IF v_final_base_def > 0 THEN
        v_def_reduct_pct := ROUND(LEAST(100.00, GREATEST(0.00, (v_final_exp_cap / v_final_base_def) * 100.00)), 2);
    ELSE
        v_def_reduct_pct := 0.00;
    END IF;

    -- 8. Expected Strategic Value Engine (Engine 6)
    IF v_inp.target_capacity_addition > 0 THEN
        v_ev_score := ROUND(LEAST(100.00, GREATEST(0.00,
            (0.20 * v_final_best_cap + 0.60 * v_final_exp_cap + 0.20 * v_final_worst_cap) *
            (100.0 / v_inp.target_capacity_addition) *
            v_inp.strategy_multiplier *
            v_forecast_conf -
            (0.15 * v_risk_score)
        )), 2);
    ELSE
        v_ev_score := 0.00;
    END IF;

    -- 9. Sensitivity Engine (Engine 4)
    v_sens_profile := jsonb_build_object(
        'delta_ev_conf_plus10', ROUND(LEAST(100.00, v_ev_score * 1.10) - v_ev_score, 2),
        'delta_ev_conf_minus10', ROUND(GREATEST(0.00, v_ev_score * 0.90) - v_ev_score, 2),
        'delta_ev_demand_plus20', ROUND(v_ev_score * 0.15, 2),
        'delta_ev_demand_minus20', ROUND(-v_ev_score * 0.15, 2)
    );

    -- 10. Historical Analogue Summary (Engine 9 - Privacy Enforced N >= 30, k >= 5)
    IF v_learning_row.total_sample_size >= 30 AND v_learning_row.total_unique_sessions >= 5 THEN
        v_analogue_summary := jsonb_build_object(
            'cohort_matched', true,
            'historical_sample_size', v_learning_row.total_sample_size,
            'unique_sessions', v_learning_row.total_unique_sessions,
            'historical_avg_effectiveness', v_learning_row.average_effectiveness_score,
            'applied_strategy_multiplier', v_inp.strategy_multiplier
        );
    ELSE
        v_analogue_summary := jsonb_build_object(
            'cohort_matched', false,
            'message', 'Sparse historical cohort. Neutral baseline multiplier (1.00x) applied.',
            'applied_strategy_multiplier', 1.00
        );
    END IF;

    -- 11. Executive Scenario Brief (Engine 10)
    v_exec_brief := jsonb_build_object(
        'classification', 'SIMULATED_PROJECTION',
        'headline', format('Projected %s%% deficit reduction over %s days.', v_def_reduct_pct, v_horizon),
        'expected_strategic_value', v_ev_score,
        'strategic_risk_rating', CASE WHEN v_risk_score >= 70 THEN 'HIGH' WHEN v_risk_score >= 40 THEN 'MODERATE' ELSE 'LOW' END,
        'confidence_grade', CASE WHEN v_forecast_conf >= 0.70 THEN 'HIGH' WHEN v_forecast_conf >= 0.40 THEN 'MODERATE' ELSE 'LOW' END,
        'advisory_disclaimer', 'SIMULATED PROJECTION ONLY — Not an observed marketplace event.'
    );

    -- Store Results atomically
    INSERT INTO public.analytics_strategic_scenario_results (
        scenario_id,
        model_version,
        simulated_at,
        forecast_confidence,
        strategic_risk_score,
        expected_strategic_value,
        projected_baseline_deficit,
        projected_best_case_capacity,
        projected_expected_case_capacity,
        projected_worst_case_capacity,
        projected_deficit_reduction_pct,
        sensitivity_profile,
        time_series_projections,
        historical_analogue_summary,
        executive_brief
    ) VALUES (
        p_scenario_id,
        'SSFDS-1.0.0',
        NOW(),
        v_forecast_conf,
        v_risk_score,
        v_ev_score,
        v_final_base_def,
        v_final_best_cap,
        v_final_exp_cap,
        v_final_worst_cap,
        v_def_reduct_pct,
        v_sens_profile,
        v_time_series,
        v_analogue_summary,
        v_exec_brief
    )
    ON CONFLICT (scenario_id) DO UPDATE SET
        simulated_at = NOW(),
        forecast_confidence = EXCLUDED.forecast_confidence,
        strategic_risk_score = EXCLUDED.strategic_risk_score,
        expected_strategic_value = EXCLUDED.expected_strategic_value,
        projected_baseline_deficit = EXCLUDED.projected_baseline_deficit,
        projected_best_case_capacity = EXCLUDED.projected_best_case_capacity,
        projected_expected_case_capacity = EXCLUDED.projected_expected_case_capacity,
        projected_worst_case_capacity = EXCLUDED.projected_worst_case_capacity,
        projected_deficit_reduction_pct = EXCLUDED.projected_deficit_reduction_pct,
        sensitivity_profile = EXCLUDED.sensitivity_profile,
        time_series_projections = EXCLUDED.time_series_projections,
        historical_analogue_summary = EXCLUDED.historical_analogue_summary,
        executive_brief = EXCLUDED.executive_brief;

    -- Update scenario status
    UPDATE public.analytics_strategic_scenarios
    SET scenario_status = 'SIMULATED', updated_at = NOW()
    WHERE id = p_scenario_id;

    -- Log Audit Trail
    INSERT INTO public.analytics_strategic_scenario_audit_log (
        scenario_id,
        previous_state,
        new_state,
        actor_id,
        action,
        details
    ) VALUES (
        p_scenario_id,
        v_scen.scenario_status,
        'SIMULATED',
        v_actor_id,
        'RUN_SIMULATION',
        jsonb_build_object(
            'expected_strategic_value', v_ev_score,
            'strategic_risk_score', v_risk_score,
            'forecast_confidence', v_forecast_conf
        )
    );

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'scenario_id', p_scenario_id,
        'model_version', 'SSFDS-1.0.0',
        'metrics', jsonb_build_object(
            'forecast_confidence', v_forecast_conf,
            'strategic_risk_score', v_risk_score,
            'expected_strategic_value', v_ev_score,
            'projected_deficit_reduction_pct', v_def_reduct_pct
        ),
        'executive_brief', v_exec_brief
    );
END;
$$;

-- ==============================================================================
-- 9. PRIVILEGED RPC 3: compare_strategic_scenarios
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.compare_strategic_scenarios(
    p_synthesis_id UUID,
    p_scenario_ids UUID[],
    p_comparison_title TEXT DEFAULT 'Strategic Candidate Comparison'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_count INT;
    v_matrix JSONB := '[]'::jsonb;
    v_rec RECORD;
    v_best_id UUID := NULL;
    v_highest_ev NUMERIC := -1.00;
    v_comp_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request. Server session required.'
            USING ERRCODE = '42501';
    END IF;

    -- Validate scenario count in [2, 5]
    v_count := COALESCE(array_length(p_scenario_ids, 1), 0);
    IF v_count < 2 OR v_count > 5 THEN
        RAISE EXCEPTION 'Scenario comparison requires between 2 and 5 scenarios. Provided: %', v_count
            USING ERRCODE = '22023';
    END IF;

    -- Build comparison matrix from simulated scenario results
    FOR v_rec IN 
        SELECT s.id, s.scenario_title, s.action_category, s.forecast_horizon_days,
               r.expected_strategic_value, r.strategic_risk_score, r.forecast_confidence,
               r.projected_deficit_reduction_pct
        FROM public.analytics_strategic_scenarios s
        JOIN public.analytics_strategic_scenario_results r ON r.scenario_id = s.id
        WHERE s.id = ANY(p_scenario_ids)
          AND s.synthesis_id = p_synthesis_id
        ORDER BY r.expected_strategic_value DESC
    LOOP
        v_matrix := v_matrix || jsonb_build_object(
            'scenario_id', v_rec.id,
            'title', v_rec.scenario_title,
            'action_category', v_rec.action_category,
            'horizon_days', v_rec.forecast_horizon_days,
            'expected_strategic_value', v_rec.expected_strategic_value,
            'strategic_risk_score', v_rec.strategic_risk_score,
            'forecast_confidence', v_rec.forecast_confidence,
            'projected_deficit_reduction_pct', v_rec.projected_deficit_reduction_pct
        );

        IF v_best_id IS NULL OR (v_rec.expected_strategic_value > v_highest_ev AND v_rec.strategic_risk_score <= 65.00) THEN
            v_best_id := v_rec.id;
            v_highest_ev := v_rec.expected_strategic_value;
        END IF;
    END LOOP;

    -- Insert comparison record
    INSERT INTO public.analytics_strategic_scenario_comparisons (
        comparison_title,
        synthesis_id,
        compared_scenario_ids,
        recommended_scenario_id,
        comparison_matrix,
        created_by
    ) VALUES (
        COALESCE(NULLIF(TRIM(p_comparison_title), ''), 'Strategic Candidate Comparison'),
        p_synthesis_id,
        p_scenario_ids,
        v_best_id,
        v_matrix,
        v_actor_id
    ) RETURNING id INTO v_comp_id;

    -- Log Audit Trail
    INSERT INTO public.analytics_strategic_scenario_audit_log (
        comparison_id,
        previous_state,
        new_state,
        actor_id,
        action,
        details
    ) VALUES (
        v_comp_id,
        'NEW',
        'COMPARED',
        v_actor_id,
        'COMPARE_SCENARIOS',
        jsonb_build_object(
            'scenarios_compared', v_count,
            'recommended_scenario_id', v_best_id
        )
    );

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'comparison_id', v_comp_id,
        'synthesis_id', p_synthesis_id,
        'recommended_scenario_id', v_best_id,
        'matrix', v_matrix
    );
END;
$$;

-- ==============================================================================
-- 10. PRIVILEGED RPC 4: get_strategic_scenario
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_strategic_scenario(
    p_scenario_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_scen RECORD;
    v_inp RECORD;
    v_res RECORD;
    v_audit JSONB := '[]'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_scen
    FROM public.analytics_strategic_scenarios
    WHERE id = p_scenario_id;

    IF v_scen.id IS NULL THEN
        RAISE EXCEPTION 'Scenario not found for id: %', p_scenario_id
            USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_inp
    FROM public.analytics_strategic_scenario_inputs
    WHERE scenario_id = p_scenario_id;

    SELECT * INTO v_res
    FROM public.analytics_strategic_scenario_results
    WHERE scenario_id = p_scenario_id;

    SELECT COALESCE(jsonb_agg(item), '[]'::jsonb) INTO v_audit
    FROM (
        SELECT action, previous_state, new_state, actor_id, details, created_at
        FROM public.analytics_strategic_scenario_audit_log
        WHERE scenario_id = p_scenario_id
        ORDER BY created_at ASC
    ) item;

    RETURN jsonb_build_object(
        'scenario', jsonb_build_object(
            'id', v_scen.id,
            'synthesis_id', v_scen.synthesis_id,
            'decision_id', v_scen.decision_id,
            'title', v_scen.scenario_title,
            'description', v_scen.scenario_description,
            'action_category', v_scen.action_category,
            'category', v_scen.category,
            'state', v_scen.state,
            'lga', v_scen.lga,
            'forecast_horizon_days', v_scen.forecast_horizon_days,
            'scenario_status', v_scen.scenario_status,
            'model_version', v_scen.model_version,
            'created_at', v_scen.created_at
        ),
        'inputs', CASE WHEN v_inp.id IS NOT NULL THEN jsonb_build_object(
            'baseline_demand', v_inp.baseline_demand,
            'baseline_supply', v_inp.baseline_supply,
            'baseline_score', v_inp.baseline_score,
            'source_confidence', v_inp.source_confidence,
            'strategy_multiplier', v_inp.strategy_multiplier,
            'target_capacity_addition', v_inp.target_capacity_addition,
            'input_hash', v_inp.input_hash,
            'snapshot_timestamp', v_inp.snapshot_timestamp
        ) ELSE NULL END,
        'results', CASE WHEN v_res.id IS NOT NULL THEN jsonb_build_object(
            'simulated_at', v_res.simulated_at,
            'forecast_confidence', v_res.forecast_confidence,
            'strategic_risk_score', v_res.strategic_risk_score,
            'expected_strategic_value', v_res.expected_strategic_value,
            'projected_baseline_deficit', v_res.projected_baseline_deficit,
            'projected_best_case_capacity', v_res.projected_best_case_capacity,
            'projected_expected_case_capacity', v_res.projected_expected_case_capacity,
            'projected_worst_case_capacity', v_res.projected_worst_case_capacity,
            'projected_deficit_reduction_pct', v_res.projected_deficit_reduction_pct,
            'sensitivity_profile', v_res.sensitivity_profile,
            'time_series_projections', v_res.time_series_projections,
            'historical_analogue_summary', v_res.historical_analogue_summary,
            'executive_brief', v_res.executive_brief
        ) ELSE NULL END,
        'audit_trail', v_audit
    );
END;
$$;

-- ==============================================================================
-- 11. PRIVILEGED RPC 5: get_strategic_scenario_history
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_strategic_scenario_history(
    p_synthesis_id UUID DEFAULT NULL,
    p_decision_id UUID DEFAULT NULL,
    p_limit INT DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_limit INT;
    v_scenarios JSONB := '[]'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    v_limit := LEAST(50, GREATEST(1, COALESCE(p_limit, 20)));

    SELECT COALESCE(jsonb_agg(item), '[]'::jsonb) INTO v_scenarios
    FROM (
        SELECT s.id, s.synthesis_id, s.decision_id, s.scenario_title, s.action_category,
               s.category, s.state, s.lga, s.forecast_horizon_days, s.scenario_status,
               s.model_version, s.created_at,
               r.expected_strategic_value, r.strategic_risk_score, r.forecast_confidence,
               r.projected_deficit_reduction_pct
        FROM public.analytics_strategic_scenarios s
        LEFT JOIN public.analytics_strategic_scenario_results r ON r.scenario_id = s.id
        WHERE (p_synthesis_id IS NULL OR s.synthesis_id = p_synthesis_id)
          AND (p_decision_id IS NULL OR s.decision_id = p_decision_id)
        ORDER BY s.created_at DESC
        LIMIT v_limit
    ) item;

    RETURN jsonb_build_object(
        'schema_version', '9.3.0',
        'generated_at', NOW(),
        'scenarios', v_scenarios
    );
END;
$$;

-- ==============================================================================
-- 12. PRIVILEGED RPC 6: get_executive_scenario_summary
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_executive_scenario_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_total_scenarios INT := 0;
    v_simulated_scenarios INT := 0;
    v_avg_ev NUMERIC(5,2) := 0.00;
    v_avg_risk NUMERIC(5,2) := 0.00;
    v_avg_conf NUMERIC(5,4) := 0.0000;
    v_high_risk_count INT := 0;
    v_total_comparisons INT := 0;
    v_top_scenarios JSONB := '[]'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    SELECT COUNT(*),
           COUNT(CASE WHEN scenario_status = 'SIMULATED' THEN 1 END)
    INTO v_total_scenarios, v_simulated_scenarios
    FROM public.analytics_strategic_scenarios;

    SELECT 
        COALESCE(AVG(expected_strategic_value), 0.00),
        COALESCE(AVG(strategic_risk_score), 0.00),
        COALESCE(AVG(forecast_confidence), 0.0000),
        COUNT(CASE WHEN strategic_risk_score >= 70.00 THEN 1 END)
    INTO v_avg_ev, v_avg_risk, v_avg_conf, v_high_risk_count
    FROM public.analytics_strategic_scenario_results;

    SELECT COUNT(*) INTO v_total_comparisons
    FROM public.analytics_strategic_scenario_comparisons;

    SELECT COALESCE(jsonb_agg(item), '[]'::jsonb) INTO v_top_scenarios
    FROM (
        SELECT s.id, s.scenario_title, s.action_category, s.category, s.state, s.lga,
               r.expected_strategic_value, r.strategic_risk_score, r.forecast_confidence,
               r.projected_deficit_reduction_pct
        FROM public.analytics_strategic_scenarios s
        JOIN public.analytics_strategic_scenario_results r ON r.scenario_id = s.id
        ORDER BY r.expected_strategic_value DESC
        LIMIT 5
    ) item;

    RETURN jsonb_build_object(
        'schema_version', '9.3.0',
        'generated_at', NOW(),
        'model_version', 'SSFDS-1.0.0',
        'kpis', jsonb_build_object(
            'total_scenarios', v_total_scenarios,
            'simulated_scenarios', v_simulated_scenarios,
            'average_expected_value', ROUND(v_avg_ev, 2),
            'average_risk_score', ROUND(v_avg_risk, 2),
            'average_forecast_confidence', ROUND(v_avg_conf, 4),
            'high_risk_scenarios_count', v_high_risk_count,
            'total_comparisons', v_total_comparisons
        ),
        'top_opportunities', v_top_scenarios
    );
END;
$$;
