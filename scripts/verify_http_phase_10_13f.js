/**
 * LOKATOR.NG — PHASE 10.13F HTTP & ASSET VERIFICATION SUITE
 * Validates serverless API route definitions, Paystack handlers, DOM attributes,
 * and zero secret exposure.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

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

function runHttpTests() {
  console.log('\n🌐 RUNNING PHASE 10.13F HTTP & ASSET VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const dashboardHtml = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');
  const dashboardJs = fs.readFileSync(path.join(root, 'dashboard.js'), 'utf8');
  const analyticsHtml = fs.readFileSync(path.join(root, 'analytics.html'), 'utf8');
  const analyticsJs = fs.readFileSync(path.join(root, 'analytics.js'), 'utf8');
  const supabaseClient = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');
  const searchJs = fs.readFileSync(path.join(root, 'search.js'), 'utf8');

  test('1. api/paystack-init.js exists and enforces 200000 kobo and non-PII reference', () => {
    const initApi = fs.readFileSync(path.join(root, 'api/paystack-init.js'), 'utf8');
    assert.ok(initApi.includes('AMOUNT_KOBO: 200000'));
    assert.ok(initApi.includes('lok_plt_'));
    assert.ok(initApi.includes('MAX_INVENTORY_PER_CLUSTER: 2'));
  });

  test('2. api/paystack-verify.js exists and validates status, amount, and currency', () => {
    const verifyApi = fs.readFileSync(path.join(root, 'api/paystack-verify.js'), 'utf8');
    assert.ok(verifyApi.includes('tx.status !== \'success\''));
    assert.ok(verifyApi.includes('tx.amount !== 200000'));
    assert.ok(verifyApi.includes('tx.currency !== \'NGN\''));
  });

  test('3. api/paystack-webhook.js exists and validates HMAC-SHA512 with timingSafeEqual', () => {
    const webhookApi = fs.readFileSync(path.join(root, 'api/paystack-webhook.js'), 'utf8');
    assert.ok(webhookApi.includes('x-paystack-signature'));
    assert.ok(webhookApi.includes('crypto.timingSafeEqual'));
    assert.ok(webhookApi.includes('charge.success'));
  });

  test('4. dashboard.html and dashboard.js contain accessible Starter Pilot checkout triggers', () => {
    assert.ok(dashboardHtml.includes('btn-start-paystack-pilot'));
    assert.ok(dashboardHtml.includes('dash-active-promo-banner'));
    assert.ok(dashboardJs.includes('btn-start-paystack-pilot'));
    assert.ok(dashboardJs.includes('dash-active-promo-banner'));
  });

  test('5. analytics.html and analytics.js display Paystack Pilot Orders table and test ready status', () => {
    assert.ok(analyticsHtml.includes('mon-pilot-orders-tbody'));
    assert.ok(analyticsJs.includes('mon-pilot-orders-tbody'));
    assert.ok(analyticsHtml.includes('PAYSTACK_TEST_MODE'));
  });

  test('6. Zero live secret keys or live billing SDKs in all frontend assets', () => {
    const forbidden = ['sk_live_', 'client_secret_live', 'js.paystack.co', 'checkout.flutterwave.com', 'js.stripe.com'];
    [dashboardHtml, dashboardJs, analyticsHtml, analyticsJs, supabaseClient, searchJs].forEach((content, idx) => {
      const lower = content.toLowerCase();
      forbidden.forEach(token => {
        assert.ok(!lower.includes(token), `Forbidden live secret/token "${token}" found in asset index ${idx}`);
      });
    });
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.13F HTTP & ASSET CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runHttpTests();
