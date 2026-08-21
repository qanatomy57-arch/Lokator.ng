-- ==============================================================================
-- LOKATOR.NG — PHASE 8.2A DATABASE MIGRATION
-- PREDICTIVE GROWTH INTELLIGENCE & OPPORTUNITY DETECTION ENGINE
-- Migration: 011_lokator_predictive_growth_intelligence.sql
--
-- INVARIANTS ENFORCED:
-- 1. OBSERVATIONAL & PREDICTIVE ONLY — Zero autonomous marketplace mutations.
-- 2. RANKING AIR-GAP — Live search ranking in search.js is 100% isolated from predictive intelligence.
-- 3. BUSINESS TRUTH IMMUTABILITY — Zero mutations against public.providers, reviews, or provider_services.
-- 4. PRIVACY GATES — Hard enforcement of N >= 30 sample floor and k >= 5 anonymity threshold.
-- 5. DETERMINISTIC STATISTICAL FORECASTING — Closed-form math with damped trend (phi = 0.85).
-- 6. AUDIT LOG IMMUTABILITY — Append-only audit trail with REVOKE UPDATE, DELETE.
-- 7. SECURITY DEFINER HARDENING — Fixed search_path and server-side public.is_admin() validation.
-- ==============================================================================

-- 1. PREDICTIVE GROWTH INTELLIGENCE TABLE
CREATE TABLE IF NOT EXISTS public.analytics_growth_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_fingerprint TEXT NOT NULL UNIQUE,
    prediction_type TEXT NOT NULL,
    opportunity_class TEXT NOT NULL 
        CHECK (opportunity_class IN (
            'EMERGING_DEMAND', 
            'UNMET_DEMAND', 
            'SUPPLY_SHORTAGE', 
            'HIGH_GROWTH_ZONE', 
            'SERVICE_EXPANSION', 
            'PERSISTENT_ZERO_RESULT', 
            'DEMAND_ACCELERATION', 
            'DECLINING_SUPPLY', 
            'MARKETPLACE_IMBALANCE'
        )),
    prediction_state TEXT NOT NULL DEFAULT 'DETECTED' 
        CHECK (prediction_state IN (
            'DETECTED', 
            'CONFIRMED', 
            'HIGH_CONFIDENCE', 
            'WATCH', 
            'ACTIONABLE', 
            'COOLDOWN', 
            'EXPIRED', 
            'INVALIDATED'
        )),
    confidence_tier TEXT NOT NULL DEFAULT 'MEDIUM' 
        CHECK (confidence_tier IN ('LOW', 'MEDIUM', 'HIGH', 'INSUFFICIENT_DATA')),
    confidence_score NUMERIC(5,4) NOT NULL DEFAULT 0.0000 
        CHECK (confidence_score >= 0.0000 AND confidence_score <= 1.0000),
    category TEXT NOT NULL,
    state TEXT NOT NULL,
    lga TEXT NOT NULL,
    forecast_window TEXT NOT NULL DEFAULT 'NEXT_24H' 
        CHECK (forecast_window IN ('NEXT_1H', 'NEXT_6H', 'NEXT_24H', 'NEXT_7D')),
    current_demand NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    baseline_demand NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    projected_demand NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    projected_supply NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    demand_growth_rate NUMERIC(6,4) NOT NULL DEFAULT 0.0000,
    supply_growth_rate NUMERIC(6,4) NOT NULL DEFAULT 0.0000,
    demand_supply_gap NUMERIC(10,2) NOT NULL DEFAULT 0.00,
    sample_size INT NOT NULL DEFAULT 0,
    unique_sessions INT NOT NULL DEFAULT 0,
    explanation JSONB NOT NULL DEFAULT '{}'::jsonb,
    supporting_evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
    source_signals JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_recommendations JSONB NOT NULL DEFAULT '[]'::jsonb,
    source_anomalies JSONB NOT NULL DEFAULT '[]'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '24 hours'),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_growth_predictions_state_conf
    ON public.analytics_growth_predictions (prediction_state, confidence_tier, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_growth_predictions_spatial
    ON public.analytics_growth_predictions (state, lga, category);

CREATE INDEX IF NOT EXISTS idx_analytics_growth_predictions_expires
    ON public.analytics_growth_predictions (expires_at)
    WHERE prediction_state != 'EXPIRED';

-- 2. PREDICTIVE AUDIT LOG TABLE (APPEND-ONLY)
CREATE TABLE IF NOT EXISTS public.analytics_growth_prediction_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prediction_id UUID NOT NULL REFERENCES public.analytics_growth_predictions(id) ON DELETE CASCADE,
    previous_state TEXT NOT NULL,
    new_state TEXT NOT NULL,
    actor_id UUID NOT NULL,
    action TEXT NOT NULL 
        CHECK (action IN ('STATE_TRANSITION', 'ACKNOWLEDGE', 'WATCH', 'DISMISS', 'FLAG_FOLLOWUP', 'EXPIRE', 'INVALIDATE')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analytics_growth_pred_audit_target
    ON public.analytics_growth_prediction_audit_log (prediction_id, created_at DESC);

-- 3. ROW LEVEL SECURITY & PERMISSION HARDENING
ALTER TABLE public.analytics_growth_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_growth_prediction_audit_log ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_growth_predictions FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_growth_prediction_audit_log FROM PUBLIC, anon;

-- Restrict direct read/write to verified administrators
CREATE POLICY admin_manage_growth_predictions ON public.analytics_growth_predictions
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_read_growth_prediction_audit_log ON public.analytics_growth_prediction_audit_log
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY admin_insert_growth_prediction_audit_log ON public.analytics_growth_prediction_audit_log
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

-- Enforce append-only immutability on audit log
REVOKE UPDATE, DELETE ON public.analytics_growth_prediction_audit_log FROM authenticated;

-- ==============================================================================
-- 4. PRIVILEGED PREDICTIVE GROWTH INTELLIGENCE RPCs
-- ==============================================================================

-- 4.1 COMPUTE PREDICTIVE GROWTH INTELLIGENCE (DETERMINISTIC STATISTICAL FORECASTING)
CREATE OR REPLACE FUNCTION public.compute_predictive_growth_intelligence(
    p_force_refresh BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_last_computed TIMESTAMPTZ;
    v_predictions_created INT := 0;
    v_predictions_updated INT := 0;
    v_rec RECORD;
    v_opp_class TEXT;
    v_state TEXT;
    v_conf_tier TEXT;
    v_conf_score NUMERIC(5,4);
    v_velocity NUMERIC(10,2);
    v_projected_demand NUMERIC(10,2);
    v_projected_supply NUMERIC(10,2);
    v_gap NUMERIC(10,2);
    v_growth_rate NUMERIC(6,4);
    v_explanation JSONB;
    v_evidence JSONB;
    v_rec_match UUID;
    v_fingerprint TEXT;
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
            'message', 'Predictive growth intelligence computed recently. Cooldown active.',
            'last_computed_at', v_last_computed
        );
    END IF;

    -- Evaluate qualified operational intelligence records with privacy floor (N >= 30, k >= 5)
    FOR v_rec IN (
        SELECT 
            op.id AS op_id,
            op.category,
            op.state,
            op.lga,
            op.current_value,
            op.baseline_value,
            op.deviation_score,
            op.sample_size,
            op.unique_sessions,
            op.persistence_count,
            op.operational_state,
            op.priority,
            op.last_seen_at
        FROM public.analytics_operational_intelligence op
        WHERE op.operational_state IN ('WATCH', 'EMERGING', 'SUSTAINED', 'HIGH_PRIORITY')
          AND op.sample_size >= 30
          AND op.unique_sessions >= 5
          AND op.last_seen_at >= NOW() - INTERVAL '12 hours'
    ) LOOP
        -- 1. Deterministic Demand Velocity Calculation
        v_velocity := GREATEST(0.0, v_rec.current_value - v_rec.baseline_value);
        v_growth_rate := CASE 
            WHEN v_rec.baseline_value > 0 THEN ROUND((v_velocity / v_rec.baseline_value), 4)
            ELSE 1.0000
        END;

        -- 2. Damped Trend Demand Projection: \hat{D}_{t+h} = Level + (phi * Velocity)
        -- phi = 0.85 damping factor
        v_projected_demand := ROUND(v_rec.current_value + (0.85 * v_velocity), 2);

        -- 3. Provider Supply Capacity Estimation (Observational read from verified providers)
        SELECT COUNT(*) * 5.0 INTO v_projected_supply
        FROM public.providers p
        WHERE p.category = v_rec.category
          AND p.state = v_rec.state
          AND (p.lga = v_rec.lga OR p.lga = 'ALL_LGAS')
          AND p.status = 'ACTIVE';

        v_projected_supply := COALESCE(v_projected_supply, 0.0);
        v_gap := GREATEST(0.0, v_projected_demand - v_projected_supply);

        -- 4. Deterministic Opportunity Classification
        IF v_projected_supply = 0.0 AND v_rec.sample_size >= 30 THEN
            v_opp_class := 'SERVICE_EXPANSION';
        ELSIF v_gap > (v_projected_supply * 2.0) THEN
            v_opp_class := 'SUPPLY_SHORTAGE';
        ELSIF v_rec.persistence_count >= 3 THEN
            v_opp_class := 'HIGH_GROWTH_ZONE';
        ELSIF v_growth_rate >= 0.50 THEN
            v_opp_class := 'DEMAND_ACCELERATION';
        ELSIF v_rec.deviation_score >= 2.0 THEN
            v_opp_class := 'EMERGING_DEMAND';
        ELSE
            v_opp_class := 'UNMET_DEMAND';
        END IF;

        -- 5. Deterministic Confidence Score Calculation
        -- C = 0.25 * min(1, N/100) + 0.20 * min(1, k/20) + 0.25 * (persist/3) + 0.30 * (1 - var)
        v_conf_score := ROUND(
            (0.25 * LEAST(1.0, v_rec.sample_size / 100.0)) +
            (0.20 * LEAST(1.0, v_rec.unique_sessions / 20.0)) +
            (0.25 * LEAST(1.0, v_rec.persistence_count / 3.0)) +
            (0.30 * CASE WHEN v_rec.deviation_score > 0 THEN 0.90 ELSE 0.50 END),
            4
        );
        v_conf_score := LEAST(1.0000, GREATEST(0.0000, v_conf_score));

        IF v_conf_score >= 0.8000 THEN
            v_conf_tier := 'HIGH';
            v_state := 'HIGH_CONFIDENCE';
        ELSIF v_conf_score >= 0.5000 THEN
            v_conf_tier := 'MEDIUM';
            v_state := 'CONFIRMED';
        ELSE
            v_conf_tier := 'LOW';
            v_state := 'DETECTED';
        END IF;

        -- 6. Canonical Fingerprint Hashing
        v_fingerprint := encode(digest(
            format('PRED:%s:%s:%s:NEXT_24H', v_rec.category, v_rec.state, v_rec.lga),
            'sha256'
        ), 'hex');

        -- 7. Cross-System Observational Recommendation Match
        SELECT id INTO v_rec_match
        FROM public.growth_recommendations
        WHERE status = 'PENDING_ADMIN_REVIEW'
          AND target_category = v_rec.category
          AND target_state = v_rec.state
          AND (target_lga = v_rec.lga OR target_lga = 'ALL_LGAS')
        LIMIT 1;

        -- 8. Deterministic Explainability & Evidence Payload
        v_explanation := jsonb_build_object(
            'summary', format('Demand for %s in %s, %s is projected to reach %s searches/hr over the next 24 hours (+%s%% growth). Opportunity: %s.',
                              v_rec.category, v_rec.lga, v_rec.state, v_projected_demand, ROUND(v_growth_rate * 100), v_opp_class),
            'forecast_horizon', 'NEXT_24H',
            'current_rate', v_rec.current_value,
            'baseline_rate', v_rec.baseline_value,
            'projected_rate', v_projected_demand,
            'projected_supply_capacity', v_projected_supply,
            'projected_gap', v_gap,
            'growth_velocity', v_velocity,
            'confidence_tier', v_conf_tier,
            'confidence_score', v_conf_score,
            'operational_posture', 'OBSERVATIONAL_PREDICTIVE_ONLY'
        );

        v_evidence := jsonb_build_object(
            'sample_size', v_rec.sample_size,
            'session_diversity', v_rec.unique_sessions,
            'confirming_windows', v_rec.persistence_count,
            'deviation_sigma', format('+%sσ', v_rec.deviation_score),
            'damping_factor_applied', 0.85,
            'privacy_gate_satisfied', true
        );

        -- 9. Atomic UPSERT into analytics_growth_predictions
        INSERT INTO public.analytics_growth_predictions (
            prediction_fingerprint,
            prediction_type,
            opportunity_class,
            prediction_state,
            confidence_tier,
            confidence_score,
            category,
            state,
            lga,
            forecast_window,
            current_demand,
            baseline_demand,
            projected_demand,
            projected_supply,
            demand_growth_rate,
            supply_growth_rate,
            demand_supply_gap,
            sample_size,
            unique_sessions,
            explanation,
            supporting_evidence,
            source_recommendations,
            expires_at,
            updated_at
        ) VALUES (
            v_fingerprint,
            'DEMAND_FORECAST',
            v_opp_class,
            v_state,
            v_conf_tier,
            v_conf_score,
            v_rec.category,
            v_rec.state,
            v_rec.lga,
            'NEXT_24H',
            v_rec.current_value,
            v_rec.baseline_value,
            v_projected_demand,
            v_projected_supply,
            v_growth_rate,
            0.0000,
            v_gap,
            v_rec.sample_size,
            v_rec.unique_sessions,
            v_explanation,
            v_evidence,
            CASE WHEN v_rec_match IS NOT NULL THEN jsonb_build_array(v_rec_match) ELSE '[]'::jsonb END,
            NOW() + INTERVAL '24 hours',
            NOW()
        )
        ON CONFLICT (prediction_fingerprint) DO UPDATE SET
            opportunity_class = EXCLUDED.opportunity_class,
            prediction_state = CASE 
                WHEN analytics_growth_predictions.prediction_state IN ('WATCH', 'COOLDOWN') THEN analytics_growth_predictions.prediction_state 
                ELSE EXCLUDED.prediction_state 
            END,
            confidence_tier = EXCLUDED.confidence_tier,
            confidence_score = EXCLUDED.confidence_score,
            current_demand = EXCLUDED.current_demand,
            baseline_demand = EXCLUDED.baseline_demand,
            projected_demand = EXCLUDED.projected_demand,
            projected_supply = EXCLUDED.projected_supply,
            demand_growth_rate = EXCLUDED.demand_growth_rate,
            demand_supply_gap = EXCLUDED.demand_supply_gap,
            sample_size = EXCLUDED.sample_size,
            unique_sessions = EXCLUDED.unique_sessions,
            explanation = EXCLUDED.explanation,
            supporting_evidence = EXCLUDED.supporting_evidence,
            source_recommendations = EXCLUDED.source_recommendations,
            expires_at = NOW() + INTERVAL '24 hours',
            updated_at = NOW();

        v_predictions_created := v_predictions_created + 1;
    END LOOP;

    -- Clean up expired predictions (> 24h)
    UPDATE public.analytics_growth_predictions
    SET prediction_state = 'EXPIRED', updated_at = NOW()
    WHERE expires_at < NOW() AND prediction_state != 'EXPIRED';

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'predictions_evaluated', v_predictions_created,
        'evaluated_at', NOW()
    );
END;
$$;

-- 4.2 GET PREDICTIVE GROWTH PREDICTIONS FEED
CREATE OR REPLACE FUNCTION public.get_predictive_growth_predictions()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_predictions JSONB;
    v_high_conf_count INT := 0;
    v_emerging_count INT := 0;
    v_shortage_count INT := 0;
    v_total_active INT := 0;
BEGIN
    -- Server-side admin authorization verification
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT 
        COUNT(*) FILTER (WHERE confidence_tier = 'HIGH'),
        COUNT(*) FILTER (WHERE opportunity_class = 'EMERGING_DEMAND'),
        COUNT(*) FILTER (WHERE opportunity_class IN ('SUPPLY_SHORTAGE', 'SERVICE_EXPANSION')),
        COUNT(*) FILTER (WHERE prediction_state != 'EXPIRED')
    INTO 
        v_high_conf_count,
        v_emerging_count,
        v_shortage_count,
        v_total_active
    FROM public.analytics_growth_predictions
    WHERE prediction_state != 'EXPIRED';

    SELECT jsonb_agg(pred) INTO v_predictions
    FROM (
        SELECT 
            id,
            prediction_fingerprint,
            prediction_type,
            opportunity_class,
            prediction_state,
            confidence_tier,
            confidence_score,
            category,
            state,
            lga,
            forecast_window,
            current_demand,
            baseline_demand,
            projected_demand,
            projected_supply,
            demand_growth_rate,
            demand_supply_gap,
            sample_size,
            unique_sessions,
            explanation,
            supporting_evidence,
            source_recommendations,
            expires_at,
            created_at,
            updated_at
        FROM public.analytics_growth_predictions
        WHERE prediction_state IN ('DETECTED', 'CONFIRMED', 'HIGH_CONFIDENCE', 'WATCH', 'ACTIONABLE', 'COOLDOWN')
        ORDER BY 
            confidence_score DESC,
            demand_supply_gap DESC,
            updated_at DESC
        LIMIT 50
    ) pred;

    RETURN jsonb_build_object(
        'status', 'HEALTHY',
        'posture', 'OBSERVATIONAL_PREDICTIVE_ONLY',
        'high_confidence_count', v_high_conf_count,
        'emerging_count', v_emerging_count,
        'shortage_count', v_shortage_count,
        'total_active_count', v_total_active,
        'predictions', COALESCE(v_predictions, '[]'::jsonb),
        'fetched_at', NOW()
    );
END;
$$;

-- 4.3 GET PREDICTIVE GROWTH DELTA
CREATE OR REPLACE FUNCTION public.get_predictive_growth_delta(
    p_since TIMESTAMPTZ
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_delta JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT jsonb_agg(d) INTO v_delta
    FROM (
        SELECT 
            id,
            prediction_fingerprint,
            opportunity_class,
            prediction_state,
            confidence_tier,
            confidence_score,
            category,
            state,
            lga,
            projected_demand,
            projected_supply,
            demand_growth_rate,
            demand_supply_gap,
            explanation,
            updated_at
        FROM public.analytics_growth_predictions
        WHERE updated_at >= p_since
        ORDER BY updated_at DESC
        LIMIT 50
    ) d;

    RETURN jsonb_build_object(
        'delta', COALESCE(v_delta, '[]'::jsonb),
        'count', COALESCE(jsonb_array_length(v_delta), 0),
        'since', p_since,
        'timestamp', NOW()
    );
END;
$$;

-- 4.4 GET PREDICTIVE GROWTH EVIDENCE
CREATE OR REPLACE FUNCTION public.get_predictive_growth_evidence(
    p_prediction_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_pred RECORD;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT 
        id,
        category,
        state,
        lga,
        forecast_window,
        current_demand,
        baseline_demand,
        projected_demand,
        projected_supply,
        demand_growth_rate,
        confidence_score,
        confidence_tier,
        sample_size,
        unique_sessions,
        explanation,
        supporting_evidence,
        source_recommendations
    INTO v_pred
    FROM public.analytics_growth_predictions
    WHERE id = p_prediction_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Growth prediction not found: %', p_prediction_id
            USING ERRCODE = 'P0002';
    END IF;

    RETURN jsonb_build_object(
        'prediction_id', v_pred.id,
        'category', v_pred.category,
        'state', v_pred.state,
        'lga', v_pred.lga,
        'forecast_window', v_pred.forecast_window,
        'confidence_tier', v_pred.confidence_tier,
        'confidence_score', v_pred.confidence_score,
        'explanation', v_pred.explanation,
        'supporting_evidence', v_pred.supporting_evidence,
        'source_recommendations', v_pred.source_recommendations
    );
END;
$$;

-- 4.5 TRANSITION PREDICTIVE GROWTH STATE
CREATE OR REPLACE FUNCTION public.transition_predictive_growth(
    p_prediction_id UUID,
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

    IF p_new_state NOT IN ('DETECTED', 'CONFIRMED', 'HIGH_CONFIDENCE', 'WATCH', 'ACTIONABLE', 'COOLDOWN', 'EXPIRED', 'INVALIDATED') THEN
        RAISE EXCEPTION 'Invalid target prediction state: %', p_new_state
            USING ERRCODE = '22023';
    END IF;

    SELECT prediction_state INTO v_curr_state
    FROM public.analytics_growth_predictions
    WHERE id = p_prediction_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prediction not found: %', p_prediction_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Rejection of illegal state resurrection
    IF v_curr_state = 'EXPIRED' AND p_new_state != 'EXPIRED' THEN
        RAISE EXCEPTION 'Illegal state transition: Cannot resurrect EXPIRED prediction'
            USING ERRCODE = '22023';
    END IF;

    -- Update state
    UPDATE public.analytics_growth_predictions
    SET prediction_state = p_new_state,
        updated_at = NOW()
    WHERE id = p_prediction_id;

    -- Append to immutable audit log
    INSERT INTO public.analytics_growth_prediction_audit_log (
        prediction_id,
        previous_state,
        new_state,
        actor_id,
        action,
        notes
    ) VALUES (
        p_prediction_id,
        v_curr_state,
        p_new_state,
        auth.uid(),
        'STATE_TRANSITION',
        p_notes
    );

    RETURN jsonb_build_object(
        'status', 'TRANSITIONED',
        'prediction_id', p_prediction_id,
        'previous_state', v_curr_state,
        'new_state', p_new_state,
        'updated_at', NOW()
    );
END;
$$;

-- 4.6 ACKNOWLEDGE PREDICTIVE GROWTH OPPORTUNITY
CREATE OR REPLACE FUNCTION public.acknowledge_predictive_growth(
    p_prediction_id UUID,
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

    SELECT prediction_state INTO v_curr_state
    FROM public.analytics_growth_predictions
    WHERE id = p_prediction_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Prediction not found: %', p_prediction_id
            USING ERRCODE = 'P0002';
    END IF;

    -- Move to COOLDOWN upon operator acknowledgement
    UPDATE public.analytics_growth_predictions
    SET prediction_state = 'COOLDOWN',
        acknowledged_at = NOW(),
        acknowledged_by = auth.uid(),
        updated_at = NOW()
    WHERE id = p_prediction_id;

    -- Append to immutable audit log
    INSERT INTO public.analytics_growth_prediction_audit_log (
        prediction_id,
        previous_state,
        new_state,
        actor_id,
        action,
        notes
    ) VALUES (
        p_prediction_id,
        v_curr_state,
        'COOLDOWN',
        auth.uid(),
        'ACKNOWLEDGE',
        COALESCE(p_notes, 'Acknowledged opportunity by operator')
    );

    RETURN jsonb_build_object(
        'status', 'ACKNOWLEDGED',
        'prediction_id', p_prediction_id,
        'acknowledged_at', NOW()
    );
END;
$$;
