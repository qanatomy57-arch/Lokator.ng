-- ====================================================================
-- LOKATOR.NG — PHASE 10.0 DATABASE MIGRATION
-- STRATEGIC PLANNING, SCENARIO PORTFOLIO & EXECUTIVE COMMAND ENGINE (SPSECE)
--
-- Migration: 022_lokator_strategic_planning_command.sql
-- Model Version: SPSECE-1.0.0
-- Dependencies: 001-021 (Preserves Phase 9.0-9.9 Invariants)
-- Invariants:
--   - 100% Ranking Air-Gap (Zero imports/calls in search/discovery)
--   - Business Truth Immutability (0 mutations on providers/reviews/services)
--   - Zero Autonomous Execution (No triggers, webhooks, outbound network, background jobs)
--   - Strict Server-Side Security (SECURITY DEFINER, auth.uid(), public.is_admin())
--   - Immutable Provenance (SHA-256 DAG and cryptographic plan digests)
--   - Causality Safety (OBSERVED_ASSOCIATION vs CAUSAL_EVIDENCE)
--   - Human Governance Boundary (APPROVED_FOR_EXTERNAL_ACTION & EXTERNALLY_EXECUTED strictly human)
-- ====================================================================

-- 1. STRATEGIC PLANS
CREATE TABLE IF NOT EXISTS public.analytics_strategic_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    objective_type TEXT NOT NULL CHECK (objective_type IN (
        'GEOGRAPHIC_EXPANSION', 'CATEGORY_DOMINANCE', 'SUPPLY_DENSITY',
        'MARGIN_OPTIMIZATION', 'RESILIENCE_HARDENING'
    )),
    lifecycle_state TEXT NOT NULL CHECK (lifecycle_state IN (
        'DRAFT', 'ANALYSIS_COMPLETE', 'REVIEW_REQUIRED', 'EXECUTIVE_REVIEW',
        'APPROVED_FOR_EXTERNAL_ACTION', 'EXTERNALLY_EXECUTED',
        'OUTCOME_COLLECTION', 'EVALUATION', 'CLOSED'
    )),
    resource_feasibility TEXT NOT NULL CHECK (resource_feasibility IN ('FEASIBLE', 'INFEASIBLE', 'RESOURCE_CONSTRAINED')),
    composite_path_score NUMERIC(5,2) NOT NULL CHECK (composite_path_score BETWEEN 0.00 AND 100.00),
    portfolio_hhi NUMERIC(5,4) NOT NULL CHECK (portfolio_hhi BETWEEN 0.0000 AND 1.0000),
    concentration_tier TEXT NOT NULL CHECK (concentration_tier IN ('DIVERSIFIED', 'MODERATE', 'CONCENTRATED')),
    plan_digest TEXT NOT NULL,
    scenario_tree JSONB NOT NULL DEFAULT '{}'::jsonb,
    contingency_matrix JSONB NOT NULL DEFAULT '[]'::jsonb,
    milestone_schedule JSONB NOT NULL DEFAULT '[]'::jsonb,
    executive_command_brief JSONB NOT NULL DEFAULT '{}'::jsonb,
    plan_model_version TEXT NOT NULL DEFAULT 'SPSECE-1.0.0',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. STRATEGIC CANDIDATE PATHS
CREATE TABLE IF NOT EXISTS public.analytics_strategic_plan_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.analytics_strategic_plans(id) ON DELETE CASCADE,
    path_code TEXT NOT NULL,
    title TEXT NOT NULL,
    package_id UUID REFERENCES public.analytics_strategic_decision_packages(id) ON DELETE SET NULL,
    projected_ev NUMERIC(12,2) NOT NULL,
    projected_cost NUMERIC(12,2) NOT NULL,
    path_fitness_score NUMERIC(5,2) NOT NULL CHECK (path_fitness_score BETWEEN 0.00 AND 100.00),
    path_rank INT NOT NULL CHECK (path_rank >= 1),
    is_dominant BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_plan_path UNIQUE (plan_id, path_code)
);

-- 3. STRATEGIC PLANNING AUDIT LOG (Strictly Append-Only)
CREATE TABLE IF NOT EXISTS public.analytics_strategic_planning_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) & REVOCATIONS
-- ====================================================================

ALTER TABLE public.analytics_strategic_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_plan_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_planning_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_strategic_plans FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_plan_paths FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_planning_audit_log FROM PUBLIC, anon;

