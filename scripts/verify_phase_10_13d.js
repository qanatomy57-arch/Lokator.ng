/**
 * LOKATOR.NG — PHASE 10.13D UNIT & LOGIC VERIFICATION SUITE
 * Validates Monetization Pilot Readiness, First-Paid-Product Selection,
 * Finalist Evaluation Matrix, Promoted Discovery Pilot Specification, and Payment Gate.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

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
  console.log('\n🔬 RUNNING PHASE 10.13D — MONETIZATION PILOT READINESS & FIRST-PAID-PRODUCT GATE\n');

  // Populate mock published providers in DB
  const mockProviders = [
    { id: 101, first_name: 'David', last_name: 'Okon', state: 'Lagos', lga: 'Surulere', category: 'recording-studio', is_verified: true, profile_complete: true, is_available: true, completedJobs: 3, reviewsCount: 4, skills: ['Sound Engineering', 'Mastering'] },
    { id: 102, first_name: 'Engr.', last_name: 'Yusuf', state: 'Abuja', lga: 'Municipal', category: 'solar-installer', is_verified: false, profile_complete: true, is_available: true, completedJobs: 1, reviewsCount: 0, skills: ['Solar Installation', 'Inverter Repair'] },
    { id: 103, first_name: 'Tarila', last_name: 'Ebi', state: 'Delta', lga: 'Warri South', category: 'electrician', is_verified: false, profile_complete: true, is_available: true, completedJobs: 0, reviewsCount: 0, skills: ['Domestic Wiring', 'Industrial Electrical'] },
    { id: 104, first_name: 'Blessing', last_name: 'Osagie', state: 'Edo', lga: 'Oredo', category: 'generator-repair', is_verified: true, profile_complete: true, is_available: true, completedJobs: 5, reviewsCount: 2, skills: ['Lister Engine', 'Diesel Generator'] },
    { id: 105, first_name: 'Chukwudi', last_name: 'Musa', state: 'Delta', lga: 'Ughelli North', category: 'plumber', is_verified: false, profile_complete: true, is_available: true, completedJobs: 0, reviewsCount: 0, skills: ['Piping', 'Borehole'] }
  ];
  localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(mockProviders));
  localStorage.removeItem('lokator_monetization_research');

  console.log('--- SECTION 1: FINALIST EVALUATION & FIRST-PAID-PRODUCT SELECTION ---');
  await test('1.1 Exactly one first-pilot product candidate is selected', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    assert.ok(summary.first_paid_product_decision);
    assert.strictEqual(summary.first_paid_product_decision.recommendation, 'PROMOTED_DISCOVERY_FIRST');
  });

  await test('1.2 Finalist evaluation contains structured scoring for both candidates', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const evalObj = summary.first_paid_product_decision.finalist_evaluation;
    assert.ok(evalObj.finalist_a_verification);
    assert.ok(evalObj.finalist_b_promotion);
    assert.strictEqual(evalObj.finalist_a_verification.verdict, 'REJECTED_AS_FIRST_PILOT');
    assert.strictEqual(evalObj.finalist_b_promotion.verdict, 'SELECTED_AS_FIRST_PILOT');
    assert.ok(evalObj.finalist_b_promotion.score > evalObj.finalist_a_verification.score);
  });

  await test('1.3 Rejection reason for verification documents operational bottleneck and sensitive PII risk', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const verif = summary.first_paid_product_decision.finalist_evaluation.finalist_a_verification;
    assert.ok(verif.rejection_reason.includes('manual review'));
    assert.ok(verif.rejection_reason.includes('identity document'));
  });

  await test('1.4 Selection reason for promotion documents automated fulfillment and zero PII risk', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const promo = summary.first_paid_product_decision.finalist_evaluation.finalist_b_promotion;
    assert.ok(promo.selection_reason.includes('automated'));
    assert.ok(promo.selection_reason.includes('PII'));
  });

  console.log('\n--- SECTION 2: PROMOTED DISCOVERY PILOT SPECIFICATION ---');
  await test('2.1 Pilot geographic clusters define Delta State as primary and Edo State as secondary', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const spec = summary.first_paid_product_decision.pilot_specification;
    assert.ok(spec.pilot_scope.priority_market.includes('Delta State'));
    assert.ok(spec.pilot_scope.secondary_market.includes('Edo State'));
  });

  await test('2.2 Inventory constraint enforces max 2 sponsored listings per Category/LGA', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const spec = summary.first_paid_product_decision.pilot_specification;
    assert.strictEqual(spec.pilot_scope.max_inventory_per_cluster, 2);
  });

  await test('2.3 Entitlement design maps to PROMOTED_LISTING with server control and auto-expiry', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const ent = summary.first_paid_product_decision.pilot_specification.entitlement_design;
    assert.strictEqual(ent.entitlement_key, 'PROMOTED_LISTING');
    assert.strictEqual(ent.is_server_controlled, true);
    assert.strictEqual(ent.auto_expiring, true);
    assert.strictEqual(ent.self_grant_prevented, true);
  });

  await test('2.4 Deterministic refund policy is explicitly defined', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const spec = summary.first_paid_product_decision.pilot_specification;
    assert.ok(spec.refund_policy.includes('100% refund'));
    assert.ok(spec.refund_policy.includes('pro-rated'));
  });

  await test('2.5 Stop-loss conditions define explicit operational shut-off triggers', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const spec = summary.first_paid_product_decision.pilot_specification;
    assert.ok(Array.isArray(spec.stop_loss_triggers));
    assert.ok(spec.stop_loss_triggers.length >= 3);
  });

  console.log('\n--- SECTION 3: PAYMENT PROVIDER RECOMMENDATION ---');
  await test('3.1 Paystack is recommended as leading gateway with documented architectural rationale', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const provRec = summary.first_paid_product_decision.pilot_specification.payment_provider_recommendation;
    assert.strictEqual(provRec.recommended_provider, 'PAYSTACK');
    assert.ok(provRec.rationale.includes('HMAC'));
  });

  console.log('\n--- SECTION 4: COMMERCIAL DECISION & PAYMENT GATE STATUS ---');
  await test('4.1 Overall commercial classification is PILOT_READY_PAYMENT_STILL_DISABLED', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    assert.strictEqual(summary.commercial_readiness_classification, 'PILOT_READY_PAYMENT_STILL_DISABLED');
  });

  await test('4.2 Payment readiness gate confirms PILOT_READY_PAYMENT_STILL_DISABLED', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    assert.strictEqual(summary.payment_readiness_gate.classification, 'PILOT_READY_PAYMENT_STILL_DISABLED');
    assert.strictEqual(summary.payment_readiness_gate.selected_first_product, 'PROMOTED_DISCOVERY_FIRST');
  });

  console.log('\n--- SECTION 5: SECURITY, PRIVACY & SEPARATION OF CONCERNS ---');
  await test('5.1 Payment processing feature flags remain strictly FALSE', async () => {
    assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_PROCESSING_ENABLED, false);
    assert.strictEqual(LokatorDB.monetization.featureFlags.LIVE_BILLING_ENABLED, false);
  });

  await test('5.2 Verification status cannot be purchased or guaranteed by payment', async () => {
    const trustProd = LokatorDB.monetization.candidateProducts.find(p => p.id === 'TRUST_VERIFICATION');
    assert.ok(trustProd.rule.includes('Payment does NOT guarantee verification approval'));
  });

  await test('5.3 Zero payment gateway SDKs or live billing code in codebase', async () => {
    const rawClient = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
    const forbidden = ['paystack.min.js', 'flutterwave/v3', 'stripe.com/v3', 'sk_live_', 'pk_live_'];
    forbidden.forEach(token => {
      assert.ok(!rawClient.includes(token), `Forbidden token "${token}" found in supabase-client.js`);
    });
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.13D MONETIZATION PILOT READINESS ASSERTIONS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
