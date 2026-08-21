-- ============================================================================
-- LOKATOR.NG — DATABASE MIGRATION 008: GROWTH AUTOMATION & SMART RECOMMENDATIONS
-- ============================================================================
-- Architecture Reference: Phase 7.2 Architecture Audit (GREEN WITH NOTES)
-- Invariant 1: ACCEPTED != EXECUTED (Advisory consensus only; zero provider mutations)
-- Invariant 2: STRICT RANKING AIR-GAP (Zero influence on live search ranking)
-- Invariant 3: PRIVACY PRESERVATION (k >= 5 sessions, N >= 30 sample floors)
-- Invariant 4: APPEND-ONLY AUDIT TRAIL (REVOKE UPDATE, DELETE on audit log)
-- ============================================================================

-- 1. RECOMMENDATIONS STORAGE TABLE
CREATE TABLE IF NOT EXISTS public.analytics_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_fingerprint TEXT NOT NULL UNIQUE,
    recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
        'SUPPLY_GAP',
        'ZERO_RESULT_SURGE',
        'DISCOVERY_QUALITY_DECLINE',
        'DEMAND_SPIKE',
        'CATEGORY_EXPANSION_OPPORTUNITY',
        'PROVIDER_ONBOARDING_OPPORTUNITY',
        'LOCATION_EXPANSION_OPPORTUNITY'
    )),
    category TEXT NOT NULL,
    state TEXT NOT NULL DEFAULT 'All',
    lga TEXT NOT NULL DEFAULT 'All',
    period_bucket TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    rationale TEXT NOT NULL,
    recommended_action TEXT NOT NULL,
    confidence_score NUMERIC(4,2) NOT NULL CHECK (confidence_score >= 0.00 AND confidence_score <= 1.00),
    confidence_tier TEXT NOT NULL CHECK (confidence_tier IN ('LOW', 'MEDIUM', 'HIGH')),
    priority TEXT NOT NULL CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    demand_index NUMERIC(10,2) NOT NULL DEFAULT 0.0,
    supply_index INT NOT NULL DEFAULT 0,
    gap_ratio NUMERIC(10,2) NOT NULL DEFAULT 0.0,
    dqs_score NUMERIC(5,2) NOT NULL DEFAULT 100.0,
    sample_size INT NOT NULL DEFAULT 0,
    confirmation_windows INT NOT NULL DEFAULT 1,
    status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN ('NEW', 'REVIEWED', 'ACCEPTED', 'DISMISSED', 'EXPIRED')),
    model_version TEXT NOT NULL DEFAULT 'v1',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES auth.users(id),
    resolution_notes TEXT
);

