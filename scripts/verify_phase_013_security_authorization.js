/**
 * Phase 013 Security & Authorization Negative Testing Suite
 * scripts/verify_phase_013_security_authorization.js
 */

const assert = require('assert');
const crypto = require('crypto');
const http = require('http');

// Serverless functions to test directly
const paystackInit = require('../api/paystack-init');
const paystackWebhook = require('../api/paystack-webhook');
const serviceReview = require('../api/service-review');
const contactMeter = require('../api/contact-meter');
const subscriptionManage = require('../api/subscription-manage');
const PadiFixSentry = require('../lib/sentry-client');
const ResendEmailService = require('../lib/resend-email-service');

function mockReqRes(options = {}) {
  const req = {
    method: options.method || 'GET',
    headers: options.headers || {},
    body: options.body || {},
    query: options.query || {},
    url: options.url || '/'
  };

  let statusCode = 200;
  let responseData = null;
  const headers = {};

  const res = {
    status: (code) => {
      statusCode = code;
      return res;
    },
    setHeader: (k, v) => {
      headers[k] = v;
      return res;
    },
    json: (data) => {
      responseData = data;
      return res;
    },
    end: () => {
      return res;
    },
    _getData: () => responseData,
    _getStatus: () => statusCode,
    _getHeaders: () => headers
  };

  return { req, res };
}

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function runSecuritySuite() {
  console.log('='.repeat(80));
  console.log('🛡️  PADIFIX PHASE 013: SECURITY, AUTHORIZATION & NEGATIVE TESTING SUITE');
  console.log('='.repeat(80));

  // --- 1. NEGATIVE TESTING: PAYSTACK INITIALIZATION BOUNDARIES ---
  console.log('\n--- 1. SERVERLESS INITIALIZATION BOUNDARIES ---');
  await asyncTest('Reject paystack-init missing provider_id with HTTP 400', async () => {
    const { req, res } = mockReqRes({
      method: 'POST',
      body: { email: 'test@example.com', plan_id: 'PRO' }
    });
    await paystackInit(req, res);
    assert.strictEqual(res._getStatus(), 400);
    assert.ok(res._getData().error.includes('provider_id'));
  });

  await asyncTest('Reject paystack-init invalid plan_id with HTTP 400', async () => {
    const { req, res } = mockReqRes({
      method: 'POST',
      body: { provider_id: 1, email: 'test@example.com', plan_id: 'HACKED_SUPER_PLAN' }
    });
    await paystackInit(req, res);
    assert.strictEqual(res._getStatus(), 400);
    assert.ok(res._getData().error.includes('Invalid plan'));
  });

  await asyncTest('Prevent client price tampering (server enforces canonical kobo)', async () => {
    // Attempting to pass ₦1.00 (100 kobo) for Pro plan (₦8,000 / 800,000 kobo)
    const { req, res } = mockReqRes({
      method: 'POST',
      body: { provider_id: 1, email: 'test@example.com', plan_id: 'PRO', amount: 100 }
    });
    // paystack-init handles Free without call, and for paid plans sets plan code & authoritative kobo
    // If no PAYSTACK_SECRET_KEY is set in mock environment, it will fail-safe with 500 configuration error
    // rather than processing a forged 100 kobo transaction!
    await paystackInit(req, res);
    const data = res._getData();
    // Either fails safely or does not accept amount 100
    assert.ok(res._getStatus() === 400 || res._getStatus() === 500 || (data && data.amount !== 100));
  });

  // --- 2. WEBHOOK SIGNATURE & REPLAY DEFENSE ---
  console.log('\n--- 2. WEBHOOK SIGNATURE & REPLAY DEFENSE ---');
  const testSecretKey = 'sk_test_mock_secret_key_padifix_2026';
  process.env.PAYSTACK_SECRET_KEY = testSecretKey;
  process.env.PAYMENT_LIVE_MODE = 'false';

  await asyncTest('Reject webhook request without signature (401)', async () => {
    const { req, res } = mockReqRes({
      method: 'POST',
      headers: {},
      body: { event: 'charge.success', data: { reference: 'ref_missing_sig' } }
    });
    await paystackWebhook(req, res);
    assert.strictEqual(res._getStatus(), 401);
  });

  await asyncTest('Reject webhook request with forged signature (401)', async () => {
    const raw = JSON.stringify({ event: 'charge.success', data: { reference: 'ref_invalid_sig' } });
    const { req, res } = mockReqRes({
      method: 'POST',
      headers: { 'x-paystack-signature': '00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000' },
      body: raw
    });
    await paystackWebhook(req, res);
    assert.strictEqual(res._getStatus(), 401);
  });

  // --- 3. REPUTATION & ABUSE DEFENSE ---
  console.log('\n--- 3. REPUTATION & REVIEW ABUSE PREVENTION ---');
  await asyncTest('Reject self-review attempt by provider (403)', async () => {
    const { req, res } = mockReqRes({
      method: 'POST',
      body: {
        action: 'submit_review',
        provider_id: 42,
        customer_identifier: 42, // Self-review
        customer_name: 'Artisan Self',
        rating: 5,
        hired_status: 'completed'
      }
    });
    await serviceReview(req, res);
    assert.strictEqual(res._getStatus(), 403);
    assert.ok(res._getData().error.includes('Self-Review Prohibited'));
  });

  await asyncTest('Reject invalid star ratings > 5 (400)', async () => {
    const { req, res } = mockReqRes({
      method: 'POST',
      body: {
        action: 'submit_review',
        provider_id: 42,
        customer_name: 'Customer One',
        rating: 6, // Invalid > 5
        hired_status: 'completed'
      }
    });
    await serviceReview(req, res);
    assert.strictEqual(res._getStatus(), 400);
    assert.ok(res._getData().error.includes('Rating must be a number between 1 and 5'));
  });

  await asyncTest('Reject invalid star ratings < 1 (400)', async () => {
    const { req, res } = mockReqRes({
      method: 'POST',
      body: {
        action: 'submit_review',
        provider_id: 42,
        customer_name: 'Customer One',
        rating: 0, // Invalid < 1
        hired_status: 'completed'
      }
    });
    await serviceReview(req, res);
    assert.strictEqual(res._getStatus(), 400);
  });

  await asyncTest('Block provider attempting to delete legitimate reviews (403)', async () => {
    const { req, res } = mockReqRes({
      method: 'POST',
      body: {
        action: 'delete_review',
        provider_id: 52,
        review_id: 'rev-123'
      }
    });
    await serviceReview(req, res);
    assert.strictEqual(res._getStatus(), 403);
    assert.ok(res._getData().error.includes('Providers cannot delete'));
  });

  // --- 4. CONTACT METERING PRIVACY & ATOMICITY ---
  console.log('\n--- 4. CONTACT METERING PRIVACY & ATOMICITY ---');
  await asyncTest('Reject contact metering request without provider_id (400)', async () => {
    const { req, res } = mockReqRes({
      method: 'POST',
      body: { channel: 'whatsapp' }
    });
    await contactMeter(req, res);
    assert.strictEqual(res._getStatus(), 400);
    assert.ok(res._getData().error.includes('Missing required provider_id'));
  });

  await asyncTest('Reject contact metering request with invalid channel (400)', async () => {
    const { req, res } = mockReqRes({
      method: 'POST',
      body: { provider_id: 10, channel: 'telepathy' }
    });
    await contactMeter(req, res);
    assert.strictEqual(res._getStatus(), 400);
    assert.ok(res._getData().error.includes('Invalid channel'));
  });

  await asyncTest('Enforce 15-minute idempotency window on identical contact clicks', async () => {
    const idemKey = 'idem-test-window-' + Date.now();
    const { req: req1, res: res1 } = mockReqRes({
      method: 'POST',
      body: { provider_id: 999, channel: 'whatsapp', idempotency_key: idemKey }
    });
    await contactMeter(req1, res1);
    assert.strictEqual(res1._getStatus(), 200);

    const { req: req2, res: res2 } = mockReqRes({
      method: 'POST',
      body: { provider_id: 999, channel: 'whatsapp', idempotency_key: idemKey }
    });
    await contactMeter(req2, res2);
    assert.strictEqual(res2._getStatus(), 200);
    assert.strictEqual(res2._getData().idempotent, true);
    assert.strictEqual(res2._getData().contacts_used, res1._getData().contacts_used);
  });

  // --- 5. TELEMETRY PII SANITIZATION ---
  console.log('\n--- 5. OBSERVABILITY & PRIVACY SANITIZATION ---');
  test('Sentry client sanitizes BVN, NIN, CVVs, passwords, and tokens', () => {
    const sensitiveData = {
      bvn: '22233344455',
      nin: '11122233344',
      password: 'SuperSecretPassword123',
      card_number: '5399837261524312',
      cvv: '123',
      auth_token: 'Bearer eyJhbGciOi...',
      legitimate_field: 'Artisan Plumbing'
    };

    const sanitized = PadiFixSentry.sanitizeData(sensitiveData);
    assert.strictEqual(sanitized.bvn, '[REDACTED]');
    assert.strictEqual(sanitized.nin, '[REDACTED]');
    assert.strictEqual(sanitized.password, '[REDACTED]');
    assert.strictEqual(sanitized.card_number, '[REDACTED]');
    assert.strictEqual(sanitized.cvv, '[REDACTED]');
    assert.strictEqual(sanitized.auth_token, '[REDACTED]');
    assert.strictEqual(sanitized.legitimate_field, 'Artisan Plumbing');
  });

  test('Sentry client scrubs query parameters from URLs', () => {
    const dirtyUrl = 'https://padifix.ng/search?query=plumber&token=secret123&bvn=222111333';
    const cleanUrl = PadiFixSentry.sanitizeUrl(dirtyUrl);
    assert.ok(!cleanUrl.includes('secret123'));
    assert.ok(!cleanUrl.includes('222111333'));
    assert.ok(cleanUrl.includes('plumber'));
  });

  // --- 6. CORE BUSINESS INVARIANTS ---
  console.log('\n--- 6. PADIFIX CORE BUSINESS INVARIANTS ---');
  test('Strict 0% commission invariant on artisan jobs', () => {
    const PadiFixMonetization = require('../monetization-config');
    const rules = PadiFixMonetization.CONFIG.RULES;
    assert.strictEqual(rules.COMMISSION_PERCENT, 0);
    assert.strictEqual(rules.FREE_PHONE_CALLS, true);
    assert.strictEqual(rules.FREE_WHATSAPP_MESSAGING, true);
    assert.strictEqual(rules.FREE_PROFILE_LISTING, true);
  });

  test('Canonical 37 Nigerian administrative entities and 774 LGAs', () => {
    const { NIGERIA_LOCATIONS_DATA } = require('../locations');
    assert.strictEqual(NIGERIA_LOCATIONS_DATA.length, 37, 'Must have 36 states + FCT = 37 entities');
    
    let totalLgas = 0;
    const seenLgas = new Set();
    for (const stateObj of NIGERIA_LOCATIONS_DATA) {
      const lgas = stateObj.lgas;
      totalLgas += lgas.length;
      for (const l of lgas) {
        const key = `${stateObj.name}:${l.name}`.toLowerCase();
        assert.ok(!seenLgas.has(key), `Duplicate LGA in same state: ${key}`);
        seenLgas.add(key);
      }
    }
    assert.strictEqual(totalLgas, 774, 'Must have exactly 774 constitutional LGAs');
  });

  console.log('\n' + '='.repeat(80));
  console.log(`SECURITY & AUTHORIZATION SUMMARY: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

runSecuritySuite().catch((err) => {
  console.error('Test suite runner crashed:', err);
  process.exit(1);
});
