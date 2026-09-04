-- ============================================================================
-- PADIFIX PHASE 010: PROVIDER SUBSCRIPTION PLANS, PAYSTACK BILLING,
-- CONTACT METERING & POST-SERVICE REPUTATION
-- Migration: 035_padifix_provider_subscriptions_contact_metering.sql
-- ============================================================================

-- 1. CANONICAL PROVIDER PLANS TABLE
CREATE TABLE IF NOT EXISTS public.provider_plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price_amount_ngn NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
  price_kobo BIGINT NOT NULL DEFAULT 0,
  billing_interval TEXT NOT NULL DEFAULT 'monthly',
  contact_allowance INTEGER NOT NULL DEFAULT 5, -- -1 or 500 for fair-use unlimited
  max_skills INTEGER NOT NULL DEFAULT 3,
  max_photos INTEGER NOT NULL DEFAULT 5,
  max_videos INTEGER NOT NULL DEFAULT 0,
  search_priority INTEGER NOT NULL DEFAULT 0, -- 0=standard, 1=improved, 2=priority, 3=highest
  is_featured BOOLEAN NOT NULL DEFAULT FALSE,
  is_popular BOOLEAN NOT NULL DEFAULT FALSE,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed Initial Canonical Plans (FREE, BASIC, PRO, PREMIUM)
INSERT INTO public.provider_plans (
  id, name, price_amount_ngn, price_kobo, billing_interval, contact_allowance,
  max_skills, max_photos, max_videos, search_priority, is_featured, is_popular, features
) VALUES
  ('FREE', 'Free Starter', 0.00, 0, 'monthly', 5, 3, 5, 0, 0, FALSE, FALSE,
   '["Basic provider profile", "Standard search visibility", "Maximum 3 skills", "Maximum 5 photos", "Customer reviews", "Standard provider dashboard", "5 customer contacts/month"]'::jsonb),
  ('BASIC', 'Basic', 3500.00, 350000, 'monthly', 30, 10, 15, 1, 1, FALSE, FALSE,
   '["Everything in Free", "Up to 10 skills/services", "Up to 15 photos", "1 provider video", "Availability status", "Improved search visibility", "Lead/contact history", "Basic analytics", "30 customer contacts/month"]'::jsonb),
  ('PRO', 'Pro', 5000.00, 500000, 'monthly', 100, 25, 30, 3, 2, TRUE, TRUE,
   '["Everything in Basic", "Up to 25 skills/services", "Up to 30 photos", "Up to 3 provider videos", "Priority search visibility", "Featured provider profile", "Advanced lead analytics", "Priority support", "100 customer contacts/month"]'::jsonb),
  ('PREMIUM', 'Premium', 10000.00, 1000000, 'monthly', 500, 999, 999, 5, 3, TRUE, FALSE,
   '["Everything in Pro", "Unlimited skills/services", "Unlimited photos", "Up to 5 provider videos", "Highest search visibility", "Featured placement", "Advanced analytics", "Promotional opportunities", "Priority support", "Unlimited customer contacts subject to fair-use policy"]'::jsonb)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price_amount_ngn = EXCLUDED.price_amount_ngn,
  price_kobo = EXCLUDED.price_kobo,
  contact_allowance = EXCLUDED.contact_allowance,
  max_skills = EXCLUDED.max_skills,
  max_photos = EXCLUDED.max_photos,
  max_videos = EXCLUDED.max_videos,
  search_priority = EXCLUDED.search_priority,
  is_featured = EXCLUDED.is_featured,
  is_popular = EXCLUDED.is_popular,
  features = EXCLUDED.features,
  updated_at = NOW();

-- 2. PROVIDER SUBSCRIPTIONS TABLE
CREATE TABLE IF NOT EXISTS public.provider_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id BIGINT NOT NULL,
  plan_id TEXT NOT NULL REFERENCES public.provider_plans(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, trialing, past_due, cancelled, expired, pending, payment_failed
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT FALSE,
  paystack_subscription_code TEXT,
  paystack_customer_code TEXT,
  paystack_email_token TEXT,
  last_payment_reference TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_provider_active_sub UNIQUE(provider_id)
);

-- 3. MONTHLY PROVIDER CONTACT USAGE TABLE
CREATE TABLE IF NOT EXISTS public.provider_contact_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id BIGINT NOT NULL,
  billing_period TEXT NOT NULL, -- Format: YYYY-MM (e.g. '2026-09') in Africa/Lagos timezone
  contacts_used INTEGER NOT NULL DEFAULT 0,
  whatsapp_contacts INTEGER NOT NULL DEFAULT 0,
  phone_contacts INTEGER NOT NULL DEFAULT 0,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_provider_billing_period UNIQUE(provider_id, billing_period)
);

-- 4. INDIVIDUAL CONTACT EVENTS TABLE (Audit Log & Deduplication)
CREATE TABLE IF NOT EXISTS public.contact_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id BIGINT NOT NULL,
  channel TEXT NOT NULL, -- 'whatsapp' or 'call'
  idempotency_key TEXT UNIQUE NOT NULL,
  billing_period TEXT NOT NULL,
  session_token TEXT,
  customer_fingerprint_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. BILLING TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.billing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id BIGINT NOT NULL,
  reference TEXT UNIQUE NOT NULL,
  amount_kobo BIGINT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NGN',
  plan_id TEXT NOT NULL REFERENCES public.provider_plans(id),
  status TEXT NOT NULL DEFAULT 'pending', -- pending, success, failed
  paystack_channel TEXT,
  gateway_response TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. POST-SERVICE REVIEWS TABLE (Comprehensive Reputation Architecture)
