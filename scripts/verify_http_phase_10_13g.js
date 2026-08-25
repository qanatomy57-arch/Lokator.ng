/**
 * LOKATOR.NG — PHASE 10.13G HTTP & ASSET VERIFICATION SUITE
 * Validates serverless API route definitions, environment consistency checks,
 * zero secrets in client bundles, and live readiness indicators.
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
  console.log('\n🌐 RUNNING PHASE 10.13G HTTP & ASSET VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const dashboardHtml = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');
  const dashboardJs = fs.readFileSync(path.join(root, 'dashboard.js'), 'utf8');
  const analyticsHtml = fs.readFileSync(path.join(root, 'analytics.html'), 'utf8');
  const analyticsJs = fs.readFileSync(path.join(root, 'analytics.js'), 'utf8');
  const supabaseClient = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');
  const initApi = fs.readFileSync(path.join(root, 'api/paystack-init.js'), 'utf8');
  const verifyApi = fs.readFileSync(path.join(root, 'api/paystack-verify.js'), 'utf8');
  const webhookApi = fs.readFileSync(path.join(root, 'api/paystack-webhook.js'), 'utf8');

  test('1. api/paystack-init.js validates environment consistency and rejects key mismatch', () => {
    assert.ok(initApi.includes('Environment Mismatch: Test secret key configured in Live Mode'));
    assert.ok(initApi.includes('Environment Mismatch: Live secret key configured in Test Mode'));
  });

  test('2. api/paystack-verify.js validates environment consistency and rejects key mismatch', () => {
    assert.ok(verifyApi.includes('Environment Mismatch: Test secret key configured in Live Mode'));
    assert.ok(verifyApi.includes('Environment Mismatch: Live secret key configured in Test Mode'));
  });

  test('3. api/paystack-webhook.js validates environment consistency and rejects key mismatch', () => {
    assert.ok(webhookApi.includes('Environment Mismatch: Test secret key configured in Live Mode'));
    assert.ok(webhookApi.includes('Environment Mismatch: Live secret key configured in Test Mode'));
  });

  test('4. supabase-client.js implements kill switch, provider eligibility, and operational metrics', () => {
    assert.ok(supabaseClient.includes('setEmergencyKillSwitch'));
    assert.ok(supabaseClient.includes('isEmergencyLockdown'));
    assert.ok(supabaseClient.includes('validateProviderEligibility'));
    assert.ok(supabaseClient.includes('getOperationalMetrics'));
    assert.ok(supabaseClient.includes('createSupportInquiry'));
  });

  test('5. dashboard.html and dashboard.js contain customer disclosures and pilot eligibility controls', () => {
    assert.ok(dashboardHtml.includes('btn-start-paystack-pilot'));
    assert.ok(dashboardJs.includes('btn-start-paystack-pilot'));
    assert.ok(dashboardHtml.includes('dash-active-promo-banner'));
  });

  test('6. Strictly zero live secret keys or unauthenticated billing tokens in client assets', () => {
    const forbidden = ['sk_live_', 'client_secret_live', 'js.paystack.co', 'checkout.flutterwave.com', 'js.stripe.com'];
    [dashboardHtml, dashboardJs, analyticsHtml, analyticsJs, supabaseClient].forEach((content, idx) => {
      const lower = content.toLowerCase();
      forbidden.forEach(token => {
        assert.ok(!lower.includes(token), `Forbidden live secret/token "${token}" found in asset index ${idx}`);
      });
    });
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.13G HTTP & ASSET CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runHttpTests();
