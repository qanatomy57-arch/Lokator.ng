-- ==============================================================================
-- LOKATOR.NG — PHASE 9.2 DATABASE MIGRATION
-- CONTINUOUS STRATEGIC ORCHESTRATION & EXECUTIVE INTELLIGENCE (CSOEI)
-- Migration: 014_lokator_continuous_strategic_orchestration.sql
--
-- INVARIANTS ENFORCED:
-- 1. OBSERVATIONAL & DECISION-SUPPORT ONLY — Zero autonomous marketplace mutations.
-- 2. RANKING AIR-GAP — Live search ranking in search.js is 100% isolated from orchestration.
-- 3. BUSINESS TRUTH IMMUTABILITY — Zero mutations against public.providers, reviews, or provider_services.
-- 4. ACCEPTED != EXECUTED — Administrative intent only; all marketplace actions are manual/external.
-- 5. PRIVACY FLOOR — Hard enforcement of N >= 30 sample floor and k >= 5 diversity threshold.
-- 6. IMMUTABLE AUDIT TRAIL — Append-only orchestration event log with REVOKE UPDATE, DELETE.
-- 7. SECURITY DEFINER HARDENING — Fixed search_path and server-side public.is_admin() verification.
-- 8. BOUNDED DETERMINISTIC SCORING — Math models for aging, decay, freshness, and learning multipliers in [0.50, 1.50].
-- 9. RESOURCE SAFETY — All feed and cycle queries strictly bounded with LIMIT <= 50.
-- ==============================================================================

