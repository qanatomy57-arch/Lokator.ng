-- ====================================================================
-- LOKATOR.NG — PHASE 9.7 DATABASE MIGRATION
-- STRATEGIC DECISION GOVERNANCE & RECOMMENDATION LIFECYCLE ENGINE (SDGRLE)
--
-- Migration: 019_lokator_strategic_decision_governance.sql
-- Model Version: SDGRLE-1.0.0
-- Dependencies: 001-018 (Preserves Phase 9.0-9.6 Invariants)
-- Invariants:
--   - 100% Ranking Air-Gap (Zero imports/calls in search/discovery)
--   - Business Truth Immutability (0 mutations on providers/reviews/services)
--   - Zero Autonomous Execution (No triggers, webhooks, outbound network, background jobs)
--   - Strict Server-Side Security (SECURITY DEFINER, auth.uid(), public.is_admin())
-- ====================================================================

-- 1. STRATEGIC RECOMMENDATIONS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    strategic_objective TEXT NOT NULL,
    current_state TEXT NOT NULL DEFAULT 'DRAFT' CHECK (current_state IN (
        'DRAFT', 'RECOMMENDED', 'REVIEW_PENDING', 'APPROVED', 'REJECTED',
        'DEFERRED', 'EXECUTED_EXTERNALLY', 'OUTCOME_PENDING', 'EVALUATED',
        'CLOSED', 'EXPIRED', 'SUPERSEDED', 'CANCELLED'
    )),
    source_phase TEXT NOT NULL DEFAULT 'PHASE_9.5' CHECK (source_phase IN (
        'PHASE_9.3', 'PHASE_9.4', 'PHASE_9.5', 'PHASE_9.6'
    )),
    plan_id UUID REFERENCES public.analytics_strategic_resource_plans(id) ON DELETE RESTRICT,
    scenario_id UUID REFERENCES public.analytics_strategic_scenarios(id) ON DELETE RESTRICT,
    model_version TEXT NOT NULL DEFAULT 'SDGRLE-1.0.0',
    provenance_hash TEXT NOT NULL,
    projected_expected_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    projected_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    projected_risk NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0.0000,
    valid_until TIMESTAMPTZ NOT NULL,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. RECOMMENDATION TRANSITIONS (Append-Only Audit History)
CREATE TABLE IF NOT EXISTS public.analytics_strategic_recommendation_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES public.analytics_strategic_recommendations(id) ON DELETE CASCADE,
    from_state TEXT NOT NULL,
    to_state TEXT NOT NULL,
    actor_id UUID NOT NULL,
    reason_code TEXT NOT NULL,
    notes TEXT,
    transitioned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. RECOMMENDATION REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_recommendation_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES public.analytics_strategic_recommendations(id) ON DELETE CASCADE,
    reviewer_id UUID NOT NULL,
    verdict TEXT NOT NULL CHECK (verdict IN ('APPROVE', 'REJECT', 'DEFER', 'REQUEST_REVISIONS')),
    strategic_alignment_score NUMERIC(3,2) NOT NULL CHECK (strategic_alignment_score BETWEEN 1.00 AND 5.00),
    evidence_quality_score NUMERIC(3,2) NOT NULL CHECK (evidence_quality_score BETWEEN 1.00 AND 5.00),
    resource_feasibility_score NUMERIC(3,2) NOT NULL CHECK (resource_feasibility_score BETWEEN 1.00 AND 5.00),
    risk_acceptability_score NUMERIC(3,2) NOT NULL CHECK (risk_acceptability_score BETWEEN 1.00 AND 5.00),
    composite_review_score NUMERIC(3,2) NOT NULL CHECK (composite_review_score BETWEEN 1.00 AND 5.00),
    rationale TEXT NOT NULL,
    conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
    reviewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. RECOMMENDATION COMPETITION & MUTUAL EXCLUSION
