-- ============================================================================
-- LOKATOR.NG — PRODUCTION DATABASE & SECURITY FOUNDATION
-- Migration: 001_lokator_production_foundation.sql
-- Target Project: hvxosxhnxauiqrhpyuur (https://hvxosxhnxauiqrhpyuur.supabase.co)
-- Status: Production Hardened & Formally Security Audited
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. EXTENSIONS
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA extensions;

-- ----------------------------------------------------------------------------
-- 2. CORE HELPER FUNCTIONS & ADMIN FOUNDATION
-- ----------------------------------------------------------------------------

-- Function to check if the executing user has admin or service role privileges
-- STRICT SECURITY: Relies exclusively on server-controlled app_metadata or service_role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, extensions, pg_temp
AS $$
  SELECT (
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'admin'
    OR coalesce(auth.jwt() ->> 'role', '') = 'service_role'
  );
$$;

-- Trigger function for automatic updated_at timestamps
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. SERVICE CATEGORIES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.service_categories (
  id TEXT PRIMARY KEY, -- canonical slug e.g. 'electrician', 'plumber'
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  icon TEXT NOT NULL,
  contextual_label TEXT,
  prompt_text TEXT,
  cta_text TEXT,
  synonyms TEXT[] DEFAULT '{}',
  hero_step_index INT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_service_categories_updated_at
  BEFORE UPDATE ON public.service_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 4. PROVIDERS TABLE (Marketplace Profiles with Strict Field Integrity)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.providers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  business_name TEXT,
  trade_title TEXT NOT NULL,
  primary_category_slug TEXT REFERENCES public.service_categories(id) ON DELETE SET NULL,
  skills TEXT[] DEFAULT '{}',
  bio TEXT,
  phone TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL,
  email TEXT,
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  lga TEXT,
  area TEXT NOT NULL,
  address TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  experience_years INT DEFAULT 1,
  starting_price TEXT DEFAULT '₦3,000 / inspection',
  avatar_bg TEXT DEFAULT 'linear-gradient(135deg, #006B3F, #059669)',
  badge_title TEXT DEFAULT 'NIN Verified Artisan',
  response_time TEXT DEFAULT '~15 mins',
  completed_jobs INT DEFAULT 0,
  rating NUMERIC(3, 2) DEFAULT 0.0,
  reviews_count INT DEFAULT 0,
  subscription_plan TEXT DEFAULT 'basic', -- 'basic', 'verified', 'premium'
  is_verified BOOLEAN DEFAULT FALSE,
  nin_verified BOOLEAN DEFAULT FALSE,
  is_available BOOLEAN DEFAULT TRUE,
  is_active BOOLEAN DEFAULT TRUE,
  is_public BOOLEAN DEFAULT TRUE,
  profile_complete BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_providers_updated_at
  BEFORE UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Security Trigger: Prevent client privilege escalation on protected fields
CREATE OR REPLACE FUNCTION public.protect_provider_platform_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  -- If service role or verified admin, allow modifications
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- On INSERT, enforce secure platform defaults
  IF TG_OP = 'INSERT' THEN
    NEW.is_verified := FALSE;
    NEW.nin_verified := FALSE;
    NEW.rating := 0.0;
    NEW.reviews_count := 0;
    NEW.subscription_plan := 'basic';
    NEW.completed_jobs := 0;
    RETURN NEW;
  END IF;

  -- On UPDATE, protect platform fields from direct client manipulation
  IF TG_OP = 'UPDATE' THEN
    -- Critical platform permissions are strictly locked to OLD values
    NEW.is_verified := OLD.is_verified;
    NEW.nin_verified := OLD.nin_verified;
    NEW.subscription_plan := OLD.subscription_plan;
    NEW.completed_jobs := OLD.completed_jobs;
    NEW.user_id := OLD.user_id; -- Ownership cannot be transferred via client update

    -- Direct client updates (depth = 1) cannot manipulate rating / reviews_count
    -- Internal triggers (depth > 1, e.g. recalculate_provider_rating) are permitted to update rating & reviews_count
    IF pg_trigger_depth() = 1 THEN
      NEW.rating := OLD.rating;
      NEW.reviews_count := OLD.reviews_count;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_protect_provider_platform_fields
  BEFORE INSERT OR UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_provider_platform_fields();

-- ----------------------------------------------------------------------------
-- 5. PROVIDER SERVICES TABLE (Multi-Skill Relationships)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.provider_services (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  category_slug TEXT REFERENCES public.service_categories(id) ON DELETE SET NULL,
  starting_price TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_provider_services_updated_at
  BEFORE UPDATE ON public.provider_services
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 6. PORTFOLIO ITEMS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  image_url TEXT,
  video_url TEXT,
  accent_color TEXT DEFAULT '#006B3F',
  icon TEXT DEFAULT '🛠️',
  is_before_after BOOLEAN DEFAULT FALSE,
  tag TEXT DEFAULT 'Completed Project',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_portfolio_items_updated_at
  BEFORE UPDATE ON public.portfolio_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 7. WORKING HOURS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.working_hours (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT UNIQUE NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  weekday_hours TEXT DEFAULT '8:00 AM – 7:00 PM',
  saturday_hours TEXT DEFAULT '8:00 AM – 6:00 PM',
  sunday_hours TEXT DEFAULT 'Emergency Callouts (24/7)',
  response_time_text TEXT DEFAULT '~15 mins',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_working_hours_updated_at
  BEFORE UPDATE ON public.working_hours
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ----------------------------------------------------------------------------
-- 8. REVIEWS TABLE & AUTOMATED SECURE RATING AGGREGATION
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_location TEXT NOT NULL,
  rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  service_type TEXT,
  comment TEXT NOT NULL,
  is_verified_customer BOOLEAN DEFAULT FALSE,
  helpful_count INT DEFAULT 0,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trigger_reviews_updated_at
  BEFORE UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Security Trigger: Prevent client approval/verification escalation on reviews
CREATE OR REPLACE FUNCTION public.protect_review_moderation_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'INSERT' THEN
    NEW.is_approved := FALSE;
    NEW.is_verified_customer := FALSE;
    NEW.helpful_count := 0;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Preserve core ownership and locked customer moderation flags
    NEW.provider_id := OLD.provider_id;
    NEW.customer_user_id := OLD.customer_user_id;
    NEW.is_verified_customer := OLD.is_verified_customer;
    NEW.helpful_count := OLD.helpful_count;

    -- If review content, rating, or service type was edited, reset is_approved to FALSE for re-moderation
    IF NEW.comment IS DISTINCT FROM OLD.comment 
       OR NEW.rating IS DISTINCT FROM OLD.rating 
       OR NEW.service_type IS DISTINCT FROM OLD.service_type THEN
      NEW.is_approved := FALSE;
    ELSE
      NEW.is_approved := OLD.is_approved;
    END IF;

    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_protect_review_moderation_fields
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_review_moderation_fields();

-- Security Definer Function: Recalculate provider ratings from approved reviews only
CREATE OR REPLACE FUNCTION public.recalculate_provider_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  target_provider_id BIGINT;
  new_rating NUMERIC(3, 2);
  new_count INT;
BEGIN
  IF TG_OP = 'DELETE' THEN
    target_provider_id := OLD.provider_id;
  ELSE
    target_provider_id := NEW.provider_id;
  END IF;

  -- Calculate average rating and count from approved reviews only
  SELECT 
    COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0),
    COUNT(*)
  INTO new_rating, new_count
  FROM public.reviews
  WHERE provider_id = target_provider_id
    AND is_approved = TRUE;

  -- Update provider record directly
  UPDATE public.providers
  SET 
    rating = new_rating,
    reviews_count = new_count,
    updated_at = NOW()
  WHERE id = target_provider_id;

  -- If review update changed target provider_id, recalculate for the old provider as well
  IF TG_OP = 'UPDATE' AND OLD.provider_id IS DISTINCT FROM NEW.provider_id THEN
    SELECT 
      COALESCE(ROUND(AVG(rating)::numeric, 1), 0.0),
      COUNT(*)
    INTO new_rating, new_count
    FROM public.reviews
    WHERE provider_id = OLD.provider_id
      AND is_approved = TRUE;

    UPDATE public.providers
    SET 
      rating = new_rating,
      reviews_count = new_count,
      updated_at = NOW()
    WHERE id = OLD.provider_id;
  END IF;

  RETURN NULL;
END;
$$;

CREATE TRIGGER trigger_recalculate_provider_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.recalculate_provider_rating();

-- ----------------------------------------------------------------------------
-- 9. PERFORMANCE, DISCOVERY & GEOLOCATION INDEXES
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_providers_user_id ON public.providers(user_id);
CREATE INDEX IF NOT EXISTS idx_providers_category ON public.providers(primary_category_slug);
CREATE INDEX IF NOT EXISTS idx_providers_state ON public.providers(state);
CREATE INDEX IF NOT EXISTS idx_providers_city ON public.providers(city);
CREATE INDEX IF NOT EXISTS idx_providers_lga ON public.providers(lga);
CREATE INDEX IF NOT EXISTS idx_providers_public ON public.providers(is_active, is_public, profile_complete);
CREATE INDEX IF NOT EXISTS idx_providers_verified ON public.providers(is_verified);
CREATE INDEX IF NOT EXISTS idx_providers_rating ON public.providers(rating DESC);
CREATE INDEX IF NOT EXISTS idx_providers_skills_gin ON public.providers USING gin (skills);
CREATE INDEX IF NOT EXISTS idx_providers_trade_trgm ON public.providers USING gin (trade_title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_providers_business_trgm ON public.providers USING gin (business_name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_providers_bio_trgm ON public.providers USING gin (bio gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON public.provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_cat ON public.provider_services(category_slug);

CREATE INDEX IF NOT EXISTS idx_portfolio_provider ON public.portfolio_items(provider_id);

CREATE INDEX IF NOT EXISTS idx_reviews_provider ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_approved_provider ON public.reviews(is_approved, provider_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created_at ON public.reviews(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_working_hours_provider ON public.working_hours(provider_id);

-- ----------------------------------------------------------------------------
-- 10. GEOGRAPHIC PROXIMITY RPC (Haversine Distance Calculator)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_nearby_providers(
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  radius_km DOUBLE PRECISION DEFAULT 50,
  max_results INT DEFAULT 20
)
RETURNS TABLE (
  id BIGINT,
  first_name TEXT,
  last_name TEXT,
  business_name TEXT,
  trade_title TEXT,
  primary_category_slug TEXT,
  skills TEXT[],
  area TEXT,
  city TEXT,
  state TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  rating NUMERIC(3, 2),
  reviews_count INT,
  is_verified BOOLEAN,
  distance_km DOUBLE PRECISION
)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public, extensions, pg_temp
AS $$
  SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.business_name,
    p.trade_title,
    p.primary_category_slug,
    p.skills,
    p.area,
    p.city,
    p.state,
    p.latitude,
    p.longitude,
    p.rating,
    p.reviews_count,
    p.is_verified,
    ROUND(
      (6371 * acos(
        least(1.0, greatest(-1.0, 
          cos(radians(user_lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(p.latitude))
        ))
      ))::numeric, 1
    )::double precision AS distance_km
  FROM public.providers p
  WHERE p.is_active = TRUE
    AND p.is_public = TRUE
    AND p.profile_complete = TRUE
    AND p.latitude IS NOT NULL
    AND p.longitude IS NOT NULL
    AND (
      6371 * acos(
        least(1.0, greatest(-1.0, 
          cos(radians(user_lat)) * cos(radians(p.latitude)) * cos(radians(p.longitude) - radians(user_lng)) + 
          sin(radians(user_lat)) * sin(radians(p.latitude))
        ))
      )
    ) <= LEAST(radius_km, 500.0)
  ORDER BY distance_km ASC
  LIMIT LEAST(max_results, 100);
$$;

-- ----------------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- 11.1 Service Categories RLS
CREATE POLICY "Public read on active service categories"
  ON public.service_categories FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

CREATE POLICY "Admin write on service categories"
  ON public.service_categories FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 11.2 Providers RLS
CREATE POLICY "Public read on active providers"
  ON public.providers FOR SELECT
  USING (
    (is_active = TRUE AND is_public = TRUE AND profile_complete = TRUE)
    OR (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.is_admin()
  );

CREATE POLICY "Authenticated user create own provider record"
  ON public.providers FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.is_admin()
  );

CREATE POLICY "Provider update own profile"
  ON public.providers FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.is_admin()
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.is_admin()
  );

CREATE POLICY "Provider delete own profile"
  ON public.providers FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
    OR public.is_admin()
  );

-- 11.3 Provider Services RLS (Ownership via providers relation)
CREATE POLICY "Public read on provider services"
  ON public.provider_services FOR SELECT
  USING (TRUE);

CREATE POLICY "Provider insert own services"
  ON public.provider_services FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_services.provider_id
      AND p.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Provider update own services"
  ON public.provider_services FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_services.provider_id
      AND p.user_id = auth.uid()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_services.provider_id
      AND p.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Provider delete own services"
  ON public.provider_services FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_services.provider_id
      AND p.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- 11.4 Portfolio Items RLS
CREATE POLICY "Public read on portfolio items"
  ON public.portfolio_items FOR SELECT
  USING (TRUE);

CREATE POLICY "Provider insert own portfolio items"
  ON public.portfolio_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = portfolio_items.provider_id
      AND p.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Provider update own portfolio items"
  ON public.portfolio_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = portfolio_items.provider_id
      AND p.user_id = auth.uid()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = portfolio_items.provider_id
      AND p.user_id = auth.uid()
    )
    OR public.is_admin()
  );

CREATE POLICY "Provider delete own portfolio items"
  ON public.portfolio_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = portfolio_items.provider_id
      AND p.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- 11.5 Working Hours RLS
CREATE POLICY "Public read on working hours"
  ON public.working_hours FOR SELECT
  USING (TRUE);

CREATE POLICY "Provider manage own working hours"
  ON public.working_hours FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = working_hours.provider_id
      AND p.user_id = auth.uid()
    )
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = working_hours.provider_id
      AND p.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- 11.6 Reviews RLS
CREATE POLICY "Public read on approved reviews"
  ON public.reviews FOR SELECT
  USING (
    is_approved = TRUE
    OR (auth.uid() IS NOT NULL AND auth.uid() = customer_user_id)
    OR public.is_admin()
  );

CREATE POLICY "Authenticated customer create review"
  ON public.reviews FOR INSERT
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = customer_user_id)
    AND (
      auth.uid() IS DISTINCT FROM (
        SELECT user_id FROM public.providers 
        WHERE id = reviews.provider_id
      )
    )
    OR public.is_admin()
  );

CREATE POLICY "Customer or admin update review"
  ON public.reviews FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = customer_user_id)
    OR public.is_admin()
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid() = customer_user_id)
    OR public.is_admin()
  );

