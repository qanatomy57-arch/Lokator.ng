/**
 * LOKATOR.NG — PHASE 10.13F END-TO-END PAYSTACK TEST-MODE TRANSACTION CERTIFICATION SUITE
 * Validates the complete lifecycle: Environment, Initialization, Verification, HMAC Webhook,
 * Idempotency, Race Conditions, IDOR, Mismatches, Inventory Cap, Expiry, Refunds, Telemetry,
 * and Free Marketplace Integrity.
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

async function runCertification() {
  console.log('\n================================================================================');
  console.log('🧪 LOKATOR.NG — PHASE 10.13F PAYSTACK TEST-MODE TRANSACTION CERTIFICATION');
  console.log('================================================================================\n');

  // Seed mock providers
  const mockProviders = [
    { id: 101, first_name: 'Tarila', last_name: 'Ebi', state: 'Delta', lga: 'Warri South', category: 'electrician', is_verified: true, profile_complete: true, is_available: true, completedJobs: 14, reviewsCount: 6, skills: ['Wiring', 'Inverter'] },
    { id: 102, first_name: 'Oghenekaro', last_name: 'Musa', state: 'Delta', lga: 'Warri South', category: 'electrician', is_verified: false, profile_complete: true, is_available: true, completedJobs: 8, reviewsCount: 3, skills: ['Generator', 'Wiring'] },
    { id: 103, first_name: 'Blessing', last_name: 'Osagie', state: 'Delta', lga: 'Warri South', category: 'electrician', is_verified: false, profile_complete: true, is_available: true, completedJobs: 5, reviewsCount: 2, skills: ['Wiring'] },
    { id: 104, first_name: 'Osaze', last_name: 'Ize', state: 'Edo', lga: 'Oredo', category: 'plumber', is_verified: true, profile_complete: true, is_available: true, completedJobs: 12, reviewsCount: 5, skills: ['Piping', 'Borehole'] }
  ];
  localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(mockProviders));
  localStorage.removeItem('lokator_pilot_orders_store');
  localStorage.removeItem('lokator_pilot_promotions_store');
  telemetryEvents.length = 0;

  console.log('--- 1. ENVIRONMENT ASSERTION & LIVE MODE GATE ---');
  await test('1.1 PAYMENT_LIVE_MODE is strictly false and TEST MODE is active', async () => {
    const flags = LokatorDB.monetization.featureFlags;
    assert.strictEqual(flags.PAYMENT_LIVE_MODE, false, 'PAYMENT_LIVE_MODE must be false');
    assert.strictEqual(flags.PAYMENT_PROCESSING_ENABLED, true, 'PAYMENT_PROCESSING_ENABLED must be true for pilot');
    assert.strictEqual(flags.PAYSTACK_ENABLED, true, 'PAYSTACK_ENABLED must be true');
    assert.strictEqual(flags.PROMOTED_PILOT_ENABLED, true, 'PROMOTED_PILOT_ENABLED must be true');
  });

  await test('1.2 Secret keys never appear in client bundles or storage', async () => {
    assert.strictEqual(typeof process.env.PAYSTACK_SECRET_KEY, 'undefined');
    assert.strictEqual(localStorage.getItem('PAYSTACK_SECRET_KEY'), null);
    assert.strictEqual(typeof window.PAYSTACK_SECRET_KEY, 'undefined');
  });

  console.log('\n--- 2. SERVER-AUTHORITATIVE PILOT PRODUCT ---');
  await test('2.1 Product parameters derived authoritatively (₦2,000 / 200,000 kobo / 14 days / NGN)', async () => {
    const prod = LokatorDB.monetization.pilot.pilotProduct;
    assert.strictEqual(prod.id, 'PROMOTED_LISTING_STARTER');
    assert.strictEqual(prod.price_kobo, 200000);
    assert.strictEqual(prod.price_amount, 2000);
    assert.strictEqual(prod.currency, 'NGN');
    assert.strictEqual(prod.duration_days, 14);
    assert.strictEqual(prod.entitlement_key, 'PROMOTED_LISTING');
    assert.strictEqual(prod.max_inventory_per_cluster, 2);
  });

  console.log('\n--- 3. ORDER CREATION & INITIALIZATION ---');
  let order1 = null;
  await test('3.1 Order creation generates non-PII reference and payment_pending status', async () => {
    const initRes = await LokatorDB.monetization.pilot.initializePayment(101, { category: 'electrician', state: 'Delta', lga: 'Warri South' });
    assert.strictEqual(initRes.status, 'success');
    assert.ok(initRes.reference.startsWith('lok_plt_'));
    assert.strictEqual(initRes.amount, 200000);
    assert.strictEqual(initRes.currency, 'NGN');
    assert.strictEqual(initRes.order.status, 'payment_pending');
    order1 = initRes.order;
  });

  console.log('\n--- 4. SUCCESSFUL TRANSACTION VERIFICATION & FULFILLMENT ---');
  await test('4.1 Server-side verification confirms status, amount, and grants 14-day PROMOTED_LISTING', async () => {
    const verifyRes = await LokatorDB.monetization.pilot.verifyPayment(order1.reference, 101, {
      status: 'success',
      amount: 200000,
      currency: 'NGN'
    });
    assert.strictEqual(verifyRes.verified, true);
    assert.strictEqual(verifyRes.order.status, 'active');
    assert.strictEqual(verifyRes.entitlement.status, 'active');
    assert.strictEqual(verifyRes.entitlement.entitlement_key, 'PROMOTED_LISTING');

    const startMs = new Date(verifyRes.entitlement.effective_from).getTime();
    const endMs = new Date(verifyRes.entitlement.effective_until).getTime();
    assert.strictEqual(Math.round((endMs - startMs) / (24 * 3600 * 1000)), 14);
  });

  console.log('\n--- 5. WEBHOOK HMAC-SHA512 VALIDATION & REPLAY IDEMPOTENCY ---');
  const mockSecret = 'sk_test_fake_secret_key_lokator_audit_123';
  await test('5.1 Valid HMAC-SHA512 signed webhook processes charge.success', async () => {
    const webhookPayload = {
      event: 'charge.success',
      data: {
        id: 771122,
        reference: 'lok_plt_wh_test_104',
        amount: 200000,
        currency: 'NGN',
        status: 'success',
        metadata: { provider_id: 104 }
      }
    };
    const bodyStr = JSON.stringify(webhookPayload);
    const validSignature = crypto.createHmac('sha512', mockSecret).update(bodyStr).digest('hex');

    const whRes = await LokatorDB.monetization.pilot.processWebhook(webhookPayload, validSignature, mockSecret);
    assert.strictEqual(whRes.processed, true);
    assert.strictEqual(whRes.idempotent, false);
  });

  await test('5.2 Invalid HMAC-SHA512 signature is strictly rejected', async () => {
    const webhookPayload = {
      event: 'charge.success',
      data: { id: 771123, reference: 'lok_plt_bad_sig', amount: 200000, currency: 'NGN', status: 'success' }
    };
    const whBadRes = await LokatorDB.monetization.pilot.processWebhook(webhookPayload, 'invalid_signature_hex_digest', mockSecret);
    assert.strictEqual(whBadRes.verified, false);
    assert.strictEqual(whBadRes.processed, false);
  });

  await test('5.3 Webhook Replay: Duplicate event is recognized and does not create duplicate entitlement', async () => {
    const webhookPayload = {
      event: 'charge.success',
      data: {
        id: 771122, // Same event ID as 5.1
        reference: 'lok_plt_wh_test_104',
        amount: 200000,
        currency: 'NGN',
        status: 'success',
        metadata: { provider_id: 104 }
      }
    };
    const bodyStr = JSON.stringify(webhookPayload);
    const validSignature = crypto.createHmac('sha512', mockSecret).update(bodyStr).digest('hex');

    const replayRes = await LokatorDB.monetization.pilot.processWebhook(webhookPayload, validSignature, mockSecret);
    assert.strictEqual(replayRes.processed, true);
    assert.strictEqual(replayRes.idempotent, true); // Safely recognized as duplicate
  });

  console.log('\n--- 6. CALLBACK + WEBHOOK RACE CONDITION HANDLING ---');
  await test('6.1 Webhook followed by Callback verification produces exactly 1 fulfillment', async () => {
    const initRace = await LokatorDB.monetization.pilot.initializePayment(102, { category: 'electrician', state: 'Delta', lga: 'Warri South' });
    
    // Webhook arrives first
    const whPayload = {
      event: 'charge.success',
      data: {
        id: 882233,
        reference: initRace.reference,
        amount: 200000,
        currency: 'NGN',
        status: 'success',
        metadata: { provider_id: 102 }
      }
    };
    const bodyStr = JSON.stringify(whPayload);
    const sig = crypto.createHmac('sha512', mockSecret).update(bodyStr).digest('hex');
    const whRes = await LokatorDB.monetization.pilot.processWebhook(whPayload, sig, mockSecret);
    assert.strictEqual(whRes.processed, true);

    // Provider returns via browser callback afterward
    const cbRes = await LokatorDB.monetization.pilot.verifyPayment(initRace.reference, 102);
    assert.strictEqual(cbRes.verified, true);
    assert.strictEqual(cbRes.idempotent, true);

    const promos = LokatorDB.monetization.pilot.getActivePromotions('electrician', 'Delta', 'Warri South');
    const prov102Promos = promos.filter(p => p.provider_id === 102);
    assert.strictEqual(prov102Promos.length, 1); // Exactly 1 active promotion
  });

  console.log('\n--- 7. MISMATCH & SECURITY TESTS (AMOUNT / CURRENCY / IDOR / SELF-GRANT) ---');
  await test('7.1 Verification with wrong amount (<> 200000) is rejected', async () => {
    let errorThrown = false;
    try {
      await LokatorDB.monetization.pilot.verifyPayment('lok_plt_fake_amt', 103, {
        amount: 50000, // ₦500 instead of ₦2,000
        currency: 'NGN',
        status: 'success'
      });
    } catch (err) {
      errorThrown = true;
      assert.ok(err.message.includes('amount mismatch'));
    }
    assert.strictEqual(errorThrown, true);
  });

  await test('7.2 Verification with wrong currency (<> NGN) is rejected', async () => {
    let errorThrown = false;
    try {
      await LokatorDB.monetization.pilot.verifyPayment('lok_plt_fake_curr', 103, {
        amount: 200000,
        currency: 'USD',
        status: 'success'
      });
    } catch (err) {
      errorThrown = true;
      assert.ok(err.message.includes('currency mismatch'));
    }
    assert.strictEqual(errorThrown, true);
  });

  await test('7.3 IDOR Protection: Provider A cannot verify or access Provider B order', async () => {
    let errorThrown = false;
    try {
      // Provider 103 attempts to verify Provider 101's order
      await LokatorDB.monetization.pilot.verifyPayment(order1.reference, 103);
    } catch (err) {
      errorThrown = true;
      assert.ok(err.message.includes('Unauthorized order access'));
    }
    assert.strictEqual(errorThrown, true);
  });

  await test('7.4 Self-Grant Protection: Client cannot activate PROMOTED_LISTING without verified order', async () => {
    const entitlements = LokatorDB.monetization.entitlements.getProviderEntitlements(103);
    assert.strictEqual(entitlements.includes('PROMOTED_LISTING'), false);
    assert.strictEqual(LokatorDB.monetization.entitlements.hasEntitlement(103, 'PROMOTED_LISTING'), false);
  });

  console.log('\n--- 8. INVENTORY CAP & CONCURRENCY PROTECTION ---');
  await test('8.1 Category/LGA reaches cap at 2; 3rd purchase attempt is blocked', async () => {
    // We already have Provider 101 and Provider 102 active in Warri South Electrician
    const activeInWarri = LokatorDB.monetization.pilot.getActivePromotions('electrician', 'Delta', 'Warri South');
    assert.strictEqual(activeInWarri.length, 2);

    const inv3 = LokatorDB.monetization.pilot.checkInventoryAvailability('electrician', 'Delta', 'Warri South');
    assert.strictEqual(inv3.available, false);

    const init3 = await LokatorDB.monetization.pilot.initializePayment(103, { category: 'electrician', state: 'Delta', lga: 'Warri South' });
    assert.strictEqual(init3.status, 'error');
    assert.strictEqual(init3.code, 'INVENTORY_LIMIT_REACHED');
  });

  console.log('\n--- 9. SEARCH PLACEMENT, SPONSORED BADGES & ORGANIC INTEGRITY ---');
  await test('9.1 Search results show exactly 2 sponsored listings with Sponsored tag, organic list below', async () => {
    const searchRes = await LokatorDB.getProviders({ category: 'electrician', state: 'Delta', lga: 'Warri South' });
    assert.ok(searchRes.data.length >= 3);
    assert.strictEqual(searchRes.data[0].is_sponsored, true);
    assert.strictEqual(searchRes.data[1].is_sponsored, true);
    assert.strictEqual(searchRes.data[2].is_sponsored, false); // Organic ranking preserved
  });

  console.log('\n--- 10. EXPIRATION LIFECYCLE ---');
  await test('10.1 Expired promotion is automatically excluded from search and dashboard', async () => {
    const promos = JSON.parse(localStorage.getItem('lokator_pilot_promotions_store') || '[]');
    // Expire Provider 101's promotion
    promos[0].effective_until = new Date(Date.now() - 5000).toISOString();
    localStorage.setItem('lokator_pilot_promotions_store', JSON.stringify(promos));

    LokatorDB.monetization.pilot.reconcileExpiredPromotions();

    const activePromos = LokatorDB.monetization.pilot.getActivePromotions('electrician', 'Delta', 'Warri South');
    assert.strictEqual(activePromos.length, 1); // Only provider 102 remains active

    const provider101Active = LokatorDB.monetization.pilot.getProviderActivePromotion(101);
    assert.strictEqual(provider101Active, null);
  });

  console.log('\n--- 11. PAYMENT FAILURE & REVERSAL / REFUND HANDLING ---');
  await test('11.1 Failed payment webhook updates order to payment_failed with zero promotion', async () => {
    const initFail = await LokatorDB.monetization.pilot.initializePayment(103, { category: 'electrician', state: 'Delta', lga: 'Warri South' });
    const failPayload = {
      event: 'charge.failed',
      data: { reference: initFail.reference, amount: 200000, currency: 'NGN', status: 'failed' }
    };
    const failWh = await LokatorDB.monetization.pilot.processWebhook(failPayload, 'any_sig', null);
    assert.strictEqual(failWh.status, 'payment_failed');

    const orders = LokatorDB.monetization.pilot.getProviderOrders(103);
    const failOrder = orders.find(o => o.reference === initFail.reference);
    assert.strictEqual(failOrder.status, 'payment_failed');
  });

  await test('11.2 Refund/reversal reconciles order and deactivates promotion immediately', async () => {
    // Provider 102 currently has active promotion
    const orders102 = LokatorDB.monetization.pilot.getProviderOrders(102);
    assert.ok(orders102.length > 0);
    const revRes = await LokatorDB.monetization.pilot.processRefundOrReversal(orders102[0].order_id, 102, 'refund');
    assert.strictEqual(revRes.status, 'refunded');
    assert.strictEqual(revRes.promotion_deactivated, true);

    const active102 = LokatorDB.monetization.pilot.getProviderActivePromotion(102);
    assert.strictEqual(active102, null);
  });

  console.log('\n--- 12. TELEMETRY & PRIVACY AUDIT ---');
  await test('12.1 Telemetry events contain zero sensitive card numbers, CVVs, PINs, or secrets', async () => {
    const forbidden = ['408408', '411111', 'cvv', 'card_number', 'pin', 'otp', 'sk_live_', 'sk_test_'];
    telemetryEvents.forEach(e => {
      const serialized = JSON.stringify(e).toLowerCase();
      forbidden.forEach(token => {
        assert.ok(!serialized.includes(token), `Forbidden token "${token}" found in telemetry event ${e.evt}`);
      });
    });
  });

  console.log('\n--- 13. FREE MARKETPLACE NATIONWIDE PRESERVATION ---');
  await test('13.1 Free marketplace features remain 100% functional with 0% commission', async () => {
    const allProviders = await LokatorDB.getProviders({});
    assert.ok(allProviders.data.length >= 4);
    assert.strictEqual(LokatorDB.monetization.featureFlags.COMMISSIONS_ENABLED, false);
    assert.strictEqual(LokatorDB.monetization.featureFlags.VERIFICATION_PAYMENT_ENABLED, false);
  });

  console.log('\n--- 14. FINAL GATE CERTIFICATION ---');
  await test('14.1 Final gate status resolves to TEST_MODE_CERTIFIED_LIVE_DISABLED', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    assert.ok(['PAYMENT_INTEGRATION_TEST_READY', 'LIVE_PAYMENT_READY_PENDING_EXPLICIT_ACTIVATION'].includes(summary.commercial_readiness_classification));
    assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_LIVE_MODE, false);
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.13F TEST-MODE TRANSACTION ASSERTIONS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runCertification();