CREATE TABLE IF NOT EXISTS public.post_service_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id BIGINT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_phone_hash TEXT,
  rating NUMERIC(2, 1) NOT NULL CHECK (rating >= 1.0 AND rating <= 5.0),
  quality_rating INTEGER CHECK (quality_rating >= 1 AND quality_rating <= 5),
  professionalism_rating INTEGER CHECK (professionalism_rating >= 1 AND professionalism_rating <= 5),
  communication_rating INTEGER CHECK (communication_rating >= 1 AND communication_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  reliability_rating INTEGER CHECK (reliability_rating >= 1 AND reliability_rating <= 5),
  comment TEXT,
  job_completed BOOLEAN NOT NULL DEFAULT TRUE,
  hired_status TEXT NOT NULL DEFAULT 'completed', -- 'completed', 'in_progress', 'not_hired'
  praise_tags JSONB DEFAULT '[]'::jsonb,
  photos JSONB DEFAULT '[]'::jsonb,
  interaction_token TEXT,
  status TEXT NOT NULL DEFAULT 'published', -- 'published', 'reported', 'moderated', 'hidden'
  is_verified_interaction BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. REVIEW RESPONSES TABLE (Provider Public Reply)
CREATE TABLE IF NOT EXISTS public.review_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.post_service_reviews(id) ON DELETE CASCADE,
  provider_id BIGINT NOT NULL,
  response_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT uq_review_response UNIQUE(review_id)
);

-- 8. REVIEW REPORTS TABLE (Community Moderation)
CREATE TABLE IF NOT EXISTS public.review_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL REFERENCES public.post_service_reviews(id) ON DELETE CASCADE,
  reporter_identifier_hash TEXT,
  reason TEXT NOT NULL,
  details TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'investigated', 'actioned', 'dismissed'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PERFORMANCE & AUDIT INDEXES
CREATE INDEX IF NOT EXISTS idx_ps_provider_id ON public.provider_subscriptions(provider_id);
CREATE INDEX IF NOT EXISTS idx_ps_status ON public.provider_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_pcu_provider_period ON public.provider_contact_usage(provider_id, billing_period);
CREATE INDEX IF NOT EXISTS idx_ce_provider_id ON public.contact_events(provider_id);
CREATE INDEX IF NOT EXISTS idx_ce_idempotency_key ON public.contact_events(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_bt_provider_id ON public.billing_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_bt_reference ON public.billing_transactions(reference);
CREATE INDEX IF NOT EXISTS idx_psr_provider_id ON public.post_service_reviews(provider_id);
CREATE INDEX IF NOT EXISTS idx_psr_status ON public.post_service_reviews(status);
CREATE INDEX IF NOT EXISTS idx_rr_review_id ON public.review_responses(review_id);
CREATE INDEX IF NOT EXISTS idx_rep_review_id ON public.review_reports(review_id);

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.provider_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_contact_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_service_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_reports ENABLE ROW LEVEL SECURITY;

-- Plans are publicly readable by everyone
DROP POLICY IF EXISTS "Plans are publicly viewable" ON public.provider_plans;
CREATE POLICY "Plans are publicly viewable"
  ON public.provider_plans FOR SELECT USING (true);

-- Subscriptions: Providers can view only their own subscription
DROP POLICY IF EXISTS "Providers view own subscription" ON public.provider_subscriptions;
CREATE POLICY "Providers view own subscription"
  ON public.provider_subscriptions FOR SELECT
  USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- Contact Usage: Providers view only their own usage
DROP POLICY IF EXISTS "Providers view own contact usage" ON public.provider_contact_usage;
CREATE POLICY "Providers view own contact usage"
  ON public.provider_contact_usage FOR SELECT
  USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- Billing Transactions: Providers view only their own billing history
DROP POLICY IF EXISTS "Providers view own billing history" ON public.billing_transactions;
CREATE POLICY "Providers view own billing history"
  ON public.billing_transactions FOR SELECT
  USING (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );

-- Published Reviews are viewable by all
DROP POLICY IF EXISTS "Published reviews are viewable by all" ON public.post_service_reviews;
CREATE POLICY "Published reviews are viewable by all"
  ON public.post_service_reviews FOR SELECT
  USING (status = 'published' OR auth.role() = 'service_role');

-- Review Responses are viewable by all
DROP POLICY IF EXISTS "Review responses are viewable by all" ON public.review_responses;
CREATE POLICY "Review responses are viewable by all"
  ON public.review_responses FOR SELECT USING (true);

-- Provider can respond only to reviews for their own business
DROP POLICY IF EXISTS "Providers can respond to reviews on their profile" ON public.review_responses;
CREATE POLICY "Providers can respond to reviews on their profile"
  ON public.review_responses FOR INSERT
  WITH CHECK (
    provider_id IN (SELECT id FROM public.providers WHERE user_id = auth.uid())
    OR auth.role() = 'service_role'
  );
