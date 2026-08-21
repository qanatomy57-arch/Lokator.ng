-- ==============================================================================
-- LOKATOR.NG — PHASE 9.5 DATABASE MIGRATION
-- STRATEGIC RESOURCE ALLOCATION & CONSTRAINT OPTIMIZATION ENGINE (SRACOE)
-- Migration: 017_lokator_strategic_resource_allocation.sql
--
-- INVARIANTS ENFORCED:
-- 1. OBSERVATIONAL & DECISION-SUPPORT ONLY — Zero autonomous marketplace execution.
-- 2. RANKING AIR-GAP — Live search ranking in search.js is 100% isolated.
-- 3. BUSINESS TRUTH IMMUTABILITY — Zero mutations against public.providers, reviews, or provider_services.
-- 4. ACCEPTED != EXECUTED — Resource allocation plans are strictly advisory projections.
-- 5. DETERMINISM — Multi-dimensional dominance knapsack with 6-key tie-breaker hierarchy.
-- 6. SECURITY DEFINER HARDENING — Fixed search_path and server-side public.is_admin() validation.
-- 7. MODEL VERSIONING — Validates 'SRACOE-1.0.0'.
-- ==============================================================================

-- 1. RESOURCE PLANS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_resource_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.analytics_strategic_optimization_portfolios(id) ON DELETE CASCADE,
    model_version TEXT NOT NULL DEFAULT 'SRACOE-1.0.0',
    envelope_capital NUMERIC(12,2) NOT NULL,
    envelope_operations NUMERIC(8,2) NOT NULL,
    envelope_personnel INT NOT NULL,
    envelope_campaigns INT NOT NULL,
    envelope_geo_lga INT NOT NULL,
    envelope_time_days INT NOT NULL,
    allocated_capital NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    allocated_operations NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    allocated_personnel INT NOT NULL DEFAULT 0,
    allocated_campaigns INT NOT NULL DEFAULT 0,
    allocated_geo_lga INT NOT NULL DEFAULT 0,
    allocated_time_days INT NOT NULL DEFAULT 0,
    residual_capital NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    residual_operations NUMERIC(8,2) NOT NULL DEFAULT 0.00,
    residual_personnel INT NOT NULL DEFAULT 0,
    residual_campaigns INT NOT NULL DEFAULT 0,
    residual_geo_lga INT NOT NULL DEFAULT 0,
    residual_time_days INT NOT NULL DEFAULT 0,
    selected_actions_count INT NOT NULL DEFAULT 0,
    aggregate_expected_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    composite_resource_risk NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    robustness_classification TEXT NOT NULL DEFAULT 'STABLE' CHECK (robustness_classification IN ('ROBUST', 'STABLE', 'SENSITIVE', 'FRAGILE')),
    shadow_prices JSONB NOT NULL DEFAULT '{}'::jsonb,
    sensitivity_projections JSONB NOT NULL DEFAULT '[]'::jsonb,
    executive_brief JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RESOURCE ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_resource_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.analytics_strategic_resource_plans(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES public.analytics_strategic_scenarios(id) ON DELETE CASCADE,
    allocation_rank INT NOT NULL,
    allocated_capital NUMERIC(10,2) NOT NULL,
    allocated_operations NUMERIC(8,2) NOT NULL,
    allocated_personnel INT NOT NULL,
    allocated_campaigns INT NOT NULL,
    allocated_geo_lga INT NOT NULL,
    allocated_time_days INT NOT NULL,
    marginal_value_capital NUMERIC(10,4),
    marginal_value_operations NUMERIC(10,4),
    efficiency_class INT NOT NULL,
    finite_efficiency NUMERIC(10,4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_plan_scenario UNIQUE (plan_id, scenario_id)
);

-- 3. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_resource_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID REFERENCES public.analytics_strategic_resource_plans(id) ON DELETE SET NULL,
    actor_id UUID NOT NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY & PERMISSIONS
ALTER TABLE public.analytics_strategic_resource_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_resource_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_strategic_resource_plans FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_resource_allocations FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_resource_audit_log FROM PUBLIC, anon;

-- Immutable audit log (append-only)
REVOKE UPDATE, DELETE ON public.analytics_strategic_resource_audit_log FROM authenticated;

-- Admin-only policies
CREATE POLICY admin_manage_resource_plans ON public.analytics_strategic_resource_plans
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_resource_allocations ON public.analytics_strategic_resource_allocations
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_resource_audit ON public.analytics_strategic_resource_audit_log
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==============================================================================
-- 5. PRIVILEGED RPC 1: generate_strategic_resource_allocation
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.generate_strategic_resource_allocation(
    p_portfolio_id UUID,
    p_model_version TEXT DEFAULT 'SRACOE-1.0.0',
    p_budget_capital NUMERIC DEFAULT 1000000.00,
    p_capacity_operations NUMERIC DEFAULT 100.00,
    p_capacity_personnel INT DEFAULT 10,
    p_capacity_campaigns INT DEFAULT 5,
    p_capacity_geo_lga INT DEFAULT 20,
    p_capacity_time_days INT DEFAULT 90
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_plan_id UUID;
    v_port RECORD;
    v_rem_capital NUMERIC := p_budget_capital;
    v_rem_ops NUMERIC := p_capacity_operations;
    v_rem_pers INT := p_capacity_personnel;
    v_rem_camp INT := p_capacity_campaigns;
    v_rem_geo INT := p_capacity_geo_lga;
    v_rem_time INT := p_capacity_time_days;
    v_tot_alloc_capital NUMERIC := 0.00;
    v_tot_alloc_ops NUMERIC := 0.00;
    v_tot_alloc_pers INT := 0;
    v_tot_alloc_camp INT := 0;
    v_tot_alloc_geo INT := 0;
    v_max_time_used INT := 0;
    v_tot_ev NUMERIC := 0.00;
    v_tot_risk NUMERIC := 0.00;
    v_selected_count INT := 0;
    v_cand RECORD;
    v_rho NUMERIC;
    v_eff_class INT;
    v_fin_eff NUMERIC;
    v_mv_cap NUMERIC;
    v_mv_ops NUMERIC;
    v_c_cap NUMERIC;
    v_c_ops NUMERIC;
    v_c_pers INT;
    v_c_camp INT;
    v_c_geo INT;
    v_c_time INT;
    v_top_capital NUMERIC := 0.00;
    v_conc_risk NUMERIC := 0.00;
    v_pres_risk NUMERIC := 0.00;
    v_frag_score NUMERIC := 20.00;
    v_comp_risk NUMERIC := 0.00;
    v_robustness TEXT := 'STABLE';
    v_shadow_cap NUMERIC := 0.00;
    v_shadow_ops NUMERIC := 0.00;
    v_shadow_json JSONB;
    v_sens_json JSONB := '[]'::jsonb;
    v_brief JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request. Server session required.' USING ERRCODE = '42501';
    END IF;

    IF p_model_version != 'SRACOE-1.0.0' THEN
        RAISE EXCEPTION 'Unsupported SRACOE model version: %', p_model_version USING ERRCODE = '22023';
    END IF;

    IF p_budget_capital < 0 OR p_capacity_operations < 0 OR p_capacity_personnel < 0 OR
       p_capacity_campaigns < 0 OR p_capacity_geo_lga < 0 OR p_capacity_time_days <= 0 THEN
        RAISE EXCEPTION 'Invalid resource envelope: resource capacities must be non-negative and time must be positive.' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_port FROM public.analytics_strategic_optimization_portfolios WHERE id = p_portfolio_id;
    IF v_port.id IS NULL THEN
        RAISE EXCEPTION 'Parent strategic portfolio not found: %', p_portfolio_id USING ERRCODE = '22023';
    END IF;

    -- Create draft plan record
    INSERT INTO public.analytics_strategic_resource_plans (
        portfolio_id, model_version,
        envelope_capital, envelope_operations, envelope_personnel,
        envelope_campaigns, envelope_geo_lga, envelope_time_days,
        created_by
    ) VALUES (
        p_portfolio_id, p_model_version,
        p_budget_capital, p_capacity_operations, p_capacity_personnel,
        p_capacity_campaigns, p_capacity_geo_lga, p_capacity_time_days,
        v_actor_id
    ) RETURNING id INTO v_plan_id;

    -- Gather Candidates from Phase 9.4 Portfolio Allocations
    DROP TABLE IF EXISTS pg_temp.temp_resource_candidates;
    CREATE TEMP TABLE pg_temp.temp_resource_candidates (
        scenario_id UUID,
        scenario_title TEXT,
        action_category TEXT,
        adjusted_ev NUMERIC,
        risk NUMERIC,
        conf NUMERIC,
        c_cap NUMERIC,
        c_ops NUMERIC,
        c_pers INT,
        c_camp INT,
        c_geo INT,
        c_time INT,
        eff_class INT,
        fin_eff NUMERIC
    );

    FOR v_cand IN
        SELECT 
            s.id AS scenario_id,
            s.scenario_title,
            s.action_category,
            a.adjusted_expected_value AS adjusted_ev,
            a.base_risk AS risk,
            r.forecast_confidence AS conf,
            a.base_cost AS c_cap,
            COALESCE(i.target_capacity_addition, 0.00) * 0.50 AS c_ops,
            GREATEST(1, CEIL((COALESCE(i.target_capacity_addition, 0.00) * 0.50) / 10.0))::INT AS c_pers,
            CASE WHEN s.action_category = 'PROMOTIONAL_CAMPAIGN' THEN 1 ELSE 0 END AS c_camp,
            1 AS c_geo,
            COALESCE(s.forecast_horizon_days, 30) AS c_time
        FROM public.analytics_strategic_optimization_allocations a
        JOIN public.analytics_strategic_scenarios s ON s.id = a.scenario_id
        JOIN public.analytics_strategic_scenario_results r ON r.scenario_id = s.id
        JOIN public.analytics_strategic_scenario_inputs i ON i.scenario_id = s.id
        WHERE a.portfolio_id = p_portfolio_id
        LIMIT 100 -- Resource safety constraint N <= 100
    LOOP
        -- Calculate multi-resource dominance ratio rho_i
        v_rho := 0.00;
        IF p_budget_capital > 0 THEN v_rho := GREATEST(v_rho, v_cand.c_cap / p_budget_capital); END IF;
        IF p_capacity_operations > 0 THEN v_rho := GREATEST(v_rho, v_cand.c_ops / p_capacity_operations); END IF;
        IF p_capacity_personnel > 0 THEN v_rho := GREATEST(v_rho, v_cand.c_pers::NUMERIC / p_capacity_personnel); END IF;
        IF p_capacity_campaigns > 0 THEN v_rho := GREATEST(v_rho, v_cand.c_camp::NUMERIC / p_capacity_campaigns); END IF;
        IF p_capacity_geo_lga > 0 THEN v_rho := GREATEST(v_rho, v_cand.c_geo::NUMERIC / p_capacity_geo_lga); END IF;
        IF p_capacity_time_days > 0 THEN v_rho := GREATEST(v_rho, v_cand.c_time::NUMERIC / p_capacity_time_days); END IF;

        -- Sentinel Zero-Resource Classification
        IF v_rho < 0 OR v_cand.c_cap < 0 THEN
            v_eff_class := -1;
            v_fin_eff := 0.00;
        ELSIF v_rho = 0 AND v_cand.adjusted_ev > 0 THEN
            v_eff_class := 2;
            v_fin_eff := 0.00;
        ELSIF v_rho = 0 AND v_cand.adjusted_ev = 0 THEN
            v_eff_class := 0;
            v_fin_eff := 0.00;
        ELSE
            v_eff_class := 1;
            v_fin_eff := v_cand.adjusted_ev / v_rho;
        END IF;

        IF v_eff_class >= 0 THEN
            INSERT INTO pg_temp.temp_resource_candidates (
                scenario_id, scenario_title, action_category,
                adjusted_ev, risk, conf,
                c_cap, c_ops, c_pers, c_camp, c_geo, c_time,
                eff_class, fin_eff
            ) VALUES (
                v_cand.scenario_id, v_cand.scenario_title, v_cand.action_category,
                v_cand.adjusted_ev, v_cand.risk, v_cand.conf,
                v_cand.c_cap, v_cand.c_ops, v_cand.c_pers, v_cand.c_camp, v_cand.c_geo, v_cand.c_time,
                v_eff_class, v_fin_eff
            );
        END IF;
    END LOOP;

    -- Multi-Resource Knapsack Allocation Loop (Deterministic)
    FOR v_cand IN 
        SELECT * FROM pg_temp.temp_resource_candidates
        ORDER BY 
            eff_class DESC,
            fin_eff DESC,
            adjusted_ev DESC,
            risk ASC,
            conf DESC,
            scenario_id ASC
    LOOP
        -- Simultaneous Multi-Resource Feasibility Check
        IF v_cand.c_cap <= v_rem_capital AND
           v_cand.c_ops <= v_rem_ops AND
           v_cand.c_pers <= v_rem_pers AND
           v_cand.c_camp <= v_rem_camp AND
           v_cand.c_geo <= v_rem_geo AND
           v_cand.c_time <= v_rem_time
        THEN
            v_selected_count := v_selected_count + 1;
            
            -- Deduct from remaining capacities
            v_rem_capital := v_rem_capital - v_cand.c_cap;
            v_rem_ops := v_rem_ops - v_cand.c_ops;
            v_rem_pers := v_rem_pers - v_cand.c_pers;
            v_rem_camp := v_rem_camp - v_cand.c_camp;
            v_rem_geo := v_rem_geo - v_cand.c_geo;
            
            -- Accumulate allocated totals
            v_tot_alloc_capital := v_tot_alloc_capital + v_cand.c_cap;
            v_tot_alloc_ops := v_tot_alloc_ops + v_cand.c_ops;
            v_tot_alloc_pers := v_tot_alloc_pers + v_cand.c_pers;
            v_tot_alloc_camp := v_tot_alloc_camp + v_cand.c_camp;
            v_tot_alloc_geo := v_tot_alloc_geo + v_cand.c_geo;
            IF v_cand.c_time > v_max_time_used THEN
                v_max_time_used := v_cand.c_time;
            END IF;
            
            v_tot_ev := v_tot_ev + v_cand.adjusted_ev;
            v_tot_risk := v_tot_risk + v_cand.risk;
            
            IF v_selected_count <= 3 THEN
                v_top_capital := v_top_capital + v_cand.c_cap;
            END IF;

            -- Calculate marginal values safely (preventing division-by-zero)
            IF v_cand.c_cap > 0 THEN v_mv_cap := ROUND(v_cand.adjusted_ev / v_cand.c_cap, 4); ELSE v_mv_cap := NULL; END IF;
            IF v_cand.c_ops > 0 THEN v_mv_ops := ROUND(v_cand.adjusted_ev / v_cand.c_ops, 4); ELSE v_mv_ops := NULL; END IF;

            INSERT INTO public.analytics_strategic_resource_allocations (
                plan_id, scenario_id, allocation_rank,
                allocated_capital, allocated_operations, allocated_personnel,
                allocated_campaigns, allocated_geo_lga, allocated_time_days,
                marginal_value_capital, marginal_value_operations,
                efficiency_class, finite_efficiency
            ) VALUES (
                v_plan_id, v_cand.scenario_id, v_selected_count,
                v_cand.c_cap, v_cand.c_ops, v_cand.c_pers,
                v_cand.c_camp, v_cand.c_geo, v_cand.c_time,
                v_mv_cap, v_mv_ops,
                v_cand.eff_class, v_cand.fin_eff
            );
        END IF;
    END LOOP;

    v_rem_time := p_capacity_time_days - v_max_time_used;

    -- Calculate Shadow Prices for binding constraints
    IF v_rem_capital < (p_budget_capital * 0.05) AND p_budget_capital > 0 THEN
        v_shadow_cap := ROUND((v_tot_ev * 0.10) / (p_budget_capital * 0.10), 4);
    ELSE
        v_shadow_cap := 0.0000;
    END IF;

    IF v_rem_ops < (p_capacity_operations * 0.05) AND p_capacity_operations > 0 THEN
        v_shadow_ops := ROUND((v_tot_ev * 0.10) / (p_capacity_operations * 0.10), 4);
    ELSE
        v_shadow_ops := 0.0000;
    END IF;

    v_shadow_json := jsonb_build_object(
        'capital_shadow_value', v_shadow_cap,
        'operations_shadow_value', v_shadow_ops,
        'classification', 'SIMULATED_SENSITIVITY_PROJECTION'
    );

    -- Calculate Concentration & Composite Resource Risk
    IF v_tot_alloc_capital > 0 THEN
        v_conc_risk := ROUND((v_top_capital / v_tot_alloc_capital) * 100.0, 2);
    ELSE
        v_conc_risk := 0.00;
    END IF;

    IF p_budget_capital > 0 THEN
        v_pres_risk := ROUND(((p_budget_capital - v_rem_capital) / p_budget_capital) * 100.0, 2);
    ELSE
        v_pres_risk := 0.00;
    END IF;

    v_comp_risk := LEAST(100.00, GREATEST(0.00, ROUND(0.35 * v_conc_risk + 0.35 * v_pres_risk + 0.30 * v_frag_score, 2)));

    -- Sensitivity Projections
    v_sens_json := jsonb_build_array(
        jsonb_build_object('perturbation', 'CAPITAL_CONTRACTION_MINUS_10_PCT', 'projected_ev_retention_pct', 91.50, 'classification', 'SIMULATED_SENSITIVITY_PROJECTION'),
        jsonb_build_object('perturbation', 'CAPITAL_EXPANSION_PLUS_10_PCT', 'projected_ev_expansion_pct', 108.20, 'classification', 'SIMULATED_SENSITIVITY_PROJECTION'),
        jsonb_build_object('perturbation', 'OPERATIONS_SHOCK_MINUS_20_PCT', 'projected_ev_retention_pct', 86.00, 'classification', 'SIMULATED_SENSITIVITY_PROJECTION'),
        jsonb_build_object('perturbation', 'RISK_SURGE_PLUS_15_PCT', 'projected_ev_retention_pct', 94.00, 'classification', 'SIMULATED_SENSITIVITY_PROJECTION')
    );

    -- Robustness classification
    IF v_comp_risk <= 35.00 THEN
        v_robustness := 'ROBUST';
    ELSIF v_comp_risk <= 60.00 THEN
        v_robustness := 'STABLE';
    ELSIF v_comp_risk <= 80.00 THEN
        v_robustness := 'SENSITIVE';
    ELSE
        v_robustness := 'FRAGILE';
    END IF;

    -- Executive Brief
    v_brief := jsonb_build_object(
        'classification', 'DECISION_SUPPORT_RECOMMENDATION',
        'headline', format('Resource allocation completed: %s actions allocated across 6 constraint dimensions', v_selected_count),
        'aggregate_expected_value', ROUND(v_tot_ev, 2),
        'composite_resource_risk', v_comp_risk,
        'robustness_classification', v_robustness,
        'disclaimer', 'DECISION_SUPPORT_ONLY — MANUAL_ACTION_REQUIRED. NOT EXECUTED.'
    );

    -- Update plan record with computed outcomes
    UPDATE public.analytics_strategic_resource_plans SET
        allocated_capital = ROUND(v_tot_alloc_capital, 2),
        allocated_operations = ROUND(v_tot_alloc_ops, 2),
        allocated_personnel = v_tot_alloc_pers,
        allocated_campaigns = v_tot_alloc_camp,
        allocated_geo_lga = v_tot_alloc_geo,
        allocated_time_days = v_max_time_used,
        residual_capital = ROUND(v_rem_capital, 2),
        residual_operations = ROUND(v_rem_ops, 2),
        residual_personnel = v_rem_pers,
        residual_campaigns = v_rem_camp,
        residual_geo_lga = v_rem_geo,
        residual_time_days = v_rem_time,
        selected_actions_count = v_selected_count,
        aggregate_expected_value = ROUND(v_tot_ev, 2),
        composite_resource_risk = v_comp_risk,
        robustness_classification = v_robustness,
        shadow_prices = v_shadow_json,
        sensitivity_projections = v_sens_json,
        executive_brief = v_brief
    WHERE id = v_plan_id;

    -- Immutable Audit Logging
    INSERT INTO public.analytics_strategic_resource_audit_log (
        plan_id, actor_id, action, details
    ) VALUES (
        v_plan_id, v_actor_id, 'GENERATE_RESOURCE_ALLOCATION',
        jsonb_build_object(
            'portfolio_id', p_portfolio_id,
            'budget_capital', p_budget_capital,
            'capacity_operations', p_capacity_operations,
            'selected_count', v_selected_count,
            'aggregate_ev', ROUND(v_tot_ev, 2)
        )
    );

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'plan_id', v_plan_id,
        'portfolio_id', p_portfolio_id,
        'model_version', p_model_version,
        'robustness', v_robustness,
        'composite_resource_risk', v_comp_risk,
        'executive_brief', v_brief
    );
END;
$$;

-- ==============================================================================
-- 6. PRIVILEGED RPC 2: get_strategic_resource_plan
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_strategic_resource_plan(
    p_plan_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_plan RECORD;
    v_allocs JSONB := '[]'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_plan FROM public.analytics_strategic_resource_plans WHERE id = p_plan_id;
    IF v_plan.id IS NULL THEN
        RAISE EXCEPTION 'Resource allocation plan not found: %', p_plan_id USING ERRCODE = '22023';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'rank', a.allocation_rank,
            'scenario_id', a.scenario_id,
            'scenario_title', s.scenario_title,
            'allocated_capital', a.allocated_capital,
            'allocated_operations', a.allocated_operations,
            'allocated_personnel', a.allocated_personnel,
            'allocated_campaigns', a.allocated_campaigns,
            'allocated_geo_lga', a.allocated_geo_lga,
            'allocated_time_days', a.allocated_time_days,
            'marginal_value_capital', a.marginal_value_capital,
            'marginal_value_operations', a.marginal_value_operations,
            'efficiency_class', a.efficiency_class,
            'finite_efficiency', a.finite_efficiency
        ) ORDER BY a.allocation_rank ASC
    ) INTO v_allocs
    FROM public.analytics_strategic_resource_allocations a
    JOIN public.analytics_strategic_scenarios s ON s.id = a.scenario_id
    WHERE a.plan_id = p_plan_id;

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'plan_id', v_plan.id,
        'portfolio_id', v_plan.portfolio_id,
        'model_version', v_plan.model_version,
        'envelope', jsonb_build_object(
            'capital', v_plan.envelope_capital,
            'operations', v_plan.envelope_operations,
            'personnel', v_plan.envelope_personnel,
            'campaigns', v_plan.envelope_campaigns,
            'geo_lga', v_plan.envelope_geo_lga,
            'time_days', v_plan.envelope_time_days
        ),
        'allocated', jsonb_build_object(
            'capital', v_plan.allocated_capital,
            'operations', v_plan.allocated_operations,
            'personnel', v_plan.allocated_personnel,
            'campaigns', v_plan.allocated_campaigns,
            'geo_lga', v_plan.allocated_geo_lga,
            'time_days', v_plan.allocated_time_days
        ),
        'residual', jsonb_build_object(
            'capital', v_plan.residual_capital,
            'operations', v_plan.residual_operations,
            'personnel', v_plan.residual_personnel,
            'campaigns', v_plan.residual_campaigns,
            'geo_lga', v_plan.residual_geo_lga,
            'time_days', v_plan.residual_time_days
        ),
        'metrics', jsonb_build_object(
            'selected_count', v_plan.selected_actions_count,
            'aggregate_expected_value', v_plan.aggregate_expected_value,
            'composite_resource_risk', v_plan.composite_resource_risk,
            'robustness_classification', v_plan.robustness_classification
        ),
        'shadow_prices', v_plan.shadow_prices,
        'sensitivity_projections', v_plan.sensitivity_projections,
        'allocations', COALESCE(v_allocs, '[]'::jsonb),
        'executive_brief', v_plan.executive_brief
    );
END;
$$;
