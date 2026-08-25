/**
 * LOKATOR.NG — PHASE 10.13B HTTP & ASSET VERIFICATION SUITE
 * Scope: Provider Willingness-to-Pay UI, Price Hypothesis Selects, Intent Buttons, Zero Payment SDKs
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

console.log('\n🌐 RUNNING PHASE 10.13B HTTP & ASSET VERIFICATION SUITE...\n');

// Group 1: Dashboard Monetization Research UI Markup
test('1. dashboard.html contains complete Phase 10.13B willingness-to-pay interactive elements', () => {
  const html = fs.readFileSync(path.join(__dirname, '../dashboard.html'), 'utf8');
  assert.ok(html.includes('id="dash-monetization-research-section"'), 'Must contain dash-monetization-research-section');
  assert.ok(html.includes('mon-price-select'), 'Must contain mon-price-select dropdowns');
  assert.ok(html.includes('btn-mon-interest'), 'Must contain btn-mon-interest buttons');
  assert.ok(html.includes('btn-mon-intent'), 'Must contain btn-mon-intent buttons');
  assert.ok(html.includes('btn-mon-waitlist'), 'Must contain btn-mon-waitlist buttons');
  assert.ok(html.includes('Research price — not currently available for purchase'), 'Must contain research price disclaimers');
  assert.ok(html.includes('Paying for verification audit review does NOT guarantee approval'), 'Must contain verification disclaimer');
  assert.ok(html.includes('0% commission'), 'Must guarantee 0% commission');
  assert.ok(html.includes('100% Free Forever'), 'Must guarantee free forever');
});

// Group 2: Dashboard JS Handler Implementation
test('2. dashboard.js contains exposure, price selection, interest, intent, and waitlist handlers', () => {
  const js = fs.readFileSync(path.join(__dirname, '../dashboard.js'), 'utf8');
  assert.ok(js.includes('renderMonetizationResearch'), 'Must define renderMonetizationResearch');
  assert.ok(js.includes('recordProductExposure'), 'Must call recordProductExposure');
  assert.ok(js.includes('recordPriceSelection'), 'Must call recordPriceSelection');
  assert.ok(js.includes('recordProductInterest'), 'Must call recordProductInterest');
  assert.ok(js.includes('recordPurchaseIntent'), 'Must call recordPurchaseIntent');
  assert.ok(js.includes('joinProductWaitlist'), 'Must call joinProductWaitlist');
  assert.ok(js.includes('No payment is charged') || js.includes('No payment required'), 'Must confirm no payment required');
});

// Group 3: Analytics Monetization Architecture Markup
test('3. analytics.html contains Phase 10.13B willingness-to-pay tables & KPI cards', () => {
  const html = fs.readFileSync(path.join(__dirname, '../analytics.html'), 'utf8');
  assert.ok(html.includes('id="section-monetization-architecture"'), 'Must contain section-monetization-architecture');
  assert.ok(html.includes('id="mon-commercial-status"'), 'Must contain mon-commercial-status');
  assert.ok(html.includes('id="kpi-mon-exposed"'), 'Must contain kpi-mon-exposed');
  assert.ok(html.includes('id="kpi-mon-interest"'), 'Must contain kpi-mon-interest');
  assert.ok(html.includes('id="kpi-mon-intent"'), 'Must contain kpi-mon-intent');
  assert.ok(html.includes('id="kpi-mon-waitlist"'), 'Must contain kpi-mon-waitlist');
  assert.ok(html.includes('id="mon-product-matrix-tbody"'), 'Must contain mon-product-matrix-tbody');
  assert.ok(html.includes('id="mon-price-sensitivity-tbody"'), 'Must contain mon-price-sensitivity-tbody');
  assert.ok(html.includes('id="mon-segmentation-tbody"'), 'Must contain mon-segmentation-tbody');
  assert.ok(html.includes('id="mon-delta-fit"'), 'Must contain mon-delta-fit');
  assert.ok(html.includes('id="mon-edo-fit"'), 'Must contain mon-edo-fit');
});

// Group 4: Analytics JS Controller Logic
test('4. analytics.js contains Phase 10.13B table hydration and KPI rendering logic', () => {
  const js = fs.readFileSync(path.join(__dirname, '../analytics.js'), 'utf8');
  assert.ok(js.includes('getMonetizationSummary'), 'Must call getMonetizationSummary');
  assert.ok(js.includes('mon-price-sensitivity-tbody'), 'Must populate price sensitivity table');
  assert.ok(js.includes('mon-segmentation-tbody'), 'Must populate segmentation table');
  assert.ok(js.includes('kpi-mon-exposed'), 'Must populate exposed KPI');
  assert.ok(js.includes('kpi-mon-intent'), 'Must populate intent KPI');
});

// Group 5: Supabase Client Research Engine Export
test('5. supabase-client.js exports complete Phase 10.13B research engine and summary computations', () => {
  const dbCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  assert.ok(dbCode.includes('recordProductExposure'), 'Must define recordProductExposure');
  assert.ok(dbCode.includes('recordPriceSelection'), 'Must define recordPriceSelection');
  assert.ok(dbCode.includes('recordPurchaseIntent'), 'Must define recordPurchaseIntent');
  assert.ok(dbCode.includes('price_hypotheses'), 'Must define price_hypotheses');
  assert.ok(dbCode.includes('EARLY_MONETIZATION_SIGNAL'), 'Must include EARLY_MONETIZATION_SIGNAL');
  assert.ok(dbCode.includes('provider_segmentation'), 'Must compute provider_segmentation');
  assert.ok(dbCode.includes('price_sensitivity'), 'Must compute price_sensitivity');
});

// Group 6: Zero Payment SDKs and Credentials Audit
test('6. Strictly zero payment gateway SDKs or live billing code in production files', () => {
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
    'PAYSTACK_SECRET', 'FLW_SECRET', 'STRIPE_SECRET'
  ];

  filesToAudit.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      forbidden.forEach(token => {
        assert.ok(!content.includes(token.toLowerCase()), `Forbidden token "${token}" found in ${file}`);
      });
    }
  });
});

console.log('================================================================================');
if (failedTests === 0) {
  console.log(`🎉 ALL ${passedTests} PHASE 10.13B HTTP & ASSET CHECKS PASSED (100%)!`);
} else {
  console.log(`❌ ${passedTests} PASSED, ${failedTests} FAILED`);
}
console.log('================================================================================\n');

if (failedTests > 0) process.exit(1);
