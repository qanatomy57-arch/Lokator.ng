-- ==============================================================================
-- LOKATOR.NG — PHASE 10.9 DATABASE MIGRATION
-- MARKETPLACE DISCOVERY & CONVERSION INTELLIGENCE ENGINE (MDCIE)
-- Migration: 031_lokator_marketplace_discovery_conversion.sql
-- Model Version: MDCIE-1.0.0
--
-- Invariants:
-- 1. 100% Ranking Air-Gap: Isolation from provider ranking and search scoring.
-- 2. Business Truth Immutability: Zero destructive mutations to providers, reviews, or provider_services.
-- 3. Zero Autonomous Execution: Advisory discovery intelligence; zero autonomous actions.
-- 4. Governed Canonical Taxonomy: Relationships and specializations strictly mapped to approved skills.
-- ==============================================================================

-- 1. Skill Relationships (Graph of Complementary & Related Trades)
CREATE TABLE IF NOT EXISTS public.skill_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id_a TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    skill_id_b TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL DEFAULT 'COMPLEMENTARY' CHECK (relationship_type IN ('COMPLEMENTARY', 'SUBSTITUTE', 'PREREQUISITE', 'RELATED')),
    strength_score NUMERIC(3,2) NOT NULL DEFAULT 0.85 CHECK (strength_score BETWEEN 0.10 AND 1.00),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_skill_pair UNIQUE (skill_id_a, skill_id_b)
);

-- 2. Marketplace Discovery & Conversion Events (Append-Only Non-Invasive Telemetry)
CREATE TABLE IF NOT EXISTS public.marketplace_discovery_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL CHECK (event_type IN (
        'marketplace_opened',
        'industry_selected',
        'category_selected',
        'skill_selected',
        'specialization_selected',
        'location_selected',
        'provider_results_viewed',
        'provider_profile_opened',
        'whatsapp_clicked',
        'phone_clicked',
        'zero_results',
        'related_skill_clicked'
    )),
    session_id TEXT,
    industry_id TEXT REFERENCES public.skill_industries(id) ON DELETE SET NULL,
    category_id TEXT REFERENCES public.skill_categories(id) ON DELETE SET NULL,
    skill_id TEXT REFERENCES public.skills(id) ON DELETE SET NULL,
    state_slug TEXT,
    city_slug TEXT,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES & PERFORMANCE OPTIMIZATIONS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_skill_rel_a ON public.skill_relationships(skill_id_a);
CREATE INDEX IF NOT EXISTS idx_skill_rel_b ON public.skill_relationships(skill_id_b);
CREATE INDEX IF NOT EXISTS idx_skill_rel_type ON public.skill_relationships(relationship_type);
CREATE INDEX IF NOT EXISTS idx_mdcie_events_type ON public.marketplace_discovery_events(event_type);
CREATE INDEX IF NOT EXISTS idx_mdcie_events_skill ON public.marketplace_discovery_events(skill_id);
CREATE INDEX IF NOT EXISTS idx_mdcie_events_created ON public.marketplace_discovery_events(created_at);

-- ==============================================================================
-- ROW LEVEL SECURITY & PERMISSIONS
-- ==============================================================================
ALTER TABLE public.skill_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.marketplace_discovery_events ENABLE ROW LEVEL SECURITY;

-- Skill Relationships: Public read active relationships, admin manage
DROP POLICY IF EXISTS p_skill_rel_select ON public.skill_relationships;
CREATE POLICY p_skill_rel_select ON public.skill_relationships
    FOR SELECT TO anon, authenticated
    USING (is_active = TRUE);

DROP POLICY IF EXISTS p_skill_rel_admin_all ON public.skill_relationships;
CREATE POLICY p_skill_rel_admin_all ON public.skill_relationships
    FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- Discovery Events: Append-only for all, select for admins/analysts
DROP POLICY IF EXISTS p_mdcie_events_insert ON public.marketplace_discovery_events;
CREATE POLICY p_mdcie_events_insert ON public.marketplace_discovery_events
    FOR INSERT TO anon, authenticated
    WITH CHECK (TRUE);

