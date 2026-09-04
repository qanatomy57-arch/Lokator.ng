-- ============================================================================
-- PADIFIX PHASE 008: REAL KYC INTEGRATION, WEBHOOK RECONCILIATION & COMPLIANCE
-- Migration: 034_padifix_kyc_integration_reconciliation_compliance.sql
-- Establishes durable verification attempts, webhook event deduplication,
-- reconciliation tracking, and hardened compliance RLS boundaries.
-- ============================================================================

-- 1. DURABLE VERIFICATION ATTEMPTS TABLE
CREATE TABLE IF NOT EXISTS public.provider_verification_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id TEXT UNIQUE NOT NULL,
  request_id TEXT NOT NULL,
  provider_id BIGINT NOT NULL,
  provider_name TEXT NOT NULL DEFAULT 'SANDBOX_KYC',
  provider_reference TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, completed, failed
  normalized_result TEXT DEFAULT 'PENDING', -- VERIFIED, REJECTED, PENDING, FAILED, UNAVAILABLE
  result_code TEXT DEFAULT 'PENDING_REVIEW', -- Standardized machine-readable decision code
  evidence_hash TEXT NOT NULL,
  idempotency_key TEXT UNIQUE,
  correlation_id TEXT,
  webhook_received_at TIMESTAMPTZ,
  reconciled_at TIMESTAMPTZ,
  failure_reason_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. DURABLE KYC WEBHOOK EVENTS TABLE (Replay protection & deduplication)
CREATE TABLE IF NOT EXISTS public.kyc_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id TEXT UNIQUE NOT NULL,
  provider_name TEXT NOT NULL,
  event_type TEXT NOT NULL,
  attempt_id TEXT,
  request_id TEXT,
  provider_id BIGINT,
  status TEXT NOT NULL DEFAULT 'processed',
  normalized_outcome TEXT NOT NULL,
  safe_result_code TEXT NOT NULL,
  signature_verified BOOLEAN DEFAULT TRUE,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES FOR PERFORMANCE, RECONCILIATION & DEDUPLICATION
CREATE INDEX IF NOT EXISTS idx_pva_attempt_id 
  ON public.provider_verification_attempts(attempt_id);

CREATE INDEX IF NOT EXISTS idx_pva_request_id 
  ON public.provider_verification_attempts(request_id);

CREATE INDEX IF NOT EXISTS idx_pva_provider_id 
  ON public.provider_verification_attempts(provider_id);

CREATE INDEX IF NOT EXISTS idx_pva_status_pending 
  ON public.provider_verification_attempts(status) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_pva_provider_reference 
  ON public.provider_verification_attempts(provider_reference);

CREATE INDEX IF NOT EXISTS idx_pva_idempotency_key 
  ON public.provider_verification_attempts(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_kwe_event_id 
  ON public.kyc_webhook_events(event_id);

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.provider_verification_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_webhook_events ENABLE ROW LEVEL SECURITY;

-- Providers can view only their own verification attempts
DROP POLICY IF EXISTS "Providers can view own attempts" ON public.provider_verification_attempts;
CREATE POLICY "Providers can view own attempts"
  ON public.provider_verification_attempts
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM public.providers WHERE user_id = auth.uid()
    )
  );

-- Providers cannot insert or mutate verification attempts directly from the client
DROP POLICY IF EXISTS "Providers cannot mutate attempts directly" ON public.provider_verification_attempts;
CREATE POLICY "Providers cannot mutate attempts directly"
  ON public.provider_verification_attempts
  FOR ALL
  USING (
    public.is_compliance_reviewer()
  )
  WITH CHECK (
    public.is_compliance_reviewer()
  );

-- Webhook events table is strictly service-role and compliance-officer accessible
DROP POLICY IF EXISTS "Compliance officers can view webhook events" ON public.kyc_webhook_events;
CREATE POLICY "Compliance officers can view webhook events"
  ON public.kyc_webhook_events
  FOR SELECT
  USING (
    public.is_compliance_reviewer()
  );
