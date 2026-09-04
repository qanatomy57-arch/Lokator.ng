-- ============================================================================
-- PADIFIX PHASE 007: PROVIDER VERIFICATION OPERATIONS & IDENTITY GATEWAY
-- Migration: 033_padifix_provider_verification_operations_gateway.sql
-- Augments verification requests with idempotency keys, correlation tracking,
-- safe result codes, adapter tracking, and hardened reviewer RLS policies
-- ============================================================================

-- 1. EXTEND VERIFICATION REQUESTS TABLE
ALTER TABLE IF EXISTS public.verification_requests
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS correlation_id TEXT,
  ADD COLUMN IF NOT EXISTS adapter_name TEXT DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS retry_count INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS safe_result_code TEXT,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. EXTEND VERIFICATION AUDITS TABLE
ALTER TABLE IF EXISTS public.verification_audits
  ADD COLUMN IF NOT EXISTS correlation_id TEXT;

-- 3. DEDICATED PERFORMANCE, IDEMPOTENCY & DUPLICATE PROTECTION INDEXES
CREATE INDEX IF NOT EXISTS idx_verification_requests_idempotency
  ON public.verification_requests(idempotency_key);

CREATE INDEX IF NOT EXISTS idx_verification_requests_doc_hash
  ON public.verification_requests(document_reference_hash);

CREATE INDEX IF NOT EXISTS idx_verification_requests_correlation
  ON public.verification_requests(correlation_id);

CREATE INDEX IF NOT EXISTS idx_verification_audits_correlation
  ON public.verification_audits(correlation_id);

-- 4. HARDENED REVIEWER & COMPLIANCE ACCESS FUNCTIONS
CREATE OR REPLACE FUNCTION public.is_compliance_reviewer()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.providers
    WHERE user_id = auth.uid() 
      AND (subscription_plan = 'admin' OR subscription_plan = 'compliance_officer' OR subscription_plan = 'reviewer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- Providers can only update non-sensitive operational fields on their own requests, but CANNOT mutate status directly
DROP POLICY IF EXISTS "Providers can update own verification requests" ON public.verification_requests;
CREATE POLICY "Providers cannot mutate verification status directly"
  ON public.verification_requests
  FOR UPDATE
  USING (
    provider_id IN (
      SELECT id FROM public.providers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    status = 'pending' AND
    provider_id IN (
      SELECT id FROM public.providers WHERE user_id = auth.uid()
    )
  );

-- Only verified compliance officers and administrators can execute trusted status transitions
DROP POLICY IF EXISTS "Compliance officers can update verification requests" ON public.verification_requests;
CREATE POLICY "Compliance officers can update verification requests"
  ON public.verification_requests
  FOR UPDATE
  USING (
    public.is_compliance_reviewer()
  )
  WITH CHECK (
    public.is_compliance_reviewer()
  );