DROP POLICY IF EXISTS p_mdcie_events_select_admin ON public.marketplace_discovery_events;
CREATE POLICY p_mdcie_events_select_admin ON public.marketplace_discovery_events
    USING (public.is_admin());

REVOKE ALL ON public.marketplace_discovery_events FROM anon, authenticated;
GRANT SELECT, INSERT ON public.marketplace_discovery_events TO anon, authenticated;
REVOKE UPDATE, DELETE ON public.marketplace_discovery_events FROM anon, authenticated;

-- ==============================================================================
-- SEED CANONICAL RELATIONSHIPS & SPECIALIZATIONS
-- ==============================================================================
INSERT INTO public.skill_relationships (skill_id_a, skill_id_b, relationship_type, strength_score)
VALUES
    ('solar-installer', 'inverter-technician', 'COMPLEMENTARY', 0.95),
    ('solar-installer', 'electrician', 'COMPLEMENTARY', 0.90),
    ('solar-installer', 'generator-technician', 'SUBSTITUTE', 0.80),
    ('electrician', 'generator-technician', 'COMPLEMENTARY', 0.85),
    ('electrician', 'cctv-installer', 'COMPLEMENTARY', 0.80),
    ('plumber', 'borehole-technician', 'COMPLEMENTARY', 0.95),
    ('plumber', 'tiler', 'COMPLEMENTARY', 0.85),
    ('painter', 'pop-installer', 'COMPLEMENTARY', 0.90),
    ('carpenter', 'furniture-maker', 'COMPLEMENTARY', 0.85),
    ('auto-mechanic', 'auto-electrician', 'COMPLEMENTARY', 0.95),
    ('auto-mechanic', 'auto-ac-technician', 'COMPLEMENTARY', 0.90),
    ('auto-mechanic', 'panel-beater', 'COMPLEMENTARY', 0.85),
    ('auto-mechanic', 'vulcanizer', 'COMPLEMENTARY', 0.80),
    ('hair-stylist', 'braider', 'COMPLEMENTARY', 0.90),
    ('hair-stylist', 'nail-technician', 'COMPLEMENTARY', 0.85),
    ('barber', 'hair-stylist', 'RELATED', 0.75),
    ('makeup-artist', 'hair-stylist', 'COMPLEMENTARY', 0.90),
    ('makeup-artist', 'photographer', 'COMPLEMENTARY', 0.85),
    ('event-planner', 'caterer', 'COMPLEMENTARY', 0.95),
    ('event-planner', 'dj', 'COMPLEMENTARY', 0.90),
    ('event-planner', 'photographer', 'COMPLEMENTARY', 0.90),
    ('deep-cleaner', 'fumigator', 'COMPLEMENTARY', 0.90),
    ('deep-cleaner', 'upholstery-cleaner', 'COMPLEMENTARY', 0.95),
    ('tailor', 'fashion-designer', 'COMPLEMENTARY', 0.90),
    ('computer-repairer', 'phone-repairer', 'COMPLEMENTARY', 0.85),
    ('computer-repairer', 'web-developer', 'RELATED', 0.70)
ON CONFLICT (skill_id_a, skill_id_b) DO UPDATE
SET strength_score = EXCLUDED.strength_score,
    relationship_type = EXCLUDED.relationship_type;

