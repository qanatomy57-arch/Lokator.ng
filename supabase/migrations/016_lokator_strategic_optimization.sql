-- ==============================================================================
-- LOKATOR.NG — PHASE 9.4 DATABASE MIGRATION
-- STRATEGIC OPTIMIZATION & PORTFOLIO ALLOCATION ENGINE (SOPAE)
-- Migration: 016_lokator_strategic_optimization.sql
--
-- INVARIANTS ENFORCED:
-- 1. OBSERVATIONAL & DECISION-SUPPORT ONLY — Zero autonomous marketplace execution.
-- 2. RANKING AIR-GAP — Live search ranking in search.js is 100% isolated.
-- 3. BUSINESS TRUTH IMMUTABILITY — Zero mutations against public.providers, reviews, or provider_services.
-- 4. ACCEPTED != EXECUTED — Portfolio recommendations are strictly advisory projections.
-- 5. DETERMINISM — Sorts strictly by efficiency_class, finite_efficiency, ev, risk, conf, scenario_id.
-- 6. SECURITY DEFINER HARDENING — Fixed search_path and server-side public.is_admin() validation.
-- 7. MODEL VERSIONING — Validates 'SOPAE-1.0.0'.
-- ==============================================================================

-- 1. PORTFOLIOS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_optimization_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_version TEXT NOT NULL DEFAULT 'SOPAE-1.0.0',
    max_budget_constraint NUMERIC(10,2) NOT NULL,
    max_risk_constraint NUMERIC(5,2) NOT NULL,
    max_actions_constraint INT NOT NULL,
    aggregate_expected_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    aggregate_risk NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    total_cost NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    selected_actions_count INT NOT NULL DEFAULT 0,
    executive_brief JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. ALLOCATIONS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_optimization_allocations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.analytics_strategic_optimization_portfolios(id) ON DELETE CASCADE,
    scenario_id UUID NOT NULL REFERENCES public.analytics_strategic_scenarios(id) ON DELETE CASCADE,
    allocation_rank INT NOT NULL,
    base_cost NUMERIC(10,2) NOT NULL,
    base_expected_value NUMERIC(10,2) NOT NULL,
    base_risk NUMERIC(5,2) NOT NULL,
    overlap_penalty NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
    adjusted_expected_value NUMERIC(10,2) NOT NULL,
    efficiency_class INT NOT NULL,
    finite_efficiency NUMERIC(10,4) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_portfolio_scenario UNIQUE (portfolio_id, scenario_id)
);

-- 3. AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_optimization_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES public.analytics_strategic_optimization_portfolios(id) ON DELETE SET NULL,
    actor_id UUID NOT NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ROW LEVEL SECURITY & PERMISSIONS
ALTER TABLE public.analytics_strategic_optimization_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_optimization_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_optimization_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_strategic_optimization_portfolios FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_optimization_allocations FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_optimization_audit_log FROM PUBLIC, anon;

-- Immutable audit
REVOKE UPDATE, DELETE ON public.analytics_strategic_optimization_audit_log FROM authenticated;

