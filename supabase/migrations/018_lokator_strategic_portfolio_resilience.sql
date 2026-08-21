-- ====================================================================
-- LOKATOR.NG — PHASE 9.6 DATABASE MIGRATION
-- STRATEGIC PORTFOLIO RESILIENCE, STRESS TESTING & CONTINGENCY INTELLIGENCE (SPRTCIE)
--
-- Migration: 018_lokator_strategic_portfolio_resilience.sql
-- Model Version: SPRTCIE-1.0.0
-- Dependencies: 001-017 (Preserves Phase 9.0-9.5 Invariants)
-- Invariants:
--   - 100% Ranking Air-Gap (Zero imports/calls in search/discovery)
--   - Business Truth Immutability (0 mutations on providers/reviews/services)
--   - Zero Autonomous Execution (No triggers, webhooks, outbound network, background jobs)
--   - Strict Server-Side Security (SECURITY DEFINER, auth.uid(), public.is_admin())
-- ====================================================================

-- 1. STRESS PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.analytics_resilience_stress_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_name TEXT NOT NULL UNIQUE,
    shock_class TEXT NOT NULL CHECK (shock_class IN (
        'CAPITAL_SHOCK', 'OPERATIONS_SHOCK', 'PERSONNEL_SHOCK',
        'CAMPAIGN_CAPACITY_SHOCK', 'GEOGRAPHIC_ACCESS_SHOCK', 'TIME_HORIZON_SHOCK',
        'DEMAND_SHOCK', 'SUPPLY_SHOCK', 'CONVERSION_SHOCK', 'MULTI_FACTOR_SHOCK'
    )),
    delta_capital NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (delta_capital BETWEEN 0.00 AND 0.90),
    delta_operations NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (delta_operations BETWEEN 0.00 AND 0.90),
    delta_personnel NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (delta_personnel BETWEEN 0.00 AND 0.90),
    delta_campaigns NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (delta_campaigns BETWEEN 0.00 AND 0.90),
    delta_geo NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (delta_geo BETWEEN 0.00 AND 0.90),
    delta_time NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (delta_time BETWEEN 0.00 AND 0.90),
    demand_shock_ratio NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (demand_shock_ratio BETWEEN 0.00 AND 0.90),
    cost_inflation_ratio NUMERIC(4,2) NOT NULL DEFAULT 0.00 CHECK (cost_inflation_ratio BETWEEN 0.00 AND 1.00),
    description TEXT,
    is_predefined BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Canonical Standard Predefined Stress Profiles
INSERT INTO public.analytics_resilience_stress_profiles (
    profile_name, shock_class, delta_capital, delta_operations, delta_personnel,
    delta_campaigns, delta_geo, delta_time, demand_shock_ratio, cost_inflation_ratio,
    description, is_predefined
) VALUES
    ('STANDARD_CAPITAL_CONTRACTION_20', 'CAPITAL_SHOCK', 0.20, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 'Simulates a 20% budget cut across capital resources.', TRUE),
    ('STANDARD_OPERATIONS_BOTTLENECK_25', 'OPERATIONS_SHOCK', 0.00, 0.25, 0.00, 0.00, 0.00, 0.00, 0.00, 0.05, 'Simulates a 25% operational bandwidth shock with slight cost inflation.', TRUE),
    ('STANDARD_PERSONNEL_ATTRITION_30', 'PERSONNEL_SHOCK', 0.00, 0.10, 0.30, 0.00, 0.00, 0.00, 0.00, 0.00, 'Simulates a 30% operations headcount constraint.', TRUE),
    ('STANDARD_CAMPAIGN_CURTAILMENT_40', 'CAMPAIGN_CAPACITY_SHOCK', 0.05, 0.00, 0.00, 0.40, 0.00, 0.00, 0.05, 0.00, 'Simulates 40% reduction in simultaneous marketing slots.', TRUE),
    ('STANDARD_GEOGRAPHIC_LOCKDOWN_35', 'GEOGRAPHIC_ACCESS_SHOCK', 0.00, 0.10, 0.00, 0.00, 0.35, 0.00, 0.10, 0.00, 'Simulates restriction across 35% of reachable local government areas.', TRUE),
    ('STANDARD_TIMELINE_COMPRESSION_30', 'TIME_HORIZON_SHOCK', 0.00, 0.05, 0.00, 0.00, 0.00, 0.30, 0.00, 0.10, 'Simulates 30% compression in available execution timeframe.', TRUE),
    ('STANDARD_DEMAND_DOWNTURN_25', 'DEMAND_SHOCK', 0.00, 0.00, 0.00, 0.00, 0.00, 0.00, 0.25, 0.00, 'Simulates 25% broad marketplace demand impairment.', TRUE),
    ('STANDARD_SUPPLY_CHAIN_INFLATION_20', 'SUPPLY_SHOCK', 0.10, 0.10, 0.00, 0.00, 0.00, 0.00, 0.00, 0.20, 'Simulates 20% unit delivery cost inflation across actions.', TRUE),
    ('STANDARD_CONVERSION_FRICTION_20', 'CONVERSION_SHOCK', 0.00, 0.05, 0.00, 0.10, 0.00, 0.00, 0.20, 0.05, 'Simulates consumer conversion friction.', TRUE),
    ('STANDARD_COMPOUND_MACRO_CRISIS_SEVERE', 'MULTI_FACTOR_SHOCK', 0.30, 0.25, 0.20, 0.35, 0.20, 0.25, 0.30, 0.15, 'Severe multi-factor economic disruption simulation.', TRUE)
