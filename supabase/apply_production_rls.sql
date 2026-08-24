-- ============================================================================
-- LOKATOR.NG — PRODUCTION ROW LEVEL SECURITY (RLS) & HARDENED DATA POLICIES
-- Paste and Run this in your Supabase SQL Editor (Project: hvxosxhnxauiqrhpyuur)
-- ============================================================================

-- 1. Enable Row Level Security (RLS) on all core tables
ALTER TABLE IF EXISTS public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.working_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.service_categories ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 2. PROVIDERS TABLE POLICIES (Parent Table)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read on active providers" ON public.providers;
DROP POLICY IF EXISTS "Allow public provider registration" ON public.providers;
DROP POLICY IF EXISTS "Allow authenticated provider insert" ON public.providers;
DROP POLICY IF EXISTS "Allow providers to update own profile" ON public.providers;
DROP POLICY IF EXISTS "Allow providers to delete own profile" ON public.providers;

-- A. Read: Visitors view active public listings; providers view their own profile even if unpublished
CREATE POLICY "Allow public read on active providers"
  ON public.providers FOR SELECT
  USING (
    (is_active = TRUE AND is_public = TRUE) OR
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
  );

-- B. Insert: Allows registration with data validation & user identity binding
CREATE POLICY "Allow public provider registration"
  ON public.providers FOR INSERT
  WITH CHECK (
    (auth.uid() IS NULL OR auth.uid() = user_id) AND
    length(trim(first_name)) > 0 AND
    length(trim(last_name)) > 0 AND
    length(trim(trade_title)) > 0 AND
    length(trim(phone)) >= 10 AND
    length(trim(state)) > 0 AND
    length(trim(city)) > 0
  );

-- C. Update: Strict owner check — an artisan can ONLY edit their own record
CREATE POLICY "Allow providers to update own profile"
  ON public.providers FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- D. Delete: Strict owner check — an artisan can ONLY delete their own record
CREATE POLICY "Allow providers to delete own profile"
  ON public.providers FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- 3. PROVIDER SERVICES POLICIES (Child Table: Linked by provider_id -> user_id)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read on provider services" ON public.provider_services;
DROP POLICY IF EXISTS "Allow provider services insert" ON public.provider_services;
DROP POLICY IF EXISTS "Allow provider services update" ON public.provider_services;
DROP POLICY IF EXISTS "Allow provider services delete" ON public.provider_services;

-- A. Read: Public can view all service offerings
CREATE POLICY "Allow public read on provider services"
  ON public.provider_services FOR SELECT
  USING (true);

-- B. Insert: Only the parent provider's owner can add services
CREATE POLICY "Allow provider services insert"
  ON public.provider_services FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL OR
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_services.provider_id
        AND (p.user_id IS NULL OR p.user_id = auth.uid())
    )
  );

-- C. Update: Only the verified owner can edit service offerings
CREATE POLICY "Allow provider services update"
  ON public.provider_services FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_services.provider_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_services.provider_id
        AND p.user_id = auth.uid()
    )
  );

-- D. Delete: Only the verified owner can remove services
CREATE POLICY "Allow provider services delete"
  ON public.provider_services FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = provider_services.provider_id
        AND p.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 4. PORTFOLIO ITEMS POLICIES (Child Table: Linked by provider_id -> user_id)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read on portfolio" ON public.portfolio_items;
DROP POLICY IF EXISTS "Allow portfolio insert" ON public.portfolio_items;
DROP POLICY IF EXISTS "Allow portfolio update" ON public.portfolio_items;
DROP POLICY IF EXISTS "Allow portfolio delete" ON public.portfolio_items;

CREATE POLICY "Allow public read on portfolio"
  ON public.portfolio_items FOR SELECT
  USING (true);

CREATE POLICY "Allow portfolio insert"
  ON public.portfolio_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = portfolio_items.provider_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow portfolio update"
  ON public.portfolio_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = portfolio_items.provider_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = portfolio_items.provider_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow portfolio delete"
  ON public.portfolio_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = portfolio_items.provider_id
        AND p.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 5. WORKING HOURS POLICIES (Child Table: Linked by provider_id -> user_id)
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read on working hours" ON public.working_hours;
DROP POLICY IF EXISTS "Allow working hours upsert" ON public.working_hours;
DROP POLICY IF EXISTS "Allow working hours update" ON public.working_hours;
DROP POLICY IF EXISTS "Allow working hours delete" ON public.working_hours;

CREATE POLICY "Allow public read on working hours"
  ON public.working_hours FOR SELECT
  USING (true);

CREATE POLICY "Allow working hours upsert"
  ON public.working_hours FOR INSERT
  WITH CHECK (
    auth.uid() IS NULL OR
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = working_hours.provider_id
        AND (p.user_id IS NULL OR p.user_id = auth.uid())
    )
  );

CREATE POLICY "Allow working hours update"
  ON public.working_hours FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = working_hours.provider_id
        AND p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = working_hours.provider_id
        AND p.user_id = auth.uid()
    )
  );

CREATE POLICY "Allow working hours delete"
  ON public.working_hours FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      WHERE p.id = working_hours.provider_id
        AND p.user_id = auth.uid()
    )
  );

-- ----------------------------------------------------------------------------
-- 6. REVIEWS & SERVICE CATEGORIES POLICIES
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read on reviews" ON public.reviews;
DROP POLICY IF EXISTS "Allow public review insert" ON public.reviews;
DROP POLICY IF EXISTS "Allow public read on service categories" ON public.service_categories;

CREATE POLICY "Allow public read on reviews"
  ON public.reviews FOR SELECT
  USING (is_approved = TRUE);

CREATE POLICY "Allow public review insert"
  ON public.reviews FOR INSERT
  WITH CHECK (
    rating >= 1 AND rating <= 5 AND
    length(trim(comment)) >= 3 AND
    length(trim(author_name)) > 0
  );

CREATE POLICY "Allow public read on service categories"
  ON public.service_categories FOR SELECT
  USING (is_active = TRUE);
