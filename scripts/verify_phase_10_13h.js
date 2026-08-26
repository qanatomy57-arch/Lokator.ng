/**
 * LOKATOR.NG — PHASE 10.13H CONTROLLED LIVE-MONEY PILOT & POST-PAYMENT RECONCILIATION SUITE
 * Validates the complete financial reconciliation engine, live transaction cap (max 3),
 * payment-to-entitlement invariants, discrepancy state detections, refund reconciliations,
 * and live-payment safety gates.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Mock browser environment for LokatorDB
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

// Mock Telemetry with privacy audit collector
const telemetryEvents = [];
global.LokatorTelemetry = {
  trackEvent: (evt, data) => telemetryEvents.push({ evt, data, time: Date.now() })
};

// Load supabase-client.js
const clientCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
eval(clientCode);

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function runReconciliationSuite() {
  console.log('\n================================================================================');
  console.log('⚖️ LOKATOR.NG — PHASE 10.13H CONTROLLED LIVE PILOT & POST-PAYMENT RECONCILIATION');
  console.log('================================================================================\n');

  // Seed mock providers
  const mockProviders = [
    { id: 401, first_name: 'Tarila', last_name: 'Ebi', state: 'Delta', lga: 'Warri South', category: 'electrician', is_verified: true, profile_complete: true, is_suspended: false, is_available: true, completedJobs: 14, reviewsCount: 6, skills: ['Wiring', 'Inverter'] },
    { id: 402, first_name: 'Oghenekaro', last_name: 'Musa', state: 'Delta', lga: 'Ughelli North', category: 'electrician', is_verified: false, profile_complete: true, is_suspended: false, is_available: true, completedJobs: 8, reviewsCount: 3, skills: ['Generator', 'Wiring'] },
    { id: 403, first_name: 'Blessing', last_name: 'Osagie', state: 'Edo', lga: 'Oredo', category: 'plumber', is_verified: true, profile_complete: true, is_suspended: false, is_available: true, completedJobs: 12, reviewsCount: 5, skills: ['Piping', 'Borehole'] },
    { id: 404, first_name: 'Efe', last_name: 'Clark', state: 'Delta', lga: 'Warri South', category: 'electrician', is_verified: true, profile_complete: true, is_suspended: false, is_available: true, completedJobs: 9, reviewsCount: 4, skills: ['Wiring'] }
  ];
  localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(mockProviders));
  localStorage.removeItem('lokator_pilot_orders_store');
  localStorage.removeItem('lokator_pilot_promotions_store');
  localStorage.removeItem('lokator_pilot_support_inquiries');
  telemetryEvents.length = 0;

  console.log('--- 1. ACTIVATION SAFETY & SAFE DEFAULTS ---');
  await test('1.1 PAYMENT_LIVE_MODE is strictly false by default and requires explicit human gate', async () => {
    assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_LIVE_MODE, false);
    assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_PROCESSING_ENABLED, true);
    assert.strictEqual(LokatorDB.monetization.featureFlags.PROMOTED_PILOT_ENABLED, true);
  });

  await test('1.2 Live secret keys are never committed or stored in client-accessible memory', async () => {
    assert.strictEqual(localStorage.getItem('PAYSTACK_SECRET_KEY'), null);
    assert.strictEqual(typeof window.PAYSTACK_SECRET_KEY, 'undefined');
  });

  console.log('\n--- 2. CONTROLLED FIRST-LIVE TRANSACTION CAP (MAX 3) ---');
  await test('2.1 checkLiveTransactionCap correctly enforces maximum 3 live purchases', async () => {
    const ordersStore = [];
    for (let i = 1; i <= 3; i++) {
      ordersStore.push({
        order_id: `ord_live_test_${i}`,
        provider_id: 400 + i,
        reference: `lok_plt_live_${i}`,
        amount: 200000,
        status: 'active',
        paid_at: new Date().toISOString(),
        live_mode: true
      });
    }
    localStorage.setItem('lokator_pilot_orders_store', JSON.stringify(ordersStore));

    const capStatus = LokatorDB.monetization.pilot.checkLiveTransactionCap();
    assert.strictEqual(capStatus.cap_reached, true);
    assert.strictEqual(capStatus.current_count, 3);
    assert.strictEqual(capStatus.max_cap, 3);
  });

  await test('2.2 Live checkout blocks 4th transaction when live cap is reached in live mode', async () => {
    // Temporarily simulate live mode check
    LokatorDB.monetization.featureFlags.PAYMENT_LIVE_MODE = true;
    const res = await LokatorDB.monetization.pilot.initializePayment(404, { category: 'electrician', state: 'Delta', lga: 'Warri South' });
    assert.strictEqual(res.status, 'error');
    assert.strictEqual(res.code, 'PILOT_LIVE_CAP_REACHED');

    // Reset live mode safely to false
    LokatorDB.monetization.featureFlags.PAYMENT_LIVE_MODE = false;
  });

  console.log('\n--- 3. POST-PAYMENT FINANCIAL RECONCILIATION ENGINE ---');
  // Clean store for controlled reconciliation tests
  localStorage.removeItem('lokator_pilot_orders_store');
  localStorage.removeItem('lokator_pilot_promotions_store');

  let testRef1 = null;
  await test('3.1 Reconciled State: 1:1 match between Paystack and Lokator.NG returns RECONCILED', async () => {
    const initRes = await LokatorDB.monetization.pilot.initializePayment(401, { category: 'electrician', state: 'Delta', lga: 'Warri South' });
    testRef1 = initRes.reference;
    await LokatorDB.monetization.pilot.verifyPayment(testRef1, 401);

    const mockGatewayTx = [
      { reference: testRef1, amount: 200000, currency: 'NGN', status: 'success' }
    ];

    const recResult = LokatorDB.monetization.pilot.reconcileTransactions(mockGatewayTx);
    assert.strictEqual(recResult.reconciliation_status, 'RECONCILED');
    assert.strictEqual(recResult.discrepancies_count, 0);
    assert.strictEqual(recResult.financial_summary.total_local_kobo, 200000);
    assert.strictEqual(recResult.financial_summary.total_local_naira, 2000);
    assert.strictEqual(recResult.financial_summary.active_entitlements, 1);
  });

  await test('3.2 Discrepancy Detection: PAYSTACK_PAID_LOCAL_UNPAID is flagged for investigation', async () => {
    const mockGatewayTx = [
      { reference: testRef1, amount: 200000, currency: 'NGN', status: 'success' },
      { reference: 'lok_plt_missing_local', amount: 200000, currency: 'NGN', status: 'success' }
    ];

    const recResult = LokatorDB.monetization.pilot.reconcileTransactions(mockGatewayTx);
    assert.strictEqual(recResult.reconciliation_status, 'INVESTIGATION_REQUIRED');
    assert.strictEqual(recResult.discrepancies_count, 1);
    const missingItem = recResult.items.find(i => i.reference === 'lok_plt_missing_local');
    assert.ok(missingItem.discrepancy_flags.includes('PAYSTACK_PAID_LOCAL_UNPAID'));
  });

  await test('3.3 Discrepancy Detection: LOCAL_PAID_PAYSTACK_UNVERIFIED is flagged for investigation', async () => {
    const mockGatewayTx = []; // No gateway records provided
    const recResult = LokatorDB.monetization.pilot.reconcileTransactions(mockGatewayTx);
    assert.strictEqual(recResult.reconciliation_status, 'INVESTIGATION_REQUIRED');
    const localItem = recResult.items.find(i => i.reference === testRef1);
    assert.ok(localItem.discrepancy_flags.includes('LOCAL_PAID_PAYSTACK_UNVERIFIED'));
  });

  await test('3.4 Discrepancy Detection: AMOUNT_MISMATCH is flagged for investigation', async () => {
    const mockGatewayTx = [
      { reference: testRef1, amount: 150000, currency: 'NGN', status: 'success' } // ₦1,500 instead of ₦2,000
    ];
    const recResult = LokatorDB.monetization.pilot.reconcileTransactions(mockGatewayTx);
    assert.strictEqual(recResult.reconciliation_status, 'INVESTIGATION_REQUIRED');
    const mismatchItem = recResult.items.find(i => i.reference === testRef1);
    assert.ok(mismatchItem.discrepancy_flags.includes('AMOUNT_MISMATCH'));
  });

  await test('3.5 Critical Invariant: ENTITLEMENT_NO_PAYMENT is flagged as severe discrepancy', async () => {
    // Inject rogue unbilled promotion without matching order
    const promos = JSON.parse(localStorage.getItem('lokator_pilot_promotions_store') || '[]');
    promos.push({
      id: 'promo_rogue_402',
      order_id: 'ord_rogue_fake',
      provider_id: 402,
      reference: 'lok_plt_rogue_ref',
      status: 'active',
      effective_until: new Date(Date.now() + 14 * 86400000).toISOString()
    });
    localStorage.setItem('lokator_pilot_promotions_store', JSON.stringify(promos));

    const recResult = LokatorDB.monetization.pilot.reconcileTransactions([
      { reference: testRef1, amount: 200000, currency: 'NGN', status: 'success' }
    ]);
    assert.strictEqual(recResult.reconciliation_status, 'INVESTIGATION_REQUIRED');
    const rogueItem = recResult.items.find(i => i.reference === 'lok_plt_rogue_ref');
    assert.ok(rogueItem.discrepancy_flags.includes('ENTITLEMENT_NO_PAYMENT'));

    // Remove rogue item
    promos.pop();
    localStorage.setItem('lokator_pilot_promotions_store', JSON.stringify(promos));
  });

  console.log('\n--- 4. REFUND & REVERSAL RECONCILIATION ---');
  await test('4.1 Refund reconciliation deactivates promotion and reconciles cleanly', async () => {
    const orders = LokatorDB.monetization.pilot.getProviderOrders(401);
    assert.ok(orders.length > 0);
    await LokatorDB.monetization.pilot.processRefundOrReversal(orders[0].order_id, 401, 'refund');

    const mockGatewayTx = [
      { reference: testRef1, amount: 200000, currency: 'NGN', status: 'refunded' }
    ];
    const recResult = LokatorDB.monetization.pilot.reconcileTransactions(mockGatewayTx);
    assert.strictEqual(recResult.reconciliation_status, 'RECONCILED');
    assert.strictEqual(recResult.financial_summary.active_entitlements, 0);

    const activePromo = LokatorDB.monetization.pilot.getProviderActivePromotion(401);
    assert.strictEqual(activePromo, null);
  });

  console.log('\n--- 5. FREE MARKETPLACE NATIONWIDE PRESERVATION ---');
  await test('5.1 Nationwide search, profiles, direct calls, and WhatsApp remain 100% free with 0% commission', async () => {
    const allProviders = await LokatorDB.getProviders({});
    assert.ok(allProviders.data.length >= 4);
    assert.strictEqual(LokatorDB.monetization.featureFlags.COMMISSIONS_ENABLED, false);
    assert.strictEqual(LokatorDB.monetization.featureFlags.VERIFICATION_PAYMENT_ENABLED, false);
  });

  console.log('\n--- 6. FINAL PHASE 10.13H GATE CLASSIFICATION ---');
  await test('6.1 Final gate classification resolves to LIVE_PILOT_NOT_ACTIVATED while live mode is off', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    assert.strictEqual(summary.live_pilot_classification, 'LIVE_PILOT_NOT_ACTIVATED');
    assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_LIVE_MODE, false);
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.13H RECONCILIATION & LIVE PILOT ASSERTIONS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runReconciliationSuite();