-- Insert Bidirectional Pairs
INSERT INTO public.skill_relationships (skill_id_a, skill_id_b, relationship_type, strength_score)
VALUES
    ('inverter-technician', 'solar-installer', 'COMPLEMENTARY', 0.95),
    ('electrician', 'solar-installer', 'COMPLEMENTARY', 0.90),
    ('generator-technician', 'solar-installer', 'SUBSTITUTE', 0.80),
    ('generator-technician', 'electrician', 'COMPLEMENTARY', 0.85),
    ('cctv-installer', 'electrician', 'COMPLEMENTARY', 0.80),
    ('borehole-technician', 'plumber', 'COMPLEMENTARY', 0.95),
    ('tiler', 'plumber', 'COMPLEMENTARY', 0.85),
    ('pop-installer', 'painter', 'COMPLEMENTARY', 0.90),
    ('furniture-maker', 'carpenter', 'COMPLEMENTARY', 0.85),
    ('auto-electrician', 'auto-mechanic', 'COMPLEMENTARY', 0.95),
    ('auto-ac-technician', 'auto-mechanic', 'COMPLEMENTARY', 0.90),
    ('panel-beater', 'auto-mechanic', 'COMPLEMENTARY', 0.85),
    ('vulcanizer', 'auto-mechanic', 'COMPLEMENTARY', 0.80),
    ('braider', 'hair-stylist', 'COMPLEMENTARY', 0.90),
    ('nail-technician', 'hair-stylist', 'COMPLEMENTARY', 0.85),
    ('hair-stylist', 'barber', 'RELATED', 0.75),
    ('photographer', 'makeup-artist', 'COMPLEMENTARY', 0.85),
    ('caterer', 'event-planner', 'COMPLEMENTARY', 0.95),
    ('dj', 'event-planner', 'COMPLEMENTARY', 0.90),
    ('photographer', 'event-planner', 'COMPLEMENTARY', 0.90),
    ('fumigator', 'deep-cleaner', 'COMPLEMENTARY', 0.90),
    ('upholstery-cleaner', 'deep-cleaner', 'COMPLEMENTARY', 0.95),
    ('fashion-designer', 'tailor', 'COMPLEMENTARY', 0.90),
    ('phone-repairer', 'computer-repairer', 'COMPLEMENTARY', 0.85),
    ('web-developer', 'computer-repairer', 'RELATED', 0.70)
ON CONFLICT (skill_id_a, skill_id_b) DO UPDATE
SET strength_score = EXCLUDED.strength_score,
    relationship_type = EXCLUDED.relationship_type;

-- ==============================================================================
-- PRIVILEGED RPC CONTRACTS & FUNCTIONS
-- ==============================================================================