CREATE TABLE IF NOT EXISTS public.analytics_strategic_recommendation_competition (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_a_id UUID NOT NULL REFERENCES public.analytics_strategic_recommendations(id) ON DELETE CASCADE,
    recommendation_b_id UUID NOT NULL REFERENCES public.analytics_strategic_recommendations(id) ON DELETE CASCADE,
    relation_type TEXT NOT NULL CHECK (relation_type IN (
        'MUTUALLY_EXCLUSIVE', 'PREREQUISITE', 'SUPERSEDES', 'RESOURCE_CONTENTION'
    )),
    conflict_dimension TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_rec_competition UNIQUE (recommendation_a_id, recommendation_b_id, relation_type)
);

-- 5. OUTCOME OBSERVATIONS & EVALUATIONS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_recommendation_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL UNIQUE REFERENCES public.analytics_strategic_recommendations(id) ON DELETE CASCADE,
    observed_by UUID NOT NULL,
    actual_expected_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    actual_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    actual_risk NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    forecast_error_ev NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    forecast_error_cost NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    forecast_error_pct NUMERIC(6,2) NOT NULL DEFAULT 0.00,
    value_realization_ratio NUMERIC(6,4) NOT NULL DEFAULT 0.0000,
    effectiveness_tier TEXT NOT NULL CHECK (effectiveness_tier IN (
        'HIGHLY_EFFECTIVE', 'EFFECTIVE', 'PARTIALLY_EFFECTIVE',
        'INEFFECTIVE', 'COUNTERPRODUCTIVE', 'INCONCLUSIVE'
    )),
    empirical_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. DECISION AUDIT LOG (Strictly Append-Only)
CREATE TABLE IF NOT EXISTS public.analytics_strategic_decision_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID REFERENCES public.analytics_strategic_recommendations(id) ON DELETE SET NULL,
    actor_id UUID NOT NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) & REVOCATIONS
-- ====================================================================

ALTER TABLE public.analytics_strategic_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_recommendation_transitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_recommendation_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_recommendation_competition ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_recommendation_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_decision_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_strategic_recommendations FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_recommendation_transitions FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_recommendation_reviews FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_recommendation_competition FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_recommendation_outcomes FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_decision_audit_log FROM PUBLIC, anon;

-- Revoke mutation privileges on append-only audit structures
REVOKE UPDATE, DELETE ON public.analytics_strategic_recommendation_transitions FROM authenticated;
REVOKE UPDATE, DELETE ON public.analytics_strategic_recommendation_reviews FROM authenticated;
REVOKE UPDATE, DELETE ON public.analytics_strategic_decision_audit_log FROM authenticated;

CREATE POLICY admin_manage_recommendations ON public.analytics_strategic_recommendations
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_transitions ON public.analytics_strategic_recommendation_transitions
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_reviews ON public.analytics_strategic_recommendation_reviews
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_competition ON public.analytics_strategic_recommendation_competition
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_outcomes ON public.analytics_strategic_recommendation_outcomes
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_decision_audit ON public.analytics_strategic_decision_audit_log
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ====================================================================
-- PRIVILEGED RPC CONTRACTS (SECURITY DEFINER / FIXED SEARCH PATH)
-- ====================================================================

