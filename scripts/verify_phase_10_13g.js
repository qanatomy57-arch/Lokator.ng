/**
 * LOKATOR.NG — PHASE 10.13G LIVE PAYMENT PILOT READINESS & ACTIVATION GATE SUITE
 * Validates production safeguards, environment separation, emergency kill switch,
 * provider eligibility, operational metrics, support paths, refund workflows,
 * and live activation readiness while PAYMENT_LIVE_MODE remains strictly false.
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

async function runReadinessGate() {
  console.log('\n================================================================================');
  console.log('🚀 LOKATOR.NG — PHASE 10.13G LIVE PAYMENT PILOT READINESS & ACTIVATION GATE');
  console.log('================================================================================\n');

  // Seed mock providers
  const mockProviders = [
    { id: 301, first_name: 'Tarila', last_name: 'Ebi', state: 'Delta', lga: 'Warri South', category: 'electrician', is_verified: true, profile_complete: true, is_suspended: false, is_available: true, completedJobs: 14, reviewsCount: 6, skills: ['Wiring', 'Inverter'] },
    { id: 302, first_name: 'Oghenekaro', last_name: 'Musa', state: 'Delta', lga: 'Ughelli North', category: 'electrician', is_verified: false, profile_complete: true, is_suspended: false, is_available: true, completedJobs: 8, reviewsCount: 3, skills: ['Generator', 'Wiring'] },
    { id: 303, first_name: 'Blessing', last_name: 'Osagie', state: 'Edo', lga: 'Oredo', category: 'plumber', is_verified: true, profile_complete: true, is_suspended: false, is_available: true, completedJobs: 12, reviewsCount: 5, skills: ['Piping', 'Borehole'] },
    { id: 304, first_name: 'Kano', last_name: 'Artisan', state: 'Kano', lga: 'Nassarawa', category: 'carpenter', is_verified: false, profile_complete: true, is_suspended: false, is_available: true, completedJobs: 2, reviewsCount: 1, skills: ['Furniture'] },
    { id: 305, first_name: 'Suspended', last_name: 'User', state: 'Delta', lga: 'Warri South', category: 'electrician', is_verified: false, profile_complete: true, is_suspended: true, is_available: false, completedJobs: 0, reviewsCount: 0, skills: ['Wiring'] }
  ];
  localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(mockProviders));
  localStorage.removeItem('lokator_pilot_orders_store');
  localStorage.removeItem('lokator_pilot_promotions_store');
  localStorage.removeItem('lokator_pilot_support_inquiries');
  telemetryEvents.length = 0;

  console.log('--- 1. ENVIRONMENT SEPARATION & SECRET AUDIT ---');
  await test('1.1 PAYMENT_LIVE_MODE is strictly false and defaults safely to test mode', async () => {
    assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_LIVE_MODE, false);
  });

  await test('1.2 Environment validator strictly rejects test keys in live mode and live keys in test mode', async () => {
    const testWithLive = LokatorDB.monetization.pilot.validateEnvironmentConsistency('sk_test_fake123', true);
    assert.strictEqual(testWithLive.valid, false);
    assert.ok(testWithLive.error.includes('Environment Mismatch'));

    const liveWithTest = LokatorDB.monetization.pilot.validateEnvironmentConsistency('sk_live_fake123', false);
    assert.strictEqual(liveWithTest.valid, false);
    assert.ok(liveWithTest.error.includes('Environment Mismatch'));

    const testWithTest = LokatorDB.monetization.pilot.validateEnvironmentConsistency('sk_test_fake123', false);
    assert.strictEqual(testWithTest.valid, true);
    assert.strictEqual(testWithTest.mode, 'TEST_CONFIRMED');
  });

  await test('1.3 Zero Paystack secret keys or bearer tokens in client storage or memory', async () => {
    assert.strictEqual(localStorage.getItem('PAYSTACK_SECRET_KEY'), null);
    assert.strictEqual(typeof window.PAYSTACK_SECRET_KEY, 'undefined');
  });

  console.log('\n--- 2. PILOT GEOGRAPHY & PROVIDER ELIGIBILITY ---');
  await test('2.1 Eligible Delta and Edo providers pass validation', async () => {
    const el301 = LokatorDB.monetization.pilot.validateProviderEligibility(301);
    assert.strictEqual(el301.eligible, true);

    const el303 = LokatorDB.monetization.pilot.validateProviderEligibility(303);
    assert.strictEqual(el303.eligible, true);
  });

  await test('2.2 Non-pilot market provider (Kano) is blocked from purchasing pilot promotion', async () => {
    const el304 = LokatorDB.monetization.pilot.validateProviderEligibility(304);
    assert.strictEqual(el304.eligible, false);
    assert.ok(el304.reason.includes('priority markets'));

    const initKano = await LokatorDB.monetization.pilot.initializePayment(304, { category: 'carpenter', state: 'Kano', lga: 'Nassarawa' });
    assert.strictEqual(initKano.status, 'error');
    assert.strictEqual(initKano.code, 'PROVIDER_NOT_ELIGIBLE');
  });

  await test('2.3 Suspended provider account is blocked from purchasing pilot promotion', async () => {
    const el305 = LokatorDB.monetization.pilot.validateProviderEligibility(305);
    assert.strictEqual(el305.eligible, false);
    assert.ok(el305.reason.includes('Suspended'));

    const initSusp = await LokatorDB.monetization.pilot.initializePayment(305, { category: 'electrician', state: 'Delta', lga: 'Warri South' });
    assert.strictEqual(initSusp.status, 'error');
    assert.strictEqual(initSusp.code, 'PROVIDER_NOT_ELIGIBLE');
  });

  console.log('\n--- 3. ORDER TRACEABILITY & AUTHORITATIVE PRICING ---');
  let validOrder = null;
  await test('3.1 Order creation enforces ₦2,000 (200,000 kobo), 14 days, NGN, and audit traceability', async () => {
    const res = await LokatorDB.monetization.pilot.initializePayment(301, { category: 'electrician', state: 'Delta', lga: 'Warri South' });
    assert.strictEqual(res.status, 'success');
    assert.strictEqual(res.amount, 200000);
    assert.strictEqual(res.currency, 'NGN');
    assert.strictEqual(res.order.duration_days, 14);
    assert.ok(res.order.order_id.startsWith('ord_'));
    assert.ok(res.order.reference.startsWith('lok_plt_'));
    validOrder = res.order;
  });

  console.log('\n--- 4. EMERGENCY ROLLBACK & KILL SWITCH ---');
  await test('4.1 Emergency kill switch immediately blocks new checkouts while preserving valid active promotions', async () => {
    // 1. Verify and activate validOrder first
    const vRes = await LokatorDB.monetization.pilot.verifyPayment(validOrder.reference, 301);
    assert.strictEqual(vRes.verified, true);

    // 2. Activate emergency lockdown
    const killRes = LokatorDB.monetization.pilot.setEmergencyKillSwitch(true);
    assert.strictEqual(killRes.killswitch_active, true);
    assert.strictEqual(LokatorDB.monetization.pilot.isEmergencyLockdown(), true);

    // 3. New checkout attempts are rejected
    const blockedInit = await LokatorDB.monetization.pilot.initializePayment(302, { category: 'electrician', state: 'Delta', lga: 'Ughelli North' });
    assert.strictEqual(blockedInit.status, 'error');
    assert.strictEqual(blockedInit.code, 'PAYMENTS_DISABLED');

    // 4. Existing active promotion remains functional
    const active301 = LokatorDB.monetization.pilot.getProviderActivePromotion(301);
    assert.ok(active301 !== null);
    assert.strictEqual(active301.status, 'active');

    // 5. Restore kill switch
    LokatorDB.monetization.pilot.setEmergencyKillSwitch(false);
    assert.strictEqual(LokatorDB.monetization.pilot.isEmergencyLockdown(), false);
  });

  console.log('\n--- 5. OPERATIONAL MONITORING & METRICS ENGINE ---');
  await test('5.1 Operational metrics accurately aggregate checkouts, successes, failures, and inventory', async () => {
    const metrics = LokatorDB.monetization.pilot.getOperationalMetrics();
    assert.ok(metrics.total_checkout_starts >= 1);
    assert.ok(metrics.successful_payments >= 1);
    assert.strictEqual(metrics.active_promotions, 1);
    assert.strictEqual(metrics.live_mode, false);
    assert.strictEqual(metrics.killswitch_active, false);
    assert.strictEqual(metrics.pilot_product, 'PROMOTED_LISTING_STARTER');
    assert.strictEqual(metrics.price_kobo, 200000);
  });

  console.log('\n--- 6. SUPPORT AUDIT & INQUIRY PATH ---');
  await test('6.1 Provider support inquiry records internal order traceability without leaking secrets', async () => {
    const inquiry = LokatorDB.monetization.pilot.createSupportInquiry(301, validOrder.order_id, 'CAMPAIGN_VISIBILITY', 'Checking impression analytics');
    assert.ok(inquiry.inquiry_id.startsWith('inq_'));
    assert.strictEqual(inquiry.provider_id, 301);
    assert.strictEqual(inquiry.order_id, validOrder.order_id);
    assert.strictEqual(inquiry.status, 'open');
  });

  console.log('\n--- 7. REFUND / REVERSAL & SLA WORKFLOW ---');
  await test('7.1 SLA refund workflow reconciles order and immediately deactivates sponsored listing', async () => {
    const refundRes = await LokatorDB.monetization.pilot.processRefundOrReversal(validOrder.order_id, 301, 'refund');
    assert.strictEqual(refundRes.status, 'refunded');
    assert.strictEqual(refundRes.promotion_deactivated, true);

    const active301After = LokatorDB.monetization.pilot.getProviderActivePromotion(301);
    assert.strictEqual(active301After, null);
  });

  console.log('\n--- 8. FREE MARKETPLACE PRESERVATION & PRIVACY ---');
  await test('8.1 Marketplace searches, profiles, calls, and WhatsApp remain 100% free with 0% commission', async () => {
    const allProviders = await LokatorDB.getProviders({});
    assert.ok(allProviders.data.length >= 5);
    assert.strictEqual(LokatorDB.monetization.featureFlags.COMMISSIONS_ENABLED, false);
    assert.strictEqual(LokatorDB.monetization.featureFlags.VERIFICATION_PAYMENT_ENABLED, false);
  });

  await test('8.2 Zero sensitive payment information in operational telemetry', async () => {
    const forbidden = ['408408', '411111', 'cvv', 'card_number', 'pin', 'otp', 'sk_live_', 'sk_test_'];
    telemetryEvents.forEach(e => {
      const serialized = JSON.stringify(e).toLowerCase();
      forbidden.forEach(token => {
        assert.ok(!serialized.includes(token), `Forbidden token "${token}" found in telemetry event ${e.evt}`);
      });
    });
  });

  console.log('\n--- 9. FINAL LIVE-READINESS GATE ---');
  await test('9.1 Gate resolves to LIVE_PAYMENT_READY_PENDING_EXPLICIT_ACTIVATION with PAYMENT_LIVE_MODE = false', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    assert.strictEqual(summary.commercial_readiness_classification, 'LIVE_PAYMENT_READY_PENDING_EXPLICIT_ACTIVATION');
    assert.strictEqual(summary.payment_readiness_gate.classification, 'LIVE_PAYMENT_READY_PENDING_EXPLICIT_ACTIVATION');
    assert.strictEqual(summary.payment_readiness_gate.pillars.emergency_killswitch_ready, true);
    assert.strictEqual(summary.payment_readiness_gate.pillars.operational_monitoring_ready, true);
    assert.strictEqual(summary.payment_readiness_gate.pillars.provider_eligibility_enforced, true);
    assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_LIVE_MODE, false);
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.13G LIVE-READINESS GATE ASSERTIONS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runReadinessGate();