-- Performance & Indexing
CREATE INDEX IF NOT EXISTS idx_analytics_recommendations_status_priority
    ON public.analytics_recommendations (status, priority, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_recommendations_category_lga
    ON public.analytics_recommendations (category, state, lga);
CREATE INDEX IF NOT EXISTS idx_analytics_recommendations_expires
    ON public.analytics_recommendations (expires_at) WHERE status IN ('NEW', 'REVIEWED');

-- 2. APPEND-ONLY ADMINISTRATIVE AUDIT LOG
CREATE TABLE IF NOT EXISTS public.analytics_recommendation_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id UUID NOT NULL REFERENCES public.analytics_recommendations(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id),
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    action TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendation_audit_log_rec_id
    ON public.analytics_recommendation_audit_log (recommendation_id, created_at DESC);

-- 3. ROW LEVEL SECURITY POLICIES
ALTER TABLE public.analytics_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_recommendation_audit_log ENABLE ROW LEVEL SECURITY;

-- Revoke dangerous direct permissions
REVOKE ALL ON public.analytics_recommendations FROM PUBLIC, anon;
REVOKE ALL ON public.analytics_recommendation_audit_log FROM PUBLIC, anon;

-- Immutable audit log: NO UPDATE, NO DELETE
REVOKE UPDATE, DELETE ON public.analytics_recommendation_audit_log FROM authenticated;

-- RLS for Recommendations
CREATE POLICY admin_manage_recommendations ON public.analytics_recommendations
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY admin_view_recommendation_audit ON public.analytics_recommendation_audit_log
    FOR SELECT TO authenticated
    USING (public.is_admin());

CREATE POLICY admin_insert_recommendation_audit ON public.analytics_recommendation_audit_log
    FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

-- ============================================================================
-- 4. SERVER-SIDE RPCs (SECURITY DEFINER + is_admin() + search_path)
-- ============================================================================

-- A. GENERATE GROWTH RECOMMENDATIONS (MULTI-WINDOW CONFIRMATION & TTL EXPIRATION)
CREATE OR REPLACE FUNCTION public.generate_growth_recommendations(
    p_eval_days INT DEFAULT 7,
    p_baseline_days INT DEFAULT 28
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_rec_count INT := 0;
    v_expired_count INT := 0;
    v_rec RECORD;
    v_fingerprint TEXT;
    v_title TEXT;
    v_summary TEXT;
    v_action TEXT;
    v_rationale TEXT;
    v_confidence NUMERIC(4,2);
    v_confidence_tier TEXT;
    v_priority TEXT;
    v_period_bucket TEXT;
BEGIN
    -- Authorization Check
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    -- Parameter Guard
    p_eval_days := COALESCE(p_eval_days, 7);
    p_baseline_days := COALESCE(p_baseline_days, 28);
    IF p_eval_days < 1 OR p_eval_days > 90 OR p_baseline_days < 7 OR p_baseline_days > 365 THEN
        RAISE EXCEPTION 'Invalid parameters: eval_days [1-90], baseline_days [7-365]'
            USING ERRCODE = '22023';
    END IF;

    v_period_bucket := TO_CHAR(CURRENT_DATE, 'YYYY-"W"IW');

    -- STEP 1: Auto-Expire Stale Recommendations (> 14 days without action)
    UPDATE public.analytics_recommendations
    SET status = 'EXPIRED',
        updated_at = NOW()
    WHERE status IN ('NEW', 'REVIEWED')
      AND expires_at <= NOW();
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    -- STEP 2: Evaluate Multi-Window Demand-Supply Gaps across LGAs
    FOR v_rec IN
        SELECT
            category,
            state,
            lga,
            SUM(search_count) AS total_searches,
            SUM(zero_result_count) AS total_zero_results,
            SUM(profile_view_count) AS total_views,
            SUM(lead_count) AS total_leads,
            SUM(unique_sessions) AS total_sessions,
            AVG(demand_index) AS avg_demand,
            MAX(active_verified_providers) AS max_providers,
            AVG(gap_ratio) AS avg_gap,
            AVG(dqs_score) AS avg_dqs,
            COUNT(DISTINCT summary_date) AS active_days
        FROM public.analytics_growth_daily_summary
        WHERE summary_date >= CURRENT_DATE - p_eval_days
          AND summary_date < CURRENT_DATE
        GROUP BY category, state, lga
        HAVING SUM(search_count) >= 30 AND SUM(unique_sessions) >= 5
    LOOP
        -- CASE 1: ACUTE SUPPLY DEFICIT
        IF v_rec.avg_gap >= 15.0 AND v_rec.max_providers <= 1 THEN
            v_fingerprint := encode(digest('REC:SUPPLY_GAP:' || v_rec.category || ':' || v_rec.state || ':' || v_rec.lga || ':' || v_period_bucket, 'sha256'), 'hex');
            v_title := 'Supply Deficit: ' || INITCAP(v_rec.category) || ' in ' || v_rec.lga;
            v_summary := 'High search demand with insufficient active verified artisan supply.';
            v_rationale := 'Demand Index is ' || ROUND(v_rec.avg_demand, 1) || 'x with ' || v_rec.max_providers || ' verified providers across ' || v_rec.total_sessions || ' unique sessions.';
            v_action := 'Prioritize ' || v_rec.category || ' artisan acquisition campaigns and field verification in ' || v_rec.lga || '.';
            
            -- Confidence Calculation: bounded [0.00, 1.00]
            v_confidence := LEAST(1.00, 0.35 * LEAST(1.0, (v_rec.total_searches - 30)::NUMERIC / 70.0) +
                                        0.30 * CASE WHEN v_rec.active_days >= 5 THEN 1.0 WHEN v_rec.active_days >= 3 THEN 0.7 ELSE 0.4 END +
                                        0.20 * LEAST(1.0, v_rec.avg_gap / 25.0) +
                                        0.15 * LEAST(1.0, (v_rec.total_sessions - 5)::NUMERIC / 15.0));
            v_confidence_tier := CASE WHEN v_confidence >= 0.80 THEN 'HIGH' WHEN v_confidence >= 0.55 THEN 'MEDIUM' ELSE 'LOW' END;
            v_priority := CASE WHEN v_rec.avg_gap >= 25.0 AND v_rec.max_providers = 0 THEN 'CRITICAL' ELSE 'HIGH' END;

            INSERT INTO public.analytics_recommendations (
                recommendation_fingerprint, recommendation_type, category, state, lga,
                period_bucket, title, summary, rationale, recommended_action,
                confidence_score, confidence_tier, priority, demand_index, supply_index,
                gap_ratio, dqs_score, sample_size, confirmation_windows, status, updated_at
            ) VALUES (
                v_fingerprint, 'SUPPLY_GAP', v_rec.category, v_rec.state, v_rec.lga,
                v_period_bucket, v_title, v_summary, v_rationale, v_action,
                v_confidence, v_confidence_tier, v_priority, v_rec.avg_demand, v_rec.max_providers,
                v_rec.avg_gap, v_rec.avg_dqs, v_rec.total_searches, CASE WHEN v_rec.active_days >= 5 THEN 2 ELSE 1 END,
                'NEW', NOW()
            )
            ON CONFLICT (recommendation_fingerprint) DO UPDATE
            SET demand_index = EXCLUDED.demand_index,
                gap_ratio = EXCLUDED.gap_ratio,
                confidence_score = EXCLUDED.confidence_score,
                confidence_tier = EXCLUDED.confidence_tier,
                sample_size = EXCLUDED.sample_size,
                updated_at = NOW()
            WHERE analytics_recommendations.status IN ('NEW', 'REVIEWED');

            v_rec_count := v_rec_count + 1;
        END IF;

        -- CASE 2: ZERO RESULT SURGE
        IF (v_rec.total_zero_results::NUMERIC / NULLIF(v_rec.total_searches, 0)) >= 0.35 THEN
            v_fingerprint := encode(digest('REC:ZERO_RESULT_SURGE:' || v_rec.category || ':' || v_rec.state || ':' || v_rec.lga || ':' || v_period_bucket, 'sha256'), 'hex');
            v_title := 'Zero-Result Surge: ' || INITCAP(v_rec.category) || ' in ' || v_rec.lga;
            v_summary := 'Elevated rate of unfulfilled customer searches.';
            v_rationale := ROUND((v_rec.total_zero_results::NUMERIC / v_rec.total_searches * 100), 1) || '% of ' || v_rec.total_searches || ' searches produced zero artisan candidates.';
            v_action := 'Audit skill synonym canonicalization and verify artisan coverage in ' || v_rec.lga || '.';
            
            v_confidence := LEAST(1.00, 0.40 * LEAST(1.0, (v_rec.total_searches - 30)::NUMERIC / 50.0) +
                                        0.35 * (v_rec.total_zero_results::NUMERIC / v_rec.total_searches) +
                                        0.25 * LEAST(1.0, (v_rec.total_sessions - 5)::NUMERIC / 10.0));
            v_confidence_tier := CASE WHEN v_confidence >= 0.80 THEN 'HIGH' WHEN v_confidence >= 0.55 THEN 'MEDIUM' ELSE 'LOW' END;
            v_priority := 'HIGH';

            INSERT INTO public.analytics_recommendations (
                recommendation_fingerprint, recommendation_type, category, state, lga,
                period_bucket, title, summary, rationale, recommended_action,
                confidence_score, confidence_tier, priority, demand_index, supply_index,
                gap_ratio, dqs_score, sample_size, confirmation_windows, status, updated_at
            ) VALUES (
                v_fingerprint, 'ZERO_RESULT_SURGE', v_rec.category, v_rec.state, v_rec.lga,
                v_period_bucket, v_title, v_summary, v_rationale, v_action,
                v_confidence, v_confidence_tier, v_priority, v_rec.avg_demand, v_rec.max_providers,
                v_rec.avg_gap, v_rec.avg_dqs, v_rec.total_searches, 1,
                'NEW', NOW()
            )
            ON CONFLICT (recommendation_fingerprint) DO UPDATE
            SET dqs_score = EXCLUDED.dqs_score,
                confidence_score = EXCLUDED.confidence_score,
                updated_at = NOW()
            WHERE analytics_recommendations.status IN ('NEW', 'REVIEWED');

            v_rec_count := v_rec_count + 1;
        END IF;

        -- CASE 3: DISCOVERY QUALITY DECLINE (DQS < 60)
        IF v_rec.avg_dqs < 60.0 AND v_rec.total_searches >= 50 THEN
            v_fingerprint := encode(digest('REC:DISCOVERY_QUALITY_DECLINE:' || v_rec.category || ':' || v_rec.state || ':' || v_rec.lga || ':' || v_period_bucket, 'sha256'), 'hex');
            v_title := 'Discovery Quality Fix: ' || INITCAP(v_rec.category) || ' in ' || v_rec.lga;
            v_summary := 'Low search-to-profile conversion and quality score deterioration.';
            v_rationale := 'Discovery Quality Score is ' || ROUND(v_rec.avg_dqs, 1) || '/100 across ' || v_rec.total_searches || ' searches.';
            v_action := 'Review profile presentation, location radius parameters, and service descriptions.';
            
            v_confidence := 0.75;
            v_confidence_tier := 'MEDIUM';
            v_priority := 'MEDIUM';

            INSERT INTO public.analytics_recommendations (
                recommendation_fingerprint, recommendation_type, category, state, lga,
                period_bucket, title, summary, rationale, recommended_action,
                confidence_score, confidence_tier, priority, demand_index, supply_index,
                gap_ratio, dqs_score, sample_size, confirmation_windows, status, updated_at
            ) VALUES (
                v_fingerprint, 'DISCOVERY_QUALITY_DECLINE', v_rec.category, v_rec.state, v_rec.lga,
                v_period_bucket, v_title, v_summary, v_rationale, v_action,
                v_confidence, v_confidence_tier, v_priority, v_rec.avg_demand, v_rec.max_providers,
                v_rec.avg_gap, v_rec.avg_dqs, v_rec.total_searches, 1,
                'NEW', NOW()
            )
            ON CONFLICT (recommendation_fingerprint) DO UPDATE
            SET dqs_score = EXCLUDED.dqs_score,
                updated_at = NOW()
            WHERE analytics_recommendations.status IN ('NEW', 'REVIEWED');

            v_rec_count := v_rec_count + 1;
        END IF;
    END LOOP;

    -- STEP 3: Batch Admin Daily Digest Notification (Phase 7.2 P3-02)
    IF v_rec_count > 0 THEN
        INSERT INTO public.analytics_notification_outbox (
            alert_id, recipient, channel, message_payload, status
        ) VALUES (
            NULL,
            'admin@lokator.ng',
            'EMAIL',
            jsonb_build_object(
                'subject', 'Lokator.NG Daily Growth Digest: ' || v_rec_count || ' New Recommendations',
                'recommendation_count', v_rec_count,
                'period_bucket', v_period_bucket,
                'generated_at', NOW()
            ),
            'PENDING'
        );
    END IF;

    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'recommendations_evaluated', v_rec_count,
        'expired_recommendations', v_expired_count,
        'model_version', 'v1',
        'generated_at', NOW()
    );
END;
$$;

-- B. GET GROWTH RECOMMENDATIONS SUMMARY
CREATE OR REPLACE FUNCTION public.get_growth_recommendation_summary()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_total_active INT := 0;
    v_critical INT := 0;
    v_high INT := 0;
    v_supply_gaps INT := 0;
    v_zero_results INT := 0;
    v_quality_fixes INT := 0;
    v_items JSONB := '[]'::jsonb;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT
        COUNT(*) FILTER (WHERE status IN ('NEW', 'REVIEWED')),
        COUNT(*) FILTER (WHERE status IN ('NEW', 'REVIEWED') AND priority = 'CRITICAL'),
        COUNT(*) FILTER (WHERE status IN ('NEW', 'REVIEWED') AND priority = 'HIGH'),
        COUNT(*) FILTER (WHERE status IN ('NEW', 'REVIEWED') AND recommendation_type = 'SUPPLY_GAP'),
        COUNT(*) FILTER (WHERE status IN ('NEW', 'REVIEWED') AND recommendation_type = 'ZERO_RESULT_SURGE'),
        COUNT(*) FILTER (WHERE status IN ('NEW', 'REVIEWED') AND recommendation_type = 'DISCOVERY_QUALITY_DECLINE')
    INTO
        v_total_active, v_critical, v_high, v_supply_gaps, v_zero_results, v_quality_fixes
    FROM public.analytics_recommendations;

    SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
            'id', id,
            'fingerprint', recommendation_fingerprint,
            'type', recommendation_type,
            'category', category,
            'state', state,
            'lga', lga,
            'title', title,
            'summary', summary,
            'rationale', rationale,
            'recommended_action', recommended_action,
            'confidence_score', confidence_score,
            'confidence_tier', confidence_tier,
            'priority', priority,
            'demand_index', demand_index,
            'supply_index', supply_index,
            'gap_ratio', gap_ratio,
            'dqs_score', dqs_score,
            'sample_size', sample_size,
            'confirmation_windows', confirmation_windows,
            'status', status,
            'expires_at', expires_at,
            'created_at', created_at
        ) ORDER BY
            CASE priority WHEN 'CRITICAL' THEN 1 WHEN 'HIGH' THEN 2 WHEN 'MEDIUM' THEN 3 ELSE 4 END,
            confidence_score DESC,
            created_at DESC
    ), '[]'::jsonb)
    INTO v_items
    FROM public.analytics_recommendations
    WHERE status IN ('NEW', 'REVIEWED')
    LIMIT 25;

    RETURN jsonb_build_object(
        'active_count', v_total_active,
        'critical_count', v_critical,
        'high_count', v_high,
        'supply_gap_count', v_supply_gaps,
        'zero_result_count', v_zero_results,
        'quality_fix_count', v_quality_fixes,
        'recommendations', v_items,
        'observational_posture', 'OBSERVATIONAL_ADVISORY_ONLY'
    );
