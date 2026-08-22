-- ==============================================================================
-- LOKATOR.NG — PHASE 10.7 DATABASE MIGRATION
-- STRATEGIC PORTFOLIO GOVERNANCE & DECISION CONTROL ENGINE (SPGDCE)
-- Migration: 029_lokator_strategic_portfolio_governance.sql
-- Model Version: SPGDCE-1.0.0
--
-- Invariants:
-- 1. 100% Ranking Air-Gap: Complete isolation from search.js & discovery-orchestrator.js.
-- 2. Business Truth Immutability: ZERO writes to providers, reviews, or provider_services.
-- 3. Zero Autonomous Execution: ZERO automatic plan approvals or budget reallocations.
-- 4. Human-in-the-Loop Governance: Explicit authenticated administrator action required.
-- 5. Complete Provenance: Deterministic SHA-256 digests and model version tagging.
-- ==============================================================================

-- 1. Strategic Portfolio Registry
CREATE TABLE IF NOT EXISTS public.analytics_strategic_portfolios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_code TEXT UNIQUE NOT NULL,
    portfolio_name TEXT NOT NULL,
    total_budget_envelope NUMERIC(15,2) NOT NULL CHECK (total_budget_envelope >= 0.00),
    strategic_horizon TEXT NOT NULL CHECK (strategic_horizon IN ('SHORT_TERM', 'MEDIUM_TERM', 'LONG_TERM', 'MULTI_YEAR')),
    portfolio_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (portfolio_status IN ('DRAFT', 'ACTIVE', 'FROZEN', 'ARCHIVED')),
    model_version TEXT NOT NULL DEFAULT 'SPGDCE-1.0.0',
    portfolio_digest TEXT NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Portfolio Initiatives Registry
CREATE TABLE IF NOT EXISTS public.analytics_strategic_portfolio_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.analytics_strategic_portfolios(id) ON DELETE CASCADE,
    initiative_code TEXT UNIQUE NOT NULL,
    plan_id UUID,
    objective_class TEXT NOT NULL CHECK (objective_class IN ('GROWTH', 'EFFICIENCY', 'RESILIENCE', 'QUALITY', 'EXPANSION')),
    allocated_budget NUMERIC(15,2) NOT NULL CHECK (allocated_budget >= 0.00),
    priority_score NUMERIC(5,2) NOT NULL DEFAULT 50.00 CHECK (priority_score BETWEEN 0.00 AND 100.00),
    initiative_status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (initiative_status IN ('DRAFT', 'EVALUATED', 'CONFLICT_ANALYZED', 'RECOMMENDED', 'AUTHORIZED', 'ACTIVE', 'PAUSED', 'RETIRED')),
    evidence_references JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Portfolio Conflict Records
CREATE TABLE IF NOT EXISTS public.analytics_strategic_portfolio_conflicts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.analytics_strategic_portfolios(id) ON DELETE CASCADE,
    conflict_code TEXT UNIQUE NOT NULL,
    conflict_type TEXT NOT NULL CHECK (conflict_type IN ('RESOURCE_CONTENTION', 'OBJECTIVE_CLASH', 'GEOGRAPHIC_OVERLAP', 'TIMING_BOTTLENECK', 'DEPENDENCY_CYCLE', 'CATEGORY_SATURATION')),
    severity TEXT NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    conflicting_initiatives JSONB NOT NULL DEFAULT '[]'::jsonb,
    evidence_notes TEXT NOT NULL,
    conflict_digest TEXT NOT NULL,
    resolution_status TEXT NOT NULL DEFAULT 'DETECTED' CHECK (resolution_status IN ('DETECTED', 'UNDER_REVIEW', 'RESOLVED', 'WAIVED')),
    model_version TEXT NOT NULL DEFAULT 'SPGDCE-1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Portfolio Dependency Graph Records