-- Admin policies
CREATE POLICY admin_manage_portfolios ON public.analytics_strategic_optimization_portfolios
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_allocations ON public.analytics_strategic_optimization_allocations
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_opt_audit ON public.analytics_strategic_optimization_audit_log
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- ==============================================================================
-- 5. PRIVILEGED RPC 1: generate_strategic_portfolio_allocation
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.generate_strategic_portfolio_allocation(
    p_model_version TEXT DEFAULT 'SOPAE-1.0.0',
    p_max_budget NUMERIC DEFAULT 100.00,
    p_max_risk NUMERIC DEFAULT 65.00,
    p_max_actions INT DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_portfolio_id UUID;
    v_total_cost NUMERIC := 0.00;
    v_total_ev NUMERIC := 0.00;
    v_total_risk NUMERIC := 0.00;
    v_selected_count INT := 0;
    v_avg_risk NUMERIC := 0.00;
    v_cand RECORD;
    v_eff_class INT;
    v_fin_eff NUMERIC;
    v_overlap_penalty NUMERIC;
    v_adjusted_ev NUMERIC;
    v_overlap_cat NUMERIC;
    v_overlap_geo NUMERIC;
    v_overlap_act NUMERIC;
    v_overlap_obj NUMERIC;
    v_max_overlap NUMERIC;
    v_selected_cands JSONB := '[]'::jsonb;
    v_sel RECORD;
    v_brief JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request. Server session required.' USING ERRCODE = '42501';
    END IF;

    IF p_model_version != 'SOPAE-1.0.0' THEN
        RAISE EXCEPTION 'Unsupported SOPAE model version: %', p_model_version USING ERRCODE = '22023';
    END IF;

    IF p_max_budget < 0 THEN
        RAISE EXCEPTION 'Invalid constraint: max_budget cannot be negative.' USING ERRCODE = '22023';
    END IF;

    -- Create portfolio record (draft state)
    INSERT INTO public.analytics_strategic_optimization_portfolios (
        model_version, max_budget_constraint, max_risk_constraint, max_actions_constraint, created_by
    ) VALUES (
        p_model_version, p_max_budget, p_max_risk, p_max_actions, v_actor_id
    ) RETURNING id INTO v_portfolio_id;

    -- Gather Candidates from Phase 9.3
    DROP TABLE IF EXISTS pg_temp.temp_candidates;
    CREATE TEMP TABLE pg_temp.temp_candidates (
        scenario_id UUID,
        scenario_title TEXT,
        action_category TEXT,
        category TEXT,
        state TEXT,
        lga TEXT,
        decision_id UUID,
        ev NUMERIC,
        risk NUMERIC,
        conf NUMERIC,
        cost NUMERIC,
        eff_class INT,
        fin_eff NUMERIC
    );

    FOR v_cand IN
        SELECT 
            s.id AS scenario_id,
            s.scenario_title,
            s.action_category,
            s.category,
            s.state,
            s.lga,
            s.decision_id,
            r.expected_strategic_value AS ev,
            r.strategic_risk_score AS risk,
            r.forecast_confidence AS conf,
            COALESCE(i.target_capacity_addition, 0.00) AS cost
        FROM public.analytics_strategic_scenarios s
        JOIN public.analytics_strategic_scenario_results r ON r.scenario_id = s.id
        JOIN public.analytics_strategic_scenario_inputs i ON i.scenario_id = s.id
        WHERE s.scenario_status = 'SIMULATED'
        LIMIT 100 -- Resource bounding N <= 100
    LOOP
        IF v_cand.cost < 0 THEN
            v_eff_class := -1;
            v_fin_eff := 0.00;
        ELSIF v_cand.cost = 0 AND v_cand.ev > 0 THEN
            v_eff_class := 2;
            v_fin_eff := 0.00;
        ELSIF v_cand.cost = 0 AND v_cand.ev = 0 THEN
            v_eff_class := 0;
            v_fin_eff := 0.00;
        ELSE
            v_eff_class := 1;
            v_fin_eff := v_cand.ev / v_cand.cost;
        END IF;

        IF v_eff_class >= 0 THEN
            INSERT INTO pg_temp.temp_candidates (
                scenario_id, scenario_title, action_category, category, state, lga, decision_id,
                ev, risk, conf, cost, eff_class, fin_eff
            ) VALUES (
                v_cand.scenario_id, v_cand.scenario_title, v_cand.action_category, v_cand.category, v_cand.state, v_cand.lga, v_cand.decision_id,
                v_cand.ev, v_cand.risk, v_cand.conf, v_cand.cost, v_eff_class, v_fin_eff
            );
        END IF;
    END LOOP;

    -- Greedy Knapsack with Dynamic Overlap Penalty
    -- We iteratively pick the best remaining candidate, computing overlaps against already picked.
    -- To do this purely dynamically without an N^2 repeated SELECT, we can loop v_selected_count times (up to max_actions).
    
    WHILE v_selected_count < p_max_actions LOOP
        DECLARE
            v_best_cand pg_temp.temp_candidates%ROWTYPE;
            v_best_adjusted_ev NUMERIC := -9999.00;
            v_best_eff_class INT := -999;
            v_best_fin_eff NUMERIC := -9999.00;
            v_best_penalty NUMERIC := 0.00;
            v_found BOOLEAN := false;
        BEGIN
            FOR v_cand IN 
                SELECT * FROM pg_temp.temp_candidates 
                WHERE scenario_id NOT IN (SELECT scenario_id FROM public.analytics_strategic_optimization_allocations WHERE portfolio_id = v_portfolio_id)
            LOOP
                -- 1. Check Cost Constraint
                IF v_total_cost + v_cand.cost > p_max_budget THEN
                    CONTINUE;
                END IF;

                -- 2. Check Risk Constraint
                IF v_selected_count + 1 > 0 THEN
                    IF (v_total_risk + v_cand.risk) / (v_selected_count + 1) > p_max_risk THEN
                        CONTINUE;
                    END IF;
                END IF;

                -- 3. Calculate Overlap Penalty
                v_max_overlap := 0.00;
                FOR v_sel IN SELECT * FROM public.analytics_strategic_optimization_allocations a JOIN pg_temp.temp_candidates t ON a.scenario_id = t.scenario_id WHERE a.portfolio_id = v_portfolio_id LOOP
                    v_overlap_cat := CASE WHEN v_cand.category = v_sel.category THEN 1.00 ELSE 0.00 END;
                    v_overlap_geo := CASE WHEN v_cand.state = v_sel.state AND v_cand.lga = v_sel.lga THEN 1.00 ELSE 0.00 END;
                    v_overlap_act := CASE WHEN v_cand.action_category = v_sel.action_category THEN 1.00 ELSE 0.00 END;
                    v_overlap_obj := CASE WHEN COALESCE(v_cand.decision_id::text, '') = COALESCE(v_sel.decision_id::text, '') AND v_cand.decision_id IS NOT NULL THEN 1.00 ELSE 0.00 END;
                    
                    v_overlap_penalty := (0.40 * v_overlap_cat) + (0.40 * v_overlap_geo) + (0.10 * v_overlap_act) + (0.10 * v_overlap_obj);
                    IF v_overlap_penalty > v_max_overlap THEN
                        v_max_overlap := v_overlap_penalty;
                    END IF;
                END LOOP;

                v_adjusted_ev := v_cand.ev * (1.00 - v_max_overlap);

                -- Adjust efficiency for comparison
                DECLARE
                    v_adj_eff_class INT := v_cand.eff_class;
                    v_adj_fin_eff NUMERIC := v_cand.fin_eff;
                BEGIN
                    IF v_cand.cost > 0 THEN
                        v_adj_fin_eff := v_adjusted_ev / v_cand.cost;
                    END IF;

                    -- Tie breaker comparison (Deterministic)
                    IF NOT v_found OR 
                       v_adj_eff_class > v_best_eff_class OR
                       (v_adj_eff_class = v_best_eff_class AND v_adj_fin_eff > v_best_fin_eff) OR
                       (v_adj_eff_class = v_best_eff_class AND v_adj_fin_eff = v_best_fin_eff AND v_adjusted_ev > v_best_adjusted_ev) OR
                       (v_adj_eff_class = v_best_eff_class AND v_adj_fin_eff = v_best_fin_eff AND v_adjusted_ev = v_best_adjusted_ev AND v_cand.risk < v_best_cand.risk) OR
                       (v_adj_eff_class = v_best_eff_class AND v_adj_fin_eff = v_best_fin_eff AND v_adjusted_ev = v_best_adjusted_ev AND v_cand.risk = v_best_cand.risk AND v_cand.conf > v_best_cand.conf) OR
                       (v_adj_eff_class = v_best_eff_class AND v_adj_fin_eff = v_best_fin_eff AND v_adjusted_ev = v_best_adjusted_ev AND v_cand.risk = v_best_cand.risk AND v_cand.conf = v_best_cand.conf AND v_cand.scenario_id < v_best_cand.scenario_id)
                    THEN
                        v_found := true;
                        v_best_cand := v_cand;
                        v_best_adjusted_ev := v_adjusted_ev;
                        v_best_eff_class := v_adj_eff_class;
                        v_best_fin_eff := v_adj_fin_eff;
                        v_best_penalty := v_max_overlap;
                    END IF;
                END;
            END LOOP;

            IF NOT v_found THEN
                EXIT; -- No more valid candidates
            END IF;

            -- Add best to portfolio
            v_selected_count := v_selected_count + 1;
            v_total_cost := v_total_cost + v_best_cand.cost;
            v_total_ev := v_total_ev + v_best_adjusted_ev;
            v_total_risk := v_total_risk + v_best_cand.risk;

            INSERT INTO public.analytics_strategic_optimization_allocations (
                portfolio_id, scenario_id, allocation_rank, base_cost, base_expected_value, base_risk,
                overlap_penalty, adjusted_expected_value, efficiency_class, finite_efficiency
            ) VALUES (
                v_portfolio_id, v_best_cand.scenario_id, v_selected_count, v_best_cand.cost, v_best_cand.ev, v_best_cand.risk,
                v_best_penalty, v_best_adjusted_ev, v_best_eff_class, v_best_fin_eff
            );

        END;
    END LOOP;

    IF v_selected_count > 0 THEN
        v_avg_risk := v_total_risk / v_selected_count;
    END IF;

    -- Generate Brief
    v_brief := jsonb_build_object(
        'classification', 'DECISION_SUPPORT_RECOMMENDATION',
        'headline', format('Optimized %s strategic actions for €%s', v_selected_count, v_total_cost),
        'aggregate_expected_value', ROUND(v_total_ev, 2),
        'aggregate_risk', ROUND(v_avg_risk, 2),
        'disclaimer', 'RECOMMENDED/SIMULATED ONLY — MANUAL_ACTION_REQUIRED. NOT EXECUTED.'
    );

    UPDATE public.analytics_strategic_optimization_portfolios SET
        aggregate_expected_value = ROUND(v_total_ev, 2),
        aggregate_risk = ROUND(v_avg_risk, 2),
        total_cost = ROUND(v_total_cost, 2),
        selected_actions_count = v_selected_count,
        executive_brief = v_brief
    WHERE id = v_portfolio_id;

    INSERT INTO public.analytics_strategic_optimization_audit_log (
        portfolio_id, actor_id, action, details
    ) VALUES (
        v_portfolio_id, v_actor_id, 'GENERATE_PORTFOLIO',
        jsonb_build_object('max_budget', p_max_budget, 'max_risk', p_max_risk, 'max_actions', p_max_actions)
    );

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'portfolio_id', v_portfolio_id,
        'model_version', p_model_version,
        'executive_brief', v_brief
    );
