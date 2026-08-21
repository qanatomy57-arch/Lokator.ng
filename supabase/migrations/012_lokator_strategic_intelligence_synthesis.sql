-- ==============================================================================
-- LOKATOR.NG — PHASE 9.0A DATABASE MIGRATION
-- STRATEGIC INTELLIGENCE SYNTHESIS & UNIFIED MARKETPLACE COMMAND CENTER (SIMCC)
-- Migration: 012_lokator_strategic_intelligence_synthesis.sql
--
-- INVARIANTS ENFORCED:
-- 1. OBSERVATIONAL & SYNTHESIS ONLY — Zero autonomous marketplace mutations.
-- 2. RANKING AIR-GAP — Live search ranking in search.js is 100% isolated from strategic synthesis.
-- 3. BUSINESS TRUTH IMMUTABILITY — Zero mutations against public.providers, reviews, or provider_services.
-- 4. PRIVACY GATES — Hard enforcement of N >= 30 sample floor and k >= 5 anonymity threshold.
-- 5. DETERMINISTIC MULTI-FACTOR STRATEGIC SCORING — Closed-form bounded math S in [0.00, 100.00].
-- 6. AUDIT LOG IMMUTABILITY — Append-only audit trail with REVOKE UPDATE, DELETE.
-- 7. SECURITY DEFINER HARDENING — Fixed search_path and server-side public.is_admin() validation.
-- 8. ACCEPTED != EXECUTED — Administrative intent only.
-- ==============================================================================

