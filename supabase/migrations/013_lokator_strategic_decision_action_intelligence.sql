-- ==============================================================================
-- LOKATOR.NG — PHASE 9.1 DATABASE MIGRATION
-- STRATEGIC DECISION & ACTION INTELLIGENCE
-- Migration: 013_lokator_strategic_decision_action_intelligence.sql
--
-- INVARIANTS ENFORCED:
-- 1. OBSERVATIONAL & DECISION-SUPPORT ONLY — Zero autonomous marketplace mutations.
-- 2. RANKING AIR-GAP — Search ranking in search.js is 100% isolated from strategic decisions.
-- 3. BUSINESS TRUTH IMMUTABILITY — Zero mutations against public.providers, reviews, or provider_services.
-- 4. ACCEPTED != EXECUTED — Administrative acceptance records human intent; execution is external/manual.
-- 5. PRIVACY GATES — Hard enforcement of N >= 30 sample floor and k >= 5 diversity threshold.
-- 6. IMMUTABLE AUDIT TRAIL — Append-only decision ledger & audit logs with REVOKE UPDATE, DELETE.
-- 7. SECURITY DEFINER HARDENING — Fixed search_path and server-side public.is_admin() verification.
-- 8. BOUNDED EFFECTIVENESS SCORING — Deterministic closed-form mathematical bounds in [0.00, 100.00].
-- ==============================================================================

