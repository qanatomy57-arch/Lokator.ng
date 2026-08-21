-- ============================================================================
-- LOKATOR.NG — SERVER-SIDE CONTENT MODERATION & STORAGE SECURITY HARDENING
-- Migration: 002_lokator_content_moderation_and_storage_hardening.sql
-- Target Project: hvxosxhnxauiqrhpyuur (https://hvxosxhnxauiqrhpyuur.supabase.co)
-- Description: Authoritative database-level content moderation, SVG XSS elimination,
--              and strict avatar storage isolation.
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- 1. NORMALIZATION & CONTENT MODERATION HELPER FUNCTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.normalize_moderation_text(raw_text TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  clean_text TEXT;
BEGIN
  IF raw_text IS NULL THEN
    RETURN '';
  END IF;

  -- 1. Lowercase and trim
  clean_text := lower(trim(raw_text));

  -- 2. Normalize common leetspeak / separator tricks:
  -- replace punctuation/separators with spaces to isolate tokens
  clean_text := regexp_replace(clean_text, '[\-_.,;:!@#$%^&*()+=\\/{}\[\]|<>?~`"''0-9]', ' ', 'g');

  -- 3. Collapse multiple spaces into single space
  clean_text := regexp_replace(clean_text, '\s+', ' ', 'g');

  RETURN trim(clean_text);
END;
$$;

-- ----------------------------------------------------------------------------
-- 2. SERVER-SIDE SERVICE CONTENT MODERATION TRIGGER FUNCTION
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_service_content_moderation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
  blocked_patterns TEXT[] := ARRAY[
    'killer',
    'kidnap',
    'kidnapper',
    'kidnapping',
    'fraud',
    'scam',
    'scammer',
    'hack',
    'hacker',
    'hacking',
    'weapon',
    'weapons',
    'firearm',
    'gun',
    'guns',
    'drug',
    'drugs',
    'cocaine',
    'narcotic',
    'narcotics',
    'fake document',
    'fake documents',
    'fake certificate',
    'counterfeit',
    'stolen good',
    'stolen goods',
    'prostitute',
    'prostitution',
    'escort service',
    'bomb',
    'malware',
    'virus maker',
    'piracy',
    'pirated',
    'hacked account',
    'hacked accounts',
    'yahoo yahoo',
    'money ritual',
    'ritual killing',
    'organ trafficking',
    'human parts'
  ];
  pattern TEXT;
  normalized_check TEXT;
  skill_item TEXT;
BEGIN
  -- Bypass check for service role / superadmin
  IF public.is_admin() THEN
    RETURN NEW;
  END IF;

  -- Construct combined text to validate from NEW record
  IF TG_TABLE_NAME = 'providers' THEN
    -- Check trade_title
    IF NEW.trade_title IS NOT NULL THEN
      normalized_check := public.normalize_moderation_text(NEW.trade_title);
      FOREACH pattern IN ARRAY blocked_patterns LOOP
        IF normalized_check ~* ('(^|\s)' || pattern || '(\s|$)') OR normalized_check ~* pattern THEN
          RAISE EXCEPTION 'This service category is not permitted on Lokator.' USING ERRCODE = '23514';
        END IF;
      END LOOP;
    END IF;

    -- Check skills array
    IF NEW.skills IS NOT NULL AND array_length(NEW.skills, 1) > 0 THEN
      FOREACH skill_item IN ARRAY NEW.skills LOOP
        normalized_check := public.normalize_moderation_text(skill_item);
        FOREACH pattern IN ARRAY blocked_patterns LOOP
          IF normalized_check ~* ('(^|\s)' || pattern || '(\s|$)') OR normalized_check ~* pattern THEN
            RAISE EXCEPTION 'This service category is not permitted on Lokator.' USING ERRCODE = '23514';
          END IF;
        END LOOP;
      END LOOP;
    END IF;

    -- Check bio for blatant illegal service marketing
    IF NEW.bio IS NOT NULL THEN
      normalized_check := public.normalize_moderation_text(NEW.bio);
      FOREACH pattern IN ARRAY blocked_patterns LOOP
        IF normalized_check ~* ('(^|\s)' || pattern || '(\s|$)') THEN
          RAISE EXCEPTION 'This service category is not permitted on Lokator.' USING ERRCODE = '23514';
        END IF;
      END LOOP;
    END IF;

  ELSIF TG_TABLE_NAME = 'provider_services' THEN
    -- Check service_name
    IF NEW.service_name IS NOT NULL THEN
      normalized_check := public.normalize_moderation_text(NEW.service_name);
      FOREACH pattern IN ARRAY blocked_patterns LOOP
        IF normalized_check ~* ('(^|\s)' || pattern || '(\s|$)') OR normalized_check ~* pattern THEN
          RAISE EXCEPTION 'This service category is not permitted on Lokator.' USING ERRCODE = '23514';
        END IF;
      END LOOP;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger to providers table
DROP TRIGGER IF EXISTS trigger_validate_provider_moderation ON public.providers;
CREATE TRIGGER trigger_validate_provider_moderation
  BEFORE INSERT OR UPDATE ON public.providers
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_service_content_moderation();

-- Attach trigger to provider_services table
DROP TRIGGER IF EXISTS trigger_validate_service_moderation ON public.provider_services;
CREATE TRIGGER trigger_validate_service_moderation
  BEFORE INSERT OR UPDATE ON public.provider_services
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_service_content_moderation();

-- ----------------------------------------------------------------------------
-- 3. STORAGE SECURITY HARDENING (ELIMINATE SVG XSS & ENFORCE 5MB LIMITS)
-- ----------------------------------------------------------------------------

-- Harden provider-avatars bucket (strictly image/jpeg, image/png, image/webp; disallow SVG)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('provider-avatars', 'provider-avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', TRUE, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure avatars alias bucket has strict RLS
DROP POLICY IF EXISTS "Public read on avatars bucket" ON storage.objects;
CREATE POLICY "Public read on avatars bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Provider upload own avatar alias" ON storage.objects;
CREATE POLICY "Provider upload own avatar alias"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

DROP POLICY IF EXISTS "Provider update/delete own avatar alias" ON storage.objects;
CREATE POLICY "Provider update/delete own avatar alias"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

DROP POLICY IF EXISTS "Provider delete own avatar alias" ON storage.objects;
CREATE POLICY "Provider delete own avatar alias"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND (auth.uid()::text = (storage.foldername(name))[1] OR public.is_admin())
  );

COMMIT;