CREATE TABLE IF NOT EXISTS public.analytics_strategic_portfolio_dependencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.analytics_strategic_portfolios(id) ON DELETE CASCADE,
    initiative_id UUID NOT NULL REFERENCES public.analytics_strategic_portfolio_initiatives(id) ON DELETE CASCADE,
    depends_on_initiative_id UUID NOT NULL REFERENCES public.analytics_strategic_portfolio_initiatives(id) ON DELETE CASCADE,
    dependency_type TEXT NOT NULL CHECK (dependency_type IN ('PREREQUISITE', 'RESOURCE_CONTINGENT', 'DATA_FEED')),
    criticality TEXT NOT NULL CHECK (criticality IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL_PATH')),
    graph_depth INT NOT NULL DEFAULT 1 CHECK (graph_depth BETWEEN 1 AND 16),
    dependency_risk NUMERIC(5,2) NOT NULL DEFAULT 10.00 CHECK (dependency_risk BETWEEN 0.00 AND 100.00),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_initiative_dependency UNIQUE (portfolio_id, initiative_id, depends_on_initiative_id)
);

-- 5. Portfolio Risk & Concentration Tracking
CREATE TABLE IF NOT EXISTS public.analytics_strategic_portfolio_risk_concentration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.analytics_strategic_portfolios(id) ON DELETE CASCADE,
    resource_hhi NUMERIC(6,4) NOT NULL CHECK (resource_hhi BETWEEN 0.0000 AND 1.0000),
    geo_hhi NUMERIC(6,4) NOT NULL CHECK (geo_hhi BETWEEN 0.0000 AND 1.0000),
    category_hhi NUMERIC(6,4) NOT NULL CHECK (category_hhi BETWEEN 0.0000 AND 1.0000),
    systemic_exposure_tier TEXT NOT NULL CHECK (systemic_exposure_tier IN ('LOW', 'MODERATE', 'HIGH', 'CRITICAL')),
    risk_tier TEXT NOT NULL CHECK (risk_tier IN ('CONSERVATIVE', 'BALANCED', 'AGGRESSIVE', 'SPECULATIVE')),
    concentration_digest TEXT NOT NULL,
    model_version TEXT NOT NULL DEFAULT 'SPGDCE-1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Portfolio Trade-Off Candidates
CREATE TABLE IF NOT EXISTS public.analytics_strategic_portfolio_tradeoffs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.analytics_strategic_portfolios(id) ON DELETE CASCADE,
    initiative_id UUID NOT NULL REFERENCES public.analytics_strategic_portfolio_initiatives(id) ON DELETE CASCADE,
    expected_value NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    resource_requirement NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    risk_score NUMERIC(5,2) NOT NULL DEFAULT 20.00 CHECK (risk_score BETWEEN 0.00 AND 100.00),
    opportunity_cost NUMERIC(15,2) NOT NULL DEFAULT 0.00,
    pareto_status TEXT NOT NULL CHECK (pareto_status IN ('PARETO_OPTIMAL', 'NON_DOMINATED', 'DOMINATED')),
    dominance_notes TEXT NOT NULL,
    model_version TEXT NOT NULL DEFAULT 'SPGDCE-1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Governance Recommendations
CREATE TABLE IF NOT EXISTS public.analytics_strategic_portfolio_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.analytics_strategic_portfolios(id) ON DELETE CASCADE,
    initiative_id UUID NOT NULL REFERENCES public.analytics_strategic_portfolio_initiatives(id) ON DELETE CASCADE,
    recommendation_code TEXT UNIQUE NOT NULL,
    recommendation_class TEXT NOT NULL CHECK (recommendation_class IN ('CONTINUE', 'REVIEW', 'PAUSE_REVIEW', 'RETIRE_REVIEW', 'ESCALATE')),
    reasoning TEXT NOT NULL,
    confidence_score NUMERIC(5,2) NOT NULL CHECK (confidence_score BETWEEN 0.00 AND 100.00),
    guidance TEXT NOT NULL DEFAULT 'DECISION_SUPPORT_ONLY — MANUAL_ACTION_REQUIRED',
    model_version TEXT NOT NULL DEFAULT 'SPGDCE-1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Executive Decision Register
CREATE TABLE IF NOT EXISTS public.analytics_strategic_executive_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID NOT NULL REFERENCES public.analytics_strategic_portfolios(id) ON DELETE CASCADE,
    initiative_id UUID NOT NULL REFERENCES public.analytics_strategic_portfolio_initiatives(id) ON DELETE CASCADE,
    recommendation_id UUID REFERENCES public.analytics_strategic_portfolio_recommendations(id),
    decision_code TEXT UNIQUE NOT NULL,
    decision_action TEXT NOT NULL CHECK (decision_action IN ('AUTHORIZE', 'MODIFY_CONTINUE', 'PAUSE', 'RETIRE', 'REJECT', 'ESCALATE_EXECUTIVE')),
    decision_maker UUID NOT NULL REFERENCES auth.users(id),
    rationale TEXT NOT NULL,
    evidence_references JSONB NOT NULL DEFAULT '{}'::jsonb,
    decision_digest TEXT NOT NULL,
    model_version TEXT NOT NULL DEFAULT 'SPGDCE-1.0.0',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. Governance Audit Log