CREATE POLICY "Customer or admin delete review"
  ON public.reviews FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid() = customer_user_id)
    OR public.is_admin()
  );

-- ----------------------------------------------------------------------------
-- 12. STORAGE BUCKETS & STORAGE RLS POLICIES
-- ----------------------------------------------------------------------------
-- Insert storage buckets idempotently
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('provider-avatars', 'provider-avatars', TRUE, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']),
  ('portfolio-images', 'portfolio-images', TRUE, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4']),
  ('verification-docs', 'verification-docs', FALSE, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Storage Policies
CREATE POLICY "Public read on provider avatars"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'provider-avatars');

CREATE POLICY "Provider upload own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'provider-avatars'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

CREATE POLICY "Provider update/delete own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'provider-avatars'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

CREATE POLICY "Public read on portfolio media"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'portfolio-images');

CREATE POLICY "Provider upload portfolio media"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio-images'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

CREATE POLICY "Provider update/delete portfolio media"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'portfolio-images'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

CREATE POLICY "Provider upload verification documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-docs'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

CREATE POLICY "Provider or admin read own verification documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'verification-docs'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

-- ----------------------------------------------------------------------------
-- 13. CANONICAL SERVICE CATEGORIES SEED DATA
-- ----------------------------------------------------------------------------
INSERT INTO public.service_categories (id, name, display_name, icon, contextual_label, prompt_text, cta_text, synonyms, hero_step_index)
VALUES 
  ('electrician', 'Electrician', 'Electrical Services', '⚡', 'ELECTRICAL SERVICES', 'Find trusted electricians near you.', 'Find Electricians', ARRAY['electrician','electricians','electrical','wiring','inverter','solar','generator','rewiring','fault diagnosis'], 1),
  ('plumber', 'Plumber', 'Plumbing Services', '🔧', 'PLUMBING SERVICES', 'Find skilled plumbers near you.', 'Find Plumbers', ARRAY['plumber','plumbers','plumbing','pipe','pipes','burst pipe','drainage','water heater','pumping machine','borehole','leak'], 2),
  ('nail-technician', 'Nail Tech', 'Beauty & Nail Services', '💅', 'BEAUTY & NAIL SERVICES', 'Discover beauty professionals near you.', 'Find Nail Technicians', ARRAY['nail-technician','nail technician','nail tech','nails','beauty','pedicure','manicure','lashes','acrylic','gel nails'], 3),
  ('tailor', 'Tailor', 'Fashion & Tailoring', '🧵', 'FASHION & TAILORING', 'Find skilled tailors near you.', 'Find Tailors', ARRAY['tailor','tailors','tailoring','fashion','fashion designer','sewing','dressmaker','agbada','senator','alterations'], 4),
  ('mechanic', 'Mechanic', 'Auto Services', '🔩', 'AUTO SERVICES', 'Connect with reliable mechanics near you.', 'Find Mechanics', ARRAY['mechanic','mechanics','auto mechanic','car repair','automobile','engine','brake','gearbox','diagnostic'], 5),
  ('carpenter', 'Carpenter', 'Carpentry & Woodwork', '🪚', 'CARPENTRY', 'Find skilled carpenters near you.', 'Find Carpenters', ARRAY['carpenter','carpenters','carpentry','woodwork','furniture','cabinet','wardrobe','kitchen cabinet','roof truss'], 6),
  ('cleaner', 'Cleaning', 'Cleaning Services', '✨', 'CLEANING SERVICES', 'Find trusted cleaning professionals near you.', 'Find Cleaners', ARRAY['cleaner','cleaners','cleaning','deep cleaning','housekeeping','post construction','janitorial','fumigation'], 7),
  ('barber', 'Barber', 'Barber & Hair Styling', '✂️', 'BARBER & GROOMING', 'Find top barbers near you.', 'Find Barbers', ARRAY['barber','barbers','haircut','fade','hair stylist','beard grooming'], 8),
  ('painter', 'Painter', 'Painting & Wall Finish', '🎨', 'PAINTING SERVICES', 'Find professional painters near you.', 'Find Painters', ARRAY['painter','painters','painting','screeding','stucco','wall paint'], 9),
  ('welder', 'Welder', 'Welding & Metal Fabrication', '🔥', 'WELDING & FABRICATION', 'Find skilled welders near you.', 'Find Welders', ARRAY['welder','welders','welding','fabrication','iron gate','burglar proof','tank stand'], 10),
  ('phone-repair', 'Phone Repair', 'Phone & Laptop Engineering', '📱', 'DEVICE REPAIR', 'Find device repair engineers near you.', 'Find Tech Engineers', ARRAY['phone repair','laptop repair','screen replacement','macbook','iphone repair'], 11),
  ('caterer', 'Caterer', 'Catering & Event Dining', '🍽️', 'CATERING & FOOD', 'Find event caterers near you.', 'Find Caterers', ARRAY['caterer','caterers','catering','jollof','small chops','event food','baker','cake'], 12),
  ('photographer', 'Photographer', 'Photography & Media', '📸', 'PHOTO & VIDEO', 'Find pro photographers near you.', 'Find Photographers', ARRAY['photographer','photography','videographer','photo studio','event coverage'], 13),
  ('laundry', 'Laundry', 'Laundry & Dry Cleaning', '👔', 'LAUNDRY SERVICES', 'Find laundry services near you.', 'Find Laundry Pros', ARRAY['laundry','dry cleaning','ironing','wash and fold'], 14),
  ('dispatch', 'Dispatch', 'Express Dispatch & Delivery', '🏍️', 'DISPATCH LOGISTICS', 'Find rapid dispatch riders near you.', 'Find Dispatch Riders', ARRAY['dispatch','dispatch rider','courier','delivery','errand'], 15)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  display_name = EXCLUDED.display_name,
  icon = EXCLUDED.icon,
  contextual_label = EXCLUDED.contextual_label,
  prompt_text = EXCLUDED.prompt_text,
  cta_text = EXCLUDED.cta_text,
  synonyms = EXCLUDED.synonyms,
  hero_step_index = EXCLUDED.hero_step_index,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

COMMIT;
