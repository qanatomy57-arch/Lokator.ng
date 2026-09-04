-- ============================================================================
-- PADIFIX PHASE 011: RECURRING PAYSTACK SUBSCRIPTIONS, BILLING LIFECYCLE,
-- RESEND EMAIL INFRASTRUCTURE & PROVIDER GROWTH
-- Migration: 036_padifix_recurring_subscriptions_and_billing_lifecycle.sql
-- ============================================================================

-- 1. ADD PAYSTACK PLAN CODES AND UPDATE CANONICAL PRICING IN PROVIDER PLANS
ALTER TABLE public.provider_plans 
  ADD COLUMN IF NOT EXISTS paystack_plan_code TEXT;

-- Update to Final Canonical Pricing:
-- BASIC = ₦3,500 (350,000 kobo)
-- PRO = ₦8,000 (800,000 kobo)
-- PREMIUM = ₦15,000 (1,500,000 kobo)
UPDATE public.provider_plans
SET 
  price_amount_ngn = 3500.00,
  price_kobo = 350000,
  paystack_plan_code = 'PLN_padifix_basic',
  updated_at = NOW()
WHERE id = 'BASIC';

UPDATE public.provider_plans
SET 
  price_amount_ngn = 8000.00,
  price_kobo = 800000,
  paystack_plan_code = 'PLN_padifix_pro',
  updated_at = NOW()
WHERE id = 'PRO';

UPDATE public.provider_plans
SET 
  price_amount_ngn = 15000.00,
  price_kobo = 1500000,
  paystack_plan_code = 'PLN_padifix_premium',
  updated_at = NOW()
WHERE id = 'PREMIUM';

UPDATE public.provider_plans
SET 
  paystack_plan_code = NULL,
  updated_at = NOW()
WHERE id = 'FREE';

-- 2. EXTEND PROVIDER SUBSCRIPTIONS TABLE FOR LIFECYCLE & GRACE PERIOD
ALTER TABLE public.provider_subscriptions
  ADD COLUMN IF NOT EXISTS paystack_plan_code TEXT,
  ADD COLUMN IF NOT EXISTS grace_period_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS failed_payment_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_failed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS lifecycle_status TEXT DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS email_notifications JSONB DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_provider_subs_lifecycle ON public.provider_subscriptions (provider_id, lifecycle_status);
CREATE INDEX IF NOT EXISTS idx_provider_subs_grace ON public.provider_subscriptions (grace_period_ends_at) WHERE grace_period_ends_at IS NOT NULL;

-- 3. EXTEND BILLING TRANSACTIONS TABLE FOR RECURRING RENEWALS & RESEND AUDITING
ALTER TABLE public.billing_transactions
  ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'initial', -- 'initial', 'renewal', 'upgrade', 'downgrade', 'failed', 'refund'
  ADD COLUMN IF NOT EXISTS paystack_plan_code TEXT,
  ADD COLUMN IF NOT EXISTS subscription_code TEXT,
  ADD COLUMN IF NOT EXISTS grace_period_active BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_billing_tx_type ON public.billing_transactions (transaction_type);
CREATE INDEX IF NOT EXISTS idx_billing_tx_subcode ON public.billing_transactions (subscription_code);

-- 4. RESEND EMAIL AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.resend_email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id BIGINT REFERENCES public.providers(id) ON DELETE SET NULL,
  recipient_email TEXT NOT NULL,
  email_type TEXT NOT NULL, -- subscription_activated, payment_success, payment_failed, grace_warning, subscription_cancelled, subscription_expired, plan_changed
  resend_id TEXT,
  status TEXT NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'sandbox_simulated'
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_provider ON public.resend_email_logs (provider_id, email_type);
CREATE INDEX IF NOT EXISTS idx_email_logs_status ON public.resend_email_logs (status);

-- 5. ROW LEVEL SECURITY (RLS) FOR RESEND EMAIL LOGS
ALTER TABLE public.resend_email_logs ENABLE ROW LEVEL SECURITY;

-- Providers can read their own notification logs
CREATE POLICY "Providers can view own email notification logs"
  ON public.resend_email_logs
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      provider_id IN (
        SELECT id FROM public.providers WHERE auth_user_id = auth.uid()::text
      )
    )
  );

-- Service role has full access
CREATE POLICY "Service role manages email logs"
  ON public.resend_email_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- End of Migration 036
