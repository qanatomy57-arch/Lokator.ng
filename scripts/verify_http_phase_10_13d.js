/**
 * LOKATOR.NG — PHASE 10.13D HTTP & ASSET VERIFICATION SUITE
 * Validates DOM markup, finalist evaluation tables, pilot readiness indicators, and zero-payment SDK security.
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
  console.log('\n🌐 RUNNING PHASE 10.13D HTTP & ASSET VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const dashboardHtml = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');
  const dashboardJs = fs.readFileSync(path.join(root, 'dashboard.js'), 'utf8');
  const analyticsHtml = fs.readFileSync(path.join(root, 'analytics.html'), 'utf8');
  const analyticsJs = fs.readFileSync(path.join(root, 'analytics.js'), 'utf8');
  const supabaseClient = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');

  test('1. dashboard.html marks Promoted Category Placement as First Pilot Candidate', () => {
    assert.ok(dashboardHtml.includes('First Pilot Candidate'), 'Must contain First Pilot Candidate badge');
    assert.ok(dashboardHtml.includes('PROMOTED_DISCOVERY'), 'Must contain PROMOTED_DISCOVERY');
  });

  test('2. analytics.html contains Phase 10.13D Finalist Evaluation & Pilot Readiness Panels', () => {
    assert.ok(analyticsHtml.includes('Monetization Pilot Readiness & First-Paid-Product Gate (Phase 10.13D)'));
    assert.ok(analyticsHtml.includes('mon-finalist-tbody'));
    assert.ok(analyticsHtml.includes('SELECTED: PROMOTED_DISCOVERY_FIRST'));
    assert.ok(analyticsHtml.includes('PAYSTACK_RECOMMENDED'));
  });

  test('3. analytics.js hydrates finalist evaluation scorecard and pilot readiness states', () => {
    assert.ok(analyticsJs.includes('mon-finalist-tbody'));
    assert.ok(analyticsJs.includes('finalist_evaluation'));
    assert.ok(analyticsJs.includes('monSummary.commercial_readiness_classification'));
  });

  test('4. supabase-client.js exports Phase 10.13D pilot decision engine and specification', () => {
    assert.ok(supabaseClient.includes('PROMOTED_DISCOVERY_FIRST'));
    assert.ok(supabaseClient.includes('PILOT_READY_PAYMENT_STILL_DISABLED'));
    assert.ok(supabaseClient.includes('PAYSTACK'));
    assert.ok(supabaseClient.includes('PAYMENT_PROCESSING_ENABLED: false'));
    assert.ok(supabaseClient.includes('LIVE_BILLING_ENABLED: false'));
  });

  test('5. Strictly zero payment gateway SDKs or live billing code in production files', () => {
    const forbiddenTokens = ['js.paystack.co', 'checkout.flutterwave.com', 'js.stripe.com', 'sk_live_', 'pk_live_', 'client_secret_live'];
    [dashboardHtml, dashboardJs, analyticsHtml, analyticsJs, supabaseClient].forEach((content, idx) => {
      const lower = content.toLowerCase();
      forbiddenTokens.forEach(token => {
        assert.ok(!lower.includes(token), `Forbidden live SDK token "${token}" found in asset index ${idx}`);
      });
    });
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.13D HTTP & ASSET CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
