-- ============================================================================
-- LOKATOR.NG — PRODUCTION SUPABASE DATABASE SCHEMA
-- PostgreSQL Schema with Row Level Security (RLS) & Performance Indexes
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- 2. SERVICE CATEGORIES TABLE
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
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PROVIDERS TABLE (Public Marketplace Listings with Flexible Skills)
CREATE TABLE IF NOT EXISTS public.providers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  business_name TEXT,
  trade_title TEXT NOT NULL,
  primary_category_slug TEXT REFERENCES public.service_categories(id) ON DELETE SET NULL,
  skills TEXT[] DEFAULT '{}', -- Flexible custom skills/services list e.g. ARRAY['Recording Studio', 'Music Production', 'Mixing']
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
  starting_price TEXT,
  avatar_bg TEXT DEFAULT 'linear-gradient(135deg, #006B3F, #059669)',
  badge_title TEXT DEFAULT 'NIN Verified Artisan',
  response_time TEXT DEFAULT '~15 mins',
  completed_jobs INT DEFAULT 0,
  rating NUMERIC(2, 1) DEFAULT 5.0,
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

-- 4. PROVIDER SERVICES (Multi-service capabilities)
CREATE TABLE IF NOT EXISTS public.provider_services (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT REFERENCES public.providers(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  category_slug TEXT REFERENCES public.service_categories(id) ON DELETE SET NULL,
  starting_price TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PORTFOLIO ITEMS TABLE
CREATE TABLE IF NOT EXISTS public.portfolio_items (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT REFERENCES public.providers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  image_url TEXT,
  accent_color TEXT DEFAULT '#006B3F',
  icon TEXT DEFAULT '🛠️',
  is_before_after BOOLEAN DEFAULT FALSE,
  tag TEXT DEFAULT 'Completed Project',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT REFERENCES public.providers(id) ON DELETE CASCADE,
  customer_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_name TEXT NOT NULL,
  author_location TEXT NOT NULL,
  rating INT CHECK (rating >= 1 AND rating <= 5),
  service_type TEXT,
  comment TEXT NOT NULL,
  is_verified_customer BOOLEAN DEFAULT TRUE,
  helpful_count INT DEFAULT 0,
  is_approved BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. WORKING HOURS & AVAILABILITY TABLE
CREATE TABLE IF NOT EXISTS public.working_hours (
  id BIGSERIAL PRIMARY KEY,
  provider_id BIGINT UNIQUE REFERENCES public.providers(id) ON DELETE CASCADE,
  weekday_hours TEXT DEFAULT '8:00 AM – 7:00 PM',
  saturday_hours TEXT DEFAULT '8:00 AM – 6:00 PM',
  sunday_hours TEXT DEFAULT 'Emergency Callouts (24/7)',
  response_time_text TEXT DEFAULT '~15 mins',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE, FAST GEOLOCATION & FLEXIBLE TEXT/SKILLS SEARCH
-- ============================================================================
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
CREATE INDEX IF NOT EXISTS idx_reviews_provider ON public.reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_portfolio_provider ON public.portfolio_items(provider_id);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.working_hours ENABLE ROW LEVEL SECURITY;

-- 1. Service Categories: Public read
CREATE POLICY "Allow public read on service categories" 
  ON public.service_categories FOR SELECT 
  USING (is_active = TRUE);

-- 2. Providers: Public read of active, public, and complete profiles
CREATE POLICY "Allow public read on active providers" 
  ON public.providers FOR SELECT 
  USING (is_active = TRUE AND is_public = TRUE AND profile_complete = TRUE);

-- 3. Providers: Public insert for provider self-registration
CREATE POLICY "Allow public provider registration" 
  ON public.providers FOR INSERT 
  WITH CHECK (true);

-- 4. Provider Services: Public read
CREATE POLICY "Allow public read on provider services" 
  ON public.provider_services FOR SELECT 
  USING (true);

-- 5. Provider Services: Insert for provider
CREATE POLICY "Allow provider services insert" 
  ON public.provider_services FOR INSERT 
  WITH CHECK (true);

-- 6. Portfolio: Public read
CREATE POLICY "Allow public read on portfolio items" 
  ON public.portfolio_items FOR SELECT 
  USING (true);

-- 7. Reviews: Public read on approved reviews
CREATE POLICY "Allow public read on approved reviews" 
  ON public.reviews FOR SELECT 
  USING (is_approved = TRUE);

-- 8. Reviews: Public insert for verified reviews
CREATE POLICY "Allow public review submission" 
  ON public.reviews FOR INSERT 
  WITH CHECK (true);

-- 9. Working Hours: Public read
CREATE POLICY "Allow public read on working hours" 
  ON public.working_hours FOR SELECT 
  USING (true);

-- ============================================================================
-- INITIAL CANONICAL CATEGORIES SEED
-- ============================================================================
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
  synonyms = EXCLUDED.synonyms;