ON CONFLICT (profile_name) DO NOTHING;

-- 2. STRESS TEST RUNS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_resilience_stress_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.analytics_strategic_resource_plans(id) ON DELETE CASCADE,
    profile_id UUID NOT NULL REFERENCES public.analytics_resilience_stress_profiles(id) ON DELETE RESTRICT,
    model_version TEXT NOT NULL DEFAULT 'SPRTCIE-1.0.0',
    resilience_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (resilience_score BETWEEN 0.00 AND 100.00),
    resilience_tier TEXT NOT NULL CHECK (resilience_tier IN ('IMMUNE', 'RESILIENT', 'VULNERABLE', 'CRITICAL_FAILURE')),
    survival_ratio_count NUMERIC(5,4) NOT NULL DEFAULT 0.0000 CHECK (survival_ratio_count BETWEEN 0.0000 AND 1.0000),
    survival_ratio_value NUMERIC(5,4) NOT NULL DEFAULT 0.0000 CHECK (survival_ratio_value BETWEEN 0.0000 AND 1.0000),
    dominant_failure_constraint TEXT,
    total_breached_constraints INT NOT NULL DEFAULT 0,
    fragility_hhi NUMERIC(5,4) NOT NULL DEFAULT 0.0000 CHECK (fragility_hhi BETWEEN 0.0000 AND 1.0000),
    contingency_portfolio_count INT NOT NULL DEFAULT 0,
    executive_resilience_brief JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. CONSTRAINT FAILURE AUDIT TABLE
CREATE TABLE IF NOT EXISTS public.analytics_resilience_constraint_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.analytics_resilience_stress_runs(id) ON DELETE CASCADE,
    constraint_dimension TEXT NOT NULL,
    baseline_limit NUMERIC(12,2) NOT NULL,
    stressed_limit NUMERIC(12,2) NOT NULL,
    portfolio_demand NUMERIC(12,2) NOT NULL,
    stress_ratio NUMERIC(8,4) NOT NULL,
    is_breached BOOLEAN NOT NULL DEFAULT FALSE,
    breach_severity_pct NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. CONTINGENCY PORTFOLIOS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_resilience_contingency_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID NOT NULL REFERENCES public.analytics_resilience_stress_runs(id) ON DELETE CASCADE,
    contingency_rank INT NOT NULL,
    recomposed_action_count INT NOT NULL,
    allocated_capital NUMERIC(12,2) NOT NULL,
    allocated_operations NUMERIC(8,2) NOT NULL,
    aggregate_expected_value NUMERIC(10,2) NOT NULL,
    value_recovery_ratio NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
    action_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. RESILIENCE AUDIT LOG TABLE (Append-Only)
CREATE TABLE IF NOT EXISTS public.analytics_resilience_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_id UUID REFERENCES public.analytics_resilience_stress_runs(id) ON DELETE SET NULL,
    actor_id UUID NOT NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) & REVOCATIONS
-- ====================================================================

ALTER TABLE public.analytics_resilience_stress_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_resilience_stress_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_resilience_constraint_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_resilience_contingency_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_resilience_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_resilience_stress_profiles FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_resilience_stress_runs FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_resilience_constraint_failures FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_resilience_contingency_portfolios FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_resilience_audit_log FROM PUBLIC, anon;

REVOKE UPDATE, DELETE ON public.analytics_resilience_audit_log FROM authenticated;

CREATE POLICY admin_manage_stress_profiles ON public.analytics_resilience_stress_profiles
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_stress_runs ON public.analytics_resilience_stress_runs
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_constraint_failures ON public.analytics_resilience_constraint_failures
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_contingency_portfolios ON public.analytics_resilience_contingency_portfolios
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_resilience_audit ON public.analytics_resilience_audit_log
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ====================================================================
-- PRIVILEGED RPC CONTRACTS (SECURITY DEFINER / FIXED SEARCH PATH)
-- ====================================================================

