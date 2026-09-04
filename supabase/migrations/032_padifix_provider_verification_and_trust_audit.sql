-- ============================================================================
-- PADIFIX PHASE 006: PROVIDER VERIFICATION & TRUST AUDIT SCHEMA MIGRATION
-- Migration: 032_padifix_provider_verification_and_trust_audit.sql
-- Implements verification request lifecycle, append-only audits, and strict RLS
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. VERIFICATION REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id BIGINT NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  verification_type TEXT NOT NULL CHECK (verification_type IN ('vnin', 'cac_cert', 'voters_card', 'drivers_license', 'platform_review')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'failed', 'expired')),
  document_reference_hash TEXT NOT NULL, -- SHA-256 one-way cryptographic hash
  document_masked_ref TEXT NOT NULL,      -- Display-safe masked reference e.g. vNIN: 1024-****-****-9812
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_source TEXT DEFAULT 'padifix_compliance',
  rejection_reason TEXT,
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- 3. VERIFICATION AUDITS TABLE (Append-Only Audit Ledger)
CREATE TABLE IF NOT EXISTS public.verification_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID REFERENCES public.verification_requests(id) ON DELETE CASCADE,
  provider_id BIGINT NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
  previous_state TEXT NOT NULL,
  new_state TEXT NOT NULL,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('provider', 'system', 'admin', 'compliance_officer', 'verifier_gateway')),
  actor_id TEXT,
  action TEXT NOT NULL,
  reason TEXT,
  ip_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PERFORMANCE & LOOKUP INDEXES
CREATE INDEX IF NOT EXISTS idx_verification_requests_provider 
  ON public.verification_requests(provider_id);

CREATE INDEX IF NOT EXISTS idx_verification_requests_status 
  ON public.verification_requests(status);

CREATE INDEX IF NOT EXISTS idx_verification_requests_submitted 
  ON public.verification_requests(submitted_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_audits_provider 
  ON public.verification_audits(provider_id);

CREATE INDEX IF NOT EXISTS idx_verification_audits_request 
  ON public.verification_audits(request_id);

CREATE INDEX IF NOT EXISTS idx_verification_audits_created 
  ON public.verification_audits(created_at DESC);

-- 5. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_audits ENABLE ROW LEVEL SECURITY;

-- 5.1 Provider Self-Service Policies (verification_requests)
-- Providers can only view their own verification requests
CREATE POLICY "Providers can view own verification requests"
  ON public.verification_requests
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM public.providers 
      WHERE user_id = auth.uid()
    )
  );

-- Providers can insert a verification request for their own profile
CREATE POLICY "Providers can submit own verification request"
  ON public.verification_requests
  FOR INSERT
  WITH CHECK (
    provider_id IN (
      SELECT id FROM public.providers 
      WHERE user_id = auth.uid()
    )
  );

-- 5.2 Verification Audit Policies (verification_audits)
-- Providers can only read their own audit history
CREATE POLICY "Providers can view own verification audits"
  ON public.verification_audits
  FOR SELECT
  USING (
    provider_id IN (
      SELECT id FROM public.providers 
      WHERE user_id = auth.uid()
    )
  );

-- System / Service Role / Admin Policy
CREATE POLICY "Admins have full access to verification requests"
  ON public.verification_requests
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.providers 
      WHERE user_id = auth.uid() AND subscription_plan = 'admin'
    )
  );

CREATE POLICY "Admins have full access to verification audits"
  ON public.verification_audits
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.providers 
      WHERE user_id = auth.uid() AND subscription_plan = 'admin'
    )
  );