END;
$$;

-- ==============================================================================
-- 6. PRIVILEGED RPC 2: get_strategic_portfolio
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_strategic_portfolio(
    p_portfolio_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_port RECORD;
    v_allocs JSONB := '[]'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_port FROM public.analytics_strategic_optimization_portfolios WHERE id = p_portfolio_id;
    IF v_port.id IS NULL THEN
        RAISE EXCEPTION 'Portfolio not found.' USING ERRCODE = '22023';
    END IF;

    SELECT jsonb_agg(
        jsonb_build_object(
            'rank', a.allocation_rank,
            'scenario_id', a.scenario_id,
            'scenario_title', s.scenario_title,
            'base_cost', a.base_cost,
            'adjusted_ev', a.adjusted_expected_value,
            'overlap_penalty', a.overlap_penalty,
            'efficiency_class', a.efficiency_class,
            'finite_efficiency', a.finite_efficiency
        ) ORDER BY a.allocation_rank ASC
    ) INTO v_allocs
    FROM public.analytics_strategic_optimization_allocations a
    JOIN public.analytics_strategic_scenarios s ON s.id = a.scenario_id
    WHERE a.portfolio_id = p_portfolio_id;

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'portfolio_id', v_port.id,
        'model_version', v_port.model_version,
        'metrics', jsonb_build_object(
            'total_cost', v_port.total_cost,
            'aggregate_expected_value', v_port.aggregate_expected_value,
            'aggregate_risk', v_port.aggregate_risk,
            'selected_count', v_port.selected_actions_count
        ),
        'allocations', COALESCE(v_allocs, '[]'::jsonb),
        'executive_brief', v_port.executive_brief
    );
END;
$$;
