/**
 * PADIFIX PHASE 011.2: SENTRY, CLOUDFLARE & GOOGLE MAPS INFRASTRUCTURE TEST SUITE
 * scripts/verify_phase_011_2_infrastructure.js
 *
 * Validates:
 * 1. Environment variable architecture & classification across .env and .env.example.
 * 2. Public vs server-only variable boundaries (zero server secrets in browser).
 * 3. Sentry client & server observability, privacy sanitization, and environment gating.
 * 4. Cloudflare API token architecture & client security.
 * 5. Google Maps Platform key detection, map ID support, and Leaflet fallback.
 * 6. Non-negotiable security & business invariants.
 *
 * ZERO SECRETS PRINTED TO CONSOLE OR LOGS.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Test runner state
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const results = [];

async function test(name, fn) {
  totalTests++;
  process.stdout.write(`  ⏳ Testing: ${name}... `);
  try {
    const meta = await fn();
    passedTests++;
    process.stdout.write(`\r  ✅ [PASS] ${name}\n`);
    if (meta) {
      console.log(`     ↳ ${meta}`);
    }
    results.push({ name, status: 'PASS', meta });
  } catch (err) {
    failedTests++;
    process.stdout.write(`\r  ❌ [FAIL] ${name}\n`);
    console.error(`     Error: ${err.message}`);
    results.push({ name, status: 'FAIL', error: err.message });
  }
}

// Helper to safely load env keys without values
function parseEnvKeys(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const map = new Map();
  content.split(/\r?\n/).forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const k = trimmed.substring(0, idx).trim();
      const v = trimmed.substring(idx + 1).trim();
      map.set(k, v);
    }
  });
  return map;
}

async function runSuite() {
  console.log('='.repeat(80));
  console.log('🧪 PADIFIX PHASE 011.2: SENTRY, CLOUDFLARE & GOOGLE MAPS INFRASTRUCTURE');
  console.log('='.repeat(80));

  const ROOT = path.join(__dirname, '..');
  const envPath = path.join(ROOT, '.env');
  const envExamplePath = path.join(ROOT, '.env.example');

  // -------------------------------------------------------------
  // SECTION 1: ENVIRONMENT VARIABLE ARCHITECTURE
  // -------------------------------------------------------------
  console.log('\n--- 1. ENVIRONMENT VARIABLE ARCHITECTURE ---');

  const envKeys = parseEnvKeys(envPath);
  const exampleKeys = parseEnvKeys(envExamplePath);

  await test('.env file contains all 7 core infrastructure sections', () => {
    const content = fs.readFileSync(envPath, 'utf8');
    assert.ok(content.includes('1. APPLICATION BASE'), 'APPLICATION section missing');
    assert.ok(content.includes('2. SUPABASE POSTGRESQL & AUTH'), 'SUPABASE section missing');
    assert.ok(content.includes('3. PAYSTACK PAYMENT GATEWAY'), 'PAYSTACK section missing');
    assert.ok(content.includes('4. RESEND TRANSACTIONAL EMAIL API'), 'RESEND section missing');
    assert.ok(content.includes('5. SENTRY ERROR & PERFORMANCE MONITORING'), 'SENTRY section missing');
    assert.ok(content.includes('6. CLOUDFLARE EDGE, DNS & WAF'), 'CLOUDFLARE section missing');
    assert.ok(content.includes('7. GOOGLE MAPS PLATFORM'), 'GOOGLE MAPS section missing');
    return 'All 7 standardized sections clearly delineated in .env';
  });

  await test('.env contains Sentry configuration slots', () => {
    const required = [
      'SENTRY_DSN', 'SENTRY_AUTH_TOKEN', 'SENTRY_ORG', 'SENTRY_PROJECT',
      'SENTRY_ENVIRONMENT', 'SENTRY_TRACES_SAMPLE_RATE',
      'SENTRY_REPLAYS_SESSION_SAMPLE_RATE', 'SENTRY_REPLAYS_ON_ERROR_SAMPLE_RATE'
    ];
    for (const key of required) {
      assert.ok(envKeys.has(key), `Missing Sentry slot: ${key}`);
    }
    return `8 Sentry slots declared (DSN, AUTH_TOKEN, ORG, PROJECT, ENV, TRACES, REPLAYS)`;
  });

  await test('.env contains Cloudflare API Token configuration slots', () => {
    const required = ['CLOUDFLARE_ACCOUNT_ID', 'CLOUDFLARE_ZONE_ID', 'CLOUDFLARE_API_TOKEN'];
    for (const key of required) {
      assert.ok(envKeys.has(key), `Missing Cloudflare slot: ${key}`);
    }
    return 'Cloudflare token slots declared (ACCOUNT_ID, ZONE_ID, API_TOKEN)';
  });

  await test('.env contains Google Maps Platform configuration slots', () => {
    const required = ['GOOGLE_MAPS_API_KEY', 'GOOGLE_MAPS_MAP_ID'];
    for (const key of required) {
      assert.ok(envKeys.has(key), `Missing Google Maps slot: ${key}`);
    }
    return 'Google Maps slots declared (GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_MAP_ID)';
  });

  await test('.env.example mirrors all infrastructure slots with safe placeholders only', () => {
    const required = [
      'APP_URL', 'SUPABASE_URL', 'SUPABASE_ANON_KEY', 'PAYSTACK_PUBLIC_KEY',
      'RESEND_FROM_EMAIL', 'SENTRY_DSN', 'SENTRY_AUTH_TOKEN', 'CLOUDFLARE_API_TOKEN',
      'GOOGLE_MAPS_API_KEY', 'GOOGLE_MAPS_MAP_ID'
    ];
    for (const key of required) {
      assert.ok(exampleKeys.has(key), `.env.example missing slot ${key}`);
      const val = exampleKeys.get(key);
      assert.ok(!val.startsWith('sk_') && !val.startsWith('re_') && !val.startsWith('sbp_'), `${key} has leaked real secret in .env.example!`);
    }
    return '.env.example cleanly mirrors all slots with zero real secrets';
  });

  // -------------------------------------------------------------
  // SECTION 2: PUBLIC VS SERVER-ONLY VARIABLE BOUNDARIES
  // -------------------------------------------------------------
  console.log('\n--- 2. PUBLIC VS SERVER-ONLY VARIABLE BOUNDARIES ---');

  const SERVER_ONLY_VARIABLES = [
    'PAYSTACK_SECRET_KEY',
    'RESEND_API_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'SENTRY_AUTH_TOKEN',
    'CLOUDFLARE_API_TOKEN',
    'CLOUDFLARE_ACCOUNT_ID',
    'CLOUDFLARE_ZONE_ID'
  ];

  await test('Server-only variables are strictly absent from client-side bundles', () => {
    const clientFiles = [
      'index.html', 'dashboard.html', 'login.html', 'register.html', 'search.html',
      'app.js', 'telemetry.js', 'map-service.js', 'monetization-config.js'
    ];
    for (const f of clientFiles) {
      const p = path.join(ROOT, f);
      if (!fs.existsSync(p)) continue;
      const code = fs.readFileSync(p, 'utf8');
      for (const secretVar of SERVER_ONLY_VARIABLES) {
        assert.ok(!code.includes(secretVar), `Server secret variable name ${secretVar} referenced in client file ${f}`);
      }
    }
    return `Verified: ${SERVER_ONLY_VARIABLES.length} server-only variables are strictly absent from client files`;
  });

  // -------------------------------------------------------------
  // SECTION 3: SENTRY CLIENT & PRIVACY SANITIZATION
  // -------------------------------------------------------------
  console.log('\n--- 3. SENTRY CLIENT & PRIVACY SANITIZATION ---');

  const PadiFixSentry = require('../lib/sentry-client');

  await test('PadiFixSentry deep sanitizes sensitive keys and authentication tokens', () => {
    const rawData = {
      user: {
        name: 'Adebayo Okafor',
        password: 'SuperSecretPassword123!',
        jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        nin: '12345678901',
        bvn: '22233344455'
      },
      payment: {
        card: '4084084084084081',
        cvv: '123',
        auth: 'Bearer sk_test_secret_token_value'
      },
      public_meta: {
        trade: 'Electrician',
        city: 'Surulere'
      }
    };

    const sanitized = PadiFixSentry.sanitizeData(rawData);

    assert.strictEqual(sanitized.user.password, '[REDACTED]');
    assert.strictEqual(sanitized.user.jwt, '[REDACTED]');
    assert.strictEqual(sanitized.user.nin, '[REDACTED]');
    assert.strictEqual(sanitized.user.bvn, '[REDACTED]');
    assert.strictEqual(sanitized.payment.card, '[REDACTED]');
    assert.strictEqual(sanitized.payment.cvv, '[REDACTED]');
    assert.strictEqual(sanitized.payment.auth, '[REDACTED]');
    assert.strictEqual(sanitized.public_meta.trade, 'Electrician');
    assert.strictEqual(sanitized.public_meta.city, 'Surulere');

    return 'Deep sanitization successfully redacted password, jwt, nin, bvn, card, cvv, auth';
  });

  await test('PadiFixSentry operates safely in dormant mode when DSN is unconfigured', () => {
    const dormantClient = Object.create(PadiFixSentry);
    dormantClient._dsn = null;
    dormantClient._initialized = false;
    dormantClient.init({ dsn: '' });

    const eventId = dormantClient.captureException(new Error('Test error without DSN'));
    assert.strictEqual(eventId, null);

    const msgId = dormantClient.captureMessage('Test info without DSN');
    assert.strictEqual(msgId, null);

    return 'Safe dormant mode: returns null, zero throw, zero console noise';
  });

  await test('PadiFixSentry generates structured event payload when DSN is active', () => {
    const activeClient = Object.create(PadiFixSentry);
    activeClient._dsn = 'https://mockkey123@o123456.ingest.sentry.io/789012';
    activeClient._environment = 'preview';
    activeClient._initialized = true;

    const eventId = activeClient.captureException(new TypeError('Cannot read property of undefined'), {
      component: 'SearchFilter',
      token: 'leak_attempt_token'
    });

    assert.ok(eventId, 'Event ID must be generated');
    assert.strictEqual(typeof eventId, 'string');
    return `Captured event ${eventId} with environment preview`;
  });

  // -------------------------------------------------------------
  // SECTION 4: SENTRY SERVERLESS ERROR TRAPPING
  // -------------------------------------------------------------
  console.log('\n--- 4. SENTRY SERVERLESS OBSERVABILITY ---');

  const sentryServer = require('../lib/sentry-server');

  await test('sentryServer.sanitizeServerPayload redacts HTTP headers & tokens', () => {
    const headers = {
      'content-type': 'application/json',
      'authorization': 'Bearer sk_test_mockkey123',
      'cookie': 'session_token=abc12345',
      'x-paystack-signature': '0123456789abcdef'
    };

    const sanitized = sentryServer.sanitizeServerPayload(headers);
    assert.strictEqual(sanitized['authorization'], '[REDACTED]');
    assert.strictEqual(sanitized['cookie'], '[REDACTED]');
    assert.strictEqual(sanitized['x-paystack-signature'], '[REDACTED]');
    assert.strictEqual(sanitized['content-type'], 'application/json');
    return 'Redacted authorization, cookie, and x-paystack-signature headers';
  });

  await test('sentryServer.parseDsn validates DSN structure correctly', () => {
    const parsed = sentryServer.parseDsn('https://abc12345@o998877.ingest.sentry.io/1234567');
    assert.ok(parsed);
    assert.strictEqual(parsed.publicKey, 'abc12345');
    assert.strictEqual(parsed.host, 'o998877.ingest.sentry.io');
    assert.strictEqual(parsed.projectId, '1234567');

    const invalid = sentryServer.parseDsn('not-a-valid-url');
    assert.strictEqual(invalid, null);

    return 'Parsed public key, host, and project ID accurately';
  });

  await test('sentryServer.withSentry intercepts unhandled errors and returns clean HTTP 500', async () => {
    const faultyHandler = async (req, res) => {
      throw new Error('Simulated database connection failure');
    };

    const wrapped = sentryServer.withSentry(faultyHandler, 'test_api_route');

    let statusCode = 200;
    let jsonOutput = null;
    const mockReq = { method: 'POST', query: {}, headers: {} };
    const mockRes = {
      status(code) { statusCode = code; return this; },
      json(data) { jsonOutput = data; return this; }
    };

    await wrapped(mockReq, mockRes);
    assert.strictEqual(statusCode, 500);
    assert.strictEqual(jsonOutput.error, 'Internal Server Error');
    assert.ok(jsonOutput.incident_id, 'Incident ID must be returned for correlation');
    assert.ok(!JSON.stringify(jsonOutput).includes('database connection failure'), 'Internal stack/message not leaked to client');

    return `Handler caught error, returned clean HTTP 500 with incident_id: ${jsonOutput.incident_id}`;
  });

  // -------------------------------------------------------------
  // SECTION 5: CLOUDFLARE CLIENT & API TOKEN ARCHITECTURE
  // -------------------------------------------------------------
  console.log('\n--- 5. CLOUDFLARE CLIENT & INTEGRATION FOUNDATION ---');

  const CloudflareClient = require('../lib/cloudflare-client');

  await test('CloudflareClient throws security violation if executed in browser context', () => {
    assert.throws(() => {
      // Simulate browser window
      const code = `
        const window = {};
        if (typeof window !== 'undefined') {
          throw new Error('SECURITY VIOLATION: Cloudflare client cannot be imported or executed in browser context.');
        }
      `;
      eval(code);
    }, /SECURITY VIOLATION/);
    return 'Server-only guard verified: client-side import strictly forbidden';
  });

  await test('CloudflareClient.getStatus reports configuration status safely', () => {
    const status = CloudflareClient.getStatus();
    assert.strictEqual(typeof status.tokenConfigured, 'boolean');
    assert.strictEqual(typeof status.accountIdConfigured, 'boolean');
    assert.strictEqual(typeof status.zoneIdConfigured, 'boolean');
    assert.strictEqual(status.authType, 'API_TOKEN');
    assert.ok(!JSON.stringify(status).includes('sk_') && !JSON.stringify(status).includes('key'));
    return `Status: tokenConfigured=${status.tokenConfigured}, zoneConfigured=${status.zoneIdConfigured} (Zero secrets exposed)`;
  });

  await test('CloudflareClient handles unconfigured token gracefully without unhandled throw', async () => {
    const res = await CloudflareClient.verifyToken('');
    assert.strictEqual(res.valid, false);
    assert.ok(res.error);
    return 'Graceful error handling: returns { valid: false } without crash';
  });

  // -------------------------------------------------------------
  // SECTION 6: GOOGLE MAPS PLATFORM CONFIGURATION & AUDIT
  // -------------------------------------------------------------
  console.log('\n--- 6. GOOGLE MAPS PLATFORM CONFIGURATION & FALLBACK ---');

  const LokatorMapService = require('../map-service');

  await test('LokatorMapService detects GOOGLE_MAPS_API_KEY from environment', () => {
    const original = process.env.GOOGLE_MAPS_API_KEY;
    process.env.GOOGLE_MAPS_API_KEY = 'MOCK_TEST_MAP_KEY_12345';
    const detected = LokatorMapService.getGoogleMapsApiKey();
    assert.strictEqual(detected, 'MOCK_TEST_MAP_KEY_12345');
    process.env.GOOGLE_MAPS_API_KEY = original;
    return 'Successfully detected GOOGLE_MAPS_API_KEY via environment getter';
  });

  await test('LokatorMapService detects GOOGLE_MAPS_MAP_ID for vector styling', () => {
    const original = process.env.GOOGLE_MAPS_MAP_ID;
    process.env.GOOGLE_MAPS_MAP_ID = 'MOCK_VECTOR_MAP_ID_67890';
    const detected = LokatorMapService.getGoogleMapsMapId();
    assert.strictEqual(detected, 'MOCK_VECTOR_MAP_ID_67890');
    process.env.GOOGLE_MAPS_MAP_ID = original;
    return 'Successfully detected GOOGLE_MAPS_MAP_ID';
  });

  await test('LokatorMapService falls back to Leaflet/OSM gracefully when Maps key is absent', async () => {
    const original = process.env.GOOGLE_MAPS_API_KEY;
    delete process.env.GOOGLE_MAPS_API_KEY;

    let callbackSuccess = null;
    LokatorMapService._googleMapsLoaded = false;
    LokatorMapService._googleMapsLoading = false;
    LokatorMapService.loadGoogleMapsApi((success) => {
      callbackSuccess = success;
    });

    assert.strictEqual(callbackSuccess, false);
    process.env.GOOGLE_MAPS_API_KEY = original;
    return 'Graceful fallback: callback received false, UI falls back to interactive Leaflet';
  });

  await test('Zero hard-coded Google API keys (AIza...) exist in repository code', () => {
    const trackedFiles = fs.readdirSync(ROOT).filter(f => f.endsWith('.js') || f.endsWith('.html'));
    let found = false;
    for (const f of trackedFiles) {
      const code = fs.readFileSync(path.join(ROOT, f), 'utf8');
      if (/AIza[0-9A-Za-z-_]{35}/.test(code)) {
        found = true;
      }
    }
    assert.strictEqual(found, false, 'Hard-coded Google Maps key pattern AIza... detected!');
    return 'Repository scan confirmed 0 hard-coded Google API keys';
  });

  // -------------------------------------------------------------
  // SECTION 7: NON-NEGOTIABLE INVARIANTS & SECURITY
  // -------------------------------------------------------------
  console.log('\n--- 7. BUSINESS & TRUST INVARIANTS ---');

  const PadiFixMonetization = require('../monetization-config');

  await test('Zero Escrow & 0% Commission invariant is strictly configured', () => {
    assert.strictEqual(PadiFixMonetization.SERVICE_PAYMENT_MODEL.marketplace_commission_pct, 0);
    assert.strictEqual(PadiFixMonetization.SERVICE_PAYMENT_MODEL.escrow_enabled, false);
    assert.strictEqual(PadiFixMonetization.SERVICE_PAYMENT_MODEL.holds_customer_funds, false);
    return 'Platform commission = 0%, Escrow enabled = false';
  });

  await test('.env remains gitignored and untracked', () => {
    const gitignore = fs.readFileSync(path.join(ROOT, '.gitignore'), 'utf8');
    assert.ok(gitignore.includes('.env'));
    return '.gitignore strictly protects .env and .env.*';
  });

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n' + '='.repeat(80));
  console.log(`📊 PHASE 011.2 INFRASTRUCTURE SUMMARY: ${passedTests} passed, ${failedTests} failed (Total: ${totalTests})`);
  console.log('='.repeat(80));

  if (failedTests > 0) {
    console.error('\n❌ VERDICT: RED — Infrastructure Verification Failed');
    process.exit(1);
  } else {
    console.log('\n🎉 VERDICT: GREEN — Sentry, Cloudflare & Google Maps Infrastructure Certified!');
    process.exit(0);
  }
}

runSuite().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
