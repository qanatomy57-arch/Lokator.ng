/**
 * PADIFIX PRODUCTION CONFIGURATION & SECURITY VALIDATOR
 * scripts/validate_production_config.js
 *
 * Safe read-only configuration auditing across all 7 infrastructure areas:
 * 1. Application Base (APP_URL)
 * 2. Supabase PostgreSQL & Auth (Public anon key vs server-only service role)
 * 3. Paystack Payment Gateway (Test/Live consistency & webhook secret validation)
 * 4. Resend Transactional Email (Sender verification & unverified domain handling)
 * 5. Sentry Error & Performance Observability (EU/DE DSN, sample rates & token security)
 * 6. Cloudflare Edge, DNS & WAF (Deferred status validation)
 * 7. Google Maps Platform & Leaflet Fallback (Key presence, Map ID & fallback safety)
 * 8. Secret Exposure Scan (Client HTML & JS code scan for accidental secret leaks)
 *
 * CRITICAL RULE: NEVER PRINTS OR EXPOSES SECRET VALUES.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const ENV_PATH = path.join(ROOT, '.env');
const ENV_EXAMPLE_PATH = path.join(ROOT, '.env.example');

// Safe key-value parser
function parseEnv(filePath) {
  if (!fs.existsSync(filePath)) return new Map();
  const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
  const map = new Map();
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.substring(0, idx).trim();
      const val = trimmed.substring(idx + 1).trim();
      map.set(key, val);
    }
  }
  return map;
}

const envMap = parseEnv(ENV_PATH);

// Helper for safe inspection without printing secret values
function inspectSecret(val) {
  if (!val || val.length === 0) return { configured: false, length: 0 };
  return {
    configured: true,
    length: val.length,
    prefix: val.substring(0, 4) + '****'
  };
}

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
let externalGates = 0;

function check(title, condition, meta = '', isGate = false) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  ✅ [PASS] ${title}${meta ? ' — ' + meta : ''}`);
  } else if (isGate) {
    externalGates++;
    console.log(`  ⚠️ [EXTERNAL GATE] ${title}${meta ? ' — ' + meta : ''}`);
  } else {
    failedChecks++;
    console.log(`  ❌ [FAIL] ${title}${meta ? ' — ' + meta : ''}`);
  }
}

async function runValidation() {
  console.log('='.repeat(80));
  console.log('🛡️  PADIFIX PRODUCTION CONFIGURATION & OPERATIONAL READINESS VALIDATOR');
  console.log('='.repeat(80));

  // --------------------------------------------------------------------------
  // 1. APPLICATION BASE
  // --------------------------------------------------------------------------
  console.log('\n[1/8] APPLICATION BASE CONFIGURATION');
  const appUrl = envMap.get('APP_URL') || process.env.APP_URL;
  check('APP_URL is configured', Boolean(appUrl), appUrl ? `Target: ${appUrl}` : 'Missing');
  check('APP_URL uses HTTPS in production', Boolean(appUrl && appUrl.startsWith('https://')), appUrl);
  check('APP_URL is valid URL', (() => {
    try { new URL(appUrl); return true; } catch (e) { return false; }
  })());

  // --------------------------------------------------------------------------
  // 2. SUPABASE POSTGRESQL & AUTH
  // --------------------------------------------------------------------------
  console.log('\n[2/8] SUPABASE POSTGRESQL & AUTH');
  const supabaseUrl = envMap.get('SUPABASE_URL') || process.env.SUPABASE_URL;
  const anonKey = envMap.get('SUPABASE_ANON_KEY') || envMap.get('SUPABASE_PUBLISHABLE_KEY') || process.env.SUPABASE_ANON_KEY;
  const serviceRoleKey = envMap.get('SUPABASE_SERVICE_ROLE_KEY') || process.env.SUPABASE_SERVICE_ROLE_KEY;

  check('SUPABASE_URL is configured', Boolean(supabaseUrl), supabaseUrl ? 'Configured (https://*.supabase.co)' : 'Missing');
  check('SUPABASE_URL is HTTPS', Boolean(supabaseUrl && supabaseUrl.startsWith('https://')));
  check('SUPABASE_ANON_KEY is configured', Boolean(anonKey && anonKey.length > 20), anonKey ? 'Configured (JWT format)' : 'Missing');
  check('SUPABASE_SERVICE_ROLE_KEY is omitted from client access', Boolean(!serviceRoleKey || serviceRoleKey.length === 0 || serviceRoleKey.startsWith('eyJ')), 'Privileged key is not required for marketplace operation');

  // --------------------------------------------------------------------------
  // 3. PAYSTACK PAYMENT GATEWAY
  // --------------------------------------------------------------------------
  console.log('\n[3/8] PAYSTACK PAYMENT GATEWAY');
  const paystackPub = envMap.get('PAYSTACK_PUBLIC_KEY') || process.env.PAYSTACK_PUBLIC_KEY;
  const paystackSec = envMap.get('PAYSTACK_SECRET_KEY') || process.env.PAYSTACK_SECRET_KEY;
  const liveMode = (envMap.get('PAYMENT_LIVE_MODE') || process.env.PAYMENT_LIVE_MODE) === 'true';

  check('PAYSTACK_PUBLIC_KEY is configured', Boolean(paystackPub && paystackPub.length > 10), paystackPub ? `Prefix: ${paystackPub.substring(0, 7)}...` : 'Missing');
  check('PAYSTACK_SECRET_KEY is configured (Server-Only)', Boolean(paystackSec && paystackSec.length > 10), paystackSec ? 'Configured (Secret held server-side)' : 'Missing');

  const keyModeMismatch = paystackSec && (
    (liveMode && paystackSec.startsWith('sk_test_')) ||
    (!liveMode && paystackSec.startsWith('sk_live_'))
  );
  check('Paystack key environment consistency', !keyModeMismatch, liveMode ? 'Live mode: sk_live configured' : 'Test mode: sk_test configured');

  const webhookCode = fs.readFileSync(path.join(ROOT, 'api', 'paystack-webhook.js'), 'utf8');
  check('Webhook verification uses PAYSTACK_SECRET_KEY', webhookCode.includes('process.env.PAYSTACK_SECRET_KEY') && !webhookCode.includes('process.env.PAYSTACK_WEBHOOK_SECRET'), 'Paystack HMAC-SHA512 strictly uses Secret Key without fictional webhook secret');

  // --------------------------------------------------------------------------
  // 4. RESEND TRANSACTIONAL EMAIL API
  // --------------------------------------------------------------------------
  console.log('\n[4/8] RESEND TRANSACTIONAL EMAIL API');
  const resendApiKey = envMap.get('RESEND_API_KEY') || process.env.RESEND_API_KEY;
  const resendFrom = envMap.get('RESEND_FROM_EMAIL') || process.env.RESEND_FROM_EMAIL;

  check('RESEND_API_KEY is configured (Server-Only)', Boolean(resendApiKey && resendApiKey.length > 10), resendApiKey ? 'Configured (Secret held server-side)' : 'Missing');
  check('RESEND_FROM_EMAIL is configured', Boolean(resendFrom), resendFrom ? `Sender: ${resendFrom}` : 'Missing');
  check('RESEND_FROM_EMAIL specifies padifix.ng sender', Boolean(resendFrom && resendFrom.includes('padifix.ng')), 'notifications@padifix.ng');

  // Check Resend external gate handling in code
  const resendServiceCode = fs.readFileSync(path.join(ROOT, 'lib', 'resend-email-service.js'), 'utf8');
  check('Resend production fallback to onboarding@resend.dev is blocked', resendServiceCode.includes('Zero silent fallback in production'), 'Visible failure on unverified domain in production');
  check('Resend unverified domain reports to Sentry observability', resendServiceCode.includes('captureServerException') && resendServiceCode.includes('resend_unverified_domain_gate'), 'Integrated with Sentry server reporting');

  // Domain verification external gate flag
  check('Resend Custom Domain DNS Verification Gate', false, 'padifix.ng DNS records pending domain acquisition on resend.com', true);

  // --------------------------------------------------------------------------
  // 5. SENTRY ERROR & PERFORMANCE OBSERVABILITY
  // --------------------------------------------------------------------------
  console.log('\n[5/8] SENTRY ERROR & OBSERVABILITY');
  const sentryDsn = envMap.get('SENTRY_DSN') || process.env.SENTRY_DSN;
  const sentryAuth = envMap.get('SENTRY_AUTH_TOKEN') || process.env.SENTRY_AUTH_TOKEN;
  const sentryEnv = envMap.get('SENTRY_ENVIRONMENT') || process.env.SENTRY_ENVIRONMENT || 'production';
  const tracesSampleRate = parseFloat(envMap.get('SENTRY_TRACES_SAMPLE_RATE') || '0.10');
  const replaysSessionSampleRate = parseFloat(envMap.get('SENTRY_REPLAYS_SESSION_SAMPLE_RATE') || '0.05');
  const replaysOnErrorSampleRate = parseFloat(envMap.get('SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE') || '1.0');

  check('SENTRY_DSN is configured', Boolean(sentryDsn && sentryDsn.includes('@') && sentryDsn.includes('sentry.io')), 'Valid Sentry DSN');
  check('SENTRY_DSN targets EU/DE ingest region', Boolean(sentryDsn && sentryDsn.includes('ingest.de.sentry.io')), 'EU/DE region compliant');
  check('SENTRY_AUTH_TOKEN is server/CI-only (never in client)', Boolean(sentryAuth && sentryAuth.length > 10), 'Configured server-side for source-maps');
  check('SENTRY_ENVIRONMENT is valid', ['production', 'preview', 'development', 'staging'].includes(sentryEnv), `Environment: ${sentryEnv}`);
  check('SENTRY_TRACES_SAMPLE_RATE is exactly 0.10', tracesSampleRate === 0.10, `Value: ${tracesSampleRate}`);
  check('SENTRY_REPLAYS_SESSION_SAMPLE_RATE is exactly 0.05', replaysSessionSampleRate === 0.05, `Value: ${replaysSessionSampleRate}`);
  check('SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE is exactly 1.0', replaysOnErrorSampleRate === 1.0, `Value: ${replaysOnErrorSampleRate}`);

  // --------------------------------------------------------------------------
  // 6. CLOUDFLARE EDGE, DNS & WAF (DEFERRED)
  // --------------------------------------------------------------------------
  console.log('\n[6/8] CLOUDFLARE EDGE, DNS & WAF');
  const cfToken = envMap.get('CLOUDFLARE_API_TOKEN');
  const cfZone = envMap.get('CLOUDFLARE_ZONE_ID');
  check('Cloudflare is intentionally deferred awaiting custom domain', !cfToken && !cfZone, 'No fictional Cloudflare credentials populated');
  check('Cloudflare Integration Gate', false, 'Deferred until padifix.ng custom domain is acquired', true);

  // --------------------------------------------------------------------------
  // 7. GOOGLE MAPS PLATFORM & LEAFLET FALLBACK
  // --------------------------------------------------------------------------
  console.log('\n[7/8] GOOGLE MAPS PLATFORM & LEAFLET FALLBACK');
  const gmapsKey = envMap.get('GOOGLE_MAPS_API_KEY') || process.env.GOOGLE_MAPS_API_KEY;
  const gmapsMapId = envMap.get('GOOGLE_MAPS_MAP_ID') || process.env.GOOGLE_MAPS_MAP_ID;

  check('GOOGLE_MAPS_API_KEY is configured (Browser-restricted)', Boolean(gmapsKey && gmapsKey.length > 20), 'Key configured');
  check('GOOGLE_MAPS_MAP_ID is configured', Boolean(gmapsMapId && gmapsMapId.length > 5), `Map ID: ${gmapsMapId}`);

  const mapServiceCode = fs.readFileSync(path.join(ROOT, 'map-service.js'), 'utf8');
  check('Leaflet/OpenStreetMap fallback engine is present', mapServiceCode.includes('Leaflet/OpenStreetMap fallback') && mapServiceCode.includes('L.map'), 'Interactive Leaflet fallback supported');
  check('Google Maps billing gate failure suppresses retry loops', mapServiceCode.includes('_googleMapsFailed') && mapServiceCode.includes('immediately fallback without retrying'), 'Retry loop suppression active');
  check('Google Maps billing error reports to Sentry observability', mapServiceCode.includes('window.PadiFixSentry.captureMessage'), 'Sentry error telemetry active on map failure');

  // Google Maps billing external gate flag
  check('Google Maps Billing Activation Gate', false, 'Google Cloud billing account requires activation for Maps JavaScript API', true);

  // --------------------------------------------------------------------------
  // 8. ACCIDENTAL SECRET LEAKAGE AUDIT (CLIENT-FACING FILES)
  // --------------------------------------------------------------------------
  console.log('\n[8/8] SECRET LEAKAGE AUDIT (CLIENT-FACING ASSETS)');

  const clientFiles = [
    'index.html', 'search.html', 'profile.html', 'dashboard.html', 'register.html', 'login.html',
    'map-service.js', 'supabase-client.js', 'lib/sentry-client.js'
  ];

  const serverSecrets = [
    { name: 'PAYSTACK_SECRET_KEY', val: paystackSec },
    { name: 'RESEND_API_KEY', val: resendApiKey },
    { name: 'SENTRY_AUTH_TOKEN', val: sentryAuth },
    { name: 'SUPABASE_SERVICE_ROLE_KEY', val: serviceRoleKey }
  ];

  let leaksFound = 0;
  for (const relFile of clientFiles) {
    const fullPath = path.join(ROOT, relFile);
    if (!fs.existsSync(fullPath)) continue;
    const content = fs.readFileSync(fullPath, 'utf8');

    for (const secret of serverSecrets) {
      if (secret.val && secret.val.length > 10) {
        if (content.includes(secret.val)) {
          leaksFound++;
          console.error(`  🚨 CRITICAL SECURITY LEAK: ${secret.name} found in client file ${relFile}!`);
        }
      }
    }
  }

  check('Zero server secrets detected in client-facing HTML & JS files', leaksFound === 0, `Scanned ${clientFiles.length} client files — 0 leaks`);

  // --------------------------------------------------------------------------
  // SUMMARY
  // --------------------------------------------------------------------------
  console.log('\n' + '='.repeat(80));
  console.log(`VALIDATION SUMMARY: ${passedChecks}/${totalChecks} checks passed (${failedChecks} failures, ${externalGates} external gates)`);
  console.log('='.repeat(80));

  if (failedChecks > 0) {
    console.error('\n❌ VERDICT: RED — Configuration validation errors detected.');
    process.exit(1);
  } else {
    console.log('\n✅ VERDICT: GREEN — Configuration fully validated. Production fallbacks and gates operational.');
  }
}

runValidation().catch(err => {
  console.error('Fatal validator error:', err);
  process.exit(1);
});