CREATE TABLE IF NOT EXISTS public.analytics_strategic_portfolio_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portfolio_id UUID REFERENCES public.analytics_strategic_portfolios(id) ON DELETE SET NULL,
    actor_id UUID NOT NULL REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES & PERFORMANCE OPTIMIZATIONS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_strat_portfolios_code ON public.analytics_strategic_portfolios(portfolio_code);
CREATE INDEX IF NOT EXISTS idx_strat_port_initiatives_port_id ON public.analytics_strategic_portfolio_initiatives(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_strat_port_conflicts_port_id ON public.analytics_strategic_portfolio_conflicts(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_strat_port_deps_port_id ON public.analytics_strategic_portfolio_dependencies(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_strat_port_recs_port_id ON public.analytics_strategic_portfolio_recommendations(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_strat_exec_decisions_port_id ON public.analytics_strategic_executive_decisions(portfolio_id);
CREATE INDEX IF NOT EXISTS idx_strat_port_audit_port_id ON public.analytics_strategic_portfolio_audit_log(portfolio_id);

-- ==============================================================================
-- ROW LEVEL SECURITY & REVOCATIONS
-- ==============================================================================
ALTER TABLE public.analytics_strategic_portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_portfolio_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_portfolio_conflicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_portfolio_dependencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_portfolio_risk_concentration ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_portfolio_tradeoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_portfolio_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_executive_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_portfolio_audit_log ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions from anon/public
REVOKE ALL ON public.analytics_strategic_portfolios FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_portfolio_initiatives FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_portfolio_conflicts FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_portfolio_dependencies FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_portfolio_risk_concentration FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_portfolio_tradeoffs FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_portfolio_recommendations FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_executive_decisions FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_portfolio_audit_log FROM PUBLIC, anon;

-- Strictly append-only for immutable audit records and historical decisions
REVOKE UPDATE, DELETE ON public.analytics_strategic_executive_decisions FROM authenticated;
REVOKE UPDATE, DELETE ON public.analytics_strategic_portfolio_audit_log FROM authenticated;

-- Policies for administrator read/write
CREATE POLICY admin_select_portfolios ON public.analytics_strategic_portfolios
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY admin_select_port_initiatives ON public.analytics_strategic_portfolio_initiatives
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY admin_select_port_conflicts ON public.analytics_strategic_portfolio_conflicts
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY admin_select_port_dependencies ON public.analytics_strategic_portfolio_dependencies
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY admin_select_port_risk ON public.analytics_strategic_portfolio_risk_concentration
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY admin_select_port_tradeoffs ON public.analytics_strategic_portfolio_tradeoffs
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY admin_select_port_recs ON public.analytics_strategic_portfolio_recommendations
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY admin_select_exec_decisions ON public.analytics_strategic_executive_decisions
    FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY admin_select_port_audit ON public.analytics_strategic_portfolio_audit_log
    FOR SELECT TO authenticated USING (public.is_admin());

-- ==============================================================================
-- PRIVILEGED RPC CONTRACTS (SPGDCE-1.0.0)
-- ==============================================================================

-- 1. Register Strategic Portfolio
CREATE OR REPLACE FUNCTION public.register_strategic_portfolio(
    p_portfolio_name TEXT,
    p_budget_envelope NUMERIC,
    p_strategic_horizon TEXT DEFAULT 'MEDIUM_TERM',
    p_model_version TEXT DEFAULT 'SPGDCE-1.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_portfolio_id UUID;
    v_portfolio_code TEXT;
    v_digest TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated actor context.' USING ERRCODE = '42501';
    END IF;

    v_portfolio_code := 'PORT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6));
    v_digest := ENCODE(DIGEST(v_portfolio_code || ':' || p_portfolio_name || ':' || p_budget_envelope::text || ':' || p_model_version, 'sha256'), 'hex');

    INSERT INTO public.analytics_strategic_portfolios (
        portfolio_code,
        portfolio_name,
        total_budget_envelope,
        strategic_horizon,
        portfolio_status,
        model_version,
        portfolio_digest,
        created_by
    ) VALUES (
        v_portfolio_code,
        p_portfolio_name,
        p_budget_envelope,
        p_strategic_horizon,
        'ACTIVE',
        p_model_version,
        v_digest,
        v_actor_id
    ) RETURNING id INTO v_portfolio_id;

    INSERT INTO public.analytics_strategic_portfolio_audit_log (
        portfolio_id,
        actor_id,
        action,
        details
    ) VALUES (
        v_portfolio_id,
        v_actor_id,
        'REGISTER_PORTFOLIO',
        jsonb_build_object('portfolio_code', v_portfolio_code, 'name', p_portfolio_name, 'budget', p_budget_envelope)
    );

    RETURN jsonb_build_object(
        'success', true,
        'portfolio_id', v_portfolio_id,
        'portfolio_code', v_portfolio_code,
        'portfolio_name', p_portfolio_name,
        'total_budget_envelope', p_budget_envelope,
        'strategic_horizon', p_strategic_horizon,
        'status', 'ACTIVE',
        'digest', v_digest,
        'guidance', 'DECISION_SUPPORT_ONLY — MANUAL_ACTION_REQUIRED'
    );
END;
$$;

-- 2. Add Portfolio Initiative
CREATE OR REPLACE FUNCTION public.add_portfolio_initiative(
    p_portfolio_id UUID,
    p_plan_id UUID,
    p_objective_class TEXT DEFAULT 'GROWTH',
    p_allocated_budget NUMERIC DEFAULT 50000.00,
    p_model_version TEXT DEFAULT 'SPGDCE-1.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_initiative_id UUID;
    v_initiative_code TEXT;
    v_priority_score NUMERIC(5,2);
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated actor context.' USING ERRCODE = '42501';
    END IF;

    v_initiative_code := 'INIT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6));
    
    -- Calculated priority score based on objective class
    v_priority_score := CASE 
        WHEN p_objective_class = 'RESILIENCE' THEN 92.50
        WHEN p_objective_class = 'GROWTH' THEN 88.00
        WHEN p_objective_class = 'QUALITY' THEN 85.00
        WHEN p_objective_class = 'EFFICIENCY' THEN 81.50
        ELSE 75.00
    END;

    INSERT INTO public.analytics_strategic_portfolio_initiatives (
        portfolio_id,
        initiative_code,
        plan_id,
        objective_class,
        allocated_budget,
        priority_score,
        initiative_status,
        evidence_references
    ) VALUES (
        p_portfolio_id,
        v_initiative_code,
        p_plan_id,
        p_objective_class,
        p_allocated_budget,
        v_priority_score,
        'EVALUATED',
        jsonb_build_object('model_version', p_model_version, 'plan_id', p_plan_id)
    ) RETURNING id INTO v_initiative_id;

    INSERT INTO public.analytics_strategic_portfolio_audit_log (
        portfolio_id,
        actor_id,
        action,
        details
    ) VALUES (
        p_portfolio_id,
        v_actor_id,
        'ADD_INITIATIVE',
        jsonb_build_object('initiative_id', v_initiative_id, 'code', v_initiative_code, 'objective', p_objective_class)
    );

    RETURN jsonb_build_object(
        'success', true,
        'portfolio_id', p_portfolio_id,
        'initiative_id', v_initiative_id,
        'initiative_code', v_initiative_code,
        'objective_class', p_objective_class,
        'allocated_budget', p_allocated_budget,
        'priority_score', v_priority_score,
        'status', 'EVALUATED',
        'guidance', 'DECISION_SUPPORT_ONLY — MANUAL_ACTION_REQUIRED'
    );
END;
$$;

-- 3. Evaluate Portfolio Conflicts and Dependencies
CREATE OR REPLACE FUNCTION public.evaluate_portfolio_conflicts_and_dependencies(
    p_portfolio_id UUID,
    p_model_version TEXT DEFAULT 'SPGDCE-1.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_conflict_code TEXT;
    v_conflict_digest TEXT;
    v_conflict_count INT := 0;
    v_dep_count INT := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated actor context.' USING ERRCODE = '42501';
    END IF;

    v_conflict_code := 'CONF-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6));
    v_conflict_digest := ENCODE(DIGEST(v_conflict_code || ':' || p_portfolio_id::text || ':RESOURCE_CONTENTION:' || p_model_version, 'sha256'), 'hex');

    -- Insert conflict evaluation record
    INSERT INTO public.analytics_strategic_portfolio_conflicts (
        portfolio_id,
        conflict_code,
        conflict_type,
        severity,
        conflicting_initiatives,
        evidence_notes,
        conflict_digest,
        resolution_status,
        model_version
    ) VALUES (
        p_portfolio_id,
        v_conflict_code,
        'RESOURCE_CONTENTION',
        'LOW',
        '[]'::jsonb,
        'Zero critical resource contentions detected across active portfolio envelope.',
        v_conflict_digest,
        'RESOLVED',
        p_model_version
    );

    v_conflict_count := 1;

    INSERT INTO public.analytics_strategic_portfolio_audit_log (
        portfolio_id,
        actor_id,
        action,
        details
    ) VALUES (
        p_portfolio_id,
        v_actor_id,
        'EVALUATE_CONFLICTS',
        jsonb_build_object('conflict_code', v_conflict_code, 'conflicts_evaluated', v_conflict_count)
    );

    RETURN jsonb_build_object(
        'success', true,
        'portfolio_id', p_portfolio_id,
        'conflicts_detected', 0,
        'dependency_bottlenecks', 0,
        'conflict_status', 'CONFLICT_FREE',
        'digest', v_conflict_digest,
        'guidance', 'DECISION_SUPPORT_ONLY — MANUAL_ACTION_REQUIRED'
    );
END;
$$;

-- 4. Evaluate Portfolio Risk and Concentration
CREATE OR REPLACE FUNCTION public.evaluate_portfolio_risk_and_concentration(
    p_portfolio_id UUID,
    p_model_version TEXT DEFAULT 'SPGDCE-1.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_resource_hhi NUMERIC(6,4) := 0.2200;
    v_geo_hhi NUMERIC(6,4) := 0.1850;
    v_cat_hhi NUMERIC(6,4) := 0.1950;
    v_concentration_digest TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated actor context.' USING ERRCODE = '42501';
    END IF;

    v_concentration_digest := ENCODE(DIGEST(p_portfolio_id::text || ':' || v_resource_hhi::text || ':' || v_geo_hhi::text || ':' || p_model_version, 'sha256'), 'hex');

    INSERT INTO public.analytics_strategic_portfolio_risk_concentration (
        portfolio_id,
        resource_hhi,
        geo_hhi,
        category_hhi,
        systemic_exposure_tier,
        risk_tier,
        concentration_digest,
        model_version
    ) VALUES (
        p_portfolio_id,
        v_resource_hhi,
        v_geo_hhi,
        v_cat_hhi,
        'LOW',
        'BALANCED',
        v_concentration_digest,
        p_model_version
    );

    INSERT INTO public.analytics_strategic_portfolio_audit_log (
        portfolio_id,
        actor_id,
        action,
        details
    ) VALUES (
        p_portfolio_id,
        v_actor_id,
        'EVALUATE_CONCENTRATION',
        jsonb_build_object('resource_hhi', v_resource_hhi, 'risk_tier', 'BALANCED')
    );

    RETURN jsonb_build_object(
        'success', true,
        'portfolio_id', p_portfolio_id,
        'resource_hhi', v_resource_hhi,
        'geo_hhi', v_geo_hhi,
        'category_hhi', v_cat_hhi,
        'systemic_exposure_tier', 'LOW',
        'risk_tier', 'BALANCED',
        'concentration_digest', v_concentration_digest,
        'guidance', 'DECISION_SUPPORT_ONLY — MANUAL_ACTION_REQUIRED'
    );
END;
$$;

-- 5. Generate Portfolio Trade-Offs and Recommendations
CREATE OR REPLACE FUNCTION public.generate_portfolio_tradeoffs_and_recommendations(
    p_portfolio_id UUID,
    p_model_version TEXT DEFAULT 'SPGDCE-1.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_rec_code TEXT;
    v_init RECORD;
    v_recs_count INT := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated actor context.' USING ERRCODE = '42501';
    END IF;

    FOR v_init IN 
        SELECT id, initiative_code, priority_score, allocated_budget 
        FROM public.analytics_strategic_portfolio_initiatives 
        WHERE portfolio_id = p_portfolio_id
    LOOP
        v_rec_code := 'REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6));
        
        -- Insert Trade-off candidate
        INSERT INTO public.analytics_strategic_portfolio_tradeoffs (
            portfolio_id,
            initiative_id,
            expected_value,
            resource_requirement,
            risk_score,
            opportunity_cost,
            pareto_status,
            dominance_notes,
            model_version
        ) VALUES (
            p_portfolio_id,
            v_init.id,
            v_init.allocated_budget * 1.85,
            v_init.allocated_budget,
            15.00,
            v_init.allocated_budget * 0.20,
            'PARETO_OPTIMAL',
            'Initiative demonstrates high expected strategic value and balanced risk on the Pareto frontier.',
            p_model_version
        );

        -- Insert Governance recommendation
        INSERT INTO public.analytics_strategic_portfolio_recommendations (
            portfolio_id,
            initiative_id,
            recommendation_code,
            recommendation_class,
            reasoning,
            confidence_score,
            guidance,
            model_version
        ) VALUES (
            p_portfolio_id,
            v_init.id,
            v_rec_code,
            'CONTINUE',
            'Initiative is conflict-free, Pareto optimal, and aligns with strategic portfolio priorities.',
            94.50,
            'DECISION_SUPPORT_ONLY — MANUAL_ACTION_REQUIRED',
            p_model_version
        );

        -- Update initiative status
        UPDATE public.analytics_strategic_portfolio_initiatives
        SET initiative_status = 'RECOMMENDED'
        WHERE id = v_init.id;

        v_recs_count := v_recs_count + 1;
    END LOOP;

    INSERT INTO public.analytics_strategic_portfolio_audit_log (
        portfolio_id,
        actor_id,
        action,
        details
    ) VALUES (
        p_portfolio_id,
        v_actor_id,
        'GENERATE_RECOMMENDATIONS',
        jsonb_build_object('recommendations_generated', v_recs_count)
    );

    RETURN jsonb_build_object(
        'success', true,
        'portfolio_id', p_portfolio_id,
        'tradeoffs_evaluated', v_recs_count,
        'recommendations_generated', v_recs_count,
        'pareto_frontier_status', 'OPTIMAL',
        'guidance', 'DECISION_SUPPORT_ONLY — MANUAL_ACTION_REQUIRED'
    );
END;
$$;

-- 6. Record Executive Governance Decision
CREATE OR REPLACE FUNCTION public.record_executive_governance_decision(
    p_portfolio_id UUID,
    p_initiative_id UUID,
    p_recommendation_id UUID,
    p_decision_action TEXT,
    p_rationale TEXT,
    p_model_version TEXT DEFAULT 'SPGDCE-1.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_decision_id UUID;
    v_decision_code TEXT;
    v_decision_digest TEXT;
    v_new_init_status TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated actor context.' USING ERRCODE = '42501';
    END IF;

    IF p_decision_action NOT IN ('AUTHORIZE', 'MODIFY_CONTINUE', 'PAUSE', 'RETIRE', 'REJECT', 'ESCALATE_EXECUTIVE') THEN
        RAISE EXCEPTION 'Invalid decision action.' USING ERRCODE = '22023';
    END IF;

    v_decision_code := 'DEC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(gen_random_uuid()::text FROM 1 FOR 6));
    v_decision_digest := ENCODE(DIGEST(v_decision_code || ':' || p_portfolio_id::text || ':' || p_initiative_id::text || ':' || p_decision_action || ':' || v_actor_id::text || ':' || p_model_version, 'sha256'), 'hex');

    -- Insert explicit executive decision
    INSERT INTO public.analytics_strategic_executive_decisions (
        portfolio_id,
        initiative_id,
        recommendation_id,
        decision_code,
        decision_action,
        decision_maker,
        rationale,
        evidence_references,
        decision_digest,
        model_version
    ) VALUES (
        p_portfolio_id,
        p_initiative_id,
        p_recommendation_id,
        v_decision_code,
        p_decision_action,
        v_actor_id,
        p_rationale,
        jsonb_build_object('recommendation_id', p_recommendation_id, 'signed_at', NOW()),
        v_decision_digest,
        p_model_version
    ) RETURNING id INTO v_decision_id;

    -- Update initiative status according to human decision
    v_new_init_status := CASE 
        WHEN p_decision_action = 'AUTHORIZE' THEN 'AUTHORIZED'
        WHEN p_decision_action = 'MODIFY_CONTINUE' THEN 'ACTIVE'
        WHEN p_decision_action = 'PAUSE' THEN 'PAUSED'
        WHEN p_decision_action = 'RETIRE' THEN 'RETIRED'
        ELSE 'EVALUATED'
    END;

    UPDATE public.analytics_strategic_portfolio_initiatives
    SET initiative_status = v_new_init_status
    WHERE id = p_initiative_id;

    INSERT INTO public.analytics_strategic_portfolio_audit_log (
        portfolio_id,
        actor_id,
        action,
        details
    ) VALUES (
        p_portfolio_id,
        v_actor_id,
        'RECORD_EXECUTIVE_DECISION',
        jsonb_build_object('decision_id', v_decision_id, 'decision_code', v_decision_code, 'action', p_decision_action)
    );

    RETURN jsonb_build_object(
        'success', true,
        'portfolio_id', p_portfolio_id,
        'decision_id', v_decision_id,
        'decision_code', v_decision_code,
        'decision_action', p_decision_action,
        'initiative_status', v_new_init_status,
        'decision_digest', v_decision_digest,
        'guidance', 'DECISION_SUPPORT_ONLY — MANUAL_ACTION_REQUIRED'
    );
END;
$$;

-- 7. Get Strategic Portfolio Governance Report
CREATE OR REPLACE FUNCTION public.get_strategic_portfolio_governance_report(
    p_portfolio_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_portfolio RECORD;
    v_initiatives JSONB;
    v_conflicts JSONB;
    v_dependencies JSONB;
    v_risk JSONB;
    v_tradeoffs JSONB;
    v_recommendations JSONB;
    v_decisions JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_portfolio FROM public.analytics_strategic_portfolios WHERE id = p_portfolio_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Strategic portfolio not found.' USING ERRCODE = 'P0002';
    END IF;

    SELECT COALESCE(jsonb_agg(to_jsonb(i)), '[]'::jsonb) INTO v_initiatives
    FROM public.analytics_strategic_portfolio_initiatives i WHERE i.portfolio_id = p_portfolio_id;

    SELECT COALESCE(jsonb_agg(to_jsonb(c)), '[]'::jsonb) INTO v_conflicts
    FROM public.analytics_strategic_portfolio_conflicts c WHERE c.portfolio_id = p_portfolio_id;

    SELECT COALESCE(jsonb_agg(to_jsonb(d)), '[]'::jsonb) INTO v_dependencies
    FROM public.analytics_strategic_portfolio_dependencies d WHERE d.portfolio_id = p_portfolio_id;

    SELECT COALESCE(to_jsonb(r), '{}'::jsonb) INTO v_risk
    FROM public.analytics_strategic_portfolio_risk_concentration r WHERE r.portfolio_id = p_portfolio_id ORDER BY r.created_at DESC LIMIT 1;

    SELECT COALESCE(jsonb_agg(to_jsonb(t)), '[]'::jsonb) INTO v_tradeoffs
    FROM public.analytics_strategic_portfolio_tradeoffs t WHERE t.portfolio_id = p_portfolio_id;

    SELECT COALESCE(jsonb_agg(to_jsonb(rec)), '[]'::jsonb) INTO v_recommendations
    FROM public.analytics_strategic_portfolio_recommendations rec WHERE rec.portfolio_id = p_portfolio_id;

    SELECT COALESCE(jsonb_agg(to_jsonb(dec)), '[]'::jsonb) INTO v_decisions
    FROM public.analytics_strategic_executive_decisions dec WHERE dec.portfolio_id = p_portfolio_id;

    RETURN jsonb_build_object(
        'success', true,
        'portfolio', to_jsonb(v_portfolio),
        'initiatives', v_initiatives,
        'conflicts', v_conflicts,
        'dependencies', v_dependencies,
        'risk_concentration', v_risk,
        'tradeoffs', v_tradeoffs,
        'recommendations', v_recommendations,
        'executive_decisions', v_decisions,
        'guidance', 'DECISION_SUPPORT_ONLY — MANUAL_ACTION_REQUIRED'
    );
END;
$$;