-- A. Build Validated Marketplace Discovery Context & Breadcrumbs
CREATE OR REPLACE FUNCTION public.get_marketplace_discovery_context(
    p_industry TEXT DEFAULT NULL,
    p_category TEXT DEFAULT NULL,
    p_skill TEXT DEFAULT NULL,
    p_specialization TEXT DEFAULT NULL,
    p_state TEXT DEFAULT NULL,
    p_city TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_industry_row RECORD;
    v_category_row RECORD;
    v_skill_row RECORD;
    v_spec_row RECORD;
    v_breadcrumbs JSONB := '[]'::jsonb;
    v_related_skills JSONB := '[]'::jsonb;
    v_result JSONB;
BEGIN
    -- 1. Resolve Skill if provided
    IF p_skill IS NOT NULL AND p_skill <> '' THEN
        SELECT s.*, c.industry_id, c.name as category_name, c.icon as category_icon,
               i.name as industry_name, i.icon as industry_icon
        INTO v_skill_row
        FROM public.skills s
        JOIN public.skill_categories c ON s.category_id = c.id
        JOIN public.skill_industries i ON c.industry_id = i.id
        WHERE s.id = p_skill AND s.governance_status = 'ACTIVE';

        IF v_skill_row.id IS NOT NULL THEN
            p_category := v_skill_row.category_id;
            p_industry := v_skill_row.industry_id;
        END IF;
    END IF;

    -- 2. Resolve Category if provided and not yet resolved
    IF p_category IS NOT NULL AND p_category <> '' AND v_skill_row.id IS NULL THEN
        SELECT c.*, i.name as industry_name, i.icon as industry_icon
        INTO v_category_row
        FROM public.skill_categories c
        JOIN public.skill_industries i ON c.industry_id = i.id
        WHERE c.id = p_category AND c.is_active = TRUE;

        IF v_category_row.id IS NOT NULL THEN
            p_industry := v_category_row.industry_id;
        END IF;
    END IF;

    -- 3. Resolve Industry if provided
    IF p_industry IS NOT NULL AND p_industry <> '' THEN
        SELECT * INTO v_industry_row
        FROM public.skill_industries
        WHERE id = p_industry AND is_active = TRUE;
    END IF;

    -- 4. Resolve Specialization if provided
    IF p_specialization IS NOT NULL AND p_specialization <> '' AND v_skill_row.id IS NOT NULL THEN
        SELECT * INTO v_spec_row
        FROM public.skill_specializations
        WHERE (slug = p_specialization OR id::text = p_specialization)
          AND skill_id = v_skill_row.id
          AND is_active = TRUE;
    END IF;

    -- 5. Construct Structured Breadcrumbs
    v_breadcrumbs := jsonb_build_array(
        jsonb_build_object('level', 'home', 'label', 'Home', 'url', 'index.html')
    );

    IF v_industry_row.id IS NOT NULL THEN
        v_breadcrumbs := v_breadcrumbs || jsonb_build_object(
            'level', 'industry',
            'id', v_industry_row.id,
            'label', v_industry_row.name,
            'icon', v_industry_row.icon,
            'url', 'search.html?industry=' || v_industry_row.id
        );
    END IF;

    IF v_category_row.id IS NOT NULL OR v_skill_row.category_id IS NOT NULL THEN
        v_breadcrumbs := v_breadcrumbs || jsonb_build_object(
            'level', 'category',
            'id', COALESCE(v_category_row.id, v_skill_row.category_id),
            'label', COALESCE(v_category_row.name, v_skill_row.category_name),
            'icon', COALESCE(v_category_row.icon, v_skill_row.category_icon),
            'url', 'search.html?category=' || COALESCE(v_category_row.id, v_skill_row.category_id)
        );
    END IF;

    IF v_skill_row.id IS NOT NULL THEN
        v_breadcrumbs := v_breadcrumbs || jsonb_build_object(
            'level', 'skill',
            'id', v_skill_row.id,
            'label', v_skill_row.display_name,
            'icon', v_skill_row.icon,
            'url', 'search.html?service=' || v_skill_row.id
        );
    END IF;

    IF v_spec_row.id IS NOT NULL THEN
        v_breadcrumbs := v_breadcrumbs || jsonb_build_object(
            'level', 'specialization',
            'id', v_spec_row.slug,
            'label', v_spec_row.name,
            'url', 'search.html?service=' || v_skill_row.id || '&spec=' || v_spec_row.slug
        );
    END IF;

    IF p_state IS NOT NULL AND p_state <> '' AND p_state <> 'all' THEN
        v_breadcrumbs := v_breadcrumbs || jsonb_build_object(
            'level', 'state',
            'label', p_state,
            'url', 'search.html?' || CASE WHEN v_skill_row.id IS NOT NULL THEN 'service=' || v_skill_row.id || '&' ELSE '' END || 'state=' || p_state
        );
    END IF;

    -- 6. Fetch Related Canonical Skills
    IF v_skill_row.id IS NOT NULL THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', s.id,
                'name', s.name,
                'display_name', s.display_name,
                'icon', s.icon,
                'relationship', sr.relationship_type,
                'strength', sr.strength_score
            ) ORDER BY sr.strength_score DESC
        )
        INTO v_related_skills
        FROM public.skill_relationships sr
        JOIN public.skills s ON sr.skill_id_b = s.id
        WHERE sr.skill_id_a = v_skill_row.id
          AND sr.is_active = TRUE
          AND s.governance_status = 'ACTIVE'
        LIMIT 6;
    END IF;

    v_result := jsonb_build_object(
        'industry', CASE WHEN v_industry_row.id IS NOT NULL THEN jsonb_build_object('id', v_industry_row.id, 'name', v_industry_row.name, 'icon', v_industry_row.icon) ELSE NULL END,
        'category', CASE WHEN v_category_row.id IS NOT NULL OR v_skill_row.category_id IS NOT NULL THEN jsonb_build_object('id', COALESCE(v_category_row.id, v_skill_row.category_id), 'name', COALESCE(v_category_row.name, v_skill_row.category_name), 'icon', COALESCE(v_category_row.icon, v_skill_row.category_icon)) ELSE NULL END,
        'skill', CASE WHEN v_skill_row.id IS NOT NULL THEN jsonb_build_object('id', v_skill_row.id, 'name', v_skill_row.name, 'display_name', v_skill_row.display_name, 'icon', v_skill_row.icon, 'prompt_text', v_skill_row.prompt_text, 'cta_text', v_skill_row.cta_text) ELSE NULL END,
        'specialization', CASE WHEN v_spec_row.id IS NOT NULL THEN jsonb_build_object('slug', v_spec_row.slug, 'name', v_spec_row.name) ELSE NULL END,
        'location', jsonb_build_object('state', p_state, 'city', p_city),
        'breadcrumbs', v_breadcrumbs,
        'related_skills', COALESCE(v_related_skills, '[]'::jsonb),
        'model_version', 'MDCIE-1.0.0'
    );

    RETURN v_result;