-- 1. CREATE CUSTOM STRESS PROFILE RPC
CREATE OR REPLACE FUNCTION public.create_resilience_stress_profile(
    p_profile_name TEXT,
    p_shock_class TEXT,
    p_delta_capital NUMERIC DEFAULT 0.00,
    p_delta_operations NUMERIC DEFAULT 0.00,
    p_delta_personnel NUMERIC DEFAULT 0.00,
    p_delta_campaigns NUMERIC DEFAULT 0.00,
    p_delta_geo NUMERIC DEFAULT 0.00,
    p_delta_time NUMERIC DEFAULT 0.00,
    p_demand_shock_ratio NUMERIC DEFAULT 0.00,
    p_cost_inflation_ratio NUMERIC DEFAULT 0.00,
    p_description TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_profile_id UUID;
    v_result JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    -- Validate bounds
    IF p_delta_capital < 0.00 OR p_delta_capital > 0.90 OR
       p_delta_operations < 0.00 OR p_delta_operations > 0.90 OR
       p_delta_personnel < 0.00 OR p_delta_personnel > 0.90 OR
       p_delta_campaigns < 0.00 OR p_delta_campaigns > 0.90 OR
       p_delta_geo < 0.00 OR p_delta_geo > 0.90 OR
       p_delta_time < 0.00 OR p_delta_time > 0.90 OR
       p_demand_shock_ratio < 0.00 OR p_demand_shock_ratio > 0.90 OR
       p_cost_inflation_ratio < 0.00 OR p_cost_inflation_ratio > 1.00 THEN
        RAISE EXCEPTION 'Invalid stress delta parameter. Must be bounded within documented constraints.' USING ERRCODE = '22023';
    END IF;

    IF p_shock_class NOT IN (
        'CAPITAL_SHOCK', 'OPERATIONS_SHOCK', 'PERSONNEL_SHOCK',
        'CAMPAIGN_CAPACITY_SHOCK', 'GEOGRAPHIC_ACCESS_SHOCK', 'TIME_HORIZON_SHOCK',
        'DEMAND_SHOCK', 'SUPPLY_SHOCK', 'CONVERSION_SHOCK', 'MULTI_FACTOR_SHOCK'
    ) THEN
        RAISE EXCEPTION 'Invalid shock_class taxonomy.' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.analytics_resilience_stress_profiles (
        profile_name, shock_class, delta_capital, delta_operations, delta_personnel,
        delta_campaigns, delta_geo, delta_time, demand_shock_ratio, cost_inflation_ratio,
        description, is_predefined
    ) VALUES (
        p_profile_name, p_shock_class, p_delta_capital, p_delta_operations, p_delta_personnel,
        p_delta_campaigns, p_delta_geo, p_delta_time, p_demand_shock_ratio, p_cost_inflation_ratio,
        p_description, FALSE
    )
    RETURNING id INTO v_profile_id;

    INSERT INTO public.analytics_resilience_audit_log (
        run_id, actor_id, action, details
    ) VALUES (
        NULL, v_actor_id, 'CREATE_STRESS_PROFILE',
        jsonb_build_object('profile_id', v_profile_id, 'profile_name', p_profile_name, 'shock_class', p_shock_class)
    );

    v_result := jsonb_build_object(
        'success', TRUE,
        'profile_id', v_profile_id,
        'profile_name', p_profile_name,
        'shock_class', p_shock_class
    );

    RETURN v_result;
END;
$$;

-- 2. RUN RESILIENCE STRESS TEST RPC (Deterministic, Knapsack Recomposition, Bounded Math)
CREATE OR REPLACE FUNCTION public.run_resilience_stress_test(
    p_plan_id UUID,
    p_profile_id UUID,
    p_model_version TEXT DEFAULT 'SPRTCIE-1.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_plan RECORD;
    v_prof RECORD;
    v_run_id UUID;

    -- Stressed Envelopes
    v_s_cap NUMERIC(12,2);
    v_s_ops NUMERIC(8,2);
    v_s_pers INT;
    v_s_camp INT;
    v_s_geo INT;
    v_s_time INT;

    -- Demand aggregates
    v_d_cap NUMERIC(12,2) := 0.00;
    v_d_ops NUMERIC(8,2) := 0.00;
    v_d_pers INT := 0;
    v_d_camp INT := 0;
    v_d_geo INT := 0;
    v_d_time INT := 0;

    -- Stress ratios
    v_r_cap NUMERIC(8,4) := 0.0000;
    v_r_ops NUMERIC(8,4) := 0.0000;
    v_r_pers NUMERIC(8,4) := 0.0000;
    v_r_camp NUMERIC(8,4) := 0.0000;
    v_r_geo NUMERIC(8,4) := 0.0000;
    v_r_time NUMERIC(8,4) := 0.0000;

    -- Breaches
    v_breached_count INT := 0;
    v_dominant_constraint TEXT := 'NONE';
    v_max_ratio NUMERIC(8,4) := 0.0000;

    -- Portfolio survival
    v_baseline_action_count INT := 0;
    v_baseline_total_val NUMERIC(10,2) := 0.00;
    v_surviving_action_count INT := 0;
    v_surviving_val NUMERIC(10,2) := 0.00;
    v_surv_ratio_count NUMERIC(5,4) := 0.0000;
    v_surv_ratio_val NUMERIC(5,4) := 0.0000;

    -- Remaining capacities for survival check
    v_rem_cap NUMERIC(12,2);
    v_rem_ops NUMERIC(8,2);
    v_rem_pers INT;
    v_rem_camp INT;
    v_rem_geo INT;
    v_rem_time INT;

    -- Fragility metrics (HHI of capital demand across allocated actions)
    v_hhi NUMERIC(5,4) := 0.0000;
    v_sq_sum NUMERIC(12,4) := 0.0000;

    -- Composite resilience score & tier
    v_resilience_score NUMERIC(5,2) := 0.00;
    v_resilience_tier TEXT := 'CRITICAL_FAILURE';
    v_kappa_breach NUMERIC(5,4) := 0.0000;

    -- Contingency recomposition variables
    v_c_alloc_cap NUMERIC(12,2) := 0.00;
    v_c_alloc_ops NUMERIC(8,2) := 0.00;
    v_c_alloc_val NUMERIC(10,2) := 0.00;
    v_c_action_ids JSONB := '[]'::jsonb;
    v_c_action_count INT := 0;
    v_c_rec_ratio NUMERIC(5,4) := 0.0000;

    -- Cursor records
    v_alloc RECORD;
    v_cand RECORD;
    v_brief JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF p_model_version != 'SPRTCIE-1.0.0' THEN
        RAISE EXCEPTION 'Unsupported model version: %. Expected SPRTCIE-1.0.0.', p_model_version USING ERRCODE = '22023';
    END IF;

    -- Fetch baseline Phase 9.5 plan
    SELECT * INTO v_plan
    FROM public.analytics_strategic_resource_plans
    WHERE id = p_plan_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Resource plan % not found.', p_plan_id USING ERRCODE = 'P0002';
    END IF;

    -- Fetch stress profile
    SELECT * INTO v_prof
    FROM public.analytics_resilience_stress_profiles
    WHERE id = p_profile_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stress profile % not found.', p_profile_id USING ERRCODE = 'P0002';
    END IF;

    -- Compute Stressed Envelopes R'_m
    v_s_cap := ROUND(v_plan.envelope_capital * (1.00 - v_prof.delta_capital), 2);
    v_s_ops := ROUND(v_plan.envelope_operations * (1.00 - v_prof.delta_operations), 2);
    v_s_pers := FLOOR(v_plan.envelope_personnel * (1.00 - v_prof.delta_personnel))::INT;
    v_s_camp := FLOOR(v_plan.envelope_campaigns * (1.00 - v_prof.delta_campaigns))::INT;
    v_s_geo := FLOOR(v_plan.envelope_geo_lga * (1.00 - v_prof.delta_geo))::INT;
    v_s_time := GREATEST(1, FLOOR(v_plan.envelope_time_days * (1.00 - v_prof.delta_time))::INT);

    -- Tally baseline demands with cost inflation
    FOR v_alloc IN (
        SELECT a.*, s.expected_value, s.confidence_score, s.risk_score
        FROM public.analytics_strategic_resource_allocations a
        JOIN public.analytics_strategic_scenarios s ON a.scenario_id = s.id
        WHERE a.plan_id = p_plan_id
        ORDER BY a.allocation_rank ASC
    ) LOOP
        v_baseline_action_count := v_baseline_action_count + 1;
        v_baseline_total_val := v_baseline_total_val + v_alloc.expected_value;

        v_d_cap := v_d_cap + ROUND(v_alloc.allocated_capital * (1.00 + v_prof.cost_inflation_ratio), 2);
        v_d_ops := v_d_ops + ROUND(v_alloc.allocated_operations * (1.00 + v_prof.cost_inflation_ratio), 2);
        v_d_pers := v_d_pers + v_alloc.allocated_personnel;
        v_d_camp := v_d_camp + v_alloc.allocated_campaigns;
        v_d_geo := v_d_geo + v_alloc.allocated_geo_lga;
        v_d_time := GREATEST(v_d_time, v_plan.envelope_time_days);

        IF v_plan.allocated_capital > 0 THEN
            v_sq_sum := v_sq_sum + POWER((v_alloc.allocated_capital / v_plan.allocated_capital), 2);
        END IF;
    END LOOP;

    -- Fragility HHI (clamped [0.0000, 1.0000])
    IF v_baseline_action_count > 0 THEN
        v_hhi := LEAST(1.0000, GREATEST(0.0000, ROUND(v_sq_sum, 4)));
    ELSE
        v_hhi := 0.0000;
    END IF;

    -- Evaluate Constraint Stress Ratios kappa_m with Sentinel Zero-Denominator handling
    IF v_s_cap > 0 THEN v_r_cap := ROUND(v_d_cap / v_s_cap, 4); ELSIF v_d_cap > 0 THEN v_r_cap := 9999.0000; ELSE v_r_cap := 0.0000; END IF;
    IF v_s_ops > 0 THEN v_r_ops := ROUND(v_d_ops / v_s_ops, 4); ELSIF v_d_ops > 0 THEN v_r_ops := 9999.0000; ELSE v_r_ops := 0.0000; END IF;
    IF v_s_pers > 0 THEN v_r_pers := ROUND(v_d_pers::NUMERIC / v_s_pers, 4); ELSIF v_d_pers > 0 THEN v_r_pers := 9999.0000; ELSE v_r_pers := 0.0000; END IF;
    IF v_s_camp > 0 THEN v_r_camp := ROUND(v_d_camp::NUMERIC / v_s_camp, 4); ELSIF v_d_camp > 0 THEN v_r_camp := 9999.0000; ELSE v_r_camp := 0.0000; END IF;
    IF v_s_geo > 0 THEN v_r_geo := ROUND(v_d_geo::NUMERIC / v_s_geo, 4); ELSIF v_d_geo > 0 THEN v_r_geo := 9999.0000; ELSE v_r_geo := 0.0000; END IF;
    IF v_s_time > 0 THEN v_r_time := ROUND(v_d_time::NUMERIC / v_s_time, 4); ELSIF v_d_time > 0 THEN v_r_time := 9999.0000; ELSE v_r_time := 0.0000; END IF;

    -- Determine Breaches & Dominant Constraint
    IF v_r_cap > 1.0000 THEN v_breached_count := v_breached_count + 1; END IF;
    IF v_r_ops > 1.0000 THEN v_breached_count := v_breached_count + 1; END IF;
    IF v_r_pers > 1.0000 THEN v_breached_count := v_breached_count + 1; END IF;
    IF v_r_camp > 1.0000 THEN v_breached_count := v_breached_count + 1; END IF;
    IF v_r_geo > 1.0000 THEN v_breached_count := v_breached_count + 1; END IF;
    IF v_r_time > 1.0000 THEN v_breached_count := v_breached_count + 1; END IF;

    v_max_ratio := v_r_cap;
    v_dominant_constraint := 'CAPITAL';

    IF v_r_ops > v_max_ratio THEN v_max_ratio := v_r_ops; v_dominant_constraint := 'OPERATIONS'; END IF;
    IF v_r_pers > v_max_ratio THEN v_max_ratio := v_r_pers; v_dominant_constraint := 'PERSONNEL'; END IF;
    IF v_r_camp > v_max_ratio THEN v_max_ratio := v_r_camp; v_dominant_constraint := 'CAMPAIGNS'; END IF;
    IF v_r_geo > v_max_ratio THEN v_max_ratio := v_r_geo; v_dominant_constraint := 'GEOGRAPHY'; END IF;
    IF v_r_time > v_max_ratio THEN v_max_ratio := v_r_time; v_dominant_constraint := 'TIME_HORIZON'; END IF;

    IF v_max_ratio <= 1.0000 THEN
        v_dominant_constraint := 'NONE';
    END IF;

    -- Evaluate Simultaneous Portfolio Survival
    v_rem_cap := v_s_cap;
    v_rem_ops := v_s_ops;
    v_rem_pers := v_s_pers;
    v_rem_camp := v_s_camp;
    v_rem_geo := v_s_geo;
    v_rem_time := v_s_time;

    FOR v_alloc IN (
        SELECT a.*, s.expected_value
        FROM public.analytics_strategic_resource_allocations a
        JOIN public.analytics_strategic_scenarios s ON a.scenario_id = s.id
        WHERE a.plan_id = p_plan_id
        ORDER BY a.allocation_rank ASC
    ) LOOP
        DECLARE
            v_req_cap NUMERIC := ROUND(v_alloc.allocated_capital * (1.00 + v_prof.cost_inflation_ratio), 2);
            v_req_ops NUMERIC := ROUND(v_alloc.allocated_operations * (1.00 + v_prof.cost_inflation_ratio), 2);
            v_adj_val NUMERIC := ROUND(v_alloc.expected_value * (1.00 - v_prof.demand_shock_ratio), 2);
        BEGIN
            IF v_req_cap <= v_rem_cap AND
               v_req_ops <= v_rem_ops AND
               v_alloc.allocated_personnel <= v_rem_pers AND
               v_alloc.allocated_campaigns <= v_rem_camp AND
               v_alloc.allocated_geo_lga <= v_rem_geo THEN

                v_surviving_action_count := v_surviving_action_count + 1;
                v_surviving_val := v_surviving_val + v_adj_val;

                v_rem_cap := v_rem_cap - v_req_cap;
                v_rem_ops := v_rem_ops - v_req_ops;
                v_rem_pers := v_rem_pers - v_alloc.allocated_personnel;
                v_rem_camp := v_rem_camp - v_alloc.allocated_campaigns;
                v_rem_geo := v_rem_geo - v_alloc.allocated_geo_lga;
            END IF;
        END;
    END LOOP;

    IF v_baseline_action_count > 0 THEN
        v_surv_ratio_count := ROUND(v_surviving_action_count::NUMERIC / v_baseline_action_count, 4);
    ELSE
        v_surv_ratio_count := 1.0000;
    END IF;

    IF v_baseline_total_val > 0 THEN
        v_surv_ratio_val := LEAST(1.0000, GREATEST(0.0000, ROUND(v_surviving_val / v_baseline_total_val, 4)));
    ELSE
        v_surv_ratio_val := 1.0000;
    END IF;

    -- Compute Resilience Score R_resilience in [0.00, 100.00]
    IF v_max_ratio > 1.0000 THEN
        v_kappa_breach := LEAST(1.0000, ROUND((v_max_ratio - 1.0000) / 2.0, 4));
    ELSE
        v_kappa_breach := 0.0000;
    END IF;

    v_resilience_score := LEAST(100.00, GREATEST(0.00, ROUND(
        100.0 * (0.40 * v_surv_ratio_val +
                 0.30 * v_surv_ratio_count +
                 0.20 * (1.0000 - v_kappa_breach) +
                 0.10 * (1.0000 - v_hhi)), 2
    )));

    IF v_resilience_score >= 85.00 THEN
        v_resilience_tier := 'IMMUNE';
    ELSIF v_resilience_score >= 65.00 THEN
        v_resilience_tier := 'RESILIENT';
    ELSIF v_resilience_score >= 40.00 THEN
        v_resilience_tier := 'VULNERABLE';
    ELSE
        v_resilience_tier := 'CRITICAL_FAILURE';
    END IF;

    -- Insert Stress Run Record
    INSERT INTO public.analytics_resilience_stress_runs (
        plan_id, profile_id, model_version, resilience_score, resilience_tier,
        survival_ratio_count, survival_ratio_value, dominant_failure_constraint,
        total_breached_constraints, fragility_hhi, contingency_portfolio_count,
        created_by
    ) VALUES (
        p_plan_id, p_profile_id, p_model_version, v_resilience_score, v_resilience_tier,
        v_surv_ratio_count, v_surv_ratio_val, v_dominant_constraint,
        v_breached_count, v_hhi, 1,
        v_actor_id
    )
    RETURNING id INTO v_run_id;

    -- Record Constraint Failure Audit Records
    INSERT INTO public.analytics_resilience_constraint_failures (
        run_id, constraint_dimension, baseline_limit, stressed_limit, portfolio_demand,
        stress_ratio, is_breached, breach_severity_pct
    ) VALUES
        (v_run_id, 'CAPITAL', v_plan.envelope_capital, v_s_cap, v_d_cap, v_r_cap, (v_r_cap > 1.0), CASE WHEN v_r_cap > 1.0 THEN ROUND((v_r_cap - 1.0) * 100.0, 2) ELSE 0.00 END),
        (v_run_id, 'OPERATIONS', v_plan.envelope_operations, v_s_ops, v_d_ops, v_r_ops, (v_r_ops > 1.0), CASE WHEN v_r_ops > 1.0 THEN ROUND((v_r_ops - 1.0) * 100.0, 2) ELSE 0.00 END),
        (v_run_id, 'PERSONNEL', v_plan.envelope_personnel, v_s_pers, v_d_pers, v_r_pers, (v_r_pers > 1.0), CASE WHEN v_r_pers > 1.0 THEN ROUND((v_r_pers - 1.0) * 100.0, 2) ELSE 0.00 END),
        (v_run_id, 'CAMPAIGNS', v_plan.envelope_campaigns, v_s_camp, v_d_camp, v_r_camp, (v_r_camp > 1.0), CASE WHEN v_r_camp > 1.0 THEN ROUND((v_r_camp - 1.0) * 100.0, 2) ELSE 0.00 END),
        (v_run_id, 'GEOGRAPHY', v_plan.envelope_geo_lga, v_s_geo, v_d_geo, v_r_geo, (v_r_geo > 1.0), CASE WHEN v_r_geo > 1.0 THEN ROUND((v_r_geo - 1.0) * 100.0, 2) ELSE 0.00 END),
        (v_run_id, 'TIME_HORIZON', v_plan.envelope_time_days, v_s_time, v_d_time, v_r_time, (v_r_time > 1.0), CASE WHEN v_r_time > 1.0 THEN ROUND((v_r_time - 1.0) * 100.0, 2) ELSE 0.00 END);

    -- Deterministic Contingency Recomposition (Polynomial Knapsack under Stressed Envelope)
    v_rem_cap := v_s_cap;
    v_rem_ops := v_s_ops;
    v_rem_pers := v_s_pers;
    v_rem_camp := v_s_camp;
    v_rem_geo := v_s_geo;
    v_rem_time := v_s_time;

    FOR v_cand IN (
        SELECT s.id AS scenario_id,
               ROUND(s.expected_value * (1.00 - v_prof.demand_shock_ratio), 2) AS adj_ev,
               s.risk_score, s.confidence_score,
               ROUND(COALESCE((s.forecast_metrics->>'estimated_cost')::NUMERIC, 50000.00) * (1.00 + v_prof.cost_inflation_ratio), 2) AS c_cap,
               ROUND(COALESCE((s.forecast_metrics->>'operational_effort')::NUMERIC, 5.00) * (1.00 + v_prof.cost_inflation_ratio), 2) AS c_ops,
               COALESCE((s.forecast_metrics->>'personnel_count')::INT, 1) AS c_pers,
               COALESCE((s.forecast_metrics->>'campaign_slots')::INT, 1) AS c_camp,
               COALESCE((s.forecast_metrics->>'lga_count')::INT, 2) AS c_geo,
               COALESCE((s.forecast_metrics->>'duration_days')::INT, 30) AS c_time
        FROM public.analytics_strategic_scenarios s
        ORDER BY
            s.expected_value DESC,
            s.risk_score ASC,
            s.confidence_score DESC,
            s.id ASC
        LIMIT 100
    ) LOOP
        IF v_cand.c_cap <= v_rem_cap AND
           v_cand.c_ops <= v_rem_ops AND
           v_cand.c_pers <= v_rem_pers AND
           v_cand.c_camp <= v_rem_camp AND
           v_cand.c_geo <= v_rem_geo AND
           v_cand.c_time <= v_rem_time THEN

            v_c_action_count := v_c_action_count + 1;
            v_c_alloc_cap := v_c_alloc_cap + v_cand.c_cap;
            v_c_alloc_ops := v_c_alloc_ops + v_cand.c_ops;
            v_c_alloc_val := v_c_alloc_val + v_cand.adj_ev;
            v_c_action_ids := v_c_action_ids || jsonb_build_array(v_cand.scenario_id);

            v_rem_cap := v_rem_cap - v_cand.c_cap;
            v_rem_ops := v_rem_ops - v_cand.c_ops;
            v_rem_pers := v_rem_pers - v_cand.c_pers;
            v_rem_camp := v_rem_camp - v_cand.c_camp;
            v_rem_geo := v_rem_geo - v_cand.c_geo;
        END IF;
    END LOOP;

    IF v_baseline_total_val > 0 THEN
        v_c_rec_ratio := LEAST(1.0000, GREATEST(0.0000, ROUND(v_c_alloc_val / v_baseline_total_val, 4)));
    ELSE
        v_c_rec_ratio := 1.0000;
    END IF;

    -- Store Contingency Portfolio
    INSERT INTO public.analytics_resilience_contingency_portfolios (
        run_id, contingency_rank, recomposed_action_count, allocated_capital,
        allocated_operations, aggregate_expected_value, value_recovery_ratio, action_ids
    ) VALUES (
        v_run_id, 1, v_c_action_count, v_c_alloc_cap,
        v_c_alloc_ops, v_c_alloc_val, v_c_rec_ratio, v_c_action_ids
    );

    -- Build Executive Resilience Brief JSONB
    v_brief := jsonb_build_object(
        'provenance', 'DECISION_SUPPORT_ONLY',
        'status', 'SIMULATED_STRESS_TEST',
        'action_guidance', 'MANUAL_ACTION_REQUIRED',
        'model_version', p_model_version,
        'profile_name', v_prof.profile_name,
        'shock_class', v_prof.shock_class,
        'resilience_score', v_resilience_score,
        'resilience_tier', v_resilience_tier,
        'survival_ratio_count', v_surv_ratio_count,
        'survival_ratio_value', v_surv_ratio_val,
        'dominant_failure_constraint', v_dominant_constraint,
        'total_breached_constraints', v_breached_count,
        'fragility_hhi', v_hhi,
        'contingency_value_recovery_ratio', v_c_rec_ratio,
        'simulated_at', NOW()
    );

    UPDATE public.analytics_resilience_stress_runs
    SET executive_resilience_brief = v_brief
    WHERE id = v_run_id;

    -- Append-Only Audit Log
    INSERT INTO public.analytics_resilience_audit_log (
        run_id, actor_id, action, details
    ) VALUES (
        v_run_id, v_actor_id, 'RUN_RESILIENCE_STRESS_TEST',
        jsonb_build_object(
            'plan_id', p_plan_id,
            'profile_id', p_profile_id,
            'resilience_score', v_resilience_score,
            'resilience_tier', v_resilience_tier
        )
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'run_id', v_run_id,
        'resilience_score', v_resilience_score,
        'resilience_tier', v_resilience_tier,
        'survival_ratio_count', v_surv_ratio_count,
        'survival_ratio_value', v_surv_ratio_val,
        'dominant_failure_constraint', v_dominant_constraint,
        'contingency_value_recovery_ratio', v_c_rec_ratio,
        'executive_brief', v_brief
    );
END;
$$;

-- 3. COMPARE RESILIENCE STRESS PROFILES RPC (Bounded Set P <= 10)
CREATE OR REPLACE FUNCTION public.compare_resilience_stress_profiles(
    p_plan_id UUID,
    p_profile_ids UUID[],
    p_model_version TEXT DEFAULT 'SPRTCIE-1.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_prof_id UUID;
    v_single_res JSONB;
    v_results JSONB := '[]'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF array_length(p_profile_ids, 1) IS NULL OR array_length(p_profile_ids, 1) < 1 OR array_length(p_profile_ids, 1) > 10 THEN
        RAISE EXCEPTION 'Stress comparison profile set must contain between 1 and 10 profiles.' USING ERRCODE = '22023';
    END IF;

    FOREACH v_prof_id IN ARRAY p_profile_ids LOOP
        v_single_res := public.run_resilience_stress_test(p_plan_id, v_prof_id, p_model_version);
        v_results := v_results || jsonb_build_array(v_single_res);
    END LOOP;

    RETURN jsonb_build_object(
        'success', TRUE,
        'plan_id', p_plan_id,
        'model_version', p_model_version,
        'comparison_count', array_length(p_profile_ids, 1),
        'comparison_results', v_results
    );
END;
$$;

-- 4. GET RESILIENCE STRESS RUN RPC
CREATE OR REPLACE FUNCTION public.get_resilience_stress_run(
    p_run_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_run RECORD;
    v_failures JSONB;
    v_contingency JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    SELECT r.*, p.profile_name, p.shock_class
    INTO v_run
    FROM public.analytics_resilience_stress_runs r
    JOIN public.analytics_resilience_stress_profiles p ON r.profile_id = p.id
    WHERE r.id = p_run_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Stress run % not found.', p_run_id USING ERRCODE = 'P0002';
    END IF;

    SELECT jsonb_agg(row_to_json(f))
    INTO v_failures
    FROM (
        SELECT constraint_dimension, baseline_limit, stressed_limit, portfolio_demand,
               stress_ratio, is_breached, breach_severity_pct
        FROM public.analytics_resilience_constraint_failures
        WHERE run_id = p_run_id
        ORDER BY stress_ratio DESC
    ) f;

    SELECT jsonb_agg(row_to_json(c))
    INTO v_contingency
    FROM (
        SELECT contingency_rank, recomposed_action_count, allocated_capital,
               allocated_operations, aggregate_expected_value, value_recovery_ratio, action_ids
        FROM public.analytics_resilience_contingency_portfolios
        WHERE run_id = p_run_id
        ORDER BY contingency_rank ASC
    ) c;

    RETURN jsonb_build_object(
        'success', TRUE,
        'run_id', v_run.id,
        'plan_id', v_run.plan_id,
        'profile_name', v_run.profile_name,
        'shock_class', v_run.shock_class,
        'model_version', v_run.model_version,
        'resilience_score', v_run.resilience_score,
        'resilience_tier', v_run.resilience_tier,
        'survival_ratio_count', v_run.survival_ratio_count,
        'survival_ratio_value', v_run.survival_ratio_value,
        'dominant_failure_constraint', v_run.dominant_failure_constraint,
        'total_breached_constraints', v_run.total_breached_constraints,
        'fragility_hhi', v_run.fragility_hhi,
        'constraint_failures', COALESCE(v_failures, '[]'::jsonb),
        'contingency_portfolios', COALESCE(v_contingency, '[]'::jsonb),
        'executive_brief', v_run.executive_resilience_brief,
        'created_at', v_run.created_at
    );
END;
$$;