-- 1. STRATEGIC INTELLIGENCE SYNTHESIS TABLE
CREATE TABLE IF NOT EXISTS public.analytics_strategic_synthesis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    synthesis_fingerprint TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL,
    state TEXT NOT NULL,
    lga TEXT NOT NULL,
    strategic_score NUMERIC(5,2) NOT NULL DEFAULT 0.00 
        CHECK (strategic_score >= 0.00 AND strategic_score <= 100.00),
    priority_class TEXT NOT NULL DEFAULT 'P2_GROWTH_WATCH'
        CHECK (priority_class IN (
            'P0_CRITICAL_INTERVENTION', 
            'P1_HIGH_PRIORITY_EXPANSION', 
            'P2_GROWTH_WATCH', 
            'P3_STABLE_MONITORING'
        )),
    convergence_level TEXT NOT NULL DEFAULT 'SINGLE_SIGNAL'
        CHECK (convergence_level IN ('SINGLE_SIGNAL', 'MULTI_SIGNAL', 'HIGH_CONVERGENCE')),
    synthesis_state TEXT NOT NULL DEFAULT 'DETECTED'
        CHECK (synthesis_state IN (
            'DETECTED', 
            'PRIORITIZED', 
            'ACKNOWLEDGED', 
            'WATCH', 
            'COOLDOWN', 
            'EXPIRED', 
            'INVALIDATED'
        )),
    confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0.0000 
        CHECK (confidence_score >= 0.0000 AND confidence_score <= 1.0000),
    primary_opportunity_class TEXT NOT NULL,
    contributing_systems JSONB NOT NULL DEFAULT '[]'::jsonb,
    score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
    explanation JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_prediction_id UUID REFERENCES public.analytics_growth_predictions(id) ON DELETE SET NULL,
    source_operational_id UUID REFERENCES public.analytics_operational_intelligence(id) ON DELETE SET NULL,
    source_recommendation_id UUID REFERENCES public.growth_recommendations(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_strategic_synthesis_score
    ON public.analytics_strategic_synthesis (strategic_score DESC, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_strategic_synthesis_priority_state
    ON public.analytics_strategic_synthesis (priority_class, synthesis_state, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_strategic_synthesis_spatial
    ON public.analytics_strategic_synthesis (state, lga, category);

CREATE INDEX IF NOT EXISTS idx_analytics_strategic_synthesis_expires
    ON public.analytics_strategic_synthesis (expires_at)
    WHERE synthesis_state != 'EXPIRED';

-- 2. STRATEGIC AUDIT LOG TABLE (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.analytics_strategic_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    synthesis_id UUID NOT NULL REFERENCES public.analytics_strategic_synthesis(id) ON DELETE CASCADE,
    previous_state TEXT NOT NULL,
    new_state TEXT NOT NULL,
    actor_id UUID NOT NULL,
    action TEXT NOT NULL 
        CHECK (action IN ('STATE_TRANSITION', 'ACKNOWLEDGE', 'WATCH', 'DISMISS', 'FLAG_PRIORITY', 'EXPIRE', 'INVALIDATE')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_strategic_audit_target
    ON public.analytics_strategic_audit_log (synthesis_id, created_at DESC);

-- 3. ROW LEVEL SECURITY & PERMISSION HARDENING
ALTER TABLE public.analytics_strategic_synthesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_strategic_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_strategic_synthesis FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_strategic_audit_log FROM PUBLIC, anon;

-- Restrict direct read/write to verified administrators
CREATE POLICY admin_manage_strategic_synthesis ON public.analytics_strategic_synthesis
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_read_strategic_audit_log ON public.analytics_strategic_audit_log
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY admin_insert_strategic_audit_log ON public.analytics_strategic_audit_log
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

-- Enforce append-only immutability on audit log
REVOKE UPDATE, DELETE ON public.analytics_strategic_audit_log FROM authenticated;

-- ==============================================================================
-- 4. PRIVILEGED STRATEGIC INTELLIGENCE SYNTHESIS RPCs
-- ==============================================================================

-- 4.1 COMPUTE STRATEGIC INTELLIGENCE SYNTHESIS (DETERMINISTIC MULTI-FACTOR CORRELATION)
CREATE OR REPLACE FUNCTION public.compute_strategic_intelligence_synthesis(
    p_force_refresh BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_last_computed TIMESTAMPTZ;
    v_synthesized_count INT := 0;
    v_rec RECORD;
    v_op RECORD;
    v_gr RECORD;
    v_score NUMERIC(5,2);
    v_prio_class TEXT;
    v_conv_level TEXT;
    v_sys_array JSONB;
    v_breakdown JSONB;
    v_metrics JSONB;
    v_explanation JSONB;
    v_fingerprint TEXT;
    v_c1_surge NUMERIC(5,2);
    v_c2_deficit NUMERIC(5,2);
    v_c3_pred NUMERIC(5,2);
    v_c4_op NUMERIC(5,2);
    v_c5_conv NUMERIC(5,2);
    v_sys_count INT;
BEGIN
    -- Server-side admin authorization verification
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    -- Check debounce window on 15m window tracker
    SELECT last_computed_at INTO v_last_computed
    FROM public.analytics_realtime_windows
    WHERE window_id = '15m';

    IF NOT p_force_refresh AND v_last_computed IS NOT NULL AND v_last_computed > (NOW() - INTERVAL '15 seconds') THEN
        RETURN jsonb_build_object(
            'status', 'DEBOUNCE_COOLDOWN_ACTIVE',
            'message', 'Strategic intelligence synthesis computed recently. Cooldown active.',
            'last_computed_at', v_last_computed
        );
    END IF;

    -- Iterate through qualified active predictions satisfying privacy floor (N >= 30, k >= 5)
    FOR v_rec IN (
        SELECT 
            p.id AS pred_id,
            p.category,
            p.state,
            p.lga,
            p.opportunity_class,
            p.confidence_score,
            p.confidence_tier,
            p.current_demand,
            p.baseline_demand,
            p.projected_demand,
            p.projected_supply,
            p.demand_growth_rate,
            p.demand_supply_gap,
            p.sample_size,
            p.unique_sessions,
            p.explanation AS pred_explanation,
            p.supporting_evidence AS pred_evidence
        FROM public.analytics_growth_predictions p
        WHERE p.prediction_state IN ('DETECTED', 'CONFIRMED', 'HIGH_CONFIDENCE', 'WATCH', 'ACTIONABLE')
          AND p.sample_size >= 30
          AND p.unique_sessions >= 5
          AND p.expires_at >= NOW()
    ) LOOP
        -- Initialize contributing systems list
        v_sys_array := jsonb_build_array('PREDICTIVE_FORECASTING');
        v_sys_count := 1;

        -- 1. Check for Correlating Operational Intelligence Record
        SELECT id, priority, deviation_score, persistence_count, operational_state
        INTO v_op
        FROM public.analytics_operational_intelligence
        WHERE category = v_rec.category
          AND state = v_rec.state
          AND lga = v_rec.lga
          AND operational_state IN ('WATCH', 'EMERGING', 'SUSTAINED', 'HIGH_PRIORITY')
          AND last_seen_at >= NOW() - INTERVAL '12 hours'
        LIMIT 1;

        IF v_op.id IS NOT NULL THEN
            v_sys_array := v_sys_array || jsonb_build_array('OPERATIONAL_INTELLIGENCE');
            v_sys_count := v_sys_count + 1;
        END IF;

        -- 2. Check for Correlating Growth Recommendation Record
        SELECT id, priority, recommendation_type, confidence_score
        INTO v_gr
        FROM public.growth_recommendations
        WHERE target_category = v_rec.category
          AND target_state = v_rec.state
          AND (target_lga = v_rec.lga OR target_lga = 'ALL_LGAS')
          AND status IN ('PENDING_ADMIN_REVIEW', 'REVIEWED')
        LIMIT 1;

        IF v_gr.id IS NOT NULL THEN
            v_sys_array := v_sys_array || jsonb_build_array('GROWTH_RECOMMENDATIONS');
            v_sys_count := v_sys_count + 1;
        END IF;

        -- 3. Check for Realtime Surge Signal
        IF EXISTS (
            SELECT 1 FROM public.analytics_realtime_signals
            WHERE category = v_rec.category
              AND state = v_rec.state
              AND lga = v_rec.lga
              AND signal_status = 'ACTIVE'
              AND window_bucket >= NOW() - INTERVAL '2 hours'
        ) THEN
            v_sys_array := v_sys_array || jsonb_build_array('REALTIME_SIGNALS');
            v_sys_count := v_sys_count + 1;
        END IF;

        -- 4. Calculate Deterministic Multi-Factor Strategic Score (0.00 - 100.00)
        -- C1: Demand Velocity / Surge Component (0 - 25 pts)
        v_c1_surge := LEAST(25.00, GREATEST(0.00, ROUND(v_rec.demand_growth_rate * 25.0, 2)));

        -- C2: Supply Deficit / Shortage Gap Component (0 - 25 pts)
        IF v_rec.projected_supply = 0.0 THEN
            v_c2_deficit := 25.00;
        ELSE
            v_c2_deficit := LEAST(25.00, GREATEST(0.00, ROUND((v_rec.demand_supply_gap / GREATEST(1.0, v_rec.projected_supply)) * 10.0, 2)));
        END IF;

        -- C3: Predictive Confidence Component (0 - 20 pts)
        v_c3_pred := LEAST(20.00, GREATEST(0.00, ROUND(v_rec.confidence_score * 20.0, 2)));

        -- C4: Operational Severity & Persistence Component (0 - 15 pts)
        IF v_op.id IS NOT NULL THEN
            v_c4_op := CASE 
                WHEN v_op.priority = 'CRITICAL' THEN 15.00
                WHEN v_op.priority = 'HIGH' THEN 11.00
                WHEN v_op.priority = 'MEDIUM' THEN 7.00
                ELSE 4.00
            END;
        ELSE
            v_c4_op := 3.00;
        END IF;

        -- C5: Cross-System Convergence Component (0 - 15 pts)
        IF v_sys_count >= 3 THEN
            v_c5_conv := 15.00;
            v_conv_level := 'HIGH_CONVERGENCE';
        ELSIF v_sys_count = 2 THEN
            v_c5_conv := 8.00;
            v_conv_level := 'MULTI_SIGNAL';
        ELSE
            v_c5_conv := 3.00;
            v_conv_level := 'SINGLE_SIGNAL';
        END IF;

        -- Total Strategic Score
        v_score := LEAST(100.00, GREATEST(0.00, ROUND(v_c1_surge + v_c2_deficit + v_c3_pred + v_c4_op + v_c5_conv, 2)));

        -- Strategic Priority Classification
        IF v_score >= 75.00 THEN
            v_prio_class := 'P0_CRITICAL_INTERVENTION';
        ELSIF v_score >= 50.00 THEN
            v_prio_class := 'P1_HIGH_PRIORITY_EXPANSION';
        ELSIF v_score >= 30.00 THEN
            v_prio_class := 'P2_GROWTH_WATCH';
        ELSE
            v_prio_class := 'P3_STABLE_MONITORING';
        END IF;

        -- Structured Score Breakdown & Metrics
        v_breakdown := jsonb_build_object(
            'demand_velocity_score', v_c1_surge,
            'supply_deficit_score', v_c2_deficit,
            'predictive_confidence_score', v_c3_pred,
            'operational_severity_score', v_c4_op,
            'cross_system_convergence_score', v_c5_conv,
            'total_strategic_score', v_score
        );

        v_metrics := jsonb_build_object(
            'current_demand', v_rec.current_demand,
            'baseline_demand', v_rec.baseline_demand,
            'projected_demand', v_rec.projected_demand,
            'projected_supply', v_rec.projected_supply,
            'demand_supply_gap', v_rec.demand_supply_gap,
            'growth_rate_pct', ROUND(v_rec.demand_growth_rate * 100, 1),
            'sample_size', v_rec.sample_size,
            'unique_sessions', v_rec.unique_sessions,
            'contributing_system_count', v_sys_count
        );

        -- Deterministic Explainability Payload
        v_explanation := jsonb_build_object(
            'summary', format('Strategic Priority %s: %s demand in %s, %s scoring %s/100 across %s contributing intelligence systems.',
                              v_prio_class, v_rec.category, v_rec.lga, v_rec.state, v_score, v_sys_count),
            'what', format('%s demand surge (+%s%%) projected to reach %s searches/hr against supply capacity of %s.',
                           v_rec.category, ROUND(v_rec.demand_growth_rate * 100), v_rec.projected_demand, v_rec.projected_supply),
            'where', format('%s, %s', v_rec.lga, v_rec.state),
            'category', v_rec.category,
            'why', format('High strategic urgency driven by %s (%s/25 deficit score) with %s convergence.',
                          v_rec.opportunity_class, v_c2_deficit, v_conv_level),
            'evidence', v_sys_array,
            'convergence_level', v_conv_level,
            'strategic_score', v_score,
            'confidence_score', v_rec.confidence_score,
            'uncertainty', CASE 
                WHEN v_rec.sample_size < 50 THEN 'Moderate sample volume; continue monitoring confirmation windows.'
                ELSE 'High sample density and multi-window statistical stability.'
            END,
            'recommended_action', CASE 
                WHEN v_rec.projected_supply = 0.0 THEN format('Recruit and verify qualified %s providers in %s.', v_rec.category, v_rec.lga)
                WHEN v_rec.demand_supply_gap > 10.0 THEN format('Targeted provider onboarding campaign for %s in %s.', v_rec.category, v_rec.lga)
                ELSE format('Operational monitoring of %s capacity in %s.', v_rec.category, v_rec.lga)
            END,
            'operational_posture', 'OBSERVATIONAL_SYNTHESIS_ONLY'
        );

        -- Canonical Fingerprint Hashing
        v_fingerprint := encode(digest(
            format('STRAT:%s:%s:%s:V1', v_rec.category, v_rec.state, v_rec.lga),
            'sha256'
        ), 'hex');

        -- Atomic UPSERT into analytics_strategic_synthesis
        INSERT INTO public.analytics_strategic_synthesis (
            synthesis_fingerprint,
            category,
            state,
            lga,
            strategic_score,
            priority_class,
            convergence_level,
            synthesis_state,
            confidence_score,
            primary_opportunity_class,
            contributing_systems,
            score_breakdown,
            metrics,
            explanation,
            source_prediction_id,
            source_operational_id,
            source_recommendation_id,
            expires_at,
            updated_at
        ) VALUES (
            v_fingerprint,
            v_rec.category,
            v_rec.state,
            v_rec.lga,
            v_score,
            v_prio_class,
            v_conv_level,
            CASE WHEN v_score >= 75.00 THEN 'PRIORITIZED' ELSE 'DETECTED' END,
            v_rec.confidence_score,
            v_rec.opportunity_class,
            v_sys_array,
            v_breakdown,
            v_metrics,
            v_explanation,
            v_rec.pred_id,
            v_op.id,
            v_gr.id,
            NOW() + INTERVAL '24 hours',
            NOW()
        )
        ON CONFLICT (synthesis_fingerprint) DO UPDATE SET
            strategic_score = EXCLUDED.strategic_score,
            priority_class = EXCLUDED.priority_class,
            convergence_level = EXCLUDED.convergence_level,
            synthesis_state = CASE 
                WHEN analytics_strategic_synthesis.synthesis_state IN ('WATCH', 'COOLDOWN') THEN analytics_strategic_synthesis.synthesis_state
                ELSE EXCLUDED.synthesis_state
            END,
            confidence_score = EXCLUDED.confidence_score,
            primary_opportunity_class = EXCLUDED.primary_opportunity_class,
            contributing_systems = EXCLUDED.contributing_systems,
            score_breakdown = EXCLUDED.score_breakdown,
            metrics = EXCLUDED.metrics,
            explanation = EXCLUDED.explanation,
            source_prediction_id = EXCLUDED.source_prediction_id,
            source_operational_id = EXCLUDED.source_operational_id,
            source_recommendation_id = EXCLUDED.source_recommendation_id,
            expires_at = NOW() + INTERVAL '24 hours',
            updated_at = NOW();

        v_synthesized_count := v_synthesized_count + 1;
    END LOOP;

    -- Clean up expired synthesis records (> 24h)
    UPDATE public.analytics_strategic_synthesis
    SET synthesis_state = 'EXPIRED', updated_at = NOW()
    WHERE expires_at < NOW() AND synthesis_state != 'EXPIRED';

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'strategic_opportunities_synthesized', v_synthesized_count,
        'synthesized_at', NOW()
    );
END;
$$;

-- 4.2 GET UNIFIED MARKETPLACE COMMAND CENTER (SINGLE ROUND-TRIP ADMIN RPC)
CREATE OR REPLACE FUNCTION public.get_unified_marketplace_command_center()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_pulse JSONB;
    v_opportunities JSONB;
    v_regional_matrix JSONB;
    v_active_alerts JSONB;
    v_p0_count INT := 0;
    v_p1_count INT := 0;
    v_total_active INT := 0;
    v_avg_score NUMERIC(5,2) := 0.00;
    v_top_opp JSONB;
    v_health_status TEXT := 'HEALTHY';
    v_alerts_count INT := 0;
BEGIN
    -- Server-side admin authorization verification
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    -- 1. Executive Opportunity Counts & Metrics
    SELECT 
        COUNT(*) FILTER (WHERE priority_class = 'P0_CRITICAL_INTERVENTION'),
        COUNT(*) FILTER (WHERE priority_class = 'P1_HIGH_PRIORITY_EXPANSION'),
        COUNT(*),
        COALESCE(ROUND(AVG(strategic_score), 2), 0.00)
    INTO 
        v_p0_count,
        v_p1_count,
        v_total_active,
        v_avg_score
    FROM public.analytics_strategic_synthesis
    WHERE synthesis_state IN ('DETECTED', 'PRIORITIZED', 'WATCH', 'ACTIONABLE', 'COOLDOWN');

    -- Count active unresolved alerts from Phase 6.4
    SELECT COUNT(*) INTO v_alerts_count
    FROM public.analytics_alerts
    WHERE status IN ('OPEN', 'ACKNOWLEDGED');

    IF v_p0_count > 0 OR v_alerts_count > 0 THEN
        v_health_status := 'ATTENTION_REQUIRED';
    END IF;

    -- 2. Top Strategic Opportunity Record
    SELECT row_to_json(top_row)::jsonb INTO v_top_opp
    FROM (
        SELECT id, category, state, lga, strategic_score, priority_class, convergence_level, primary_opportunity_class, explanation
        FROM public.analytics_strategic_synthesis
        WHERE synthesis_state IN ('DETECTED', 'PRIORITIZED', 'WATCH')
        ORDER BY strategic_score DESC, updated_at DESC
        LIMIT 1
    ) top_row;

    -- Build Executive Pulse
    v_pulse := jsonb_build_object(
        'marketplace_health', v_health_status,
        'strategic_pressure_index', v_avg_score,
        'critical_interventions_count', v_p0_count,
        'high_priority_expansions_count', v_p1_count,
        'total_active_opportunities', v_total_active,
        'active_alerts_count', v_alerts_count,
        'top_opportunity', v_top_opp,
        'operational_posture', 'OBSERVATIONAL_ADVISORY_COMMAND_CENTER'
    );

    -- 3. Top Prioritized Strategic Opportunities (LIMIT 25)
    SELECT jsonb_agg(opp) INTO v_opportunities
    FROM (
        SELECT 
            id,
            synthesis_fingerprint,
            category,
            state,
            lga,
            strategic_score,
            priority_class,
            convergence_level,
            synthesis_state,
            confidence_score,
            primary_opportunity_class,
            contributing_systems,
            score_breakdown,
            metrics,
            explanation,
            created_at,
            updated_at
        FROM public.analytics_strategic_synthesis
        WHERE synthesis_state IN ('DETECTED', 'PRIORITIZED', 'WATCH', 'COOLDOWN')
        ORDER BY strategic_score DESC, updated_at DESC
        LIMIT 25
    ) opp;

    -- 4. Regional Matrix Aggregation (State & LGA Level Balance, LIMIT 30)
    SELECT jsonb_agg(reg) INTO v_regional_matrix
    FROM (
        SELECT 
            state,
            lga,
            COUNT(*) AS active_opportunity_count,
            MAX(strategic_score) AS max_strategic_score,
            jsonb_agg(DISTINCT category) AS affected_categories,
            jsonb_agg(DISTINCT priority_class) AS priority_classes
        FROM public.analytics_strategic_synthesis
        WHERE synthesis_state != 'EXPIRED'
        GROUP BY state, lga
        ORDER BY max_strategic_score DESC
        LIMIT 30
    ) reg;

    -- 5. Active Operational Alerts (Phase 6.4, LIMIT 10)
    SELECT jsonb_agg(alt) INTO v_active_alerts
    FROM (
        SELECT id, alert_type, severity, status, title, summary, created_at
        FROM public.analytics_alerts
        WHERE status IN ('OPEN', 'ACKNOWLEDGED')
        ORDER BY 
            CASE severity WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
            created_at DESC
        LIMIT 10
    ) alt;

    -- Assemble Unified Response Payload
    RETURN jsonb_build_object(
        'schema_version', '9.0.0',
        'status', 'HEALTHY',
        'executive_pulse', v_pulse,
        'strategic_opportunities', COALESCE(v_opportunities, '[]'::jsonb),
        'regional_matrix', COALESCE(v_regional_matrix, '[]'::jsonb),
        'active_alerts', COALESCE(v_active_alerts, '[]'::jsonb),
        'generated_at', NOW()
    );
END;
$$;

-- 4.3 GET STRATEGIC SYNTHESIS EVIDENCE
CREATE OR REPLACE FUNCTION public.get_strategic_synthesis_evidence(
    p_synthesis_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_syn RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT * INTO v_syn
    FROM public.analytics_strategic_synthesis
    WHERE id = p_synthesis_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Strategic synthesis opportunity not found: %', p_synthesis_id
            USING ERRCODE = 'P0002';
    END IF;

    RETURN jsonb_build_object(
        'synthesis_id', v_syn.id,
        'category', v_syn.category,
        'state', v_syn.state,
        'lga', v_syn.lga,
        'strategic_score', v_syn.strategic_score,
        'priority_class', v_syn.priority_class,
        'convergence_level', v_syn.convergence_level,
        'synthesis_state', v_syn.synthesis_state,
        'confidence_score', v_syn.confidence_score,
        'primary_opportunity_class', v_syn.primary_opportunity_class,
        'contributing_systems', v_syn.contributing_systems,
        'score_breakdown', v_syn.score_breakdown,
        'metrics', v_syn.metrics,
        'explanation', v_syn.explanation,
        'source_prediction_id', v_syn.source_prediction_id,
        'source_operational_id', v_syn.source_operational_id,
        'source_recommendation_id', v_syn.source_recommendation_id,
        'created_at', v_syn.created_at,
        'updated_at', v_syn.updated_at
    );
END;
$$;

-- 4.4 TRANSITION STRATEGIC SYNTHESIS STATE
CREATE OR REPLACE FUNCTION public.transition_strategic_synthesis(
    p_synthesis_id UUID,
    p_new_state TEXT,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_curr_state TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    IF p_new_state NOT IN ('DETECTED', 'PRIORITIZED', 'ACKNOWLEDGED', 'WATCH', 'COOLDOWN', 'EXPIRED', 'INVALIDATED') THEN
        RAISE EXCEPTION 'Invalid target strategic synthesis state: %', p_new_state
            USING ERRCODE = '22023';
    END IF;

    SELECT synthesis_state INTO v_curr_state
    FROM public.analytics_strategic_synthesis
    WHERE id = p_synthesis_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Strategic synthesis opportunity not found: %', p_synthesis_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Rejection of illegal state resurrection
    IF v_curr_state = 'EXPIRED' AND p_new_state != 'EXPIRED' THEN
        RAISE EXCEPTION 'Illegal state transition: Cannot resurrect EXPIRED strategic opportunity'
            USING ERRCODE = '22023';
    END IF;

    -- Update state
    UPDATE public.analytics_strategic_synthesis
    SET synthesis_state = p_new_state,
        updated_at = NOW()
    WHERE id = p_synthesis_id;

    -- Append to immutable audit log
    INSERT INTO public.analytics_strategic_audit_log (
        synthesis_id,
        previous_state,
        new_state,
        actor_id,
        action,
        notes
    ) VALUES (
        p_synthesis_id,
        v_curr_state,
        p_new_state,
        auth.uid(),
        'STATE_TRANSITION',
        p_notes
    );

    RETURN jsonb_build_object(
        'status', 'TRANSITIONED',
        'synthesis_id', p_synthesis_id,
        'previous_state', v_curr_state,
        'new_state', p_new_state,
        'updated_at', NOW()
    );
END;
$$;

-- 4.5 ACKNOWLEDGE STRATEGIC OPPORTUNITY
CREATE OR REPLACE FUNCTION public.acknowledge_strategic_synthesis(
    p_synthesis_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_curr_state TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT synthesis_state INTO v_curr_state
    FROM public.analytics_strategic_synthesis
    WHERE id = p_synthesis_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Strategic synthesis opportunity not found: %', p_synthesis_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Move to COOLDOWN upon operator acknowledgement
    UPDATE public.analytics_strategic_synthesis
    SET synthesis_state = 'COOLDOWN',
        acknowledged_at = NOW(),
        acknowledged_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_synthesis_id;

    -- Append to immutable audit log
    INSERT INTO public.analytics_strategic_audit_log (
        synthesis_id,
        previous_state,
        new_state,
        actor_id,
        action,
        notes
    ) VALUES (
        p_synthesis_id,
        v_curr_state,
        'COOLDOWN',
        auth.uid(),
        'ACKNOWLEDGE',
        COALESCE(p_notes, 'Strategic opportunity acknowledged by operator')
    );

    RETURN jsonb_build_object(
        'status', 'ACKNOWLEDGED',
        'synthesis_id', p_synthesis_id,
        'acknowledged_at', NOW()
    );
END;
$$;