-- 1. STRATEGIC ORCHESTRATION EVENTS TABLE (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.analytics_strategic_orchestration_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL 
        CHECK (event_type IN (
            'SIGNAL_DETECTED', 
            'DECISION_AGING', 
            'ACTION_PLAN_OVERDUE', 
            'MEASUREMENT_READY', 
            'CONFIDENCE_DECAY', 
            'INTELLIGENCE_STALE', 
            'ESCALATION_REQUIRED', 
            'REASSESSMENT_REQUIRED', 
            'STRATEGY_LEARNING_UPDATED', 
            'EXECUTIVE_SUMMARY_REFRESHED',
            'ORCHESTRATION_EVALUATION'
        )),
    synthesis_id UUID REFERENCES public.analytics_strategic_synthesis(id) ON DELETE SET NULL,
    decision_id UUID REFERENCES public.analytics_strategic_decisions(id) ON DELETE SET NULL,
    action_plan_id UUID REFERENCES public.analytics_strategic_action_plans(id) ON DELETE SET NULL,
    severity TEXT NOT NULL DEFAULT 'INFO'
        CHECK (severity IN ('INFO', 'NOTICE', 'WARNING', 'CRITICAL')),
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    evaluated_by UUID NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orchestration_events_type_created
    ON public.analytics_strategic_orchestration_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orchestration_events_decision
    ON public.analytics_strategic_orchestration_events (decision_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orchestration_events_severity
    ON public.analytics_strategic_orchestration_events (severity, created_at DESC);

-- 2. STRATEGY LEARNING AGGREGATES TABLE (PRIVACY-PRESERVING HISTORICAL EFFICACY)
CREATE TABLE IF NOT EXISTS public.analytics_strategy_learning_aggregates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action_category TEXT NOT NULL,
    category TEXT NOT NULL,
    state TEXT NOT NULL,
    total_interventions INT NOT NULL DEFAULT 0,
    successful_interventions INT NOT NULL DEFAULT 0,
    underperforming_interventions INT NOT NULL DEFAULT 0,
    average_effectiveness_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 
        CHECK (average_effectiveness_score >= 0.00 AND average_effectiveness_score <= 100.00),
    strategy_multiplier NUMERIC(3,2) NOT NULL DEFAULT 1.00
        CHECK (strategy_multiplier >= 0.50 AND strategy_multiplier <= 1.50),
    total_sample_size INT NOT NULL DEFAULT 0,
    total_unique_sessions INT NOT NULL DEFAULT 0,
    confidence_rating TEXT NOT NULL DEFAULT 'INSUFFICIENT_DATA'
        CHECK (confidence_rating IN ('HIGH', 'MODERATE', 'LOW', 'INSUFFICIENT_DATA')),
    last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_strategy_learning_cohort UNIQUE (action_category, category, state)
);

CREATE INDEX IF NOT EXISTS idx_strategy_learning_cohort
    ON public.analytics_strategy_learning_aggregates (action_category, category, state);

CREATE INDEX IF NOT EXISTS idx_strategy_learning_score
    ON public.analytics_strategy_learning_aggregates (average_effectiveness_score DESC);

-- 3. ROW LEVEL SECURITY & PERMISSION HARDENING
ALTER TABLE public.analytics_strategic_orchestration_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategy_learning_aggregates ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_strategic_orchestration_events FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategy_learning_aggregates FROM PUBLIC, anon;

-- Explicitly revoke UPDATE and DELETE on orchestration events to enforce append-only immutability
REVOKE UPDATE, DELETE ON public.analytics_strategic_orchestration_events FROM authenticated;

-- Admin RLS Policies
CREATE POLICY admin_manage_orchestration_events ON public.analytics_strategic_orchestration_events
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_manage_strategy_learning ON public.analytics_strategy_learning_aggregates
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- 4. PRIVILEGED RPC 1: evaluate_strategic_orchestration_cycle
-- Runs deterministic continuous evaluation of aging, decay, and learning.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.evaluate_strategic_orchestration_cycle(
    p_force_reevaluate BOOLEAN DEFAULT FALSE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_now TIMESTAMPTZ := NOW();
    v_last_eval TIMESTAMPTZ;
    v_events_count INT := 0;
    v_stalled_decisions INT := 0;
    v_overdue_plans INT := 0;
    v_awaiting_measurement INT := 0;
    v_decayed_syntheses INT := 0;
    v_escalations INT := 0;
    v_rec RECORD;
    v_decay_conf NUMERIC(5,4);
    v_freshness NUMERIC(3,2);
    v_days_old NUMERIC;
    v_eff_score NUMERIC(5,2);
    v_mult NUMERIC(3,2);
    v_conf_rating TEXT;
BEGIN
    -- 1. Security Gate: Verify admin privileges
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    -- 2. Derive actor strictly from server-side session
    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated request. Server session required.'
            USING ERRCODE = '42501';
    END IF;

    -- 3. Debounce & Cooldown Check (60-second window unless forced)
    IF NOT p_force_reevaluate THEN
        SELECT created_at INTO v_last_eval
        FROM public.analytics_strategic_orchestration_events
        WHERE event_type = 'ORCHESTRATION_EVALUATION'
        ORDER BY created_at DESC
        LIMIT 1;

        IF v_last_eval IS NOT NULL AND v_now - v_last_eval < INTERVAL '60 seconds' THEN
            RETURN jsonb_build_object(
                'status', 'COOLDOWN_ACTIVE',
                'message', 'Orchestration cycle evaluated within past 60 seconds. Evaluation throttled.',
                'last_evaluated_at', v_last_eval,
                'cooldown_remaining_seconds', GREATEST(0, EXTRACT(EPOCH FROM (v_last_eval + INTERVAL '60 seconds' - v_now))::int)
            );
        END IF;
    END IF;

    -- 4. ENGINE 2: DECISION AGING (Accepted decisions without action plans > 7 days)
    FOR v_rec IN 
        SELECT d.id, d.synthesis_id, d.category, d.state, d.lga, d.created_at,
               EXTRACT(DAY FROM (v_now - d.created_at)) AS days_idle
        FROM public.analytics_strategic_decisions d
        WHERE d.decision_state = 'ACCEPTED'
          AND NOT EXISTS (
              SELECT 1 FROM public.analytics_strategic_action_plans p
              WHERE p.decision_id = d.id
          )
          AND d.created_at < (v_now - INTERVAL '7 days')
        LIMIT 50
    LOOP
        INSERT INTO public.analytics_strategic_orchestration_events (
            event_type,
            decision_id,
            synthesis_id,
            severity,
            details,
            evaluated_by
        ) VALUES (
            'DECISION_AGING',
            v_rec.id,
            v_rec.synthesis_id,
            CASE WHEN v_rec.days_idle >= 14 THEN 'CRITICAL' ELSE 'WARNING' END,
            jsonb_build_object(
                'days_idle', v_rec.days_idle,
                'category', v_rec.category,
                'lga', v_rec.lga,
                'state', v_rec.state,
                'message', format('Decision accepted %s days ago without an action plan.', v_rec.days_idle)
            ),
            v_actor_id
        );
        v_stalled_decisions := v_stalled_decisions + 1;
        v_events_count := v_events_count + 1;
    END LOOP;

    -- 5. ENGINE 3: ACTION PLAN AGING & OVERDUE (target_completion_date passed & active)
    FOR v_rec IN 
        SELECT p.id, p.decision_id, p.synthesis_id, p.objective, p.target_completion_date,
               (CURRENT_DATE - p.target_completion_date) AS slippage_days
        FROM public.analytics_strategic_action_plans p
        WHERE p.plan_status IN ('PLANNED', 'ACTIVE', 'IN_PROGRESS')
          AND p.target_completion_date < CURRENT_DATE
        LIMIT 50
    LOOP
        INSERT INTO public.analytics_strategic_orchestration_events (
            event_type,
            decision_id,
            action_plan_id,
            synthesis_id,
            severity,
            details,
            evaluated_by
        ) VALUES (
            'ACTION_PLAN_OVERDUE',
            v_rec.decision_id,
            v_rec.id,
            v_rec.synthesis_id,
            CASE WHEN v_rec.slippage_days >= 7 THEN 'CRITICAL' ELSE 'WARNING' END,
            jsonb_build_object(
                'slippage_days', v_rec.slippage_days,
                'target_completion_date', v_rec.target_completion_date,
                'objective', v_rec.objective,
                'message', format('Action plan "%s" is overdue by %s days.', v_rec.objective, v_rec.slippage_days)
            ),
            v_actor_id
        );
        v_overdue_plans := v_overdue_plans + 1;
        v_events_count := v_events_count + 1;
    END LOOP;

    -- 6. ENGINE 4: OUTCOME MEASUREMENT SCHEDULER (observation window ended, no outcome)
    FOR v_rec IN 
        SELECT p.id AS plan_id, p.decision_id, p.synthesis_id, p.objective, p.start_date,
               d.observation_window_days,
               (p.start_date + (d.observation_window_days || ' days')::INTERVAL) AS obs_end_date
        FROM public.analytics_strategic_action_plans p
        JOIN public.analytics_strategic_decisions d ON d.id = p.decision_id
        WHERE p.plan_status IN ('PLANNED', 'ACTIVE', 'IN_PROGRESS')
          AND (p.start_date + (d.observation_window_days || ' days')::INTERVAL) <= v_now
          AND NOT EXISTS (
              SELECT 1 FROM public.analytics_strategic_outcomes o
              WHERE o.action_plan_id = p.id
          )
        LIMIT 50
    LOOP
        INSERT INTO public.analytics_strategic_orchestration_events (
            event_type,
            decision_id,
            action_plan_id,
            synthesis_id,
            severity,
            details,
            evaluated_by
        ) VALUES (
            'MEASUREMENT_READY',
            v_rec.decision_id,
            v_rec.plan_id,
            v_rec.synthesis_id,
            'NOTICE',
            jsonb_build_object(
                'observation_window_days', v_rec.observation_window_days,
                'start_date', v_rec.start_date,
                'observation_ended_at', v_rec.obs_end_date,
                'objective', v_rec.objective,
                'message', format('Observation window (%s days) concluded. Ready for outcome measurement.', v_rec.observation_window_days)
            ),
            v_actor_id
        );
        v_awaiting_measurement := v_awaiting_measurement + 1;
        v_events_count := v_events_count + 1;
    END LOOP;

    -- 7. ENGINE 5 & 6: CONFIDENCE DECAY & FRESHNESS (Half-life = 7 days, max = 14 days)
    FOR v_rec IN 
        SELECT s.id, s.strategic_score, s.confidence_score, s.updated_at,
               EXTRACT(EPOCH FROM (v_now - s.updated_at)) / 86400.0 AS age_days
        FROM public.analytics_strategic_synthesis s
        WHERE s.synthesis_state IN ('DETECTED', 'PRIORITIZED', 'WATCH')
          AND s.updated_at < (v_now - INTERVAL '3 days')
        LIMIT 50
    LOOP
        v_days_old := v_rec.age_days;
        -- C(t) = C0 * (0.5)^(t/7)
        v_decay_conf := ROUND(LEAST(1.0000, GREATEST(0.0000, v_rec.confidence_score * POWER(0.5, v_days_old / 7.0))), 4);
        -- F(t) = max(0, 1 - t/14)
        v_freshness := ROUND(LEAST(1.00, GREATEST(0.00, 1.00 - (v_days_old / 14.0))), 2);

        IF v_decay_conf < 0.3500 THEN
            INSERT INTO public.analytics_strategic_orchestration_events (
                event_type,
                synthesis_id,
                severity,
                details,
                evaluated_by
            ) VALUES (
                'CONFIDENCE_DECAY',
                v_rec.id,
                'WARNING',
                jsonb_build_object(
                    'original_confidence', v_rec.confidence_score,
                    'decayed_confidence', v_decay_conf,
                    'freshness_score', v_freshness,
                    'age_days', ROUND(v_days_old, 1),
                    'message', format('Synthesis confidence decayed to %s (Age: %s days). Re-evaluation recommended.', v_decay_conf, ROUND(v_days_old, 1))
                ),
                v_actor_id
            );
            v_decayed_syntheses := v_decayed_syntheses + 1;
            v_events_count := v_events_count + 1;
        END IF;
    END LOOP;

    -- 8. ENGINE 8: STRATEGY LEARNING AGGREGATION (Privacy threshold N >= 30, k >= 5)
    FOR v_rec IN
        SELECT 
            p.action_category,
            p.category,
            p.state,
            COUNT(o.id) AS total_interventions,
            COUNT(CASE WHEN o.effectiveness_status IN ('MEETING_TARGET', 'EXCEEDING_TARGET') THEN 1 END) AS successful_interventions,
            COUNT(CASE WHEN o.effectiveness_status = 'UNDERPERFORMING' THEN 1 END) AS underperforming_interventions,
            COALESCE(AVG(o.effectiveness_score), 0.00) AS avg_effectiveness,
            COALESCE(SUM(o.sample_size), 0) AS total_sample_size,
            COALESCE(SUM(o.unique_sessions), 0) AS total_unique_sessions
        FROM public.analytics_strategic_outcomes o
        JOIN public.analytics_strategic_action_plans p ON p.id = o.action_plan_id
        GROUP BY p.action_category, p.category, p.state
        LIMIT 50
    LOOP
        v_eff_score := ROUND(v_rec.avg_effectiveness, 2);
        
        -- Enforce Privacy Floor: N >= 30 and k >= 5
        IF v_rec.total_sample_size >= 30 AND v_rec.total_unique_sessions >= 5 AND v_rec.total_interventions >= 1 THEN
            -- Strategy Multiplier M in [0.50, 1.50]: M = 0.50 + (avg_score / 100.0)
            v_mult := ROUND(LEAST(1.50, GREATEST(0.50, 0.50 + (v_eff_score / 100.00))), 2);
            
            IF v_rec.total_interventions >= 5 THEN
                v_conf_rating := 'HIGH';
            ELSIF v_rec.total_interventions >= 3 THEN
                v_conf_rating := 'MODERATE';
            ELSE
                v_conf_rating := 'LOW';
            END IF;
        ELSE
            v_mult := 1.00;
            v_conf_rating := 'INSUFFICIENT_DATA';
        END IF;

        INSERT INTO public.analytics_strategy_learning_aggregates (
            action_category,
            category,
            state,
            total_interventions,
            successful_interventions,
            underperforming_interventions,
            average_effectiveness_score,
            strategy_multiplier,
            total_sample_size,
            total_unique_sessions,
            confidence_rating,
            last_calculated_at,
            updated_at
        ) VALUES (
            v_rec.action_category,
            v_rec.category,
            v_rec.state,
            v_rec.total_interventions,
            v_rec.successful_interventions,
            v_rec.underperforming_interventions,
            v_eff_score,
            v_mult,
            v_rec.total_sample_size,
            v_rec.total_unique_sessions,
            v_conf_rating,
            v_now,
            v_now
        )
        ON CONFLICT (action_category, category, state) DO UPDATE SET
            total_interventions = EXCLUDED.total_interventions,
            successful_interventions = EXCLUDED.successful_interventions,
            underperforming_interventions = EXCLUDED.underperforming_interventions,
            average_effectiveness_score = EXCLUDED.average_effectiveness_score,
            strategy_multiplier = EXCLUDED.strategy_multiplier,
            total_sample_size = EXCLUDED.total_sample_size,
            total_unique_sessions = EXCLUDED.total_unique_sessions,
            confidence_rating = EXCLUDED.confidence_rating,
            last_calculated_at = v_now,
            updated_at = v_now;
    END LOOP;

    -- 9. Log Master Orchestration Evaluation Event
    INSERT INTO public.analytics_strategic_orchestration_events (
        event_type,
        severity,
        details,
        evaluated_by
    ) VALUES (
        'ORCHESTRATION_EVALUATION',
        'INFO',
        jsonb_build_object(
            'stalled_decisions', v_stalled_decisions,
            'overdue_plans', v_overdue_plans,
            'awaiting_measurement', v_awaiting_measurement,
            'decayed_syntheses', v_decayed_syntheses,
            'total_events_logged', v_events_count
        ),
        v_actor_id
    );

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'evaluated_at', v_now,
        'summary', jsonb_build_object(
            'stalled_decisions', v_stalled_decisions,
            'overdue_action_plans', v_overdue_plans,
            'plans_awaiting_measurement', v_awaiting_measurement,
            'decayed_syntheses', v_decayed_syntheses,
            'events_generated', v_events_count
        )
    );
END;
$$;

-- ==============================================================================
-- 5. PRIVILEGED RPC 2: get_strategic_orchestration_feed
-- Returns prioritized "WHAT TO DO NOW" operator actionable queue.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_strategic_orchestration_feed(
    p_limit INT DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_limit INT;
    v_escalations JSONB := '[]'::jsonb;
    v_stalled_decisions JSONB := '[]'::jsonb;
    v_overdue_plans JSONB := '[]'::jsonb;
    v_awaiting_measurement JSONB := '[]'::jsonb;
    v_stale_syntheses JSONB := '[]'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    -- Strict bounding of limit in [1, 50]
    v_limit := LEAST(GREATEST(COALESCE(p_limit, 20), 1), 50);

    -- 1. Critical P0 Escalations (Syntheses needing operator decision)
    SELECT COALESCE(jsonb_agg(item), '[]'::jsonb) INTO v_escalations
    FROM (
        SELECT s.id, s.category, s.state, s.lga, s.strategic_score, s.priority_class,
               s.convergence_level, s.confidence_score, s.created_at,
               'OPPORTUNITY_REQUIRES_DECISION' AS recommendation_action
        FROM public.analytics_strategic_synthesis s
        WHERE s.priority_class = 'P0_CRITICAL_INTERVENTION'
          AND s.synthesis_state IN ('DETECTED', 'PRIORITIZED')
        ORDER BY s.strategic_score DESC
        LIMIT v_limit
    ) item;

    -- 2. Stalled Decisions (Accepted > 7 days without action plans)
    SELECT COALESCE(jsonb_agg(item), '[]'::jsonb) INTO v_stalled_decisions
    FROM (
        SELECT d.id AS decision_id, d.synthesis_id, d.category, d.state, d.lga, d.decision_type,
               d.rationale, d.created_at,
               EXTRACT(DAY FROM (NOW() - d.created_at))::int AS days_idle,
               'CREATE_ACTION_PLAN' AS recommended_action
        FROM public.analytics_strategic_decisions d
        WHERE d.decision_state = 'ACCEPTED'
          AND NOT EXISTS (
              SELECT 1 FROM public.analytics_strategic_action_plans p
              WHERE p.decision_id = d.id
          )
        ORDER BY d.created_at ASC
        LIMIT v_limit
    ) item;

    -- 3. Overdue Action Plans (Past target date & not completed)
    SELECT COALESCE(jsonb_agg(item), '[]'::jsonb) INTO v_overdue_plans
    FROM (
        SELECT p.id AS action_plan_id, p.decision_id, p.objective, p.category, p.state, p.lga,
               p.owner_title, p.priority, p.plan_status, p.target_completion_date,
               (CURRENT_DATE - p.target_completion_date) AS slippage_days,
               'MANUAL_EXTERNAL_INTERVENTION' AS recommended_action
        FROM public.analytics_strategic_action_plans p
        WHERE p.plan_status IN ('PLANNED', 'ACTIVE', 'IN_PROGRESS')
          AND p.target_completion_date < CURRENT_DATE
        ORDER BY p.target_completion_date ASC
        LIMIT v_limit
    ) item;

    -- 4. Plans Awaiting Measurement (Observation window completed)
    SELECT COALESCE(jsonb_agg(item), '[]'::jsonb) INTO v_awaiting_measurement
    FROM (
        SELECT p.id AS action_plan_id, p.decision_id, p.objective, p.category, p.state, p.lga,
               p.start_date, d.observation_window_days,
               (p.start_date + (d.observation_window_days || ' days')::INTERVAL) AS obs_ended_at,
               'RECORD_OUTCOME_OBSERVATION' AS recommended_action
        FROM public.analytics_strategic_action_plans p
        JOIN public.analytics_strategic_decisions d ON d.id = p.decision_id
        WHERE p.plan_status IN ('PLANNED', 'ACTIVE', 'IN_PROGRESS')
          AND (p.start_date + (d.observation_window_days || ' days')::INTERVAL) <= NOW()
          AND NOT EXISTS (
              SELECT 1 FROM public.analytics_strategic_outcomes o
              WHERE o.action_plan_id = p.id
          )
        ORDER BY p.start_date ASC
        LIMIT v_limit
    ) item;

    -- 5. Stale Syntheses (Confidence decaying or nearing 14-day limit)
    SELECT COALESCE(jsonb_agg(item), '[]'::jsonb) INTO v_stale_syntheses
    FROM (
        SELECT s.id, s.category, s.state, s.lga, s.strategic_score, s.confidence_score, s.updated_at,
               ROUND(GREATEST(0.00, 1.00 - (EXTRACT(EPOCH FROM (NOW() - s.updated_at)) / 86400.0 / 14.0)), 2) AS freshness_score,
               'REEVALUATE_SYNTHESIS' AS recommended_action
        FROM public.analytics_strategic_synthesis s
        WHERE s.synthesis_state IN ('DETECTED', 'PRIORITIZED', 'WATCH')
          AND s.updated_at < (NOW() - INTERVAL '5 days')
        ORDER BY s.updated_at ASC
        LIMIT v_limit
    ) item;

    RETURN jsonb_build_object(
        'schema_version', '9.2.0',
        'generated_at', NOW(),
        'feed_summary', jsonb_build_object(
            'critical_escalations_count', jsonb_array_length(v_escalations),
            'stalled_decisions_count', jsonb_array_length(v_stalled_decisions),
            'overdue_plans_count', jsonb_array_length(v_overdue_plans),
            'awaiting_measurement_count', jsonb_array_length(v_awaiting_measurement),
            'stale_syntheses_count', jsonb_array_length(v_stale_syntheses)
        ),
        'critical_escalations', v_escalations,
        'stalled_decisions', v_stalled_decisions,
        'overdue_action_plans', v_overdue_plans,
        'awaiting_measurement', v_awaiting_measurement,
        'stale_syntheses', v_stale_syntheses
    );
END;
$$;

-- ==============================================================================
-- 6. PRIVILEGED RPC 3: get_strategy_learning_insights
-- Retrieves empirical strategy efficacy track record enforcing privacy floor.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_strategy_learning_insights(
    p_action_category TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_insights JSONB := '[]'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    SELECT COALESCE(jsonb_agg(item), '[]'::jsonb) INTO v_insights
    FROM (
        SELECT 
            action_category,
            category,
            state,
            total_interventions,
            successful_interventions,
            underperforming_interventions,
            -- If privacy threshold not met, return safe sanitized values
            CASE 
                WHEN total_sample_size >= 30 AND total_unique_sessions >= 5 THEN average_effectiveness_score
                ELSE 0.00
            END AS average_effectiveness_score,
            CASE 
                WHEN total_sample_size >= 30 AND total_unique_sessions >= 5 THEN strategy_multiplier
                ELSE 1.00
            END AS strategy_multiplier,
            confidence_rating,
            last_calculated_at
        FROM public.analytics_strategy_learning_aggregates
        WHERE (p_action_category IS NULL OR action_category = p_action_category)
          AND (p_category IS NULL OR category = p_category)
          AND (p_state IS NULL OR state = p_state)
        ORDER BY average_effectiveness_score DESC
        LIMIT 50
    ) item;

    RETURN jsonb_build_object(
        'schema_version', '9.2.0',
        'generated_at', NOW(),
        'insights', v_insights
    );
END;
$$;

-- ==============================================================================
-- 7. PRIVILEGED RPC 4: get_executive_strategic_summary
-- Generates high-level strategic macro pulse & decision velocity KPIs.
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_executive_strategic_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_active_decisions INT := 0;
    v_active_plans INT := 0;
    v_overdue_plans INT := 0;
    v_awaiting_meas INT := 0;
    v_escalated_opps INT := 0;
    v_weekly_decisions INT := 0;
    v_avg_eff NUMERIC(5,2) := 0.00;
    v_health_score NUMERIC(5,2) := 100.00;
    v_total_syntheses INT := 0;
    v_fresh_count INT := 0;
    v_stale_count INT := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrator privileges required.'
            USING ERRCODE = '42501';
    END IF;

    -- Count active decisions
    SELECT COUNT(*) INTO v_active_decisions
    FROM public.analytics_strategic_decisions
    WHERE decision_state NOT IN ('COMPLETED', 'REJECTED', 'CANCELLED', 'EXPIRED');

    -- Count decisions recorded in past 7 days (Decision Velocity)
    SELECT COUNT(*) INTO v_weekly_decisions
    FROM public.analytics_strategic_decisions
    WHERE created_at >= (NOW() - INTERVAL '7 days');

    -- Count active action plans
    SELECT COUNT(*) INTO v_active_plans
    FROM public.analytics_strategic_action_plans
    WHERE plan_status IN ('PLANNED', 'ACTIVE', 'IN_PROGRESS');

    -- Count overdue action plans
    SELECT COUNT(*) INTO v_overdue_plans
    FROM public.analytics_strategic_action_plans
    WHERE plan_status IN ('PLANNED', 'ACTIVE', 'IN_PROGRESS')
      AND target_completion_date < CURRENT_DATE;

    -- Count plans awaiting measurement
    SELECT COUNT(*) INTO v_awaiting_meas
    FROM public.analytics_strategic_action_plans p
    JOIN public.analytics_strategic_decisions d ON d.id = p.decision_id
    WHERE p.plan_status IN ('PLANNED', 'ACTIVE', 'IN_PROGRESS')
      AND (p.start_date + (d.observation_window_days || ' days')::INTERVAL) <= NOW()
      AND NOT EXISTS (
          SELECT 1 FROM public.analytics_strategic_outcomes o
          WHERE o.action_plan_id = p.id
      );

    -- Count P0 critical interventions
    SELECT COUNT(*) INTO v_escalated_opps
    FROM public.analytics_strategic_synthesis
    WHERE priority_class = 'P0_CRITICAL_INTERVENTION'
      AND synthesis_state IN ('DETECTED', 'PRIORITIZED');

    -- Calculate historical average effectiveness
    SELECT COALESCE(AVG(effectiveness_score), 0.00) INTO v_avg_eff
    FROM public.analytics_strategic_outcomes
    WHERE sample_size >= 30 AND unique_sessions >= 5;

    -- Freshness breakdown
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN updated_at >= (NOW() - INTERVAL '5 days') THEN 1 END),
        COUNT(CASE WHEN updated_at < (NOW() - INTERVAL '7 days') THEN 1 END)
    INTO v_total_syntheses, v_fresh_count, v_stale_count
    FROM public.analytics_strategic_synthesis
    WHERE synthesis_state IN ('DETECTED', 'PRIORITIZED', 'WATCH');

    -- Deterministic Portfolio Health Score:
    -- Starts at 100, penalized by overdue plans (-5 each), stalled escalations (-8 each), stale data (-3 each), boosted by effectiveness (+0.2 * eff)
    v_health_score := ROUND(LEAST(100.00, GREATEST(0.00, 
        100.00 
        - (v_overdue_plans * 5.0) 
        - (v_escalated_opps * 8.0) 
        - (v_stale_count * 3.0)
        + (v_avg_eff * 0.1)
    )), 2);

    RETURN jsonb_build_object(
        'schema_version', '9.2.0',
        'generated_at', NOW(),
        'kpis', jsonb_build_object(
            'portfolio_health_score', v_health_score,
            'weekly_decision_velocity', v_weekly_decisions,
            'active_decisions', v_active_decisions,
            'active_action_plans', v_active_plans,
            'overdue_action_plans', v_overdue_plans,
            'plans_awaiting_measurement', v_awaiting_meas,
            'critical_escalations', v_escalated_opps,
            'historical_average_effectiveness', ROUND(v_avg_eff, 2)
        ),
        'freshness_summary', jsonb_build_object(
            'total_active_syntheses', v_total_syntheses,
            'fresh_syntheses', v_fresh_count,
            'stale_syntheses', v_stale_count
        )
    );
END;
$$;
