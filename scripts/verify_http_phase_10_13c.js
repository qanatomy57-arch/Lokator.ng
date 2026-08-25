/**
 * LOKATOR.NG — PHASE 10.13C HTTP & ASSET VERIFICATION SUITE
 * Validates DOM markup, feedback selectors, 5-stage funnel tables, and zero-payment SDK security.
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
  console.log('\n🌐 RUNNING PHASE 10.13C HTTP & ASSET VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const dashboardHtml = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');
  const dashboardJs = fs.readFileSync(path.join(root, 'dashboard.js'), 'utf8');
  const analyticsHtml = fs.readFileSync(path.join(root, 'analytics.html'), 'utf8');
  const analyticsJs = fs.readFileSync(path.join(root, 'analytics.js'), 'utf8');
  const supabaseClient = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');

  test('1. dashboard.html contains feedback selector and submit button', () => {
    assert.ok(dashboardHtml.includes('dash-mon-feedback-box'), 'Must contain dash-mon-feedback-box');
    assert.ok(dashboardHtml.includes('mon-feedback-reason-select'), 'Must contain feedback select');
    assert.ok(dashboardHtml.includes('btn-submit-mon-feedback'), 'Must contain feedback submit button');
  });

  test('2. dashboard.js handles feedback submission and records structured telemetry', () => {
    assert.ok(dashboardJs.includes('btn-submit-mon-feedback'), 'Must handle btn-submit-mon-feedback');
    assert.ok(dashboardJs.includes('recordResearchFeedback'), 'Must call recordResearchFeedback');
  });

  test('3. analytics.html contains Phase 10.13C 5-stage funnel, preference overlap, and feedback panels', () => {
    assert.ok(analyticsHtml.includes('Monetization Product & Pricing Validation Center (Phase 10.13C)'));
    assert.ok(analyticsHtml.includes('mon-product-matrix-tbody'));
    assert.ok(analyticsHtml.includes('mon-price-sensitivity-tbody'));
    assert.ok(analyticsHtml.includes('mon-preference-container'));
    assert.ok(analyticsHtml.includes('mon-feedback-container'));
    assert.ok(analyticsHtml.includes('kpi-mon-repeat'));
  });

  test('4. analytics.js hydrates 5-stage funnel, preference overlap, and feedback distributions', () => {
    assert.ok(analyticsJs.includes('kpi-mon-repeat'));
    assert.ok(analyticsJs.includes('mon-preference-container') || analyticsJs.includes('mon-pref-total'));
    assert.ok(analyticsJs.includes('mon-feedback-container') || analyticsJs.includes('feedback_analysis'));
    assert.ok(analyticsJs.includes('intent_after_interest_rate'));
  });

  test('5. supabase-client.js exports complete Phase 10.13C research engine and summary computations', () => {
    assert.ok(supabaseClient.includes('recordResearchFeedback'));
    assert.ok(supabaseClient.includes('monetization_product_repeat_interest'));
    assert.ok(supabaseClient.includes('monetization_research_feedback'));
    assert.ok(supabaseClient.includes('PROMISING_BUT_UNVALIDATED'));
    assert.ok(supabaseClient.includes('PAYMENT_PROCESSING_ENABLED: false'));
    assert.ok(supabaseClient.includes('LIVE_BILLING_ENABLED: false'));
  });

  test('6. Strictly zero payment gateway SDKs or live billing code in production files', () => {
    const forbiddenTokens = ['paystack', 'flutterwave', 'stripe', 'sk_live_', 'pk_live_'];
    [dashboardHtml, dashboardJs, analyticsHtml, analyticsJs, supabaseClient].forEach((content, idx) => {
      const lower = content.toLowerCase();
      forbiddenTokens.forEach(token => {
        assert.ok(!lower.includes(token), `Forbidden token "${token}" found in asset index ${idx}`);
      });
    });
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.13C HTTP & ASSET CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
