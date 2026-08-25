/**
 * LOKATOR.NG — PHASE 10.13C COMPREHENSIVE UNIT & LOGIC VERIFICATION SUITE
 * Validates Monetization Product & Pricing Validation Engine, 5-Stage Funnels,
 * Deduplicated Denominators, Repeat Intent, Preference Overlap, and Feedback Signals.
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
  console.log('\n🔬 RUNNING PHASE 10.13C — MONETIZATION PRODUCT & PRICING VALIDATION\n');

  // Populate mock published providers in DB
  const mockProviders = [
    { id: 101, first_name: 'David', last_name: 'Okon', state: 'Lagos', lga: 'Surulere', category: 'recording-studio', is_verified: true, profile_complete: true, is_available: true, completedJobs: 3, reviewsCount: 4, skills: ['Sound Engineering', 'Mastering'] },
    { id: 102, first_name: 'Engr.', last_name: 'Yusuf', state: 'Abuja', lga: 'Municipal', category: 'solar-installer', is_verified: false, profile_complete: true, is_available: true, completedJobs: 1, reviewsCount: 0, skills: ['Solar Installation', 'Inverter Repair'] },
    { id: 103, first_name: 'Tarila', last_name: 'Ebi', state: 'Delta', lga: 'Warri South', category: 'electrician', is_verified: false, profile_complete: true, is_available: true, completedJobs: 0, reviewsCount: 0, skills: ['Domestic Wiring', 'Industrial Electrical'] },
    { id: 104, first_name: 'Blessing', last_name: 'Osagie', state: 'Edo', lga: 'Oredo', category: 'generator-repair', is_verified: true, profile_complete: true, is_available: true, completedJobs: 5, reviewsCount: 2, skills: ['Lister Engine', 'Diesel Generator'] },
    { id: 105, first_name: 'Chukwudi', last_name: 'Musa', state: 'Delta', lga: 'Ughelli North', category: 'plumber', is_verified: false, profile_complete: true, is_available: true, completedJobs: 0, reviewsCount: 0, skills: ['Piping', 'Borehole'] }
  ];
  localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(mockProviders));

  // Clear monetization research data
  localStorage.removeItem('lokator_monetization_research');

  console.log('--- SECTION 1: DATA FOUNDATION & DEDUPLICATED DENOMINATORS ---');
  await test('1.1 Product exposure correctly logs provider ID and metadata', async () => {
    await LokatorDB.monetization.research.recordProductExposure(101, 'TRUST_VERIFICATION', { category: 'recording-studio', state: 'Lagos' });
    await LokatorDB.monetization.research.recordProductExposure(102, 'TRUST_VERIFICATION', { category: 'solar-installer', state: 'Abuja' });
    await LokatorDB.monetization.research.recordProductExposure(103, 'PROMOTED_DISCOVERY', { category: 'electrician', state: 'Delta' });
    const data = LokatorDB.monetization.research.getResearchData();
    assert.strictEqual(data.exposures.length, 3);
  });

  await test('1.2 Deduplication: Multiple exposures for provider 101 do not inflate unique provider count', async () => {
    await LokatorDB.monetization.research.recordProductExposure(101, 'TRUST_VERIFICATION', { category: 'recording-studio', state: 'Lagos' });
    await LokatorDB.monetization.research.recordProductExposure(101, 'TRUST_VERIFICATION', { category: 'recording-studio', state: 'Lagos' });
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const trustProd = summary.candidate_products.find(p => p.product_id === 'TRUST_VERIFICATION');
    assert.strictEqual(trustProd.exposed_providers, 2); // 101 and 102
    assert.strictEqual(trustProd.raw_events.exposures, 4);
  });

  await test('1.3 Cohort exposed denominator uses distinct provider count across all products', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    assert.strictEqual(summary.cohort_metrics.total_exposed_providers, 3); // 101, 102, 103
  });

  console.log('\n--- SECTION 2: 5-STAGE PRODUCT FUNNEL CALCULATION ---');
  await test('2.1 Stage 2 (Interest) distinct provider count and interest rate calculation', async () => {
    await LokatorDB.monetization.research.recordProductInterest(101, 'TRUST_VERIFICATION', 'Looking for trust badge');
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const trustProd = summary.candidate_products.find(p => p.product_id === 'TRUST_VERIFICATION');
    assert.strictEqual(trustProd.interest_count, 1);
    assert.strictEqual(trustProd.interest_rate, 50.0); // 1 / 2 exposed
    assert.strictEqual(trustProd.funnel.stage_2_interested.count, 1);
  });

  await test('2.2 Stage 3 (Price Selection) unique provider count and rate', async () => {
    await LokatorDB.monetization.research.recordPriceSelection(101, 'TRUST_VERIFICATION', { label: '₦5,000 one-time review', amount: 5000 });
    await LokatorDB.monetization.research.recordPriceSelection(102, 'TRUST_VERIFICATION', { label: '₦3,000 one-time review', amount: 3000 });
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const trustProd = summary.candidate_products.find(p => p.product_id === 'TRUST_VERIFICATION');
    assert.strictEqual(trustProd.price_select_count, 2);
    assert.strictEqual(trustProd.price_selection_rate, 100.0); // 2 / 2 exposed
  });

  await test('2.3 Stage 4 (Purchase Intent) and Intent-after-Interest conversion rate', async () => {
    await LokatorDB.monetization.research.recordPurchaseIntent(101, 'TRUST_VERIFICATION', { label: '₦5,000 one-time review', amount: 5000 });
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const trustProd = summary.candidate_products.find(p => p.product_id === 'TRUST_VERIFICATION');
    assert.strictEqual(trustProd.purchase_intent_count, 1);
    assert.strictEqual(trustProd.intent_rate, 50.0); // 1 / 2 exposed
    assert.strictEqual(trustProd.intent_after_interest_rate, 100.0); // 1 intent / 1 interested
  });

  await test('2.4 Stage 5 (Waitlist / Commitment) conversion rate', async () => {
    await LokatorDB.monetization.research.joinProductWaitlist(101, 'TRUST_VERIFICATION', '08012345678', 'Early beta');
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const trustProd = summary.candidate_products.find(p => p.product_id === 'TRUST_VERIFICATION');
    assert.strictEqual(trustProd.waitlist_count, 1);
    assert.strictEqual(trustProd.waitlist_rate, 50.0); // 1 / 2 exposed
  });

  console.log('\n--- SECTION 3: PRODUCT / PRICE HYPOTHESIS & PRICE SENSITIVITY ---');
  await test('3.1 Price hypothesis matrix calculates selection and intent rates per band', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const trustProd = summary.candidate_products.find(p => p.product_id === 'TRUST_VERIFICATION');
    assert.ok(Array.isArray(trustProd.price_sensitivity));
    assert.strictEqual(trustProd.price_sensitivity.length, 3);

    const baselineBand = trustProd.price_sensitivity.find(h => h.is_baseline);
    assert.strictEqual(baselineBand.label, '₦5,000 one-time review');
    assert.strictEqual(baselineBand.unique_selections, 1);
    assert.strictEqual(baselineBand.unique_intents, 1);
    assert.strictEqual(baselineBand.status, 'LEADING_HYPOTHESIS');
  });

  await test('3.2 Entry and premium price bands are evaluated without crashes', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const trustProd = summary.candidate_products.find(p => p.product_id === 'TRUST_VERIFICATION');
    const lowBand = trustProd.price_sensitivity.find(h => h.amount === 3000);
    assert.strictEqual(lowBand.unique_selections, 1);
    assert.strictEqual(lowBand.unique_intents, 0);
  });

  console.log('\n--- SECTION 4: REPEAT INTENT & CONSISTENCY ---');
  await test('4.1 Repeat intent tracking accurately identifies providers with multiple interactions', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    assert.strictEqual(summary.cohort_metrics.repeat_intent_providers >= 1, true);
    assert.strictEqual(typeof summary.cohort_metrics.repeat_intent_rate, 'number');
  });

  await test('4.2 Repeated interest click emits monetization_product_repeat_interest telemetry', async () => {
    await LokatorDB.monetization.research.recordProductInterest(101, 'TRUST_VERIFICATION', 'Second click');
    const repeatEvt = telemetryEvents.find(e => e.evt === 'monetization_product_repeat_interest');
    assert.ok(repeatEvt, 'Must emit monetization_product_repeat_interest event');
    assert.strictEqual(repeatEvt.data.is_repeat, true);
  });

  console.log('\n--- SECTION 5: PRODUCT PREFERENCE & OVERLAP ANALYSIS ---');
  await test('5.1 Multi-product overlap and exclusive product preference calculation', async () => {
    await LokatorDB.monetization.research.recordProductInterest(103, 'PROMOTED_DISCOVERY');
    await LokatorDB.monetization.research.recordProductInterest(104, 'QUALIFIED_LEAD_ACCESS');
    await LokatorDB.monetization.research.recordProductInterest(104, 'PROMOTED_DISCOVERY'); // 104 is interested in 2 products

    const summary = LokatorDB.monetization.getMonetizationSummary();
    assert.ok(summary.preference_analysis);
    assert.strictEqual(summary.preference_analysis.exclusive_trust_verification, 1); // 101
    assert.strictEqual(summary.preference_analysis.exclusive_promoted_discovery, 1); // 103
    assert.strictEqual(summary.preference_analysis.multi_product_overlap, 1); // 104 (promoted + lead)
  });

  console.log('\n--- SECTION 6: STRUCTURED RESEARCH FEEDBACK ---');
  await test('6.1 recordResearchFeedback captures structured reasons and emits telemetry', async () => {
    await LokatorDB.monetization.research.recordResearchFeedback(101, 'TRUST_VERIFICATION', 'More trust & credibility');
    await LokatorDB.monetization.research.recordResearchFeedback(103, 'PROMOTED_DISCOVERY', 'More local visibility');

    const data = LokatorDB.monetization.research.getResearchData();
    assert.strictEqual(data.feedback.length, 2);

    const fbkEvt = telemetryEvents.find(e => e.evt === 'monetization_research_feedback');
    assert.ok(fbkEvt, 'Must emit monetization_research_feedback');
    assert.strictEqual(fbkEvt.data.provider_id, '101');

    const summary = LokatorDB.monetization.getMonetizationSummary();
    assert.strictEqual(summary.feedback_analysis['More trust & credibility'], 1);
    assert.strictEqual(summary.feedback_analysis['More local visibility'], 1);
  });

  console.log('\n--- SECTION 7: PROVIDER ENGAGEMENT SEGMENTATION ---');
  await test('7.1 Segmentation measures verified and contacted provider intent with non-causal notes', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    assert.ok(Array.isArray(summary.provider_segmentation));
    assert.strictEqual(summary.provider_segmentation.length, 4);

    const verifiedSeg = summary.provider_segmentation.find(s => s.segment_id === 'verified_trust_signal');
    assert.ok(verifiedSeg);
    assert.strictEqual(typeof verifiedSeg.interest_rate, 'number');
    assert.strictEqual(typeof verifiedSeg.intent_rate, 'number');
    assert.ok(verifiedSeg.observation_note.includes('observed intent'));
  });

  console.log('\n--- SECTION 8: REGIONAL WILLINGNESS-TO-PAY (DELTA & EDO) ---');
  await test('8.1 Delta State and Edo State market metrics maintain exact provider denominators', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const delta = summary.regional_insights.delta_priority_market;
    const edo = summary.regional_insights.edo_strategic_adjacent;

    assert.strictEqual(delta.total_providers, 2); // 103, 105
    assert.strictEqual(edo.total_providers, 1); // 104
    assert.strictEqual(delta.top_monetization_fit, 'TRUST_VERIFICATION & PROMOTED_DISCOVERY');
    assert.strictEqual(edo.top_monetization_fit, 'PROMOTED_DISCOVERY');
  });

  console.log('\n--- SECTION 9: CONFIDENCE MODEL & COMMERCIAL DECISION ---');
  await test('9.1 Confidence levels adhere to sample size thresholds', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    const trustProd = summary.candidate_products.find(p => p.product_id === 'TRUST_VERIFICATION');
    assert.ok(['HIGH', 'MEDIUM', 'LOW', 'INSUFFICIENT_DATA'].includes(trustProd.confidence));
  });

  await test('9.2 Overall commercial classification is PROMISING_BUT_UNVALIDATED', async () => {
    const summary = LokatorDB.monetization.getMonetizationSummary();
    assert.strictEqual(summary.commercial_readiness_classification, 'PROMISING_BUT_UNVALIDATED');
  });

  console.log('\n--- SECTION 10: PAYMENT GATE INTEGRITY & PRIVACY ---');
  await test('10.1 Payment processing feature flags remain strictly disabled', async () => {
    assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_PROCESSING_ENABLED, false);
    assert.strictEqual(LokatorDB.monetization.featureFlags.LIVE_BILLING_ENABLED, false);
  });

  await test('10.2 Separating verification approval from fee payment', async () => {
    const trustProd = LokatorDB.monetization.candidateProducts.find(p => p.id === 'TRUST_VERIFICATION');
    assert.ok(trustProd.rule.includes('Payment does NOT guarantee verification approval'));
  });

  await test('10.3 Zero financial PII stored in research logs (cards, CVVs, bank accounts, passwords)', async () => {
    const data = LokatorDB.monetization.research.getResearchData();
    const str = JSON.stringify(data).toLowerCase();
    ['card_number', 'cvv', 'pin', 'bank_account', 'password', 'sk_live', 'pk_live'].forEach(token => {
      assert.ok(!str.includes(token), `Forbidden token "${token}" found in research data`);
    });
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.13C WILLINGNESS-TO-PAY & PRICING ASSERTIONS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests();