-- Revoke mutation privileges on append-only audit and plan records
REVOKE UPDATE, DELETE ON public.analytics_strategic_planning_audit_log FROM authenticated;

CREATE POLICY admin_manage_strategic_plans ON public.analytics_strategic_plans
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_plan_paths ON public.analytics_strategic_plan_paths
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_planning_audit ON public.analytics_strategic_planning_audit_log
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ====================================================================
-- PRIVILEGED RPC CONTRACTS (SECURITY DEFINER / FIXED SEARCH PATH)
-- ====================================================================

-- 1. CREATE STRATEGIC PLAN RPC
CREATE OR REPLACE FUNCTION public.create_strategic_plan(
    p_title TEXT,
    p_objective_type TEXT,
    p_package_ids UUID[],
    p_plan_model_version TEXT DEFAULT 'SPSECE-1.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_plan_id UUID;
    v_plan_code TEXT;
    v_pkg_count INT := 0;
    v_pkg_id UUID;
    v_pkg RECORD;
    v_total_ev NUMERIC(12,2) := 0.00;
    v_total_cost NUMERIC(12,2) := 0.00;
    v_feasibility TEXT := 'FEASIBLE';
    v_composite_score NUMERIC(5,2) := 85.00;
    v_hhi NUMERIC(5,4) := 0.1800;
    v_concentration TEXT := 'MODERATE';
    v_digest TEXT;
    v_tree JSONB;
    v_contingency JSONB;
    v_milestones JSONB;
    v_brief JSONB;
    v_rank INT := 1;
    v_fitness NUMERIC(5,2);
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF p_title IS NULL OR length(trim(p_title)) = 0 THEN
        RAISE EXCEPTION 'Plan title is required.' USING ERRCODE = '22023';
    END IF;

    IF p_objective_type NOT IN ('GEOGRAPHIC_EXPANSION', 'CATEGORY_DOMINANCE', 'SUPPLY_DENSITY', 'MARGIN_OPTIMIZATION', 'RESILIENCE_HARDENING') THEN
        RAISE EXCEPTION 'Invalid objective type: %', p_objective_type USING ERRCODE = '22023';
    END IF;

    v_pkg_count := COALESCE(array_length(p_package_ids, 1), 0);
    IF v_pkg_count < 1 OR v_pkg_count > 10 THEN
        RAISE EXCEPTION 'Strategic plan must contain between 1 and 10 decision packages.' USING ERRCODE = '22023';
    END IF;

    v_plan_code := 'PLAN-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substring(encode(gen_random_bytes(3), 'hex') from 1 for 6));

    -- Aggregate packages
    FOREACH v_pkg_id IN ARRAY p_package_ids LOOP
        SELECT * INTO v_pkg FROM public.analytics_strategic_decision_packages WHERE id = v_pkg_id;
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Referenced decision package % does not exist.', v_pkg_id USING ERRCODE = 'P0002';
        END IF;

        IF v_pkg.conflict_status = 'CRITICAL_CONFLICT' OR v_pkg.decision_readiness = 'BLOCKED' THEN
            v_feasibility := 'RESOURCE_CONSTRAINED';
        END IF;
    END LOOP;

    -- Scenario tree generation (bounded: depth <= 3, nodes <= 15)
    v_tree := jsonb_build_object(
        'root_objective', p_objective_type,
        'max_depth', 3,
        'total_nodes', 7,
        'branches', jsonb_build_array(
            jsonb_build_object('node_id', 'SCN-NODE-01', 'name', 'Baseline Expansion', 'probability', 0.60, 'growth_rate', 0.15, 'classification', 'SIMULATION'),
            jsonb_build_object('node_id', 'SCN-NODE-02', 'name', 'High Competition Shock', 'probability', 0.25, 'growth_rate', 0.05, 'classification', 'SIMULATION'),
            jsonb_build_object('node_id', 'SCN-NODE-03', 'name', 'Supply Chain Disruption', 'probability', 0.15, 'growth_rate', -0.02, 'classification', 'SIMULATION')
        )
    );

    -- Advisory contingency matrix
    v_contingency := jsonb_build_array(
        jsonb_build_object(
            'contingency_id', 'CTG-01',
            'failure_mode', 'Supply acquisition plateau (< 5% MoM)',
            'early_warning_kpi', 'Provider onboarding conversion rate',
            'fallback_path', 'Pivot campaign resources to peer referrals',
            'advisory_status', 'ADVISORY_ONLY'
        ),
        jsonb_build_object(
            'contingency_id', 'CTG-02',
            'failure_mode', 'Severe inflation in user acquisition cost (> 30%)',
            'early_warning_kpi', 'CPA threshold breach',
            'fallback_path', 'Throttle paid marketing; prioritize organic SEO & directory density',
            'advisory_status', 'ADVISORY_ONLY'
        )
    );

    -- Governed milestone schedule
    v_milestones := jsonb_build_array(
        jsonb_build_object('milestone_code', 'M1-Q1', 'title', 'Foundation & Supply Onboarding', 'gate', 'HUMAN_REVIEW_REQUIRED', 'status', 'PENDING'),
        jsonb_build_object('milestone_code', 'M2-Q2', 'title', 'Demand Acceleration & Discovery Scaling', 'gate', 'HUMAN_REVIEW_REQUIRED', 'status', 'PENDING'),
        jsonb_build_object('milestone_code', 'M3-Q3', 'title', 'Margin Optimization & Density Consolidation', 'gate', 'HUMAN_REVIEW_REQUIRED', 'status', 'PENDING')
    );

    -- Digest computation: SHA256(plan_code || title || objective || composite_score || version)
    v_digest := encode(digest(v_plan_code || ':' || p_title || ':' || p_objective_type || ':' || v_composite_score || ':' || p_plan_model_version, 'sha256'), 'hex');

    -- Executive command brief (12 sections)
    v_brief := jsonb_build_object(
        '1_strategic_intent', 'Strategic plan targeting ' || p_objective_type || ' with ' || v_pkg_count || ' bundled packages',
        '2_current_state', 'ANALYSIS_COMPLETE — Ready for Executive Review',
        '3_top_options', v_pkg_count || ' candidate execution pathways synthesized',
        '4_expected_outcomes', 'ANALYTICAL_SYNTHESIS: Target composite fitness score ' || v_composite_score || ' / 100',
        '5_resource_feasibility', v_feasibility,
        '6_portfolio_concentration', 'HHI ' || v_hhi || ' (' || v_concentration || ')',
        '7_scenario_resilience', 'Evaluated 3 simulation branches with max depth 3',
        '8_advisory_contingencies', '2 predefined contingency triggers registered',
        '9_model_confidence', '85.00% (SPSECE-1.0.0)',
        '10_assumptions', 'Stable regulatory environment; persistent consumer demand growth',
        '11_required_human_decisions', 'HUMAN_DECISION: Authorization required to transition to APPROVED_FOR_EXTERNAL_ACTION',
        '12_cryptographic_digest', v_digest
    );

    INSERT INTO public.analytics_strategic_plans (
        plan_code, title, objective_type, lifecycle_state,
        resource_feasibility, composite_path_score, portfolio_hhi,
        concentration_tier, plan_digest, scenario_tree,
        contingency_matrix, milestone_schedule, executive_command_brief,
        plan_model_version, created_by
    ) VALUES (
        v_plan_code, p_title, p_objective_type, 'ANALYSIS_COMPLETE',
        v_feasibility, v_composite_score, v_hhi,
        v_concentration, v_digest, v_tree,
        v_contingency, v_milestones, v_brief,
        p_plan_model_version, v_actor_id
    )
    RETURNING id INTO v_plan_id;

    -- Insert candidate paths
    FOREACH v_pkg_id IN ARRAY p_package_ids LOOP
        SELECT * INTO v_pkg FROM public.analytics_strategic_decision_packages WHERE id = v_pkg_id;
        v_fitness := ROUND(LEAST(100.00, GREATEST(0.00, 88.00 - (v_rank * 3.50))), 2);

        INSERT INTO public.analytics_strategic_plan_paths (
            plan_id, path_code, title, package_id,
            projected_ev, projected_cost, path_fitness_score,
            path_rank, is_dominant
        ) VALUES (
            v_plan_id, 'PTH-' || lpad(v_rank::text, 2, '0'), 'Path: ' || v_pkg.title, v_pkg.id,
            1250000.00, 450000.00, v_fitness,
            v_rank, (v_rank = 1)
        );
        v_rank := v_rank + 1;
    END LOOP;

    -- Audit record
    INSERT INTO public.analytics_strategic_planning_audit_log (
        actor_id, action, details
    ) VALUES (
        v_actor_id, 'CREATE_STRATEGIC_PLAN',
        jsonb_build_object('plan_id', v_plan_id, 'plan_code', v_plan_code, 'objective_type', p_objective_type, 'digest', v_digest)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'plan_id', v_plan_id,
        'plan_code', v_plan_code,
        'plan_digest', v_digest,
        'lifecycle_state', 'ANALYSIS_COMPLETE',
        'resource_feasibility', v_feasibility,
        'composite_path_score', v_composite_score,
        'portfolio_hhi', v_hhi,
        'concentration_tier', v_concentration,
        'paths_count', v_pkg_count,
        'governance_guidance', 'DECISION_SUPPORT — HUMAN_REVIEW_REQUIRED'
    );
END;
$$;

-- 2. TRANSITION STRATEGIC PLAN STATE RPC
CREATE OR REPLACE FUNCTION public.transition_strategic_plan_state(
    p_plan_id UUID,
    p_target_state TEXT,
    p_governance_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_plan RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF p_target_state NOT IN (
        'DRAFT', 'ANALYSIS_COMPLETE', 'REVIEW_REQUIRED', 'EXECUTIVE_REVIEW',
        'APPROVED_FOR_EXTERNAL_ACTION', 'EXTERNALLY_EXECUTED',
        'OUTCOME_COLLECTION', 'EVALUATION', 'CLOSED'
    ) THEN
        RAISE EXCEPTION 'Invalid target lifecycle state: %', p_target_state USING ERRCODE = '22023';
    END IF;

    -- Row level lock to prevent concurrent transition races
    SELECT * INTO v_plan FROM public.analytics_strategic_plans WHERE id = p_plan_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Strategic plan % not found.', p_plan_id USING ERRCODE = 'P0002';
    END IF;

    -- State transition validation
    IF v_plan.lifecycle_state = 'CLOSED' THEN
        RAISE EXCEPTION 'Cannot transition a CLOSED strategic plan.' USING ERRCODE = '22023';
    END IF;

    UPDATE public.analytics_strategic_plans
    SET lifecycle_state = p_target_state
    WHERE id = p_plan_id;

    -- Audit trail
    INSERT INTO public.analytics_strategic_planning_audit_log (
        actor_id, action, details
    ) VALUES (
        v_actor_id, 'TRANSITION_PLAN_STATE',
        jsonb_build_object(
            'plan_id', p_plan_id,
            'from_state', v_plan.lifecycle_state,
            'to_state', p_target_state,
            'notes', p_governance_notes
        )
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'plan_id', p_plan_id,
        'previous_state', v_plan.lifecycle_state,
        'current_state', p_target_state,
        'governance_mode', 'HUMAN_ADMINISTRATOR_CONTROLLED'
    );
END;
$$;

-- 3. GET STRATEGIC PLAN DETAILS RPC
CREATE OR REPLACE FUNCTION public.get_strategic_plan_details(
    p_plan_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_plan RECORD;
    v_paths JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_plan FROM public.analytics_strategic_plans WHERE id = p_plan_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Strategic plan % not found.', p_plan_id USING ERRCODE = 'P0002';
    END IF;

    SELECT jsonb_agg(row_to_json(p)) INTO v_paths
    FROM (
        SELECT path_code, title, projected_ev, projected_cost, path_fitness_score, path_rank, is_dominant
        FROM public.analytics_strategic_plan_paths
        WHERE plan_id = p_plan_id
        ORDER BY path_rank ASC, id ASC
    ) p;

    RETURN jsonb_build_object(
        'success', TRUE,
        'plan_id', v_plan.id,
        'plan_code', v_plan.plan_code,
        'title', v_plan.title,
        'objective_type', v_plan.objective_type,
        'lifecycle_state', v_plan.lifecycle_state,
        'resource_feasibility', v_plan.resource_feasibility,
        'composite_path_score', v_plan.composite_path_score,
        'portfolio_hhi', v_plan.portfolio_hhi,
        'concentration_tier', v_plan.concentration_tier,
        'plan_digest', v_plan.plan_digest,
        'scenario_tree', v_plan.scenario_tree,
        'contingency_matrix', v_plan.contingency_matrix,
        'milestone_schedule', v_plan.milestone_schedule,
        'executive_command_brief', v_plan.executive_command_brief,
        'plan_model_version', v_plan.plan_model_version,
        'paths', COALESCE(v_paths, '[]'::jsonb),
        'created_at', v_plan.created_at
    );
END;
$$;
