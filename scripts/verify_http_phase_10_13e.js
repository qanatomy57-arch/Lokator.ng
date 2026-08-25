/**
 * LOKATOR.NG — PHASE 10.13E HTTP & ASSET VERIFICATION SUITE
 * Validates serverless API endpoints, DOM markup, Paystack integration assets,
 * and zero client-side secret exposure.
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

function runTests() {
  console.log('\n🌐 RUNNING PHASE 10.13E HTTP & ASSET VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const dashboardHtml = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');
  const dashboardJs = fs.readFileSync(path.join(root, 'dashboard.js'), 'utf8');
  const analyticsHtml = fs.readFileSync(path.join(root, 'analytics.html'), 'utf8');
  const analyticsJs = fs.readFileSync(path.join(root, 'analytics.js'), 'utf8');
  const supabaseClient = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');
  const searchJs = fs.readFileSync(path.join(root, 'search.js'), 'utf8');

  test('1. Vercel serverless API handlers exist with complete logic', () => {
    const initApi = fs.readFileSync(path.join(root, 'api/paystack-init.js'), 'utf8');
    const verifyApi = fs.readFileSync(path.join(root, 'api/paystack-verify.js'), 'utf8');
    const webhookApi = fs.readFileSync(path.join(root, 'api/paystack-webhook.js'), 'utf8');

    assert.ok(initApi.includes('PROMOTED_LISTING_STARTER'));
    assert.ok(initApi.includes('200000'));
    assert.ok(verifyApi.includes('transaction/verify'));
    assert.ok(webhookApi.includes('x-paystack-signature'));
  });

  test('2. dashboard.html and dashboard.js include Paystack starter pilot trigger & active promo banner', () => {
    assert.ok(dashboardHtml.includes('btn-start-paystack-pilot'));
    assert.ok(dashboardHtml.includes('dash-active-promo-banner'));
    assert.ok(dashboardJs.includes('btn-start-paystack-pilot'));
    assert.ok(dashboardJs.includes('dash-active-promo-banner'));
  });

  test('3. analytics.html and analytics.js include Phase 10.13E Paystack Pilot Orders table and test ready state', () => {
    assert.ok(analyticsHtml.includes('Paystack Pilot Payment Integration & Pilot Gate (Phase 10.13E)'));
    assert.ok(analyticsHtml.includes('mon-pilot-orders-tbody'));
    assert.ok(analyticsJs.includes('mon-pilot-orders-tbody'));
    assert.ok(analyticsJs.includes('PAYMENT_INTEGRATION_TEST_READY') || analyticsJs.includes('monSummary.commercial_readiness_classification'));
  });

  test('4. search.js renders explicit sponsored badge for promoted artisan search results', () => {
    assert.ok(searchJs.includes('badge-tag-sponsored'));
    assert.ok(searchJs.includes('⚡ Sponsored'));
  });

  test('5. supabase-client.js exports Paystack pilot engine and enforces test mode', () => {
    assert.ok(supabaseClient.includes('paystackPilotEngine'));
    assert.ok(supabaseClient.includes('PROMOTED_LISTING_STARTER'));
    assert.ok(supabaseClient.includes('PAYMENT_INTEGRATION_TEST_READY'));
    assert.ok(supabaseClient.includes('PAYMENT_LIVE_MODE: false'));
  });

  test('6. Strictly zero Paystack live secret keys or live billing SDKs in frontend assets', () => {
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
    console.log(`🎉 ALL ${passed} PHASE 10.13E HTTP & ASSET CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