END;
$$;

-- C. REVIEW GROWTH RECOMMENDATION
CREATE OR REPLACE FUNCTION public.review_growth_recommendation(
    p_recommendation_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_prev_status TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT status INTO v_prev_status
    FROM public.analytics_recommendations
    WHERE id = p_recommendation_id;

    IF v_prev_status IS NULL THEN
        RAISE EXCEPTION 'Recommendation not found' USING ERRCODE = 'P0002';
    END IF;

    IF v_prev_status NOT IN ('NEW') THEN
        RAISE EXCEPTION 'Invalid State Transition: Cannot review recommendation with status %', v_prev_status
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.analytics_recommendations
    SET status = 'REVIEWED',
        updated_at = NOW(),
        resolution_notes = p_notes
    WHERE id = p_recommendation_id;

    INSERT INTO public.analytics_recommendation_audit_log (
        recommendation_id, actor_id, previous_status, new_status, action, notes
    ) VALUES (
        p_recommendation_id, auth.uid(), v_prev_status, 'REVIEWED', 'MARK_REVIEWED', p_notes
    );

    RETURN jsonb_build_object('status', 'SUCCESS', 'id', p_recommendation_id, 'new_status', 'REVIEWED');
END;
$$;

-- D. ACCEPT GROWTH RECOMMENDATION (ACCEPTED != EXECUTED INVARIANT)
CREATE OR REPLACE FUNCTION public.accept_growth_recommendation(
    p_recommendation_id UUID,
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_prev_status TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT status INTO v_prev_status
    FROM public.analytics_recommendations
    WHERE id = p_recommendation_id;

    IF v_prev_status IS NULL THEN
        RAISE EXCEPTION 'Recommendation not found' USING ERRCODE = 'P0002';
    END IF;

    IF v_prev_status NOT IN ('NEW', 'REVIEWED') THEN
        RAISE EXCEPTION 'Invalid State Transition: Cannot accept recommendation with status %', v_prev_status
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.analytics_recommendations
    SET status = 'ACCEPTED',
        resolved_at = NOW(),
        resolved_by = auth.uid(),
        resolution_notes = p_notes,
        updated_at = NOW()
    WHERE id = p_recommendation_id;

    INSERT INTO public.analytics_recommendation_audit_log (
        recommendation_id, actor_id, previous_status, new_status, action, notes
    ) VALUES (
        p_recommendation_id, auth.uid(), v_prev_status, 'ACCEPTED', 'ACCEPT_CONSENSUS', p_notes
    );

    -- NOTE: ACCEPTED != EXECUTED
    -- Zero automated provider creation, zero rating change, zero ranking change.
    RETURN jsonb_build_object(
        'status', 'SUCCESS',
        'id', p_recommendation_id,
        'new_status', 'ACCEPTED',
        'execution_posture', 'ACCEPTED_RECORDED_NO_AUTOMATED_MUTATION'
    );
END;
$$;

-- E. DISMISS GROWTH RECOMMENDATION
CREATE OR REPLACE FUNCTION public.dismiss_growth_recommendation(
    p_recommendation_id UUID,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_prev_status TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    SELECT status INTO v_prev_status
    FROM public.analytics_recommendations
    WHERE id = p_recommendation_id;

    IF v_prev_status IS NULL THEN
        RAISE EXCEPTION 'Recommendation not found' USING ERRCODE = 'P0002';
    END IF;

    IF v_prev_status NOT IN ('NEW', 'REVIEWED') THEN
        RAISE EXCEPTION 'Invalid State Transition: Cannot dismiss recommendation with status %', v_prev_status
            USING ERRCODE = '22023';
    END IF;

    UPDATE public.analytics_recommendations
    SET status = 'DISMISSED',
        resolved_at = NOW(),
        resolved_by = auth.uid(),
        resolution_notes = p_reason,
        updated_at = NOW()
    WHERE id = p_recommendation_id;

    INSERT INTO public.analytics_recommendation_audit_log (
        recommendation_id, actor_id, previous_status, new_status, action, notes
    ) VALUES (
        p_recommendation_id, auth.uid(), v_prev_status, 'DISMISSED', 'DISMISS_RECOMMENDATION', p_reason
    );

    RETURN jsonb_build_object('status', 'SUCCESS', 'id', p_recommendation_id, 'new_status', 'DISMISSED');
END;
$$;

-- F. EXPIRE STALE RECOMMENDATIONS (TTL MAINTENANCE)
CREATE OR REPLACE FUNCTION public.expire_growth_recommendations()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_expired_count INT := 0;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access Denied: Administrator privileges required'
            USING ERRCODE = '42501';
    END IF;

    UPDATE public.analytics_recommendations
    SET status = 'EXPIRED',
        updated_at = NOW()
    WHERE status IN ('NEW', 'REVIEWED')
      AND expires_at <= NOW();
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;

    RETURN jsonb_build_object('status', 'SUCCESS', 'expired_count', v_expired_count);
END;
$$;
