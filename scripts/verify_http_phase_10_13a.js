/**
 * LOKATOR.NG — PHASE 10.13A HTTP & ASSET VERIFICATION SUITE
 * Scope: Monetization assets, dashboard, analytics, zero payment endpoints, zero secret exposure
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failedTests++;
  }
}

console.log('\n🌐 RUNNING PHASE 10.13A HTTP & ASSET VERIFICATION SUITE...\n');

// Group 1: Analytics Monetization Architecture Section Completeness
test('1. analytics.html contains complete Phase 10.13 monetization architecture section', () => {
  const html = fs.readFileSync(path.join(__dirname, '../analytics.html'), 'utf8');
  assert.ok(html.includes('id="section-monetization-architecture"'), 'Must contain section-monetization-architecture');
  assert.ok(html.includes('id="mon-gate-status"'), 'Must contain mon-gate-status');
  assert.ok(html.includes('id="mon-product-matrix-tbody"'), 'Must contain mon-product-matrix-tbody');
  assert.ok(html.includes('id="mon-research-tbody"'), 'Must contain mon-research-tbody');
  assert.ok(html.includes('id="mon-delta-fit"'), 'Must contain mon-delta-fit');
  assert.ok(html.includes('id="mon-edo-fit"'), 'Must contain mon-edo-fit');
  assert.ok(html.includes('ARCHITECTURE_READY'), 'Must show ARCHITECTURE_READY badge');
  assert.ok(html.includes('0%_COMMISSION_LOCKED'), 'Must show 0%_COMMISSION_LOCKED badge');
});

// Group 2: Analytics Controller Hydration Logic
test('2. analytics.js contains Phase 10.13 monetization rendering logic', () => {
  const js = fs.readFileSync(path.join(__dirname, '../analytics.js'), 'utf8');
  assert.ok(js.includes('getMonetizationSummary'), 'Must invoke getMonetizationSummary');
  assert.ok(js.includes('mon-product-matrix-tbody'), 'Must render product matrix');
  assert.ok(js.includes('mon-research-tbody'), 'Must render research waitlist');
  assert.ok(js.includes('mon-gate-status'), 'Must render gate status');
  assert.ok(js.includes('mon-delta-fit'), 'Must render Delta fit');
  assert.ok(js.includes('mon-edo-fit'), 'Must render Edo fit');
});

// Group 3: Dashboard Monetization Research UI
test('3. dashboard.html contains monetization research section with trust separation', () => {
  const html = fs.readFileSync(path.join(__dirname, '../dashboard.html'), 'utf8');
  assert.ok(html.includes('id="dash-monetization-research-section"'), 'Must contain dash-monetization-research-section');
  assert.ok(html.includes('btn-mon-interest'), 'Must contain waitlist buttons');
  assert.ok(html.includes('TRUST_VERIFICATION'), 'Must reference TRUST_VERIFICATION product');
  assert.ok(html.includes('PROMOTED_DISCOVERY'), 'Must reference PROMOTED_DISCOVERY product');
  assert.ok(html.includes('QUALIFIED_LEAD_ACCESS'), 'Must reference QUALIFIED_LEAD_ACCESS product');
  assert.ok(html.includes('does NOT guarantee approval'), 'Must contain verification disclaimer');
  assert.ok(html.includes('0% commission'), 'Must guarantee 0% commission');
  assert.ok(html.includes('100% Free Forever'), 'Must guarantee free forever');
  assert.ok(html.includes('RESEARCH_CONCEPT'), 'Must label as RESEARCH_CONCEPT');
});

// Group 4: Dashboard Controller Logic
test('4. dashboard.js contains renderMonetizationResearch and waitlist handler', () => {
  const js = fs.readFileSync(path.join(__dirname, '../dashboard.js'), 'utf8');
  assert.ok(js.includes('renderMonetizationResearch'), 'Must define renderMonetizationResearch');
  assert.ok(js.includes('joinProductWaitlist'), 'Must invoke joinProductWaitlist');
  assert.ok(js.includes('btn-mon-interest'), 'Must bind to waitlist buttons');
  assert.ok(js.includes('No payment required'), 'Must show "No payment required" confirmation');
});

// Group 5: Supabase Client Monetization Module
test('5. supabase-client.js exports complete monetization architecture', () => {
  const dbCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  assert.ok(dbCode.includes('LokatorDB.monetization = {'), 'Must export LokatorDB.monetization');
  assert.ok(dbCode.includes('PaymentProviderAdapter'), 'Must define PaymentProviderAdapter');
  assert.ok(dbCode.includes('CANDIDATE_MONETIZATION_PRODUCTS'), 'Must define product candidates');
  assert.ok(dbCode.includes('CANDIDATE_PLANS'), 'Must define plan candidates');
  assert.ok(dbCode.includes('FREE_DEFAULT_ENTITLEMENTS'), 'Must define free entitlements');
  assert.ok(dbCode.includes('getProviderEntitlements'), 'Must define entitlement evaluator');
  assert.ok(dbCode.includes('hasEntitlement'), 'Must define hasEntitlement');
  assert.ok(dbCode.includes('ARCHITECTURALLY_READY_BUT_NOT_VALIDATED'), 'Must classify readiness gate');
  assert.ok(dbCode.includes('computeMonetizationSummary'), 'Must define summary computation');
});

// Group 6: Zero Payment Gateway Code — Comprehensive Audit
test('6. Strictly zero payment gateway SDKs, credentials, or active billing code', () => {
  const filesToAudit = [
    'supabase-client.js', 'analytics.js', 'analytics.html',
    'dashboard.js', 'dashboard.html', 'search.js', 'search.html',
    'profile.js', 'profile.html', 'register.html', 'register.js',
    'join.html', 'login.html', 'index.html', 'app.js',
    'telemetry.js', 'categories.js', 'sw.js'
  ];

  const forbidden = [
    'paystack', 'flutterwave', 'stripe', 'razorpay',
    'checkout.session', 'chargeCard', 'createSubscription',
    'createPaymentIntent', 'sk_live_', 'pk_live_', 'sk_test_', 'pk_test_',
    'PAYSTACK_SECRET', 'FLW_SECRET', 'STRIPE_SECRET',
    'credit card', 'debit card', 'card number', 'cvv'
  ];

  filesToAudit.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      forbidden.forEach(token => {
        assert.ok(!content.includes(token.toLowerCase()), `CRITICAL: Forbidden token "${token}" found in ${file}`);
      });
    }
  });
});

// Group 7: No Public Payment Endpoint Exposure
test('7. No payment API endpoints or webhook URLs exposed in HTML/JS', () => {
  const filesToCheck = [
    'index.html', 'search.html', 'profile.html', 'register.html',
    'dashboard.html', 'analytics.html', 'join.html', 'login.html'
  ];

  const paymentEndpoints = [
    '/api/pay', '/api/charge', '/api/billing', '/api/subscription',
    '/webhook/payment', '/webhook/billing',
    'api.paystack.co', 'api.flutterwave.com', 'api.stripe.com'
  ];

  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      paymentEndpoints.forEach(endpoint => {
        assert.ok(!content.includes(endpoint.toLowerCase()),
          `Payment endpoint "${endpoint}" found in ${file}`);
      });
    }
  });
});

// Group 8: Core HTML Script Linkage Integrity
test('8. All core HTML pages exist with proper script linkages', () => {
  const required = ['index.html', 'join.html', 'search.html', 'register.html',
    'profile.html', 'dashboard.html', 'analytics.html', 'login.html'];
  required.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    assert.ok(fs.existsSync(filePath), `${file} must exist`);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('telemetry.js'), `${file} must include telemetry.js`);
  });
});

console.log('================================================================================');
if (failedTests === 0) {
  console.log(`🎉 ALL ${passedTests} PHASE 10.13A HTTP & ASSET CHECKS PASSED (100%)!`);
} else {
  console.log(`❌ ${passedTests} PASSED, ${failedTests} FAILED`);
}
console.log('================================================================================\n');

if (failedTests > 0) process.exit(1);