-- 1. CREATE STRATEGIC RECOMMENDATION RPC
CREATE OR REPLACE FUNCTION public.create_strategic_recommendation(
    p_plan_id UUID,
    p_scenario_id UUID,
    p_title TEXT,
    p_objective TEXT,
    p_valid_days INT DEFAULT 30,
    p_model_version TEXT DEFAULT 'SDGRLE-1.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_plan RECORD;
    v_scen RECORD;
    v_rec_id UUID;
    v_rec_code TEXT;
    v_prov_hash TEXT;
    v_valid_until TIMESTAMPTZ;
    v_cost NUMERIC(12,2) := 50000.00;
    v_ev NUMERIC(10,2) := 0.00;
    v_risk NUMERIC(5,2) := 0.00;
    v_conf NUMERIC(5,4) := 0.0000;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF p_model_version != 'SDGRLE-1.0.0' THEN
        RAISE EXCEPTION 'Unsupported model version: %. Expected SDGRLE-1.0.0.', p_model_version USING ERRCODE = '22023';
    END IF;

    IF p_valid_days <= 0 OR p_valid_days > 365 THEN
        RAISE EXCEPTION 'Validity horizon must be between 1 and 365 days.' USING ERRCODE = '22023';
    END IF;

    -- Fetch Plan and Scenario
    SELECT * INTO v_plan FROM public.analytics_strategic_resource_plans WHERE id = p_plan_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Resource plan % not found.', p_plan_id USING ERRCODE = 'P0002';
    END IF;

    SELECT * INTO v_scen FROM public.analytics_strategic_scenarios WHERE id = p_scenario_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Scenario % not found.', p_scenario_id USING ERRCODE = 'P0002';
    END IF;

    v_ev := v_scen.expected_value;
    v_risk := v_scen.risk_score;
    v_conf := v_scen.confidence_score;
    v_cost := COALESCE((v_scen.forecast_metrics->>'estimated_cost')::NUMERIC, 50000.00);

    v_rec_code := 'REC-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || SUBSTRING(gen_random_uuid()::text FROM 1 FOR 8);
    v_valid_until := NOW() + (p_valid_days || ' days')::INTERVAL;

    -- Cryptographic provenance hash
    v_prov_hash := encode(digest(
        p_plan_id::text || ':' || p_scenario_id::text || ':' || p_model_version || ':' || v_ev::text || ':' || v_cost::text || ':' || NOW()::text,
        'sha256'
    ), 'hex');

    INSERT INTO public.analytics_strategic_recommendations (
        recommendation_code, title, strategic_objective, current_state, source_phase,
        plan_id, scenario_id, model_version, provenance_hash, projected_expected_value,
        projected_cost, projected_risk, confidence_score, valid_until, created_by
    ) VALUES (
        v_rec_code, p_title, p_objective, 'RECOMMENDED', 'PHASE_9.5',
        p_plan_id, p_scenario_id, p_model_version, v_prov_hash, v_ev,
        v_cost, v_risk, v_conf, v_valid_until, v_actor_id
    )
    RETURNING id INTO v_rec_id;

    -- Append-only transition log
    INSERT INTO public.analytics_strategic_recommendation_transitions (
        recommendation_id, from_state, to_state, actor_id, reason_code, notes
    ) VALUES (
        v_rec_id, 'DRAFT', 'RECOMMENDED', v_actor_id, 'RECOMMENDATION_GENERATED', 'Generated from Phase 9.5 resource plan'
    );

    -- Audit log
    INSERT INTO public.analytics_strategic_decision_audit_log (
        recommendation_id, actor_id, action, details
    ) VALUES (
        v_rec_id, v_actor_id, 'CREATE_RECOMMENDATION',
        jsonb_build_object('recommendation_code', v_rec_code, 'plan_id', p_plan_id, 'scenario_id', p_scenario_id)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'recommendation_id', v_rec_id,
        'recommendation_code', v_rec_code,
        'current_state', 'RECOMMENDED',
        'provenance_hash', v_prov_hash,
        'valid_until', v_valid_until
    );
END;
$$;

-- 2. TRANSITION RECOMMENDATION STATE RPC (Strict FSM Validation with Row Locking)
CREATE OR REPLACE FUNCTION public.transition_recommendation_state(
    p_recommendation_id UUID,
    p_target_state TEXT,
    p_reason_code TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_rec RECORD;
    v_is_valid BOOLEAN := FALSE;
    v_conflict RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    -- Lock row for update to serialize state machine transitions
    SELECT * INTO v_rec
    FROM public.analytics_strategic_recommendations
    WHERE id = p_recommendation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recommendation % not found.', p_recommendation_id USING ERRCODE = 'P0002';
    END IF;

    -- Validate FSM Matrix
    IF (v_rec.current_state = 'DRAFT' AND p_target_state = 'RECOMMENDED') OR
       (v_rec.current_state = 'RECOMMENDED' AND p_target_state IN ('REVIEW_PENDING', 'SUPERSEDED', 'EXPIRED', 'CANCELLED')) OR
       (v_rec.current_state = 'REVIEW_PENDING' AND p_target_state IN ('APPROVED', 'REJECTED', 'DEFERRED', 'SUPERSEDED', 'EXPIRED', 'CANCELLED')) OR
       (v_rec.current_state = 'DEFERRED' AND p_target_state IN ('REVIEW_PENDING', 'EXPIRED', 'CANCELLED')) OR
       (v_rec.current_state = 'APPROVED' AND p_target_state IN ('EXECUTED_EXTERNALLY', 'CANCELLED', 'EXPIRED')) OR
       (v_rec.current_state = 'EXECUTED_EXTERNALLY' AND p_target_state IN ('OUTCOME_PENDING', 'EVALUATED')) OR
       (v_rec.current_state = 'OUTCOME_PENDING' AND p_target_state IN ('EVALUATED', 'CLOSED')) OR
       (v_rec.current_state = 'EVALUATED' AND p_target_state = 'CLOSED') THEN
        v_is_valid := TRUE;
    END IF;

    IF NOT v_is_valid THEN
        RAISE EXCEPTION 'Invalid state transition from % to %.', v_rec.current_state, p_target_state USING ERRCODE = '22023';
    END IF;

    -- If transitioning to APPROVED, check expiry and competition constraints
    IF p_target_state = 'APPROVED' THEN
        IF NOW() > v_rec.valid_until THEN
            RAISE EXCEPTION 'Recommendation has expired (valid_until: %). Cannot approve.', v_rec.valid_until USING ERRCODE = '22023';
        END IF;

        -- Check mutual exclusion conflicts
        FOR v_conflict IN (
            SELECT c.recommendation_b_id, r.current_state, r.recommendation_code
            FROM public.analytics_strategic_recommendation_competition c
            JOIN public.analytics_strategic_recommendations r ON c.recommendation_b_id = r.id
            WHERE c.recommendation_a_id = p_recommendation_id
              AND c.relation_type = 'MUTUALLY_EXCLUSIVE'
              AND r.current_state = 'APPROVED'
        ) LOOP
            RAISE EXCEPTION 'Conflict: Mutually exclusive recommendation % is already APPROVED.', v_conflict.recommendation_code USING ERRCODE = '22023';
        END LOOP;
    END IF;

    -- Update state
    UPDATE public.analytics_strategic_recommendations
    SET current_state = p_target_state,
        updated_at = NOW()
    WHERE id = p_recommendation_id;

    -- Append transition record
    INSERT INTO public.analytics_strategic_recommendation_transitions (
        recommendation_id, from_state, to_state, actor_id, reason_code, notes
    ) VALUES (
        p_recommendation_id, v_rec.current_state, p_target_state, v_actor_id, p_reason_code, p_notes
    );

    -- Audit log
    INSERT INTO public.analytics_strategic_decision_audit_log (
        recommendation_id, actor_id, action, details
    ) VALUES (
        p_recommendation_id, v_actor_id, 'TRANSITION_STATE',
        jsonb_build_object('from_state', v_rec.current_state, 'to_state', p_target_state, 'reason_code', p_reason_code)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'recommendation_id', p_recommendation_id,
        'from_state', v_rec.current_state,
        'to_state', p_target_state
    );
END;
$$;

-- 3. SUBMIT STRUCTURED HUMAN REVIEW RPC
CREATE OR REPLACE FUNCTION public.submit_recommendation_review(
    p_recommendation_id UUID,
    p_verdict TEXT,
    p_alignment_score NUMERIC,
    p_evidence_score NUMERIC,
    p_feasibility_score NUMERIC,
    p_risk_score NUMERIC,
    p_rationale TEXT,
    p_conditions JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_rec RECORD;
    v_comp_score NUMERIC(3,2);
    v_review_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    -- Score bounds check [1.00, 5.00]
    IF p_alignment_score < 1.00 OR p_alignment_score > 5.00 OR
       p_evidence_score < 1.00 OR p_evidence_score > 5.00 OR
       p_feasibility_score < 1.00 OR p_feasibility_score > 5.00 OR
       p_risk_score < 1.00 OR p_risk_score > 5.00 THEN
        RAISE EXCEPTION 'Review scores must be within range [1.00, 5.00].' USING ERRCODE = '22023';
    END IF;

    IF p_verdict NOT IN ('APPROVE', 'REJECT', 'DEFER', 'REQUEST_REVISIONS') THEN
        RAISE EXCEPTION 'Invalid review verdict.' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_rec FROM public.analytics_strategic_recommendations WHERE id = p_recommendation_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recommendation % not found.', p_recommendation_id USING ERRCODE = 'P0002';
    END IF;

    -- Calculate deterministic composite review score: 35% alignment + 25% evidence + 25% feasibility + 15% risk
    v_comp_score := ROUND(0.35 * p_alignment_score + 0.25 * p_evidence_score + 0.25 * p_feasibility_score + 0.15 * p_risk_score, 2);

    INSERT INTO public.analytics_strategic_recommendation_reviews (
        recommendation_id, reviewer_id, verdict, strategic_alignment_score,
        evidence_quality_score, resource_feasibility_score, risk_acceptability_score,
        composite_review_score, rationale, conditions
    ) VALUES (
        p_recommendation_id, v_actor_id, p_verdict, p_alignment_score,
        p_evidence_score, p_feasibility_score, p_risk_score,
        v_comp_score, p_rationale, p_conditions
    )
    RETURNING id INTO v_review_id;

    -- If approved and in review_pending, automatically trigger transition
    IF p_verdict = 'APPROVE' AND v_rec.current_state = 'REVIEW_PENDING' THEN
        PERFORM public.transition_recommendation_state(p_recommendation_id, 'APPROVED', 'HUMAN_REVIEW_APPROVED', p_rationale);
    ELSIF p_verdict = 'REJECT' AND v_rec.current_state = 'REVIEW_PENDING' THEN
        PERFORM public.transition_recommendation_state(p_recommendation_id, 'REJECTED', 'HUMAN_REVIEW_REJECTED', p_rationale);
    END IF;

    -- Audit log
    INSERT INTO public.analytics_strategic_decision_audit_log (
        recommendation_id, actor_id, action, details
    ) VALUES (
        p_recommendation_id, v_actor_id, 'SUBMIT_REVIEW',
        jsonb_build_object('verdict', p_verdict, 'composite_score', v_comp_score, 'review_id', v_review_id)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'review_id', v_review_id,
        'composite_score', v_comp_score,
        'verdict', p_verdict
    );
END;
$$;

-- 4. RECORD REALIZED OUTCOME & EVALUATION RPC
CREATE OR REPLACE FUNCTION public.record_recommendation_outcome(
    p_recommendation_id UUID,
    p_actual_ev NUMERIC,
    p_actual_cost NUMERIC,
    p_actual_risk NUMERIC,
    p_evidence JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_rec RECORD;
    v_fe_ev NUMERIC(10,2);
    v_fe_cost NUMERIC(12,2);
    v_fe_pct NUMERIC(6,2);
    v_vrr NUMERIC(6,4);
    v_cvr NUMERIC(6,4);
    v_tier TEXT := 'INCONCLUSIVE';
    v_outcome_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_rec FROM public.analytics_strategic_recommendations WHERE id = p_recommendation_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recommendation % not found.', p_recommendation_id USING ERRCODE = 'P0002';
    END IF;

    -- Calculate forecast errors
    v_fe_ev := ROUND(p_actual_ev - v_rec.projected_expected_value, 2);
    v_fe_cost := ROUND(p_actual_cost - v_rec.projected_cost, 2);

    IF v_rec.projected_expected_value > 0 THEN
        v_fe_pct := ROUND((ABS(p_actual_ev - v_rec.projected_expected_value) / v_rec.projected_expected_value) * 100.0, 2);
        v_vrr := ROUND(p_actual_ev / v_rec.projected_expected_value, 4);
    ELSE
        v_fe_pct := 0.00;
        v_vrr := CASE WHEN p_actual_ev >= 0 THEN 1.0000 ELSE 0.0000 END;
    END IF;

    IF v_rec.projected_cost > 0 THEN
        v_cvr := ROUND(p_actual_cost / v_rec.projected_cost, 4);
    ELSE
        v_cvr := 1.0000;
    END IF;

    -- Determine Effectiveness Tier
    IF v_vrr >= 1.2000 AND v_cvr <= 1.1000 THEN
        v_tier := 'HIGHLY_EFFECTIVE';
    ELSIF v_vrr >= 0.9000 AND v_cvr <= 1.1500 THEN
        v_tier := 'EFFECTIVE';
    ELSIF v_vrr >= 0.6000 AND v_cvr <= 1.3000 THEN
        v_tier := 'PARTIALLY_EFFECTIVE';
    ELSIF v_vrr < 0.0000 THEN
        v_tier := 'COUNTERPRODUCTIVE';
    ELSIF v_vrr < 0.6000 THEN
        v_tier := 'INEFFECTIVE';
    ELSE
        v_tier := 'INCONCLUSIVE';
    END IF;

    INSERT INTO public.analytics_strategic_recommendation_outcomes (
        recommendation_id, observed_by, actual_expected_value, actual_cost,
        actual_risk, forecast_error_ev, forecast_error_cost, forecast_error_pct,
        value_realization_ratio, effectiveness_tier, empirical_evidence
    ) VALUES (
        p_recommendation_id, v_actor_id, p_actual_ev, p_actual_cost,
        p_actual_risk, v_fe_ev, v_fe_cost, v_fe_pct,
        v_vrr, v_tier, p_evidence
    )
    ON CONFLICT (recommendation_id) DO UPDATE
    SET actual_expected_value = EXCLUDED.actual_expected_value,
        actual_cost = EXCLUDED.actual_cost,
        actual_risk = EXCLUDED.actual_risk,
        forecast_error_ev = EXCLUDED.forecast_error_ev,
        forecast_error_cost = EXCLUDED.forecast_error_cost,
        forecast_error_pct = EXCLUDED.forecast_error_pct,
        value_realization_ratio = EXCLUDED.value_realization_ratio,
        effectiveness_tier = EXCLUDED.effectiveness_tier,
        empirical_evidence = EXCLUDED.empirical_evidence,
        observed_at = NOW()
    RETURNING id INTO v_outcome_id;

    -- Transition recommendation state to EVALUATED if currently in EXECUTED_EXTERNALLY or OUTCOME_PENDING
    IF v_rec.current_state IN ('EXECUTED_EXTERNALLY', 'OUTCOME_PENDING') THEN
        PERFORM public.transition_recommendation_state(p_recommendation_id, 'EVALUATED', 'OUTCOME_RECORDED', 'Outcome observed and evaluated');
    END IF;

    -- Audit log
    INSERT INTO public.analytics_strategic_decision_audit_log (
        recommendation_id, actor_id, action, details
    ) VALUES (
        p_recommendation_id, v_actor_id, 'RECORD_OUTCOME',
        jsonb_build_object('vrr', v_vrr, 'effectiveness_tier', v_tier, 'outcome_id', v_outcome_id)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'outcome_id', v_outcome_id,
        'value_realization_ratio', v_vrr,
        'effectiveness_tier', v_tier,
        'forecast_error_pct', v_fe_pct
    );
END;
$$;

-- 5. GET MODEL PERFORMANCE & DRIFT ANALYSIS RPC
CREATE OR REPLACE FUNCTION public.get_model_performance_drift(
    p_model_version TEXT DEFAULT 'SDGRLE-1.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_sample_count INT := 0;
    v_avg_fe_ev NUMERIC(10,2) := 0.00;
    v_avg_fe_cost NUMERIC(12,2) := 0.00;
    v_avg_vrr NUMERIC(6,4) := 0.0000;
    v_effective_count INT := 0;
    v_drift_detected BOOLEAN := FALSE;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    SELECT COUNT(*),
           COALESCE(AVG(o.forecast_error_ev), 0.00),
           COALESCE(AVG(o.forecast_error_cost), 0.00),
           COALESCE(AVG(o.value_realization_ratio), 0.0000),
           COUNT(*) FILTER (WHERE o.effectiveness_tier IN ('HIGHLY_EFFECTIVE', 'EFFECTIVE'))
    INTO v_sample_count, v_avg_fe_ev, v_avg_fe_cost, v_avg_vrr, v_effective_count
    FROM public.analytics_strategic_recommendation_outcomes o
    JOIN public.analytics_strategic_recommendations r ON o.recommendation_id = r.id
    WHERE r.model_version = p_model_version;

    -- Model bias flag: if average absolute value realization ratio differs from 1.0 by > 25%
    IF v_sample_count >= 5 AND (v_avg_vrr < 0.7500 OR v_avg_vrr > 1.2500) THEN
        v_drift_detected := TRUE;
    END IF;

    RETURN jsonb_build_object(
        'success', TRUE,
        'model_version', p_model_version,
        'evaluated_sample_count', v_sample_count,
        'avg_forecast_error_ev', v_avg_fe_ev,
        'avg_forecast_error_cost', v_avg_fe_cost,
        'avg_value_realization_ratio', v_avg_vrr,
        'effective_rate_pct', CASE WHEN v_sample_count > 0 THEN ROUND((v_effective_count::NUMERIC / v_sample_count) * 100.0, 2) ELSE 0.00 END,
        'parameter_drift_flag', v_drift_detected
    );
END;
$$;

-- 6. GET STRATEGIC RECOMMENDATION DETAILS RPC
CREATE OR REPLACE FUNCTION public.get_strategic_recommendation_details(
    p_recommendation_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_rec RECORD;
    v_reviews JSONB;
    v_transitions JSONB;
    v_outcome JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_rec
    FROM public.analytics_strategic_recommendations
    WHERE id = p_recommendation_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Recommendation % not found.', p_recommendation_id USING ERRCODE = 'P0002';
    END IF;

    SELECT jsonb_agg(row_to_json(r)) INTO v_reviews
    FROM (
        SELECT verdict, composite_review_score, strategic_alignment_score,
               evidence_quality_score, resource_feasibility_score, risk_acceptability_score,
               rationale, conditions, reviewed_at
        FROM public.analytics_strategic_recommendation_reviews
        WHERE recommendation_id = p_recommendation_id
        ORDER BY reviewed_at DESC
    ) r;

    SELECT jsonb_agg(row_to_json(t)) INTO v_transitions
    FROM (
        SELECT from_state, to_state, reason_code, notes, transitioned_at
        FROM public.analytics_strategic_recommendation_transitions
        WHERE recommendation_id = p_recommendation_id
        ORDER BY transitioned_at ASC
    ) t;

    SELECT row_to_json(o)::jsonb INTO v_outcome
    FROM (
        SELECT actual_expected_value, actual_cost, actual_risk,
               forecast_error_ev, forecast_error_cost, forecast_error_pct,
               value_realization_ratio, effectiveness_tier, empirical_evidence, observed_at
        FROM public.analytics_strategic_recommendation_outcomes
        WHERE recommendation_id = p_recommendation_id
    ) o;

    RETURN jsonb_build_object(
        'success', TRUE,
        'recommendation_id', v_rec.id,
        'recommendation_code', v_rec.recommendation_code,
        'title', v_rec.title,
        'objective', v_rec.strategic_objective,
        'current_state', v_rec.current_state,
        'source_phase', v_rec.source_phase,
        'plan_id', v_rec.plan_id,
        'scenario_id', v_rec.scenario_id,
        'model_version', v_rec.model_version,
        'provenance_hash', v_rec.provenance_hash,
        'projected_ev', v_rec.projected_expected_value,
        'projected_cost', v_rec.projected_cost,
        'projected_risk', v_rec.projected_risk,
        'confidence_score', v_rec.confidence_score,
        'valid_until', v_rec.valid_until,
        'reviews', COALESCE(v_reviews, '[]'::jsonb),
        'transitions', COALESCE(v_transitions, '[]'::jsonb),
        'outcome', v_outcome,
        'created_at', v_rec.created_at
    );
END;
$$;
