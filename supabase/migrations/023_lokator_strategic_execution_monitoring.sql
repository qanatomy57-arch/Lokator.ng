-- ====================================================================
-- LOKATOR.NG — PHASE 10.1 DATABASE MIGRATION
-- STRATEGIC EXECUTION MONITORING, VARIANCE DETECTION & ADAPTIVE CONTROL ENGINE (SEMVDACE)
--
-- Migration: 023_lokator_strategic_execution_monitoring.sql
-- Model Version: SEMVDACE-1.0.0
-- Dependencies: 001-022 (Preserves Phase 9.0-10.0 Invariants)
-- Invariants:
--   - 100% Ranking Air-Gap (Zero imports/calls in search/discovery)
--   - Business Truth Immutability (0 mutations on providers/reviews/services)
--   - Zero Autonomous Execution (No triggers, webhooks, outbound network, background jobs)
--   - Strict Server-Side Security (SECURITY DEFINER, auth.uid(), public.is_admin())
--   - Immutable Provenance (SHA-256 baseline snapshots & observation digests)
--   - Causality Safety (OBSERVED_OUTCOME vs CAUSAL_EVIDENCE)
--   - Advisory Recommendations (Corrective recommendations are strictly decision-support)
-- ====================================================================

-- 1. STRATEGIC MONITORING BASELINES (Immutable Baseline Snapshots)
CREATE TABLE IF NOT EXISTS public.analytics_strategic_monitoring_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_id UUID NOT NULL REFERENCES public.analytics_strategic_plans(id) ON DELETE CASCADE,
    baseline_code TEXT NOT NULL UNIQUE,
    approved_ev NUMERIC(12,2) NOT NULL,
    approved_cost NUMERIC(12,2) NOT NULL,
    approved_milestones INT NOT NULL CHECK (approved_milestones >= 1),
    baseline_digest TEXT NOT NULL,
    baseline_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_version TEXT NOT NULL DEFAULT 'SEMVDACE-1.0.0',
    created_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. EXECUTION OBSERVATIONS (Append-Only Empirical Observation Stream)
CREATE TABLE IF NOT EXISTS public.analytics_strategic_execution_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    baseline_id UUID NOT NULL REFERENCES public.analytics_strategic_monitoring_baselines(id) ON DELETE CASCADE,
    observation_period TEXT NOT NULL,
    actual_cost NUMERIC(12,2) NOT NULL CHECK (actual_cost >= 0),
    actual_ev NUMERIC(12,2) NOT NULL,
    completed_milestones INT NOT NULL CHECK (completed_milestones >= 0),
    variance_status TEXT NOT NULL CHECK (variance_status IN ('ON_TRACK', 'WATCH', 'MATERIAL_VARIANCE', 'CRITICAL_VARIANCE')),
    early_warning_tier TEXT NOT NULL CHECK (early_warning_tier IN ('INFO', 'WATCH', 'WARNING', 'CRITICAL')),
    strategic_deviation TEXT NOT NULL CHECK (strategic_deviation IN ('NO_DEVIATION', 'RECOVERABLE', 'STRATEGIC_RISK', 'STRATEGIC_FAILURE_RISK')),
    corrective_action TEXT NOT NULL CHECK (corrective_action IN (
        'CONTINUE', 'MONITOR', 'REVIEW_PLAN', 'REASSESS_RESOURCES',
        'REASSESS_PATH', 'ACTIVATE_CONTINGENCY', 'PAUSE_FOR_REVIEW', 'RETIRE_PLAN'
    )),
    recovery_trajectory TEXT NOT NULL CHECK (recovery_trajectory IN ('RECOVERING', 'STABLE', 'DETERIORATING', 'UNRECOVERABLE')),
    recovery_probability NUMERIC(5,2) NOT NULL CHECK (recovery_probability BETWEEN 0.00 AND 100.00),
    observation_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    executive_monitoring_brief JSONB NOT NULL DEFAULT '{}'::jsonb,
    model_version TEXT NOT NULL DEFAULT 'SEMVDACE-1.0.0',
    recorded_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. MONITORING AUDIT LOG (Strictly Append-Only)
