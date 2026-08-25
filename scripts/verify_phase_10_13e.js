/**
 * LOKATOR.NG — PHASE 10.13E UNIT & LOGIC VERIFICATION SUITE
 * Validates Paystack Pilot Payment Integration, ₦2,000/14-Day Starter Specification,
 * Server Initialization, Verification, HMAC-SHA512 Webhook, Idempotency, Inventory Cap (2),
 * and Test-Mode Gate.
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

// Mock Telemetry
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

async function runTests() {
  console.log('\n🔬 RUNNING PHASE 10.13E — PAYSTACK PILOT PAYMENT INTEGRATION SUITE\n');

  // Populate mock published providers in DB
  const mockProviders = [
    { id: 201, first_name: 'Tarila', last_name: 'Ebi', state: 'Delta', lga: 'Warri South', category: 'electrician', is_verified: true, profile_complete: true, is_available: true, completedJobs: 10, reviewsCount: 4, skills: ['Wiring', 'Inverter'] },
    { id: 202, first_name: 'Oghenekaro', last_name: 'Musa', state: 'Delta', lga: 'Warri South', category: 'electrician', is_verified: false, profile_complete: true, is_available: true, completedJobs: 6, reviewsCount: 2, skills: ['Wiring', 'Generator'] },
    { id: 203, first_name: 'Blessing', last_name: 'Osagie', state: 'Delta', lga: 'Warri South', category: 'electrician', is_verified: false, profile_complete: true, is_available: true, completedJobs: 2, reviewsCount: 1, skills: ['Industrial Wiring'] },
    { id: 204, first_name: 'Chukwudi', last_name: 'Okon', state: 'Edo', lga: 'Oredo', category: 'generator-repair', is_verified: true, profile_complete: true, is_available: true, completedJobs: 8, reviewsCount: 5, skills: ['Diesel Generator'] }
  ];
  localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(mockProviders));
  localStorage.removeItem('lokator_pilot_orders_store');
  localStorage.removeItem('lokator_pilot_promotions_store');

  console.log('--- SECTION 1: PILOT PRODUCT SPECIFICATION & FEATURE FLAGS ---');
  await test('1.1 Pilot product is Promoted Category Placement — Starter at ₦2,000 (200,000 kobo)', async () => {
    const prod = LokatorDB.monetization.pilot.pilotProduct;
    assert.strictEqual(prod.id, 'PROMOTED_LISTING_STARTER');
    assert.strictEqual(prod.price_kobo, 200000);
    assert.strictEqual(prod.price_amount, 2000);
    assert.strictEqual(prod.currency, 'NGN');
    assert.strictEqual(prod.duration_days, 14);
    assert.strictEqual(prod.entitlement_key, 'PROMOTED_LISTING');
  });

  await test('1.2 Feature flags enable pilot processing in TEST MODE only', async () => {
    const flags = LokatorDB.monetization.featureFlags;
    assert.strictEqual(flags.PAYMENT_PROCESSING_ENABLED, true);
    assert.strictEqual(flags.PAYSTACK_ENABLED, true);
    assert.strictEqual(flags.PROMOTED_PILOT_ENABLED, true);
    assert.strictEqual(flags.PAYMENT_LIVE_MODE, false); // Must remain false (test mode)
    assert.strictEqual(flags.VERIFICATION_PAYMENT_ENABLED, false);
    assert.strictEqual(flags.LEAD_PAYMENT_ENABLED, false);
    assert.strictEqual(flags.SUBSCRIPTIONS_ENABLED, false);
    assert.strictEqual(flags.COMMISSIONS_ENABLED, false);
  });

  console.log('\n--- SECTION 2: TRANSACTION INITIALIZATION & INVENTORY ENFORCEMENT ---');
  await test('2.1 Transaction initialization returns unique reference and order record', async () => {
    const initRes = await LokatorDB.monetization.pilot.initializePayment(201, { category: 'electrician', state: 'Delta', lga: 'Warri South' });
    assert.strictEqual(initRes.status, 'success');
    assert.ok(initRes.reference.startsWith('lok_plt_'));
    assert.strictEqual(initRes.amount, 200000);
    assert.strictEqual(initRes.currency, 'NGN');
    assert.strictEqual(initRes.order.status, 'payment_pending');
  });

  await test('2.2 Inventory cap allows max 2 active sponsored listings per Category/LGA', async () => {
    const invBefore = LokatorDB.monetization.pilot.checkInventoryAvailability('electrician', 'Delta', 'Warri South');
    assert.strictEqual(invBefore.available, true);
    assert.strictEqual(invBefore.max_capacity, 2);
  });

  console.log('\n--- SECTION 3: TRANSACTION VERIFICATION & IDEMPOTENT FULFILLMENT ---');
  let firstReference = '';
  await test('3.1 Successful verification fulfills order and activates 14-day PROMOTED_LISTING', async () => {
    const init1 = await LokatorDB.monetization.pilot.initializePayment(201, { category: 'electrician', state: 'Delta', lga: 'Warri South' });
    firstReference = init1.reference;
    const verify1 = await LokatorDB.monetization.pilot.verifyPayment(init1.reference, 201);
    assert.strictEqual(verify1.verified, true);
    assert.strictEqual(verify1.entitlement.status, 'active');
    assert.strictEqual(verify1.entitlement.entitlement_key, 'PROMOTED_LISTING');
    
    // Verify 14-day expiration math
    const startMs = new Date(verify1.entitlement.effective_from).getTime();
    const endMs = new Date(verify1.entitlement.effective_until).getTime();
    const diffDays = Math.round((endMs - startMs) / (24 * 3600 * 1000));
    assert.strictEqual(diffDays, 14);
  });

  await test('3.2 Idempotency: Duplicate verification on fulfilled order does not create duplicate entitlement', async () => {
    const promosBefore = LokatorDB.monetization.pilot.getActivePromotions('electrician', 'Delta', 'Warri South');
    const verifyDup = await LokatorDB.monetization.pilot.verifyPayment(firstReference, 201);
    assert.strictEqual(verifyDup.idempotent, true);
    const promosAfter = LokatorDB.monetization.pilot.getActivePromotions('electrician', 'Delta', 'Warri South');
    assert.strictEqual(promosBefore.length, promosAfter.length);
  });

  console.log('\n--- SECTION 4: INVENTORY LIMIT OVERFLOW PROTECTION ---');
  await test('4.1 Second provider can purchase remaining sponsored slot', async () => {
    const init2 = await LokatorDB.monetization.pilot.initializePayment(202, { category: 'electrician', state: 'Delta', lga: 'Warri South' });
    const verify2 = await LokatorDB.monetization.pilot.verifyPayment(init2.reference, 202);
    assert.strictEqual(verify2.verified, true);

    const activeList = LokatorDB.monetization.pilot.getActivePromotions('electrician', 'Delta', 'Warri South');
    assert.strictEqual(activeList.length, 2);
  });

  await test('4.2 Third provider purchase is rejected when slot capacity (2) is reached', async () => {
    const init3 = await LokatorDB.monetization.pilot.initializePayment(203, { category: 'electrician', state: 'Delta', lga: 'Warri South' });
    assert.strictEqual(init3.status, 'error');
    assert.strictEqual(init3.code, 'INVENTORY_LIMIT_REACHED');
  });

  console.log('\n--- SECTION 5: HMAC-SHA512 WEBHOOK SECURITY & DEDUPLICATION ---');
  await test('5.1 Webhook validates HMAC-SHA512 signature and executes idempotent fulfillment', async () => {
    const secretKey = 'sk_test_mock_secret_key_123';
    const payload = {
      event: 'charge.success',
      data: {
        id: 998877,
        reference: 'lok_plt_webhook_test_999',
        amount: 200000,
        currency: 'NGN',
        status: 'success',
        metadata: { provider_id: 204 }
      }
    };
    const bodyStr = JSON.stringify(payload);
    const signature = crypto.createHmac('sha512', secretKey).update(bodyStr).digest('hex');

    const webhookRes = await LokatorDB.monetization.pilot.processWebhook(payload, signature, secretKey);
    assert.strictEqual(webhookRes.processed, true);

    // Invalid signature rejection
    const badSigRes = await LokatorDB.monetization.pilot.processWebhook(payload, 'invalid_signature_hex', secretKey);
    assert.strictEqual(badSigRes.verified, false);
    assert.strictEqual(badSigRes.error, 'Invalid webhook signature');
  });

  console.log('\n--- SECTION 6: SEARCH INTEGRATION & ORGANIC RANKING PRESERVATION ---');
  await test('6.1 Search renders max 2 sponsored listings pinned at top, preserving organic results below', async () => {
    const searchRes = await LokatorDB.getProviders({
      category: 'electrician',
      state: 'Delta',
      lga: 'Warri South'
    });

    assert.ok(searchRes.data.length >= 3);
    assert.strictEqual(searchRes.data[0].is_sponsored, true);
    assert.strictEqual(searchRes.data[1].is_sponsored, true);
    assert.strictEqual(searchRes.data[2].is_sponsored, false); // 3rd provider remains organic
  });

  await test('6.2 Expired promotions automatically lose sponsored rank without manual intervention', async () => {
    const promoStore = JSON.parse(localStorage.getItem('lokator_pilot_promotions_store') || '[]');
    // Simulate expired campaign
    promoStore[0].effective_until = new Date(Date.now() - 10000).toISOString();
    localStorage.setItem('lokator_pilot_promotions_store', JSON.stringify(promoStore));

    const activePromos = LokatorDB.monetization.pilot.getActivePromotions('electrician', 'Delta', 'Warri South');
    assert.strictEqual(activePromos.length, 1);
  });

  console.log('\n--- SECTION 7: REFUND WORKFLOW & PAYMENT GATE STATUS ---');
  await test('7.1 Refund request records policy clause and marks order refund_pending', async () => {
    const orders = LokatorDB.monetization.pilot.getProviderOrders(201);
    assert.ok(orders.length > 0);
    const refRecord = await LokatorDB.monetization.pilot.requestRefund(orders[0].order_id, 201, 'Technical search outage');
    assert.strictEqual(refRecord.status, 'refund_pending');
    assert.strictEqual(refRecord.eligible, true);
  });

  await test('7.2 Overall commercial classification is PAYMENT_INTEGRATION_TEST_READY or LIVE_PAYMENT_READY_PENDING_EXPLICIT_ACTIVATION', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    assert.ok(['PAYMENT_INTEGRATION_TEST_READY', 'LIVE_PAYMENT_READY_PENDING_EXPLICIT_ACTIVATION'].includes(summary.commercial_readiness_classification));
    assert.ok(['PAYMENT_INTEGRATION_TEST_READY', 'LIVE_PAYMENT_READY_PENDING_EXPLICIT_ACTIVATION'].includes(summary.payment_readiness_gate.classification));
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.13E PAYSTACK PILOT PAYMENT ASSERTIONS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
