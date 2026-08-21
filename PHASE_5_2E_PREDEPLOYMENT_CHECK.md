# LOKATOR.NG — PHASE 5.2E PRE-DEPLOYMENT VERIFICATION CHECK
**CONTROLLED PRODUCTION TELEMETRY DEPLOYMENT GATEWAY**

---

## 1. Target Environment Verification

| Deployment Target | Required Value | Actual Verified Value | Verification Status |
| :--- | :--- | :--- | :---: |
| **Supabase Project Reference** | `hvxosxhnxauiqrhpyuur` | `hvxosxhnxauiqrhpyuur` | **CONFIRMED / MATCH** |
| **Supabase Project URL** | `https://hvxosxhnxauiqrhpyuur.supabase.co` | `https://hvxosxhnxauiqrhpyuur.supabase.co` | **CONFIRMED / MATCH** |
| **Live Production Web URL** | `https://lokator-ng.vercel.app/` | `https://lokator-ng.vercel.app/` | **CONFIRMED / MATCH** |
| **Git Remote Repository** | `https://github.com/qanatomy57-arch/Lokator.ng.git` | `origin/main` | **CONFIRMED / MATCH** |
| **Current Baseline Commit** | `a9615dc` | `a9615dc` | **CONFIRMED / MATCH** |
| **Active Local Branch** | `main` | `main` | **CONFIRMED / MATCH** |

---

## 2. Migration Inventory & Status

```text
Existing Migration History:
├── 001_lokator_production_foundation.sql                     [APPLIED / UNTOUCHED]
├── 002_lokator_content_moderation_and_storage_hardening.sql [APPLIED / UNTOUCHED]
└── 003_lokator_analytics_events_and_rls.sql                 [READY TO APPLY]
```

- **Safety Check**: Migrations `001` and `002` are preserved without modification.
- **Migration `003`**: Formally specifies `public.analytics_events` table with case-insensitive PII check constraints, server-side rate limit trigger (`BEFORE INSERT`), and append-only RLS.

---

## 3. Exact Migration SQL to be Applied

```sql
-- Migration 003: public.analytics_events
CREATE TABLE IF NOT EXISTS public.analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL,
    event_name VARCHAR(64) NOT NULL,
    page_path VARCHAR(128) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT check_event_name_format CHECK (event_name ~ '^[a-z0-9_]{3,64}$'),
    CONSTRAINT check_event_name_length CHECK (length(event_name) <= 64),
    CONSTRAINT check_page_path_length CHECK (length(page_path) <= 128),
    CONSTRAINT check_properties_size CHECK (octet_length(properties::text) <= 2048),
    CONSTRAINT check_no_sensitive_keys_case_insensitive CHECK (
        properties::text !~* '"(password|pwd|token|access_token|refresh_token|jwt|auth|secret|service_role|api_key|apikey|key|nin|bvn|account_number|credit_card|phone|email|whatsapp_message|message|private_message)"\s*:'
    )
);

CREATE INDEX IF NOT EXISTS idx_analytics_events_name_created 
    ON public.analytics_events (event_name, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_created 
    ON public.analytics_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_created 
    ON public.analytics_events (session_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.enforce_analytics_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_recent_count INT;
BEGIN
    NEW.created_at := now();

    SELECT count(*) INTO v_recent_count
    FROM public.analytics_events
    WHERE session_id = NEW.session_id
      AND created_at > (now() - INTERVAL '60 seconds');

    IF v_recent_count >= 30 THEN
        RAISE EXCEPTION 'Telemetry rate limit exceeded for session %', NEW.session_id
            USING ERRCODE = '23514';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_analytics_rate_limit ON public.analytics_events;
CREATE TRIGGER trg_enforce_analytics_rate_limit
    BEFORE INSERT ON public.analytics_events
    FOR EACH ROW
    EXECUTE FUNCTION public.enforce_analytics_rate_limit();

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.analytics_events FROM PUBLIC, anon, authenticated;
GRANT INSERT ON public.analytics_events TO anon, authenticated;

CREATE POLICY "Allow append-only analytics event insert"
    ON public.analytics_events
    FOR INSERT
    TO anon, authenticated
    WITH CHECK (
        length(event_name) >= 3 AND
        length(event_name) <= 64 AND
        length(page_path) <= 128 AND
        octet_length(properties::text) <= 2048 AND
        properties::text !~* '"(password|pwd|token|access_token|refresh_token|jwt|auth|secret|service_role|api_key|apikey|key|nin|bvn|account_number|credit_card|phone|email|whatsapp_message|message|private_message)"\s*:'
    );

DROP POLICY IF EXISTS "Deny public select" ON public.analytics_events;
DROP POLICY IF EXISTS "Deny public update" ON public.analytics_events;
DROP POLICY IF EXISTS "Deny public delete" ON public.analytics_events;
```

---

## 4. Pre-Deployment Test Baseline

- Automated Regression Test Suite: **446 / 446 assertions PASS (100% GREEN)** across 11 test suites.
- Working tree is clean and ready for deployment.