END;
$$;

-- B. Get Governed Related Skills for a Canonical Skill
CREATE OR REPLACE FUNCTION public.get_related_canonical_skills(
    p_skill_id TEXT,
    p_limit INT DEFAULT 6
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_skills JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', s.id,
            'name', s.name,
            'display_name', s.display_name,
            'icon', s.icon,
            'relationship', sr.relationship_type,
            'strength', sr.strength_score
        ) ORDER BY sr.strength_score DESC
    )
    INTO v_skills
    FROM public.skill_relationships sr
    JOIN public.skills s ON sr.skill_id_b = s.id
    WHERE sr.skill_id_a = p_skill_id
      AND sr.is_active = TRUE
      AND s.governance_status = 'ACTIVE'
    LIMIT LEAST(p_limit, 12);

    -- Fallback to same-category skills if no explicit relationships
    IF v_skills IS NULL OR jsonb_array_length(v_skills) = 0 THEN
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', s.id,
                'name', s.name,
                'display_name', s.display_name,
                'icon', s.icon,
                'relationship', 'SAME_CATEGORY',
                'strength', 0.70
            )
        )
        INTO v_skills
        FROM public.skills s
        WHERE s.category_id = (SELECT category_id FROM public.skills WHERE id = p_skill_id)
          AND s.id <> p_skill_id
          AND s.governance_status = 'ACTIVE'
        LIMIT LEAST(p_limit, 6);
    END IF;

    RETURN COALESCE(v_skills, '[]'::jsonb);
END;
$$;

-- C. Get Full Nested Hierarchy Tree (Optimized for Fast Client Caching)
CREATE OR REPLACE FUNCTION public.get_hierarchical_taxonomy_tree()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_tree JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ind.id,
            'name', ind.name,
            'icon', ind.icon,
            'description', ind.description,
            'display_order', ind.display_order,
            'categories', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', cat.id,
                        'name', cat.name,
                        'icon', cat.icon,
                        'description', cat.description,
                        'skills', (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'id', sk.id,
                                    'name', sk.name,
                                    'display_name', sk.display_name,
                                    'icon', sk.icon,
                                    'prompt_text', sk.prompt_text,
                                    'cta_text', sk.cta_text,
                                    'specializations', (
                                        SELECT jsonb_agg(
                                            jsonb_build_object(
                                                'slug', sp.slug,
                                                'name', sp.name
                                            )
                                        )
                                        FROM public.skill_specializations sp
                                        WHERE sp.skill_id = sk.id AND sp.is_active = TRUE
                                    )
                                ) ORDER BY sk.name ASC
                            )
                            FROM public.skills sk
                            WHERE sk.category_id = cat.id AND sk.governance_status = 'ACTIVE'
                        )
                    ) ORDER BY cat.display_order ASC, cat.name ASC
                )
                FROM public.skill_categories cat
                WHERE cat.industry_id = ind.id AND cat.is_active = TRUE
            )
        ) ORDER BY ind.display_order ASC, ind.name ASC
    )
    INTO v_tree
    FROM public.skill_industries ind
    WHERE ind.is_active = TRUE;

    RETURN COALESCE(v_tree, '[]'::jsonb);