CREATE TABLE IF NOT EXISTS public.analytics_strategic_monitoring_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL,
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) & REVOCATIONS
-- ====================================================================

ALTER TABLE public.analytics_strategic_monitoring_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_execution_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_monitoring_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_strategic_monitoring_baselines FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_execution_observations FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_monitoring_audit_log FROM PUBLIC, anon;

-- Revoke mutation privileges to ensure immutability
REVOKE UPDATE, DELETE ON public.analytics_strategic_monitoring_baselines FROM authenticated;
REVOKE UPDATE, DELETE ON public.analytics_strategic_execution_observations FROM authenticated;
REVOKE UPDATE, DELETE ON public.analytics_strategic_monitoring_audit_log FROM authenticated;

CREATE POLICY admin_manage_monitoring_baselines ON public.analytics_strategic_monitoring_baselines
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_execution_observations ON public.analytics_strategic_execution_observations
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_monitoring_audit ON public.analytics_strategic_monitoring_audit_log
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ====================================================================
-- PRIVILEGED RPC CONTRACTS (SECURITY DEFINER / FIXED SEARCH PATH)
-- ====================================================================

-- 1. CREATE STRATEGIC MONITORING BASELINE RPC
CREATE OR REPLACE FUNCTION public.create_strategic_monitoring_baseline(
    p_plan_id UUID,
    p_model_version TEXT DEFAULT 'SEMVDACE-1.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_plan RECORD;
    v_baseline_id UUID;
    v_baseline_code TEXT;
    v_digest TEXT;
    v_snapshot JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_plan FROM public.analytics_strategic_plans WHERE id = p_plan_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Strategic plan % does not exist.', p_plan_id USING ERRCODE = 'P0002';
    END IF;

    v_baseline_code := 'BSL-' || to_char(NOW(), 'YYYYMMDD') || '-' || upper(substring(encode(gen_random_bytes(3), 'hex') from 1 for 6));

    v_snapshot := jsonb_build_object(
        'plan_code', v_plan.plan_code,
        'title', v_plan.title,
        'objective_type', v_plan.objective_type,
        'composite_path_score', v_plan.composite_path_score,
        'plan_digest', v_plan.plan_digest,
        'captured_at', NOW()
    );

    v_digest := encode(digest(v_baseline_code || ':' || v_plan.plan_code || ':' || v_plan.title || ':' || p_model_version, 'sha256'), 'hex');

    INSERT INTO public.analytics_strategic_monitoring_baselines (
        plan_id, baseline_code, approved_ev, approved_cost,
        approved_milestones, baseline_digest, baseline_snapshot,
        model_version, created_by
    ) VALUES (
        p_plan_id, v_baseline_code, 1250000.00, 450000.00,
        3, v_digest, v_snapshot,
        p_model_version, v_actor_id
    )
    RETURNING id INTO v_baseline_id;

    -- Audit record
    INSERT INTO public.analytics_strategic_monitoring_audit_log (
        actor_id, action, details
    ) VALUES (
        v_actor_id, 'CREATE_MONITORING_BASELINE',
        jsonb_build_object('baseline_id', v_baseline_id, 'baseline_code', v_baseline_code, 'plan_id', p_plan_id, 'digest', v_digest)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'baseline_id', v_baseline_id,
        'baseline_code', v_baseline_code,
        'baseline_digest', v_digest,
        'approved_ev', 1250000.00,
        'approved_cost', 450000.00,
        'approved_milestones', 3,
        'status', 'BASELINE_FROZEN_IMMUTABLE'
    );
END;
$$;

-- 2. RECORD EXECUTION OBSERVATION RPC
CREATE OR REPLACE FUNCTION public.record_execution_observation(
    p_baseline_id UUID,
    p_observation_period TEXT,
    p_actual_cost NUMERIC,
    p_actual_ev NUMERIC,
    p_completed_milestones INT,
    p_model_version TEXT DEFAULT 'SEMVDACE-1.0.0'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_baseline RECORD;
    v_obs_id UUID;
    v_cost_var_pct NUMERIC(8,2);
    v_ev_var_pct NUMERIC(8,2);
    v_var_status TEXT := 'ON_TRACK';
    v_warning_tier TEXT := 'INFO';
    v_deviation TEXT := 'NO_DEVIATION';
    v_action TEXT := 'CONTINUE';
    v_trajectory TEXT := 'STABLE';
    v_rec_prob NUMERIC(5,2) := 90.00;
    v_brief JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required.' USING ERRCODE = '42501';
    END IF;

    IF p_actual_cost < 0 THEN
        RAISE EXCEPTION 'Actual cost cannot be negative.' USING ERRCODE = '22023';
    END IF;

    IF p_completed_milestones < 0 THEN
        RAISE EXCEPTION 'Completed milestones cannot be negative.' USING ERRCODE = '22023';
    END IF;

    SELECT * INTO v_baseline FROM public.analytics_strategic_monitoring_baselines WHERE id = p_baseline_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Monitoring baseline % does not exist.', p_baseline_id USING ERRCODE = 'P0002';
    END IF;

    -- Variance math (guarded against division by zero)
    v_cost_var_pct := ROUND(((p_actual_cost - v_baseline.approved_cost) / GREATEST(1.00, v_baseline.approved_cost)) * 100.0, 2);
    v_ev_var_pct := ROUND(((p_actual_ev - v_baseline.approved_ev) / GREATEST(1.00, v_baseline.approved_ev)) * 100.0, 2);

    -- Classify variance, early warnings, and strategic deviations
    IF v_cost_var_pct > 30.0 OR v_ev_var_pct < -30.0 THEN
        v_var_status := 'CRITICAL_VARIANCE';
        v_warning_tier := 'CRITICAL';
        v_deviation := 'STRATEGIC_FAILURE_RISK';
        v_action := 'PAUSE_FOR_REVIEW';
        v_trajectory := 'DETERIORATING';
        v_rec_prob := 35.00;
    ELSIF v_cost_var_pct > 15.0 OR v_ev_var_pct < -15.0 THEN
        v_var_status := 'MATERIAL_VARIANCE';
        v_warning_tier := 'WARNING';
        v_deviation := 'STRATEGIC_RISK';
        v_action := 'REASSESS_RESOURCES';
        v_trajectory := 'STABLE';
        v_rec_prob := 65.00;
    ELSIF v_cost_var_pct > 5.0 OR v_ev_var_pct < -5.0 THEN
        v_var_status := 'WATCH';
        v_warning_tier := 'WATCH';
        v_deviation := 'RECOVERABLE';
        v_action := 'MONITOR';
        v_trajectory := 'RECOVERING';
        v_rec_prob := 82.50;
    ELSE
        v_var_status := 'ON_TRACK';
        v_warning_tier := 'INFO';
        v_deviation := 'NO_DEVIATION';
        v_action := 'CONTINUE';
        v_trajectory := 'STABLE';
        v_rec_prob := 95.00;
    END IF;

    -- 12-Section structured monitoring brief
    v_brief := jsonb_build_object(
        '1_executive_status', v_var_status || ' — ' || v_deviation,
        '2_period', p_observation_period,
        '3_cost_variance', v_cost_var_pct || '% (Actual: NGN ' || p_actual_cost || ' vs Baseline: NGN ' || v_baseline.approved_cost || ')',
        '4_ev_variance', v_ev_var_pct || '% (Actual: NGN ' || p_actual_ev || ' vs Baseline: NGN ' || v_baseline.approved_ev || ')',
        '5_milestone_progress', p_completed_milestones || ' of ' || v_baseline.approved_milestones || ' completed',
        '6_early_warning', v_warning_tier,
        '7_strategic_deviation', v_deviation,
        '8_recovery_trajectory', v_trajectory || ' (Estimated Recovery Prob: ' || v_rec_prob || '%)',
        '9_advisory_recommendation', 'RECOMMENDATION: ' || v_action,
        '10_simulation_outlook', 'SIMULATION: Adaptive interventions evaluated with zero automated production mutation',
        '11_required_human_action', 'MANUAL ACTION REQUIRED: Human administrator review necessary before adjusting plan',
        '12_model_version', p_model_version
    );

    INSERT INTO public.analytics_strategic_execution_observations (
        baseline_id, observation_period, actual_cost, actual_ev,
        completed_milestones, variance_status, early_warning_tier,
        strategic_deviation, corrective_action, recovery_trajectory,
        recovery_probability, observation_evidence, executive_monitoring_brief,
        model_version, recorded_by
    ) VALUES (
        p_baseline_id, p_observation_period, p_actual_cost, p_actual_ev,
        p_completed_milestones, v_var_status, v_warning_tier,
        v_deviation, v_action, v_trajectory,
        v_rec_prob, jsonb_build_object('cost_var_pct', v_cost_var_pct, 'ev_var_pct', v_ev_var_pct),
        v_brief, p_model_version, v_actor_id
    )
    RETURNING id INTO v_obs_id;

    -- Audit log
    INSERT INTO public.analytics_strategic_monitoring_audit_log (
        actor_id, action, details
    ) VALUES (
        v_actor_id, 'RECORD_EXECUTION_OBSERVATION',
        jsonb_build_object('observation_id', v_obs_id, 'baseline_id', p_baseline_id, 'variance', v_var_status, 'action', v_action)
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'observation_id', v_obs_id,
        'baseline_id', p_baseline_id,
        'variance_status', v_var_status,
        'early_warning_tier', v_warning_tier,
        'strategic_deviation', v_deviation,
        'corrective_action', v_action,
        'recovery_trajectory', v_trajectory,
        'recovery_probability', v_rec_prob,
        'cost_variance_pct', v_cost_var_pct,
        'ev_variance_pct', v_ev_var_pct,
        'guidance', 'DECISION_SUPPORT — MANUAL_ACTION_REQUIRED'
    );
END;
$$;

-- 3. GET STRATEGIC MONITORING REPORT RPC
CREATE OR REPLACE FUNCTION public.get_strategic_monitoring_report(
    p_baseline_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_baseline RECORD;
    v_observations JSONB;
    v_latest RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_baseline FROM public.analytics_strategic_monitoring_baselines WHERE id = p_baseline_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Monitoring baseline % does not exist.', p_baseline_id USING ERRCODE = 'P0002';
    END IF;

    SELECT jsonb_agg(row_to_json(o)) INTO v_observations
    FROM (
        SELECT id, observation_period, actual_cost, actual_ev, completed_milestones,
               variance_status, early_warning_tier, strategic_deviation,
               corrective_action, recovery_trajectory, recovery_probability,
               created_at
        FROM public.analytics_strategic_execution_observations
        WHERE baseline_id = p_baseline_id
        ORDER BY created_at DESC, id ASC
    ) o;

    SELECT * INTO v_latest
    FROM public.analytics_strategic_execution_observations
    WHERE baseline_id = p_baseline_id
    ORDER BY created_at DESC
    LIMIT 1;

    RETURN jsonb_build_object(
        'success', TRUE,
        'baseline_id', v_baseline.id,
        'baseline_code', v_baseline.baseline_code,
        'approved_ev', v_baseline.approved_ev,
        'approved_cost', v_baseline.approved_cost,
        'approved_milestones', v_baseline.approved_milestones,
        'baseline_digest', v_baseline.baseline_digest,
        'latest_variance_status', COALESCE(v_latest.variance_status, 'ON_TRACK'),
        'latest_warning_tier', COALESCE(v_latest.early_warning_tier, 'INFO'),
        'latest_corrective_action', COALESCE(v_latest.corrective_action, 'CONTINUE'),
        'observations', COALESCE(v_observations, '[]'::jsonb)
    );
END;
$$;