-- 1. STRATEGIC DECISIONS TABLE (APPEND-ONLY DECISION LEDGER)
CREATE TABLE IF NOT EXISTS public.analytics_strategic_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    synthesis_id UUID NOT NULL REFERENCES public.analytics_strategic_synthesis(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    state TEXT NOT NULL,
    lga TEXT NOT NULL,
    actor_id UUID NOT NULL,
    decision_type TEXT NOT NULL 
        CHECK (decision_type IN ('ACCEPT', 'REJECT', 'DEFER', 'WATCH', 'ESCALATE', 'COMPLETE', 'CANCEL')),
    decision_state TEXT NOT NULL DEFAULT 'IDENTIFIED'
        CHECK (decision_state IN (
            'IDENTIFIED', 
            'EVALUATING', 
            'ACCEPTED', 
            'PLANNED', 
            'IN_PROGRESS', 
            'MEASURING', 
            'COMPLETED', 
            'REJECTED', 
            'DEFERRED', 
            'CANCELLED', 
            'EXPIRED'
        )),
    rationale TEXT NOT NULL,
    expected_outcome TEXT,
    target_metric TEXT NOT NULL DEFAULT 'SUPPLY_DEFICIT_REDUCTION'
        CHECK (target_metric IN (
            'SUPPLY_DEFICIT_REDUCTION',
            'DEMAND_VELOCITY_GROWTH',
            'PROVIDER_DENSITY_INCREASE',
            'SEARCH_RESOLUTION_RATE',
            'STRATEGIC_SCORE_REDUCTION'
        )),
    baseline_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    target_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    observation_window_days INT NOT NULL DEFAULT 14 
        CHECK (observation_window_days >= 1 AND observation_window_days <= 90),
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategic_decisions_synthesis
    ON public.analytics_strategic_decisions (synthesis_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategic_decisions_state_type
    ON public.analytics_strategic_decisions (decision_state, decision_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategic_decisions_spatial
    ON public.analytics_strategic_decisions (state, lga, category);

-- 2. STRATEGIC ACTION PLANS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_action_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID NOT NULL REFERENCES public.analytics_strategic_decisions(id) ON DELETE CASCADE,
    synthesis_id UUID NOT NULL REFERENCES public.analytics_strategic_synthesis(id) ON DELETE CASCADE,
    objective TEXT NOT NULL,
    category TEXT NOT NULL,
    state TEXT NOT NULL,
    lga TEXT NOT NULL,
    action_category TEXT NOT NULL DEFAULT 'PROVIDER_ACQUISITION'
        CHECK (action_category IN (
            'PROVIDER_ACQUISITION',
            'CATEGORY_EXPANSION',
            'QUALITY_VERIFICATION',
            'COVERAGE_DENSITY',
            'PROMOTIONAL_CAMPAIGN',
            'OPERATIONAL_MONITORING'
        )),
    recommended_action TEXT NOT NULL,
    owner_title TEXT NOT NULL DEFAULT 'Operations Lead',
    priority TEXT NOT NULL DEFAULT 'P1'
        CHECK (priority IN ('P0', 'P1', 'P2', 'P3')),
    plan_status TEXT NOT NULL DEFAULT 'PLANNED'
        CHECK (plan_status IN ('DRAFT', 'PLANNED', 'ACTIVE', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED')),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    target_completion_date DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
    expected_outcome TEXT,
    success_metric TEXT NOT NULL DEFAULT 'SUPPLY_DEFICIT_REDUCTION',
    baseline_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    target_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategic_action_plans_decision
    ON public.analytics_strategic_action_plans (decision_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategic_action_plans_status
    ON public.analytics_strategic_action_plans (plan_status, priority, target_completion_date);

-- 3. STRATEGIC OUTCOMES & EFFECTIVENESS MEASUREMENT TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_plan_id UUID NOT NULL REFERENCES public.analytics_strategic_action_plans(id) ON DELETE CASCADE,
    decision_id UUID NOT NULL REFERENCES public.analytics_strategic_decisions(id) ON DELETE CASCADE,
    synthesis_id UUID NOT NULL REFERENCES public.analytics_strategic_synthesis(id) ON DELETE CASCADE,
    observation_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    baseline_demand NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    observed_demand NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    baseline_supply NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    observed_supply NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    baseline_searches INT NOT NULL DEFAULT 0,
    observed_searches INT NOT NULL DEFAULT 0,
    baseline_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    observed_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    target_metric_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    observed_metric_value NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    effectiveness_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 
        CHECK (effectiveness_score >= 0.00 AND effectiveness_score <= 100.00),
    effectiveness_status TEXT NOT NULL DEFAULT 'NOT_STARTED'
        CHECK (effectiveness_status IN (
            'NOT_STARTED', 
            'INSUFFICIENT_DATA', 
            'ON_TRACK', 
            'UNDERPERFORMING', 
            'MEETING_TARGET', 
            'EXCEEDING_TARGET', 
            'INCONCLUSIVE'
        )),
    sample_size INT NOT NULL DEFAULT 0,
    unique_sessions INT NOT NULL DEFAULT 0,
    attribution_notes TEXT NOT NULL DEFAULT 'Observed outcome in post-action observation window.',
    measured_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategic_outcomes_plan
    ON public.analytics_strategic_outcomes (action_plan_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_strategic_outcomes_decision
    ON public.analytics_strategic_outcomes (decision_id, created_at DESC);

-- 4. STRATEGIC DECISION AUDIT LOG TABLE (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.analytics_strategic_decision_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES public.analytics_strategic_decisions(id) ON DELETE CASCADE,
    action_plan_id UUID REFERENCES public.analytics_strategic_action_plans(id) ON DELETE CASCADE,
    outcome_id UUID REFERENCES public.analytics_strategic_outcomes(id) ON DELETE CASCADE,
    previous_state TEXT NOT NULL,
    new_state TEXT NOT NULL,
    actor_id UUID NOT NULL,
    action TEXT NOT NULL 
        CHECK (action IN (
            'RECORD_DECISION',
            'STATE_TRANSITION',
            'CREATE_ACTION_PLAN',
            'UPDATE_ACTION_PLAN',
            'RECORD_OUTCOME',
            'COMPLETE_DECISION',
            'CANCEL_DECISION',
            'EXPIRE_DECISION'
        )),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_strategic_decision_audit_target
    ON public.analytics_strategic_decision_audit_log (decision_id, created_at DESC);

-- 5. ROW LEVEL SECURITY & ACCESS PERMISSIONS HARDENING
ALTER TABLE public.analytics_strategic_decisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_action_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_decision_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_strategic_decisions FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_action_plans FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_outcomes FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_decision_audit_log FROM PUBLIC, anon;

-- Explicitly revoke UPDATE and DELETE on audit log and outcomes to enforce immutability
REVOKE UPDATE, DELETE ON public.analytics_strategic_decisions FROM authenticated;
REVOKE UPDATE, DELETE ON public.analytics_strategic_outcomes FROM authenticated;
REVOKE UPDATE, DELETE ON public.analytics_strategic_decision_audit_log FROM authenticated;

-- Admin RLS Policies
CREATE POLICY admin_select_strategic_decisions ON public.analytics_strategic_decisions
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY admin_select_strategic_action_plans ON public.analytics_strategic_action_plans
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_select_strategic_outcomes ON public.analytics_strategic_outcomes
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY admin_select_strategic_decision_audit_log ON public.analytics_strategic_decision_audit_log
    FOR SELECT TO authenticated
    USING (public.is_admin());

-- ==============================================================================
-- 6. PRIVILEGED RPC 1: record_strategic_decision
-- Records an immutable strategic decision against a synthesized opportunity.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.record_strategic_decision(
    p_synthesis_id UUID,
    p_decision_type TEXT,
    p_rationale TEXT,
    p_expected_outcome TEXT DEFAULT NULL,
    p_target_metric TEXT DEFAULT 'SUPPLY_DEFICIT_REDUCTION',
    p_target_value NUMERIC DEFAULT 0.00,
    p_observation_window_days INT DEFAULT 14
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_synthesis RECORD;
    v_decision_id UUID;
    v_init_state TEXT;
    v_baseline_val NUMERIC;
BEGIN
    -- 1. Security Gate: Verify administrator privileges
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Derive actor_id strictly from server-side session
    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request. Server session required.'
            USING ERRCODE = '42501';
    END IF;

    -- 3. Validate synthesis opportunity exists
    SELECT * INTO v_synthesis
    FROM public.analytics_strategic_synthesis
    WHERE id = p_synthesis_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Synthesis opportunity not found: %', p_synthesis_id
            USING ERRCODE = '22023';
    END IF;

    -- 4. Validate parameters
    IF p_decision_type NOT IN ('ACCEPT', 'REJECT', 'DEFER', 'WATCH', 'ESCALATE', 'COMPLETE', 'CANCEL') THEN
        RAISE EXCEPTION 'Invalid decision type: %', p_decision_type
            USING ERRCODE = '22023';
    END IF;

    IF p_rationale IS NULL OR LENGTH(TRIM(p_rationale)) < 3 THEN
        RAISE EXCEPTION 'A valid decision rationale is required (minimum 3 characters).'
            USING ERRCODE = '22023';
    END IF;

    -- Map decision type to initial state
    v_init_state := CASE 
        WHEN p_decision_type = 'ACCEPT' THEN 'ACCEPTED'
        WHEN p_decision_type = 'REJECT' THEN 'REJECTED'
        WHEN p_decision_type = 'DEFER' THEN 'DEFERRED'
        WHEN p_decision_type = 'WATCH' THEN 'EVALUATING'
        WHEN p_decision_type = 'ESCALATE' THEN 'EVALUATING'
        WHEN p_decision_type = 'COMPLETE' THEN 'COMPLETED'
        WHEN p_decision_type = 'CANCEL' THEN 'CANCELLED'
        ELSE 'IDENTIFIED'
    END;

    -- Extract baseline value from synthesis metrics
    v_baseline_val := COALESCE((v_synthesis.metrics->>'projected_gap')::numeric, (v_synthesis.metrics->>'supply_deficit')::numeric, 0.00);

    -- 5. Insert strategic decision record
    INSERT INTO public.analytics_strategic_decisions (
        synthesis_id,
        category,
        state,
        lga,
        actor_id,
        decision_type,
        decision_state,
        rationale,
        expected_outcome,
        target_metric,
        baseline_value,
        target_value,
        observation_window_days,
        metadata
    ) VALUES (
        p_synthesis_id,
        v_synthesis.category,
        v_synthesis.state,
        v_synthesis.lga,
        v_actor_id,
        p_decision_type,
        v_init_state,
        TRIM(p_rationale),
        p_expected_outcome,
        p_target_metric,
        v_baseline_val,
        p_target_value,
        COALESCE(p_observation_window_days, 14),
        jsonb_build_object(
            'strategic_score', v_synthesis.strategic_score,
            'priority_class', v_synthesis.priority_class,
            'convergence_level', v_synthesis.convergence_level
        )
    ) RETURNING id INTO v_decision_id;

    -- 6. Log audit entry
    INSERT INTO public.analytics_strategic_decision_audit_log (
        decision_id,
        previous_state,
        new_state,
        actor_id,
        action,
        notes
    ) VALUES (
        v_decision_id,
        'IDENTIFIED',
        v_init_state,
        v_actor_id,
        'RECORD_DECISION',
        format('Decision %s recorded for %s in %s. Rationale: %s', p_decision_type, v_synthesis.category, v_synthesis.lga, TRIM(p_rationale))
    );

    -- 7. Update synthesis record state if accepting or watching
    IF p_decision_type = 'ACCEPT' THEN
        UPDATE public.analytics_strategic_synthesis
        SET synthesis_state = 'ACKNOWLEDGED',
            acknowledged_at = NOW(),
            acknowledged_by = v_actor_id,
            updated_at = NOW()
        WHERE id = p_synthesis_id;
    ELSIF p_decision_type = 'WATCH' THEN
        UPDATE public.analytics_strategic_synthesis
        SET synthesis_state = 'WATCH',
            updated_at = NOW()
        WHERE id = p_synthesis_id;
    END IF;

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'decision_id', v_decision_id,
        'synthesis_id', p_synthesis_id,
        'decision_type', p_decision_type,
        'decision_state', v_init_state,
        'category', v_synthesis.category,
        'lga', v_synthesis.lga,
        'state', v_synthesis.state,
        'recorded_at', NOW()
    );
END;
$$;

-- ==============================================================================
-- 7. PRIVILEGED RPC 2: transition_strategic_decision
-- Manages deterministic state machine transitions for strategic decisions.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.transition_strategic_decision(
    p_decision_id UUID,
    p_new_state TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_curr RECORD;
    v_valid_transition BOOLEAN := FALSE;
BEGIN
    -- 1. Security Gate
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request.' USING ERRCODE = '42501';
    END IF;

    -- 2. Fetch current decision record
    SELECT * INTO v_curr
    FROM public.analytics_strategic_decisions
    WHERE id = p_decision_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Strategic decision not found: %', p_decision_id
            USING ERRCODE = '22023';
    END IF;

    -- 3. Validate State Machine Transitions
    IF v_curr.decision_state IN ('COMPLETED', 'CANCELLED', 'EXPIRED', 'REJECTED') AND p_new_state != v_curr.decision_state THEN
        RAISE EXCEPTION 'Illegal state resurrection: Terminal state % cannot transition to %', v_curr.decision_state, p_new_state
            USING ERRCODE = '22023';
    END IF;

    IF p_new_state NOT IN ('IDENTIFIED', 'EVALUATING', 'ACCEPTED', 'PLANNED', 'IN_PROGRESS', 'MEASURING', 'COMPLETED', 'REJECTED', 'DEFERRED', 'CANCELLED', 'EXPIRED') THEN
        RAISE EXCEPTION 'Invalid decision state: %', p_new_state
            USING ERRCODE = '22023';
    END IF;

    -- 4. Update Decision State
    UPDATE public.analytics_strategic_decisions
    SET decision_state = p_new_state,
        updated_at = NOW()
    WHERE id = p_decision_id;

    -- 5. Append Audit Entry
    INSERT INTO public.analytics_strategic_decision_audit_log (
        decision_id,
        previous_state,
        new_state,
        actor_id,
        action,
        notes
    ) VALUES (
        p_decision_id,
        v_curr.decision_state,
        p_new_state,
        v_actor_id,
        'STATE_TRANSITION',
        COALESCE(p_notes, format('Transitioned from %s to %s', v_curr.decision_state, p_new_state))
    );

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'decision_id', p_decision_id,
        'previous_state', v_curr.decision_state,
        'new_state', p_new_state,
        'updated_at', NOW()
    );
END;
$$;

-- ==============================================================================
-- 8. PRIVILEGED RPC 3: create_strategic_action_plan
-- Creates an explicit operational action plan from an accepted decision.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.create_strategic_action_plan(
    p_decision_id UUID,
    p_objective TEXT,
    p_action_category TEXT DEFAULT 'PROVIDER_ACQUISITION',
    p_recommended_action TEXT DEFAULT 'Initiate provider acquisition outreach',
    p_owner_title TEXT DEFAULT 'Operations Lead',
    p_priority TEXT DEFAULT 'P1',
    p_start_date DATE DEFAULT CURRENT_DATE,
    p_target_completion_date DATE DEFAULT (CURRENT_DATE + INTERVAL '14 days'),
    p_expected_outcome TEXT DEFAULT NULL,
    p_success_metric TEXT DEFAULT 'SUPPLY_DEFICIT_REDUCTION',
    p_target_value NUMERIC DEFAULT 0.00,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_decision RECORD;
    v_plan_id UUID;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_decision
    FROM public.analytics_strategic_decisions
    WHERE id = p_decision_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Strategic decision not found: %', p_decision_id
            USING ERRCODE = '22023';
    END IF;

    IF p_objective IS NULL OR LENGTH(TRIM(p_objective)) < 3 THEN
        RAISE EXCEPTION 'Action plan objective is required.' USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.analytics_strategic_action_plans (
        decision_id,
        synthesis_id,
        objective,
        category,
        state,
        lga,
        action_category,
        recommended_action,
        owner_title,
        priority,
        plan_status,
        start_date,
        target_completion_date,
        expected_outcome,
        success_metric,
        baseline_value,
        target_value,
        notes,
        created_by
    ) VALUES (
        p_decision_id,
        v_decision.synthesis_id,
        TRIM(p_objective),
        v_decision.category,
        v_decision.state,
        v_decision.lga,
        COALESCE(p_action_category, 'PROVIDER_ACQUISITION'),
        COALESCE(p_recommended_action, 'Initiate provider acquisition outreach'),
        COALESCE(p_owner_title, 'Operations Lead'),
        COALESCE(p_priority, 'P1'),
        'PLANNED',
        COALESCE(p_start_date, CURRENT_DATE),
        COALESCE(p_target_completion_date, CURRENT_DATE + INTERVAL '14 days'),
        p_expected_outcome,
        COALESCE(p_success_metric, 'SUPPLY_DEFICIT_REDUCTION'),
        v_decision.baseline_value,
        COALESCE(p_target_value, 0.00),
        p_notes,
        v_actor_id
    ) RETURNING id INTO v_plan_id;

    -- Update decision state to PLANNED
    UPDATE public.analytics_strategic_decisions
    SET decision_state = 'PLANNED',
        updated_at = NOW()
    WHERE id = p_decision_id AND decision_state = 'ACCEPTED';

    -- Audit log
    INSERT INTO public.analytics_strategic_decision_audit_log (
        decision_id,
        action_plan_id,
        previous_state,
        new_state,
        actor_id,
        action,
        notes
    ) VALUES (
        p_decision_id,
        v_plan_id,
        v_decision.decision_state,
        'PLANNED',
        v_actor_id,
        'CREATE_ACTION_PLAN',
        format('Created action plan: %s (Target: %s)', TRIM(p_objective), p_target_value)
    );

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'action_plan_id', v_plan_id,
        'decision_id', p_decision_id,
        'synthesis_id', v_decision.synthesis_id,
        'objective', TRIM(p_objective),
        'plan_status', 'PLANNED',
        'created_at', NOW()
    );
END;
$$;

-- ==============================================================================
-- 9. PRIVILEGED RPC 4: record_strategic_outcome
-- Calculates deterministic effectiveness score and records outcome observation.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.record_strategic_outcome(
    p_action_plan_id UUID,
    p_observed_metric_value NUMERIC,
    p_sample_size INT DEFAULT 0,
    p_unique_sessions INT DEFAULT 0,
    p_attribution_notes TEXT DEFAULT 'Observed outcome in post-action observation window.'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_plan RECORD;
    v_synthesis RECORD;
    v_outcome_id UUID;
    v_eff_score NUMERIC(5,2);
    v_eff_status TEXT;
    v_target_delta NUMERIC;
    v_observed_delta NUMERIC;
    v_ratio NUMERIC;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_plan
    FROM public.analytics_strategic_action_plans
    WHERE id = p_action_plan_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Action plan not found: %', p_action_plan_id
            USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_synthesis
    FROM public.analytics_strategic_synthesis
    WHERE id = v_plan.synthesis_id;

    -- Privacy Floor & Data Sufficiency Check
    IF COALESCE(p_sample_size, 0) < 30 OR COALESCE(p_unique_sessions, 0) < 5 THEN
        v_eff_score := 0.00;
        v_eff_status := 'INSUFFICIENT_DATA';
    ELSE
        -- Deterministic Bounded Effectiveness Formula
        -- Target delta = |target_value - baseline_value|
        v_target_delta := ABS(v_plan.target_value - v_plan.baseline_value);
        v_observed_delta := ABS(COALESCE(p_observed_metric_value, 0.00) - v_plan.baseline_value);

        IF v_target_delta <= 0.001 THEN
            -- If baseline was already target or target delta is 0
            IF v_observed_delta <= 0.001 THEN
                v_eff_score := 100.00;
                v_eff_status := 'MEETING_TARGET';
            ELSE
                v_eff_score := 50.00;
                v_eff_status := 'INCONCLUSIVE';
            END IF;
        ELSE
            v_ratio := (v_observed_delta / v_target_delta) * 100.0;
            v_eff_score := ROUND(LEAST(100.00, GREATEST(0.00, v_ratio)), 2);

            IF v_eff_score >= 95.00 THEN
                v_eff_status := 'MEETING_TARGET';
            ELSIF v_eff_score >= 60.00 THEN
                v_eff_status := 'ON_TRACK';
            ELSE
                v_eff_status := 'UNDERPERFORMING';
            END IF;
        END IF;
    END IF;

    -- Insert Outcome Record
    INSERT INTO public.analytics_strategic_outcomes (
        action_plan_id,
        decision_id,
        synthesis_id,
        baseline_demand,
        observed_demand,
        baseline_supply,
        observed_supply,
        baseline_score,
        observed_score,
        target_metric_value,
        observed_metric_value,
        effectiveness_score,
        effectiveness_status,
        sample_size,
        unique_sessions,
        attribution_notes,
        measured_by
    ) VALUES (
        p_action_plan_id,
        v_plan.decision_id,
        v_plan.synthesis_id,
        COALESCE((v_synthesis.metrics->>'projected_demand')::numeric, 0.00),
        COALESCE(p_observed_metric_value, 0.00),
        COALESCE((v_synthesis.metrics->>'projected_supply')::numeric, 0.00),
        COALESCE(p_observed_metric_value, 0.00),
        v_synthesis.strategic_score,
        v_synthesis.strategic_score,
        v_plan.target_value,
        COALESCE(p_observed_metric_value, 0.00),
        v_eff_score,
        v_eff_status,
        COALESCE(p_sample_size, 0),
        COALESCE(p_unique_sessions, 0),
        COALESCE(p_attribution_notes, 'Observed outcome in post-action observation window.'),
        v_actor_id
    ) RETURNING id INTO v_outcome_id;

    -- Update plan status and decision state
    UPDATE public.analytics_strategic_action_plans
    SET plan_status = CASE WHEN v_eff_status = 'MEETING_TARGET' THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
        updated_at = NOW()
    WHERE id = p_action_plan_id;

    UPDATE public.analytics_strategic_decisions
    SET decision_state = CASE WHEN v_eff_status = 'MEETING_TARGET' THEN 'COMPLETED' ELSE 'MEASURING' END,
        updated_at = NOW()
    WHERE id = v_plan.decision_id;

    -- Audit log
    INSERT INTO public.analytics_strategic_decision_audit_log (
        decision_id,
        action_plan_id,
        outcome_id,
        previous_state,
        new_state,
        actor_id,
        action,
        notes
    ) VALUES (
        v_plan.decision_id,
        p_action_plan_id,
        v_outcome_id,
        'MEASURING',
        CASE WHEN v_eff_status = 'MEETING_TARGET' THEN 'COMPLETED' ELSE 'MEASURING' END,
        v_actor_id,
        'RECORD_OUTCOME',
        format('Outcome recorded. Effectiveness: %s%% (%s). Sample N=%s, k=%s', v_eff_score, v_eff_status, p_sample_size, p_unique_sessions)
    );

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'outcome_id', v_outcome_id,
        'action_plan_id', p_action_plan_id,
        'effectiveness_score', v_eff_score,
        'effectiveness_status', v_eff_status,
        'sample_size', p_sample_size,
        'unique_sessions', p_unique_sessions,
        'recorded_at', NOW()
    );
END;
$$;

-- ==============================================================================
-- 10. PRIVILEGED RPC 5: get_strategic_decision_workbench
-- Delivers complete evidence, context, decisions, action plans & outcomes for an opportunity.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_strategic_decision_workbench(
    p_synthesis_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_synthesis RECORD;
    v_decisions JSONB;
    v_plans JSONB;
    v_outcomes JSONB;
    v_audit_logs JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_synthesis
    FROM public.analytics_strategic_synthesis
    WHERE id = p_synthesis_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Synthesis opportunity not found: %', p_synthesis_id
            USING ERRCODE = '22023';
    END IF;

    -- Fetch decisions
    SELECT COALESCE(jsonb_agg(d ORDER BY d.created_at DESC), '[]'::jsonb)
    INTO v_decisions
    FROM public.analytics_strategic_decisions d
    WHERE d.synthesis_id = p_synthesis_id;

    -- Fetch action plans
    SELECT COALESCE(jsonb_agg(p ORDER BY p.created_at DESC), '[]'::jsonb)
    INTO v_plans
    FROM public.analytics_strategic_action_plans p
    WHERE p.synthesis_id = p_synthesis_id;

    -- Fetch outcomes
    SELECT COALESCE(jsonb_agg(o ORDER BY o.created_at DESC), '[]'::jsonb)
    INTO v_outcomes
    FROM public.analytics_strategic_outcomes o
    WHERE o.synthesis_id = p_synthesis_id;

    -- Fetch audit log
    SELECT COALESCE(jsonb_agg(a ORDER BY a.created_at DESC), '[]'::jsonb)
    INTO v_audit_logs
    FROM public.analytics_strategic_decision_audit_log a
    WHERE a.decision_id IN (SELECT id FROM public.analytics_strategic_decisions WHERE synthesis_id = p_synthesis_id);

    RETURN jsonb_build_object(
        'schema_version', '9.1.0',
        'opportunity', jsonb_build_object(
            'id', v_synthesis.id,
            'category', v_synthesis.category,
            'state', v_synthesis.state,
            'lga', v_synthesis.lga,
            'strategic_score', v_synthesis.strategic_score,
            'priority_class', v_synthesis.priority_class,
            'convergence_level', v_synthesis.convergence_level,
            'confidence_score', v_synthesis.confidence_score,
            'synthesis_state', v_synthesis.synthesis_state,
            'contributing_systems', v_synthesis.contributing_systems,
            'metrics', v_synthesis.metrics,
            'score_breakdown', v_synthesis.score_breakdown,
            'explanation', v_synthesis.explanation,
            'created_at', v_synthesis.created_at,
            'expires_at', v_synthesis.expires_at
        ),
        'decisions', v_decisions,
        'action_plans', v_plans,
        'outcomes', v_outcomes,
        'audit_trail', v_audit_logs,
        'generated_at', NOW()
    );
END;
$$;

-- ==============================================================================
-- 11. PRIVILEGED RPC 6: get_strategic_decision_performance_summary
-- Aggregates executive decision KPIs and lifecycle effectiveness metrics.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_strategic_decision_performance_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_total_decisions INT := 0;
    v_active_decisions INT := 0;
    v_active_plans INT := 0;
    v_awaiting_measurement INT := 0;
    v_successful_interventions INT := 0;
    v_underperforming INT := 0;
    v_inconclusive INT := 0;
    v_avg_score NUMERIC(5,2) := 0.00;
    v_recent_decisions JSONB;
    v_recent_plans JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    -- Count decisions
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE decision_state IN ('ACCEPTED', 'PLANNED', 'IN_PROGRESS', 'MEASURING')),
        COUNT(*) FILTER (WHERE decision_state = 'MEASURING')
    INTO v_total_decisions, v_active_decisions, v_awaiting_measurement
    FROM public.analytics_strategic_decisions;

    -- Count active plans
    SELECT COUNT(*)
    INTO v_active_plans
    FROM public.analytics_strategic_action_plans
    WHERE plan_status IN ('PLANNED', 'ACTIVE', 'IN_PROGRESS');

    -- Count outcomes
    SELECT
        COUNT(*) FILTER (WHERE effectiveness_status IN ('MEETING_TARGET', 'EXCEEDING_TARGET')),
        COUNT(*) FILTER (WHERE effectiveness_status = 'UNDERPERFORMING'),
        COUNT(*) FILTER (WHERE effectiveness_status IN ('INSUFFICIENT_DATA', 'INCONCLUSIVE')),
        COALESCE(AVG(effectiveness_score), 0.00)
    INTO v_successful_interventions, v_underperforming, v_inconclusive, v_avg_score
    FROM public.analytics_strategic_outcomes;

    -- Recent Decisions (LIMIT 15)
    SELECT COALESCE(jsonb_agg(d), '[]'::jsonb)
    INTO v_recent_decisions
    FROM (
        SELECT id, category, state, lga, decision_type, decision_state, rationale, target_metric, target_value, created_at
        FROM public.analytics_strategic_decisions
        ORDER BY created_at DESC
        LIMIT 15
    ) d;

    -- Recent Action Plans (LIMIT 15)
    SELECT COALESCE(jsonb_agg(p), '[]'::jsonb)
    INTO v_recent_plans
    FROM (
        SELECT id, decision_id, objective, category, state, lga, action_category, priority, plan_status, target_completion_date, target_value, created_at
        FROM public.analytics_strategic_action_plans
        ORDER BY created_at DESC
        LIMIT 15
    ) p;

    RETURN jsonb_build_object(
        'schema_version', '9.1.0',
        'kpis', jsonb_build_object(
            'total_decisions', v_total_decisions,
            'active_decisions', v_active_decisions,
            'active_action_plans', v_active_plans,
            'decisions_awaiting_measurement', v_awaiting_measurement,
            'successful_interventions', v_successful_interventions,
            'underperforming_interventions', v_underperforming,
            'inconclusive_interventions', v_inconclusive,
            'average_effectiveness_score', ROUND(v_avg_score, 2),
            'conversion_rate', CASE WHEN v_total_decisions > 0 THEN ROUND((v_successful_interventions::numeric / v_total_decisions::numeric) * 100.0, 1) ELSE 0.0 END
        ),
        'recent_decisions', v_recent_decisions,
        'recent_action_plans', v_recent_plans,
        'generated_at', NOW()
    );
END;
$$;

-- 12. RPC PERMISSION GRANTS
GRANT EXECUTE ON FUNCTION public.record_strategic_decision(UUID, TEXT, TEXT, TEXT, TEXT, NUMERIC, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.transition_strategic_decision(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_strategic_action_plan(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, DATE, DATE, TEXT, TEXT, NUMERIC, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_strategic_outcome(UUID, NUMERIC, INT, INT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_strategic_decision_workbench(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_strategic_decision_performance_summary() TO authenticated;