END;
$$;

-- D. Log Non-Invasive Marketplace Discovery Event
CREATE OR REPLACE FUNCTION public.log_marketplace_discovery_event(
    p_event_type TEXT,
    p_context JSONB DEFAULT '{}'::jsonb,
    p_session_id TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_event_id UUID;
    v_industry_id TEXT;
    v_category_id TEXT;
    v_skill_id TEXT;
    v_state_slug TEXT;
    v_city_slug TEXT;
BEGIN
    -- Extract context parameters safely
    v_industry_id := NULLIF(p_context->>'industry_id', '');
    v_category_id := NULLIF(p_context->>'category_id', '');
    v_skill_id := NULLIF(p_context->>'skill_id', '');
    v_state_slug := NULLIF(p_context->>'state', '');
    v_city_slug := NULLIF(p_context->>'city', '');

    INSERT INTO public.marketplace_discovery_events (
        event_type,
        session_id,
        industry_id,
        category_id,
        skill_id,
        state_slug,
        city_slug,
        metadata
    ) VALUES (
        p_event_type,
        p_session_id,
        v_industry_id,
        v_category_id,
        v_skill_id,
        v_state_slug,
        v_city_slug,
        p_context
    )
    RETURNING id INTO v_event_id;

    RETURN v_event_id;
END;
$$;

-- E. Aggregate Discovery & Conversion Signals (For Strategic Observability Only)
CREATE OR REPLACE FUNCTION public.get_discovery_conversion_signals(
    p_timeframe_days INT DEFAULT 30
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_since TIMESTAMPTZ := NOW() - (p_timeframe_days || ' days')::INTERVAL;
    v_total_events INT;
    v_top_skills JSONB;
    v_zero_result_rate NUMERIC(5,2);
    v_contact_conversions INT;
    v_result JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Access denied. Administrative role required.';
    END IF;

    SELECT COUNT(*) INTO v_total_events
    FROM public.marketplace_discovery_events
    WHERE created_at >= v_since;

    SELECT jsonb_agg(
        jsonb_build_object(
            'skill_id', skill_id,
            'search_volume', count
        ) ORDER BY count DESC
    )
    INTO v_top_skills
    FROM (
        SELECT skill_id, COUNT(*) as count
        FROM public.marketplace_discovery_events
        WHERE created_at >= v_since AND skill_id IS NOT NULL
        GROUP BY skill_id
        LIMIT 10
    ) sub;

    SELECT COUNT(*) INTO v_contact_conversions
    FROM public.marketplace_discovery_events
    WHERE created_at >= v_since AND event_type IN ('whatsapp_clicked', 'phone_clicked');

    SELECT ROUND(
        (COUNT(CASE WHEN event_type = 'zero_results' THEN 1 END)::NUMERIC /
         GREATEST(COUNT(CASE WHEN event_type = 'provider_results_viewed' THEN 1 END), 1)::NUMERIC) * 100.0,
        2
    )
    INTO v_zero_result_rate
    FROM public.marketplace_discovery_events
    WHERE created_at >= v_since;

    v_result := jsonb_build_object(
        'timeframe_days', p_timeframe_days,
        'total_events', v_total_events,
        'top_demand_skills', COALESCE(v_top_skills, '[]'::jsonb),
        'contact_conversions', v_contact_conversions,
        'zero_result_rate_pct', COALESCE(v_zero_result_rate, 0.0),
        'model_version', 'MDCIE-1.0.0'
    );

    RETURN v_result;
END;
$$;
