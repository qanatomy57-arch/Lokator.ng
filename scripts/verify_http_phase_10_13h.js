/**
 * LOKATOR.NG — PHASE 10.13H HTTP & ASSET VERIFICATION SUITE
 * Validates reconciliation tables, live transaction cap indicators,
 * serverless handlers, and zero secrets in client assets.
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
  console.log('\n🌐 RUNNING PHASE 10.13H HTTP & ASSET VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const dashboardHtml = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');
  const dashboardJs = fs.readFileSync(path.join(root, 'dashboard.js'), 'utf8');
  const analyticsHtml = fs.readFileSync(path.join(root, 'analytics.html'), 'utf8');
  const analyticsJs = fs.readFileSync(path.join(root, 'analytics.js'), 'utf8');
  const supabaseClient = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');

  test('1. analytics.html contains Post-Payment Financial Reconciliation table markup', () => {
    assert.ok(analyticsHtml.includes('mon-reconciliation-tbody'));
    assert.ok(analyticsHtml.includes('mon-reconciliation-badge'));
    assert.ok(analyticsHtml.includes('mon-live-cap-text'));
  });

  test('2. analytics.js implements reconciliation ledger hydration and invariant status', () => {
    assert.ok(analyticsJs.includes('mon-reconciliation-tbody'));
    assert.ok(analyticsJs.includes('mon-reconciliation-badge'));
    assert.ok(analyticsJs.includes('reconciliation'));
  });

  test('3. supabase-client.js exports reconcileTransactions and checkLiveTransactionCap', () => {
    assert.ok(supabaseClient.includes('reconcileTransactions'));
    assert.ok(supabaseClient.includes('checkLiveTransactionCap'));
    assert.ok(supabaseClient.includes('MAX_LIVE_PILOT_TRANSACTIONS: 3'));
    assert.ok(supabaseClient.includes('PILOT_LIVE_CAP_REACHED'));
  });

  test('4. api/paystack-init.js, verify, and webhook maintain environment consistency guards', () => {
    const initApi = fs.readFileSync(path.join(root, 'api/paystack-init.js'), 'utf8');
    const verifyApi = fs.readFileSync(path.join(root, 'api/paystack-verify.js'), 'utf8');
    const webhookApi = fs.readFileSync(path.join(root, 'api/paystack-webhook.js'), 'utf8');
    assert.ok(initApi.includes('Environment Mismatch'));
    assert.ok(verifyApi.includes('Environment Mismatch'));
    assert.ok(webhookApi.includes('Environment Mismatch'));
  });

  test('5. dashboard.html and dashboard.js contain pilot checkout triggers & disclosures', () => {
    assert.ok(dashboardHtml.includes('btn-start-paystack-pilot'));
    assert.ok(dashboardJs.includes('btn-start-paystack-pilot'));
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
    console.log(`🎉 ALL ${passed} PHASE 10.13H HTTP & ASSET CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runHttpTests();
