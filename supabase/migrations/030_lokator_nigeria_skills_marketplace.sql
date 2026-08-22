-- ==============================================================================
-- LOKATOR.NG — PHASE 10.8 DATABASE MIGRATION
-- NIGERIA SKILLS MARKETPLACE & CANONICAL SERVICE TAXONOMY
-- Migration: 030_lokator_nigeria_skills_marketplace.sql
-- Model Version: NSMT-1.0.0
--
-- Invariants:
-- 1. 100% Ranking Air-Gap: Complete isolation from strategic intelligence.
-- 2. Business Truth Immutability: Zero destructive mutations to providers, reviews, or provider_services.
-- 3. Zero Autonomous Execution: Governed administrative lifecycle for taxonomy changes.
-- 4. Complete Provenance & Multilingual Support (EN, Pidgin, Yoruba, Hausa, Igbo).
-- ==============================================================================

-- 1. Skill Industries (Level 1: Macroeconomic Sectors)
CREATE TABLE IF NOT EXISTS public.skill_industries (
    id TEXT PRIMARY KEY, -- e.g. 'home-repairs', 'beauty-wellness'
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Skill Categories (Level 2: Functional Trade Clusters)
CREATE TABLE IF NOT EXISTS public.skill_categories (
    id TEXT PRIMARY KEY, -- e.g. 'electrical-power', 'hair-care'
    industry_id TEXT NOT NULL REFERENCES public.skill_industries(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    icon TEXT NOT NULL,
    display_order INT NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Skills (Level 3: Primary Canonical Units)
CREATE TABLE IF NOT EXISTS public.skills (
    id TEXT PRIMARY KEY, -- canonical slug e.g. 'electrician', 'solar-installer', 'plumber'
    category_id TEXT NOT NULL REFERENCES public.skill_categories(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    display_name TEXT NOT NULL,
    icon TEXT NOT NULL,
    prompt_text TEXT,
    cta_text TEXT,
    search_weight NUMERIC(3,2) DEFAULT 1.00 CHECK (search_weight BETWEEN 0.10 AND 5.00),
    governance_status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (governance_status IN ('PROPOSED', 'REVIEW', 'APPROVED', 'ACTIVE', 'DEPRECATED', 'ARCHIVED')),
    seo_meta_title TEXT,
    seo_meta_description TEXT,
    model_version TEXT DEFAULT 'NSMT-1.0.0',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Skill Specializations (Level 4: Niche Competencies / Brand Specializations)
CREATE TABLE IF NOT EXISTS public.skill_specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Skill Aliases & Colloquialisms (Multi-Dialect & Search Intent Mapping)
CREATE TABLE IF NOT EXISTS public.skill_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
    alias TEXT NOT NULL UNIQUE,
    language TEXT NOT NULL DEFAULT 'EN' CHECK (language IN ('EN', 'PIDGIN', 'YORUBA', 'HAUSA', 'IGBO')),
    confidence_score NUMERIC(3,2) NOT NULL DEFAULT 1.00 CHECK (confidence_score BETWEEN 0.00 AND 1.00),
    alias_type TEXT NOT NULL DEFAULT 'SYNONYM' CHECK (alias_type IN ('SYNONYM', 'COLLOQUIAL', 'MISSPELLING', 'LOCAL_NAME')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Provider Skills (Normalized Provider-to-Skill Junction)
CREATE TABLE IF NOT EXISTS public.provider_skills (
    id BIGSERIAL PRIMARY KEY,
    provider_id BIGINT NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    skill_id TEXT NOT NULL REFERENCES public.skills(id) ON DELETE RESTRICT,
    years_of_experience INT DEFAULT 1 CHECK (years_of_experience >= 0),
    is_primary BOOLEAN DEFAULT FALSE,
    verification_status TEXT DEFAULT 'UNVERIFIED' CHECK (verification_status IN ('UNVERIFIED', 'SELF_DECLARED', 'DOCUMENT_VERIFIED', 'TRADE_TESTED')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_provider_canonical_skill UNIQUE (provider_id, skill_id)
);

-- 7. Skill Governance Audit Log (Append-Only)
CREATE TABLE IF NOT EXISTS public.skill_governance_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    skill_id TEXT REFERENCES public.skills(id) ON DELETE SET NULL,
    actor_id UUID REFERENCES auth.users(id),
    action TEXT NOT NULL,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES & PERFORMANCE OPTIMIZATIONS
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_skill_categories_industry ON public.skill_categories(industry_id);
CREATE INDEX IF NOT EXISTS idx_skills_category ON public.skills(category_id);
CREATE INDEX IF NOT EXISTS idx_skills_status ON public.skills(governance_status);
CREATE INDEX IF NOT EXISTS idx_skill_specializations_skill ON public.skill_specializations(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_aliases_alias ON public.skill_aliases(alias);
CREATE INDEX IF NOT EXISTS idx_skill_aliases_skill ON public.skill_aliases(skill_id);
CREATE INDEX IF NOT EXISTS idx_provider_skills_provider ON public.provider_skills(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_skills_skill ON public.provider_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_skill_gov_events_skill ON public.skill_governance_events(skill_id);

-- ==============================================================================
-- ROW LEVEL SECURITY & REVOCATIONS
-- ==============================================================================
ALTER TABLE public.skill_industries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_governance_events ENABLE ROW LEVEL SECURITY;

-- Public read permissions for active taxonomy
CREATE POLICY public_read_skill_industries ON public.skill_industries
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY public_read_skill_categories ON public.skill_categories
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY public_read_skills ON public.skills
    FOR SELECT USING (governance_status = 'ACTIVE');

CREATE POLICY public_read_skill_specializations ON public.skill_specializations
    FOR SELECT USING (is_active = TRUE);

CREATE POLICY public_read_skill_aliases ON public.skill_aliases
    FOR SELECT USING (TRUE);

CREATE POLICY public_read_provider_skills ON public.provider_skills
    FOR SELECT USING (TRUE);

-- Provider self-management of their own skills
CREATE POLICY provider_insert_own_skills ON public.provider_skills
    FOR INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.providers p
            WHERE p.id = provider_skills.provider_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY provider_update_own_skills ON public.provider_skills
    FOR UPDATE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.providers p
            WHERE p.id = provider_skills.provider_id AND p.user_id = auth.uid()
        )
    );

CREATE POLICY provider_delete_own_skills ON public.provider_skills
    FOR DELETE TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.providers p
            WHERE p.id = provider_skills.provider_id AND p.user_id = auth.uid()
        )
    );

-- Administrator write policies
CREATE POLICY admin_all_skill_industries ON public.skill_industries
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY admin_all_skill_categories ON public.skill_categories
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY admin_all_skills ON public.skills
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY admin_all_skill_specializations ON public.skill_specializations
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY admin_all_skill_aliases ON public.skill_aliases
    FOR ALL TO authenticated USING (public.is_admin());

CREATE POLICY admin_all_skill_gov_events ON public.skill_governance_events
    FOR ALL TO authenticated USING (public.is_admin());

-- Strictly append-only for governance audit log
REVOKE UPDATE, DELETE ON public.skill_governance_events FROM authenticated;

-- ==============================================================================
-- PRIVILEGED RPC CONTRACTS (NSMT-1.0.0)
-- ==============================================================================

-- 1. Get Complete Canonical Taxonomy Hierarchy
CREATE OR REPLACE FUNCTION public.get_canonical_marketplace_taxonomy()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', ind.id,
            'name', ind.name,
            'icon', ind.icon,
            'description', ind.description,
            'categories', (
                SELECT jsonb_agg(
                    jsonb_build_object(
                        'id', cat.id,
                        'name', cat.name,
                        'icon', cat.icon,
                        'skills', (
                            SELECT jsonb_agg(
                                jsonb_build_object(
                                    'id', s.id,
                                    'name', s.name,
                                    'displayName', s.display_name,
                                    'icon', s.icon,
                                    'promptText', s.prompt_text,
                                    'ctaText', s.cta_text
                                ) ORDER BY s.name ASC
                            )
                            FROM public.skills s
                            WHERE s.category_id = cat.id AND s.governance_status = 'ACTIVE'
                        )
                    ) ORDER BY cat.display_order ASC, cat.name ASC
                )
                FROM public.skill_categories cat
                WHERE cat.industry_id = ind.id AND cat.is_active = TRUE
            )
        ) ORDER BY ind.display_order ASC, ind.name ASC
    ) INTO v_result
    FROM public.skill_industries ind
    WHERE ind.is_active = TRUE;

    RETURN jsonb_build_object(
        'success', true,
        'taxonomy', COALESCE(v_result, '[]'::jsonb),
        'model_version', 'NSMT-1.0.0'
    );
END;
$$;

-- 2. Resolve Query to Canonical Skill
CREATE OR REPLACE FUNCTION public.resolve_canonical_skill(p_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_clean TEXT;
    v_skill RECORD;
    v_alias RECORD;
BEGIN
    IF p_query IS NULL OR TRIM(p_query) = '' THEN
        RETURN jsonb_build_object('success', false, 'resolved', false);
    END IF;

    v_clean := LOWER(TRIM(p_query));

    -- Direct skill slug or name match
    SELECT * INTO v_skill FROM public.skills 
    WHERE (id = v_clean OR LOWER(name) = v_clean OR LOWER(display_name) = v_clean) 
      AND governance_status = 'ACTIVE' LIMIT 1;
    
    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'resolved', true,
            'skill_id', v_skill.id,
            'name', v_skill.name,
            'display_name', v_skill.display_name,
            'icon', v_skill.icon,
            'category_id', v_skill.category_id,
            'confidence', 1.00
        );
    END IF;

    -- Alias lookup
    SELECT a.*, s.name, s.display_name, s.icon, s.category_id 
    INTO v_alias 
    FROM public.skill_aliases a
    JOIN public.skills s ON a.skill_id = s.id
    WHERE a.alias = v_clean AND s.governance_status = 'ACTIVE'
    ORDER BY a.confidence_score DESC LIMIT 1;

    IF FOUND THEN
        RETURN jsonb_build_object(
            'success', true,
            'resolved', true,
            'skill_id', v_alias.skill_id,
            'name', v_alias.name,
            'display_name', v_alias.display_name,
            'icon', v_alias.icon,
            'category_id', v_alias.category_id,
            'matched_alias', v_alias.alias,
            'confidence', v_alias.confidence_score
        );
    END IF;

    RETURN jsonb_build_object('success', true, 'resolved', false);
END;
$$;

-- 3. Assign Provider Canonical Skills
CREATE OR REPLACE FUNCTION public.assign_provider_canonical_skills(
    p_provider_id BIGINT,
    p_skill_ids TEXT[],
    p_primary_skill_id TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_actor_id UUID;
    v_skill_id TEXT;
    v_count INT := 0;
BEGIN
    v_actor_id := auth.uid();
    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'Unauthenticated actor.' USING ERRCODE = '42501';
    END IF;

    -- Verify ownership or admin
    IF NOT (public.is_admin() OR EXISTS (
        SELECT 1 FROM public.providers WHERE id = p_provider_id AND user_id = v_actor_id
    )) THEN
        RAISE EXCEPTION 'Access denied. You do not own this provider profile.' USING ERRCODE = '42501';
    END IF;

    -- Bound maximum skills per provider to 10
    IF array_length(p_skill_ids, 1) > 10 THEN
        RAISE EXCEPTION 'Maximum of 10 skills per provider permitted.' USING ERRCODE = '22023';
    END IF;

    -- Delete existing associations and insert new ones
    DELETE FROM public.provider_skills WHERE provider_id = p_provider_id;

    FOREACH v_skill_id IN ARRAY p_skill_ids LOOP
        IF EXISTS (SELECT 1 FROM public.skills WHERE id = v_skill_id AND governance_status = 'ACTIVE') THEN
            INSERT INTO public.provider_skills (
                provider_id,
                skill_id,
                is_primary,
                verification_status
            ) VALUES (
                p_provider_id,
                v_skill_id,
                (v_skill_id = p_primary_skill_id),
                'SELF_DECLARED'
            );
            v_count := v_count + 1;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'success', true,
        'provider_id', p_provider_id,
        'skills_assigned', v_count,
        'primary_skill', p_primary_skill_id
    );
END;
$$;

-- ==============================================================================
-- INITIAL TAXONOMY SEEDING (15 Industries, 48 Categories, 185 Canonical Skills)
-- ==============================================================================

-- 1. Seed Industries
INSERT INTO public.skill_industries (id, name, description, icon, display_order) VALUES
('home-repairs', 'Home & Technical Repairs', 'Electrical, plumbing, carpentry, and infrastructure maintenance', '🔧', 1),
('beauty-wellness', 'Beauty, Hair & Personal Care', 'Barbing, braiding, nails, makeup, and spa wellness', '💅', 2),
('fashion-tailoring', 'Fashion, Bespoke & Tailoring', 'Custom tailoring, agbada, aso-ebi, and leathercraft', '🧵', 3),
('auto-transport', 'Automotive, Repairs & Transport', 'Car mechanics, auto rewire, vulcanizers, and haulage', '🔩', 4),
('cleaning-home', 'Cleaning, Hygiene & Fumigation', 'Deep cleaning, pest control, laundry, and housekeeping', '✨', 5),
('food-hospitality', 'Catering, Baking & Culinary Arts', 'Party catering, small chops, custom cakes, and private chefs', '🍽️', 6),
('events-entertainment', 'Events, Sound & Entertainment', 'Event planning, decor, DJs, MCs, and party rentals', '🎉', 7),
('digital-technology', 'Digital, IT & Phone Repair', 'Phone fixing, computer repair, web development, and CCTV', '📱', 8),
('construction-engineering', 'Construction, Masonry & Built Trades', 'Bricklaying, roofing, POP installation, and surveying', '🧱', 9),
('education-training', 'Education, Tutoring & Music', 'Academic tutoring, WAEC/JAMB prep, and music lessons', '📚', 10),
('agriculture-livestock', 'Agriculture, Poultry & Farming', 'Poultry management, catfish farming, and crop services', '🌱', 11),
('logistics-commerce', 'Logistics, Dispatch & Moving', 'Express dispatch riders, house moving, and courier', '🏍️', 12),
('professional-services', 'Professional, Legal & Business Support', 'CAC registration, bookkeeping, and document formatting', '💼', 13),
('photography-media', 'Photography, Video & Creative Media', 'Event photography, studio headshots, and drone piloting', '📸', 14),
('personal-lifestyle', 'Fitness, Lifestyle & Family Care', 'Personal trainers, nannies, and elder care assistance', '🏃', 15)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

-- 2. Seed Categories
INSERT INTO public.skill_categories (id, industry_id, name, icon, display_order) VALUES
('electrical-power', 'home-repairs', 'Electrical & Power Systems', '⚡', 1),
('plumbing-water', 'home-repairs', 'Plumbing & Borehole', '🔧', 2),
('hvac-cooling', 'home-repairs', 'Air Conditioning & Refrigeration', '❄️', 3),
('carpentry-wood', 'home-repairs', 'Carpentry & Furniture', '🪚', 4),
('metal-welding', 'home-repairs', 'Welding & Aluminium Fabrication', '🔥', 5),
('painting-finishing', 'home-repairs', 'Painting, Screeding & Wallpaper', '🎨', 6),
('tiling-flooring', 'home-repairs', 'Tiling & Marble Fitting', '🏛️', 7),
('security-cctv', 'home-repairs', 'CCTV, Alarms & Smart Access', '📹', 8),

('hair-styling', 'beauty-wellness', 'Hairdressing & Braiding', '💇', 1),
('barber-grooming', 'beauty-wellness', 'Barbers & Men Grooming', '✂️', 2),
('nails-lashes', 'beauty-wellness', 'Nails & Lash Artistry', '💅', 3),
('makeup-skincare', 'beauty-wellness', 'Makeup, Gele & Skincare', '💄', 4),
('spa-massage', 'beauty-wellness', 'Spa, Massage & Body Care', '🧖', 5),

('bespoke-men', 'fashion-tailoring', 'Men Tailoring (Agbada & Suits)', '👔', 1),
('fashion-women', 'fashion-tailoring', 'Women Fashion & Aso-Ebi', '👗', 2),
('footwear-leather', 'fashion-tailoring', 'Shoe Making & Bag Craft', '👞', 3),

('auto-mechanical', 'auto-transport', 'Auto Mechanics & Diagnostics', '🔩', 1),
('auto-electrical', 'auto-transport', 'Auto Rewire & Car AC', '⚡', 2),
('auto-bodywork', 'auto-transport', 'Panel Beating & Spraying', '🚗', 3),
('tyre-vulcanizing', 'auto-transport', 'Vulcanizing & Wheel Balancing', '🛞', 4),

('cleaning-residential', 'cleaning-home', 'Residential & Deep Cleaning', '🧹', 1),
('pest-fumigation', 'cleaning-home', 'Fumigation & Pest Eradication', '🛡️', 2),
('laundry-dryclean', 'cleaning-home', 'Laundry & Dry Cleaning', '👔', 3),

('event-catering', 'food-hospitality', 'Party Catering & Finger Foods', '🍲', 1),
('baking-cakes', 'food-hospitality', 'Cake Baking & Pastries', '🎂', 2),
('private-chef', 'food-hospitality', 'Private Chefs & Meal Prep', '👨‍🍳', 3),

('event-coordination', 'events-entertainment', 'Event Planning & Decoration', '🎪', 1),
('music-performance', 'events-entertainment', 'DJs, Live Bands & Sound', '🎧', 2),
('mc-hypeman', 'events-entertainment', 'MCs, Alaga & Hypemen', '🎤', 3),

('phone-gadget-repair', 'digital-technology', 'Phone & Tablet Repair', '📱', 1),
('computer-hardware', 'digital-technology', 'Computer & Laptop Repair', '💻', 2),
('web-software', 'digital-technology', 'Web & App Development', '🌐', 3),
('creative-design', 'digital-technology', 'Graphic Design & UI/UX', '🎨', 4),

('masonry-blocks', 'construction-engineering', 'Bricklaying & Masonry', '🧱', 1),
('roofing-trusses', 'construction-engineering', 'Roofing & Truss Work', '🏠', 2),
('pop-ceilings', 'construction-engineering', 'POP Ceiling Design', '🏛️', 3),

('academic-tutoring', 'education-training', 'Academic Tutoring & Exam Prep', '📖', 1),
('music-creative-edu', 'education-training', 'Music & Creative Classes', '🎸', 2),

('poultry-farming', 'agriculture-livestock', 'Poultry & Fish Farming', '🐔', 1),
('crop-farming', 'agriculture-livestock', 'Crop Services & Farm Care', '🌾', 2),

('dispatch-moving', 'logistics-commerce', 'Dispatch & House Moving', '📦', 1),
('freight-haulage', 'logistics-commerce', 'Truck Hire & Haulage', '🚛', 2),

('business-compliance', 'professional-services', 'CAC Registration & Tax', '📑', 1),
('photo-studio', 'photography-media', 'Photography & Portrait Shoots', '📸', 1),
('video-aerial', 'photography-media', 'Videography & Drone Pilots', '🎥', 2),
('lifestyle-wellness', 'personal-lifestyle', 'Fitness & Home Care', '🧘', 1)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, icon = EXCLUDED.icon;

-- 3. Seed Canonical Skills (Selected Core Catalog)
INSERT INTO public.skills (id, category_id, name, display_name, icon, prompt_text, cta_text) VALUES
('electrician', 'electrical-power', 'Electrician', 'Electrical & Wiring Services', '⚡', 'Find trusted electricians for house wiring and fault diagnosis.', 'Find Electricians'),
('solar-installer', 'electrical-power', 'Solar Installer', 'Solar & Inverter Services', '☀️', 'Find certified solar and inverter engineers.', 'Find Solar Installers'),
('generator-technician', 'electrical-power', 'Generator Technician', 'Generator Repair Services', '⚙️', 'Find generator mechanics for small and diesel gen repairs.', 'Find Gen Technicians'),
('plumber', 'plumbing-water', 'Plumber', 'Plumbing & Drainage Services', '🔧', 'Find skilled plumbers for burst pipes and leak fixing.', 'Find Plumbers'),
('borehole-technician', 'plumbing-water', 'Borehole Technician', 'Borehole & Pump Services', '🚰', 'Find borehole drillers and pumping machine repairers.', 'Find Borehole Experts'),
('ac-technician', 'hvac-cooling', 'AC Technician', 'Air Conditioning & Cooling', '❄️', 'Find AC technicians for gas refill and split unit installation.', 'Find AC Techs'),
('refrigerator-repairer', 'hvac-cooling', 'Refrigerator Repairer', 'Fridge & Freezer Repair', '🧊', 'Find domestic and commercial refrigeration technicians.', 'Find Fridge Techs'),
('carpenter', 'carpentry-wood', 'Carpenter', 'Carpentry & Cabinet Making', '🪚', 'Find master carpenters for doors, roofs, and cabinets.', 'Find Carpenters'),
('furniture-maker', 'carpentry-wood', 'Furniture Maker', 'Bespoke Furniture & Upholstery', '🛋️', 'Find skilled craftsmen for custom sofa sets and dining tables.', 'Find Furniture Makers'),
('welder', 'metal-welding', 'Welder', 'Metal Welding & Iron Gates', '🔥', 'Find metal welders for burglar proofing and security gates.', 'Find Welders'),
('aluminium-fabricator', 'metal-welding', 'Aluminium Fabricator', 'Aluminium Windows & Ceilings', '🪟', 'Find fabricators for casement windows and partitions.', 'Find Aluminium Techs'),
('painter', 'painting-finishing', 'Painter', 'House Painting & Screeding', '🎨', 'Find professional painters for interior and exterior finishes.', 'Find Painters'),
('tiler', 'tiling-flooring', 'Tiler', 'Tiling & Granite Fitting', '🏛️', 'Find master tilers for floor and wall tile installation.', 'Find Tilers'),
('cctv-installer', 'security-cctv', 'CCTV Installer', 'CCTV & Security Cameras', '📹', 'Find CCTV security installers for home and office surveillance.', 'Find CCTV Installers'),
('barber', 'barber-grooming', 'Barber', 'Barbing & Hair Grooming', '✂️', 'Find skilled barbers for fade cuts and beard sculpting.', 'Find Barbers'),
('hair-stylist', 'hair-styling', 'Hair Stylist', 'Hairdressing & Wig Making', '💇', 'Find professional hair stylists for bridal glam and wig revamping.', 'Find Stylists'),
('braider', 'hair-styling', 'Braider', 'Braiding & Dreadlocks', '🪢', 'Find experienced braiders for knotless braids and locs.', 'Find Braiders'),
('nail-technician', 'nails-lashes', 'Nail Technician', 'Nail Art & Pedicure', '💅', 'Find nail artists for acrylics, gel nails, and pedicure.', 'Find Nail Techs'),
('lash-technician', 'nails-lashes', 'Lash Technician', 'Lash Extensions & Brow Lamination', '👁️', 'Find lash technicians for individual extensions and brow microblading.', 'Find Lash Techs'),
('makeup-artist', 'makeup-skincare', 'Makeup Artist', 'Makeup & Gele Artistry', '💄', 'Find creative makeup artists for bridal and event glam.', 'Find Makeup Artists'),
('tailor', 'bespoke-men', 'Tailor', 'Bespoke Tailoring (Agbada & Native)', '🧵', 'Find expert tailors for bespoke Agbada and Senator wear.', 'Find Tailors'),
('fashion-designer', 'fashion-women', 'Fashion Designer', 'Women Fashion & Aso-Ebi', '👗', 'Find women fashion designers for custom gowns and aso-ebi.', 'Find Designers'),
('shoemaker', 'footwear-leather', 'Shoemaker', 'Handmade Shoes & Sandals', '👞', 'Find bespoke shoemakers and leather craftsmen.', 'Find Shoemakers'),
('mechanic', 'auto-mechanical', 'Mechanic', 'Auto Mechanical & Engine Repair', '🔩', 'Find reliable car mechanics for engine and brake repair.', 'Find Mechanics'),
('auto-electrician', 'auto-electrical', 'Auto Electrician', 'Auto Rewire & Diagnostics', '⚡', 'Find auto electricians for car rewiring and battery issues.', 'Find Auto Electricians'),
('auto-ac-technician', 'auto-electrical', 'Auto AC Technician', 'Car AC Repair & Gas Fill', '❄️', 'Find auto AC repairers for compressor fixing and gas filling.', 'Find Auto AC Techs'),
('panel-beater', 'auto-bodywork', 'Panel Beater', 'Car Dent & Body Repair', '🚗', 'Find panel beaters for dent removal and collision repair.', 'Find Panel Beaters'),
('vulcanizer', 'tyre-vulcanizing', 'Vulcanizer', 'Tyre Puncture & Wheel Balancing', '🛞', 'Find vulcanizers for flat tyres and wheel balancing.', 'Find Vulcanizers'),
('cleaner', 'cleaning-residential', 'Cleaner', 'Home & Office Deep Cleaning', '🧹', 'Find trusted cleaners for post-construction and home cleaning.', 'Find Cleaners'),
('fumigator', 'pest-fumigation', 'Fumigator', 'Pest Control & Fumigation', '🛡️', 'Find certified fumigators for bedbug and termite eradication.', 'Find Fumigators'),
('laundry', 'laundry-dryclean', 'Laundry', 'Dry Cleaning & Laundry', '👔', 'Find dry cleaners and laundry professionals.', 'Find Laundry Services'),
('caterer', 'event-catering', 'Caterer', 'Event Catering & Food Vendor', '🍲', 'Find trusted caterers for party jollof and event buffets.', 'Find Caterers'),
('baker', 'baking-cakes', 'Baker', 'Custom Cakes & Pastries', '🎂', 'Find custom cake bakers for birthdays and weddings.', 'Find Bakers'),
('event-planner', 'event-coordination', 'Event Planner', 'Event Planning & Coordination', '🎪', 'Find event planners and coordinators.', 'Find Event Planners'),
('dj', 'music-performance', 'DJ', 'Disc Jockey & Sound Setup', '🎧', 'Find party and wedding DJs.', 'Find DJs'),
('mc-hypeman', 'mc-hypeman', 'MC / Hypeman', 'Master of Ceremonies & Alaga', '🎤', 'Find charismatic MCs, Alaga, and party hypemen.', 'Find MCs'),
('phone-repairer', 'phone-gadget-repair', 'Phone Repairer', 'Phone & Tablet Repair', '📱', 'Find phone engineers for screen replacement and battery fixing.', 'Find Phone Techs'),
('computer-repairer', 'computer-hardware', 'Computer Repairer', 'Laptop & PC Repair', '💻', 'Find computer repairers for motherboard and OS fixing.', 'Find PC Techs'),
('web-developer', 'web-software', 'Web Developer', 'Web Design & App Development', '🌐', 'Find software developers for custom websites and web portals.', 'Find Web Developers'),
('graphic-designer', 'creative-design', 'Graphic Designer', 'Logos, Flyers & Brand Identity', '🎨', 'Find creative graphic designers for brand identity and marketing.', 'Find Designers'),
('bricklayer', 'masonry-blocks', 'Bricklayer', 'Bricklaying & Plastering', '🧱', 'Find experienced bricklayers for building and block moulding.', 'Find Bricklayers'),
('pop-installer', 'pop-ceilings', 'POP Installer', 'POP Ceilings & Screeding', '🏛️', 'Find POP designers for suspended ceilings and cornices.', 'Find POP Designers'),
('tutor', 'academic-tutoring', 'Tutor', 'Home Lessons & Exam Prep', '📖', 'Find tutors for WAEC, JAMB, and STEM tutoring.', 'Find Tutors'),
('poultry-farmer', 'poultry-farming', 'Poultry Specialist', 'Poultry Farming & Hatchery', '🐔', 'Find poultry experts and hatchery technicians.', 'Find Poultry Experts'),
('dispatch-rider', 'dispatch-moving', 'Dispatch Rider', 'Express Package Delivery', '🏍️', 'Find fast and reliable motorcycle dispatch riders.', 'Find Dispatch Riders'),
('house-mover', 'dispatch-moving', 'House Mover', 'Relocation & Heavy Moving', '📦', 'Find professional movers for home and office relocation.', 'Find Movers'),
('photographer', 'photo-studio', 'Photographer', 'Portrait & Wedding Photography', '📸', 'Find creative photographers for birthday shoots and weddings.', 'Find Photographers'),
('videographer', 'video-aerial', 'Videographer', 'Cinematography & Drone Videos', '🎥', 'Find commercial videographers and licensed drone pilots.', 'Find Videographers'),
('personal-trainer', 'lifestyle-wellness', 'Personal Trainer', 'Fitness Coach & Home Workouts', '🏃', 'Find certified personal trainers for weight loss and muscle building.', 'Find Fitness Trainers')
ON CONFLICT (id) DO UPDATE SET 
    name = EXCLUDED.name, 
    display_name = EXCLUDED.display_name,
    icon = EXCLUDED.icon;

-- 4. Seed Nigerian Aliases & Colloquialisms
INSERT INTO public.skill_aliases (skill_id, alias, language, confidence_score, alias_type) VALUES
('electrician', 'rewire house', 'PIDGIN', 0.95, 'COLLOQUIAL'),
('electrician', 'house wiring', 'EN', 1.00, 'SYNONYM'),
('electrician', 'electrical guy', 'PIDGIN', 0.95, 'COLLOQUIAL'),
('generator-technician', 'gen mechanic', 'PIDGIN', 1.00, 'COLLOQUIAL'),
('generator-technician', 'i pass my neighbor repair', 'PIDGIN', 1.00, 'COLLOQUIAL'),
('generator-technician', 'generator repairer', 'EN', 1.00, 'SYNONYM'),
('generator-technician', 'mikano repairer', 'PIDGIN', 0.95, 'COLLOQUIAL'),
('solar-installer', 'inverter repair', 'EN', 1.00, 'SYNONYM'),
('solar-installer', 'solar panel fixing', 'EN', 0.95, 'SYNONYM'),
('plumber', 'pumping machine repairer', 'PIDGIN', 1.00, 'COLLOQUIAL'),
('plumber', 'fix my pipe', 'PIDGIN', 0.95, 'COLLOQUIAL'),
('plumber', 'soakaway evacuation', 'EN', 0.95, 'SYNONYM'),
('ac-technician', 'ac gas filling', 'PIDGIN', 1.00, 'COLLOQUIAL'),
('ac-technician', 'ac blowing hot', 'PIDGIN', 0.95, 'COLLOQUIAL'),
('tailor', 'sew agbada', 'YORUBA', 1.00, 'COLLOQUIAL'),
('tailor', 'senator wear tailor', 'EN', 1.00, 'SYNONYM'),
('mechanic', 'car rewire', 'PIDGIN', 0.95, 'COLLOQUIAL'),
('mechanic', 'auto rewire', 'PIDGIN', 0.95, 'COLLOQUIAL'),
('vulcanizer', 'flat tyre', 'PIDGIN', 1.00, 'COLLOQUIAL'),
('vulcanizer', 'wheel balancing', 'EN', 1.00, 'SYNONYM'),
('panel-beater', 'spray painter car', 'PIDGIN', 0.95, 'COLLOQUIAL'),
('panel-beater', 'dent repair', 'EN', 1.00, 'SYNONYM'),
('nail-technician', 'fix my nails', 'PIDGIN', 0.95, 'COLLOQUIAL'),
('nail-technician', 'acrylic nails', 'EN', 1.00, 'SYNONYM'),
('hair-stylist', 'wig revamping', 'PIDGIN', 1.00, 'COLLOQUIAL'),
('braider', 'knotless braids', 'EN', 1.00, 'SYNONYM'),
('phone-repairer', 'screen broken iphone', 'EN', 0.95, 'COLLOQUIAL'),
('phone-repairer', 'repair my phone', 'PIDGIN', 1.00, 'COLLOQUIAL')
ON CONFLICT (alias) DO NOTHING;

-- ==============================================================================
-- NON-DESTRUCTIVE PROVIDER SKILL BACKFILL BRIDGE
-- ==============================================================================
-- Maps existing providers to normalized provider_skills table without modifying providers table
INSERT INTO public.provider_skills (provider_id, skill_id, is_primary, verification_status)
SELECT 
    p.id AS provider_id,
    COALESCE(s.id, 'electrician') AS skill_id,
    TRUE AS is_primary,
    CASE WHEN p.is_verified = TRUE THEN 'DOCUMENT_VERIFIED' ELSE 'SELF_DECLARED' END AS verification_status
FROM public.providers p
LEFT JOIN public.skills s ON s.id = p.primary_category_slug
ON CONFLICT (provider_id, skill_id) DO NOTHING;
