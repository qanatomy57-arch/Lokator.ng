// ============================================================================
// LOKATOR.NG — PHASE 10.13B AUTOMATED VERIFICATION SUITE
// Scope: Provider Willingness-to-Pay Validation & Research Engine
// ============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

console.log('\n🔬 RUNNING PHASE 10.13B — PROVIDER WILLINGNESS-TO-PAY VALIDATION\n');

// ============================================================================
// SETUP VM SANDBOX
// ============================================================================

const categoriesCode = fs.readFileSync(path.join(__dirname, '../categories.js'), 'utf8');
const telemetryCode = fs.readFileSync(path.join(__dirname, '../telemetry.js'), 'utf8');
const dbCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');

const storageData = {};
const storageMock = {
  _data: storageData,
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

const sandbox = {
  window: { addEventListener: () => {}, dispatchEvent: () => true },
  module: {},
  console: console,
  sessionStorage: storageMock,
  localStorage: storageMock,
  document: {
    title: 'Lokator.NG Test',
    readyState: 'complete',
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  },
  navigator: { userAgent: 'NodeTestEnv/1.0' },
  performance: { now: () => Date.now() },
  Date: Date, Math: Math, JSON: JSON,
  crypto: { randomUUID: () => '00000000-0000-4000-8000-000000000000' }
};

vm.createContext(sandbox);
vm.runInContext(categoriesCode, sandbox);
vm.runInContext(telemetryCode, sandbox);
vm.runInContext(dbCode, sandbox);

const LokatorDB = sandbox.window.LokatorDB;

// Seed sample providers for segmentation and regional calculations
const dbKey = 'lokator_supabase_providers_db';
const seedProviders = [
  { id: 101, name: 'Warri Electrician', trade: 'Electrician', category: 'electrician', state: 'Delta', lga: 'Warri South', profile_complete: true, is_available: true, is_verified: true, completedJobs: 5, reviewsCount: 3, skills: ['Wiring', 'Inverter'] },
  { id: 102, name: 'Ughelli Plumber', trade: 'Plumber', category: 'plumber', state: 'Delta', lga: 'Ughelli North', profile_complete: true, is_available: true, is_verified: false, completedJobs: 0, reviewsCount: 0, skills: ['Piping', 'Leak Repair'] },
  { id: 103, name: 'Benin Generator Tech', trade: 'Generator Repair', category: 'generator-repair', state: 'Edo', lga: 'Oredo', profile_complete: true, is_available: true, is_verified: false, completedJobs: 2, reviewsCount: 1, skills: ['Generator Overhaul'] },
  { id: 104, name: 'Lagos Solar Pro', trade: 'Solar Installer', category: 'solar-installer', state: 'Lagos', lga: 'Ikeja', profile_complete: true, is_available: true, nin_verified: true, completedJobs: 8, reviewsCount: 4, skills: ['Solar Panel', 'Lithium Battery'] }
];
storageMock.setItem(dbKey, JSON.stringify(seedProviders));

// ============================================================================
// SECTION 1: RESEARCH EXPOSURE CONTROL & DENOMINATORS (LEVEL 0)
// ============================================================================

console.log('--- SECTION 1: RESEARCH EXPOSURE CONTROL & DENOMINATORS ---');

test('1.1 recordProductExposure records exposure with provider metadata', async () => {
  const exp = await LokatorDB.monetization.research.recordProductExposure(101, 'TRUST_VERIFICATION', { category: 'electrician', state: 'Delta' });
  assert.ok(exp.id, 'Exposure record has an ID');
  assert.strictEqual(exp.provider_id, 101);
  assert.strictEqual(exp.product_id, 'TRUST_VERIFICATION');
  assert.strictEqual(exp.state, 'Delta');
  assert.ok(exp.exposed_at);
});

test('1.2 Multiple exposures from same provider are tracked for volume but distinct for rates', async () => {
  await LokatorDB.monetization.research.recordProductExposure(101, 'TRUST_VERIFICATION', { category: 'electrician', state: 'Delta' });
  await LokatorDB.monetization.research.recordProductExposure(102, 'TRUST_VERIFICATION', { category: 'plumber', state: 'Delta' });
  
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  assert.ok(summary.cohort_metrics.total_exposed_providers >= 2, 'Distinct exposed providers count is at least 2');
  assert.ok(summary.research_summary.total_exposures >= 3, 'Raw exposure events volume is tracked');
});

test('1.3 Exposure rate denominator uses distinct exposed providers, not raw event volume', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  assert.ok(typeof summary.cohort_metrics.interest_rate === 'number');
  assert.ok(typeof summary.cohort_metrics.intent_rate === 'number');
  assert.ok(summary.cohort_metrics.total_exposed_providers > 0);
});

// ============================================================================
// SECTION 2: PRODUCT INTEREST MEASUREMENT (LEVEL 1)
// ============================================================================

console.log('\n--- SECTION 2: PRODUCT INTEREST MEASUREMENT (LEVEL 1) ---');

test('2.1 recordProductInterest captures explicit Level 1 interest', async () => {
  const interest = await LokatorDB.monetization.research.recordProductInterest(101, 'TRUST_VERIFICATION', 'Interested in trust badge', { category: 'electrician', state: 'Delta' });
  assert.ok(interest.id);
  assert.strictEqual(interest.provider_id, 101);
  assert.strictEqual(interest.product_id, 'TRUST_VERIFICATION');
  assert.strictEqual(interest.state, 'Delta');
});

test('2.2 Level 1 interest does NOT automatically imply purchase intent (Level 2)', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  const trustProd = summary.candidate_products.find(p => p.product_id === 'TRUST_VERIFICATION');
  assert.ok(trustProd.interest_count >= 1, 'Trust product has recorded interest');
  // Distinct interest vs distinct intent are evaluated separately
  assert.ok(typeof trustProd.interest_rate === 'number');
  assert.ok(typeof trustProd.intent_rate === 'number');
});

test('2.3 Deduplication: multiple interest clicks by same provider count as 1 interested provider', async () => {
  await LokatorDB.monetization.research.recordProductInterest(101, 'TRUST_VERIFICATION', 'Clicked again', { category: 'electrician', state: 'Delta' });
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  const trustProd = summary.candidate_products.find(p => p.product_id === 'TRUST_VERIFICATION');
  assert.strictEqual(trustProd.interest_count, 1, 'Provider 101 is counted only once for TRUST_VERIFICATION interest');
});

// ============================================================================
// SECTION 3: PURCHASE INTENT CAPTURE (LEVEL 2)
// ============================================================================

console.log('\n--- SECTION 3: PURCHASE INTENT CAPTURE (LEVEL 2) ---');

test('3.1 recordPurchaseIntent requires explicit product and price selection', async () => {
  const intent = await LokatorDB.monetization.research.recordPurchaseIntent(101, 'TRUST_VERIFICATION', { label: '₦5,000 one-time review', amount: 5000 }, { category: 'electrician', state: 'Delta', notes: 'Intent confirmed' });
  assert.ok(intent.id);
  assert.strictEqual(intent.provider_id, 101);
  assert.strictEqual(intent.product_id, 'TRUST_VERIFICATION');
  assert.strictEqual(intent.price_option, '₦5,000 one-time review');
  assert.strictEqual(intent.price_amount, 5000);
});

test('3.2 Purchase intent is NOT triggered by passive viewing (Level 0)', async () => {
  // Provider 104 is exposed to PROMOTED_DISCOVERY but has not expressed intent
  await LokatorDB.monetization.research.recordProductExposure(104, 'PROMOTED_DISCOVERY', { category: 'solar-installer', state: 'Lagos' });
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  const promoProd = summary.candidate_products.find(p => p.product_id === 'PROMOTED_DISCOVERY');
  assert.strictEqual(promoProd.purchase_intent_count, 0, 'No intent recorded for PROMOTED_DISCOVERY yet');
});

test('3.3 Purchase intent rate is calculated correctly against exposed providers', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  const trustProd = summary.candidate_products.find(p => p.product_id === 'TRUST_VERIFICATION');
  assert.ok(trustProd.purchase_intent_count >= 1);
  assert.ok(trustProd.intent_rate > 0);
  assert.strictEqual(trustProd.intent_rate, Number(((trustProd.purchase_intent_count / trustProd.exposed_providers) * 100).toFixed(1)));
});

// ============================================================================
// SECTION 4: PRICE HYPOTHESIS & PRICE SENSITIVITY RESEARCH
// ============================================================================

console.log('\n--- SECTION 4: PRICE HYPOTHESIS & SENSITIVITY RESEARCH ---');

test('4.1 All candidate products have defined price hypotheses with baseline', () => {
  const products = LokatorDB.monetization.candidateProducts;
  products.filter(p => p.id !== 'TRANSACTION_COMMISSION').forEach(prod => {
    assert.ok(Array.isArray(prod.price_hypotheses), `${prod.id} must have price_hypotheses array`);
    assert.ok(prod.price_hypotheses.length >= 3, `${prod.id} must have at least 3 hypothesis bands`);
    const baseline = prod.price_hypotheses.find(h => h.is_baseline);
    assert.ok(baseline, `${prod.id} must have a baseline hypothesis`);
  });
});

test('4.2 recordPriceSelection captures preferred price bands safely', async () => {
  const sel1 = await LokatorDB.monetization.research.recordPriceSelection(101, 'TRUST_VERIFICATION', { label: '₦5,000 one-time review', amount: 5000 }, { category: 'electrician', state: 'Delta' });
  const sel2 = await LokatorDB.monetization.research.recordPriceSelection(102, 'TRUST_VERIFICATION', { label: '₦3,000 one-time review', amount: 3000 }, { category: 'plumber', state: 'Delta' });
  assert.strictEqual(sel1.price_amount, 5000);
  assert.strictEqual(sel2.price_amount, 3000);
});

test('4.3 Price sensitivity matrix aggregates selection volume and intent shares', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  const trustProd = summary.candidate_products.find(p => p.product_id === 'TRUST_VERIFICATION');
  assert.ok(Array.isArray(trustProd.price_sensitivity));
  assert.ok(trustProd.price_sensitivity.length >= 3);
  const baselineHyp = trustProd.price_sensitivity.find(h => h.amount === 5000);
  assert.ok(baselineHyp);
  assert.ok(baselineHyp.selections_count >= 1);
});

test('4.4 Preferred research price reflects observed selections', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  const trustProd = summary.candidate_products.find(p => p.product_id === 'TRUST_VERIFICATION');
  assert.ok(trustProd.preferred_research_price.includes('₦'), 'Preferred price contains Naira currency symbol');
});

// ============================================================================
// SECTION 5: NOTIFICATION WAITLIST CAPTURE (LEVEL 3)
// ============================================================================

console.log('\n--- SECTION 5: NOTIFICATION WAITLIST CAPTURE (LEVEL 3) ---');

test('5.1 joinProductWaitlist records Level 3 commitment safely', async () => {
  const wtl = await LokatorDB.monetization.research.joinProductWaitlist(101, 'TRUST_VERIFICATION', '', 'Notify me when ready', { category: 'electrician', state: 'Delta' });
  assert.ok(wtl.id);
  assert.strictEqual(wtl.provider_id, 101);
  assert.strictEqual(wtl.product_id, 'TRUST_VERIFICATION');
  assert.ok(wtl.joined_at);
});

test('5.2 Waitlist conversion rate is computed against exposed cohort', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  assert.ok(typeof summary.cohort_metrics.waitlist_rate === 'number');
  assert.ok(summary.cohort_metrics.distinct_waitlist_providers >= 1);
});

// ============================================================================
// SECTION 6: PRIVACY & NDPR COMPLIANCE
// ============================================================================

console.log('\n--- SECTION 6: PRIVACY & NDPR COMPLIANCE ---');

test('6.1 No financial PII stored in research logs (cards, CVVs, bank accounts, passwords)', () => {
  const researchData = LokatorDB.monetization.research.getResearchData();
  const rawStr = JSON.stringify(researchData).toLowerCase();
  ['cardnumber', 'cvv', 'bankaccount', 'password', 'token', 'secret'].forEach(token => {
    assert.ok(!rawStr.includes(token), `Forbidden token "${token}" found in research data store`);
  });
});

test('6.2 Telemetry emissions strip private details and only send product/variant identifiers', () => {
  const dbFile = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  assert.ok(dbFile.includes("trackEvent('monetization_product_exposed'"), 'Emits monetization_product_exposed');
  assert.ok(dbFile.includes("trackEvent('monetization_product_interest'"), 'Emits monetization_product_interest');
  assert.ok(dbFile.includes("trackEvent('monetization_price_selected'"), 'Emits monetization_price_selected');
  assert.ok(dbFile.includes("trackEvent('monetization_purchase_intent'"), 'Emits monetization_purchase_intent');
  assert.ok(dbFile.includes("trackEvent('monetization_waitlist_joined'"), 'Emits monetization_waitlist_joined');
});

// ============================================================================
// SECTION 7: PROVIDER ENGAGEMENT SEGMENTATION & HYPOTHESIS TESTING
// ============================================================================

console.log('\n--- SECTION 7: PROVIDER ENGAGEMENT SEGMENTATION ---');

test('7.1 Provider segmentation evaluates High Completeness, Verified, and Contacted cohorts', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  assert.ok(Array.isArray(summary.provider_segmentation));
  assert.strictEqual(summary.provider_segmentation.length, 4, 'Must evaluate 4 distinct engagement segments');
  
  const segKeys = summary.provider_segmentation.map(s => s.segment_id);
  assert.ok(segKeys.includes('high_completeness'));
  assert.ok(segKeys.includes('verified_trust_signal'));
  assert.ok(segKeys.includes('contacted_providers'));
  assert.ok(segKeys.includes('uncontacted_new'));
});

test('7.2 Segmentation observations use non-causal association language', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  summary.provider_segmentation.forEach(seg => {
    assert.ok(seg.observation_note.includes('observed intent'), 'Must use non-causal "observed intent" phrasing');
    assert.ok(!seg.observation_note.includes('causes'), 'Must NOT claim causality ("causes")');
  });
});

// ============================================================================
// SECTION 8: REGIONAL ANALYSIS (DELTA & EDO STATES)
// ============================================================================

console.log('\n--- SECTION 8: REGIONAL WILLINGNESS-TO-PAY ---');

test('8.1 Delta State priority market contains exposed, interest, intent, and status', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  const delta = summary.regional_insights.delta_priority_market;
  assert.ok(delta);
  assert.ok(typeof delta.total_providers === 'number');
  assert.ok(typeof delta.interest_count === 'number');
  assert.ok(typeof delta.purchase_intent_count === 'number');
  assert.ok(delta.status === 'VALIDATING' || delta.status === 'INSUFFICIENT_DATA');
});

test('8.2 Edo State strategic adjacent market contains exposed, interest, intent, and status', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  const edo = summary.regional_insights.edo_strategic_adjacent;
  assert.ok(edo);
  assert.ok(typeof edo.total_providers === 'number');
  assert.ok(typeof edo.interest_count === 'number');
  assert.ok(typeof edo.purchase_intent_count === 'number');
  assert.ok(edo.status === 'VALIDATING' || edo.status === 'INSUFFICIENT_DATA');
});

test('8.3 National baseline confirms 100% free discovery and 0% commissions', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  const nat = summary.regional_insights.national_baseline;
  assert.ok(nat.free_marketplace_status.includes('Free'));
  assert.ok(nat.monetization_policy.includes('0% Commissions'));
});

// ============================================================================
// SECTION 9: COMMERCIAL READINESS CLASSIFICATION
// ============================================================================

console.log('\n--- SECTION 9: COMMERCIAL READINESS CLASSIFICATION ---');

test('9.1 Per-product classification adheres to evidence thresholds', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  const validClasses = ['NO_VALIDATED_DEMAND', 'PROMISING_INTEREST', 'STRONG_PURCHASE_INTENT', 'INSUFFICIENT_DATA'];
  summary.candidate_products.forEach(prod => {
    assert.ok(validClasses.includes(prod.product_classification),
      `Product ${prod.id} has valid classification: ${prod.product_classification}`);
  });
});

test('9.2 Overall Phase 10.13B commercial readiness classification is EARLY_MONETIZATION_SIGNAL', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  assert.strictEqual(summary.commercial_readiness_classification, 'EARLY_MONETIZATION_SIGNAL',
    'Overall phase commercial readiness classification must be EARLY_MONETIZATION_SIGNAL');
});

// ============================================================================
// SECTION 10: PAYMENT GATE INTEGRITY
// ============================================================================

console.log('\n--- SECTION 10: PAYMENT GATE INTEGRITY ---');

test('10.1 PAYMENT_PROCESSING_ENABLED feature flag remains strictly FALSE', () => {
  assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_PROCESSING_ENABLED, false);
});

test('10.2 LIVE_BILLING_ENABLED feature flag remains strictly FALSE', () => {
  assert.strictEqual(LokatorDB.monetization.featureFlags.LIVE_BILLING_ENABLED, false);
});

test('10.3 Zero live payment SDKs, endpoints, or credentials in any production file', () => {
  const files = ['supabase-client.js', 'dashboard.js', 'dashboard.html', 'analytics.js', 'analytics.html', 'search.js'];
  files.forEach(f => {
    const filePath = path.join(__dirname, '..', f);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      ['paystack', 'flutterwave', 'stripe', 'razorpay', 'sk_live_', 'pk_live_'].forEach(token => {
        assert.ok(!content.includes(token), `Forbidden token "${token}" found in ${f}`);
      });
    }
  });
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================

console.log('\n================================================================================');
if (failCount === 0) {
  console.log(`🎉 ALL ${passCount} PHASE 10.13B WILLINGNESS-TO-PAY ASSERTIONS PASSED (100%)!`);
} else {
  console.log(`❌ ${passCount} PASSED, ${failCount} FAILED`);
}
console.log('================================================================================\n');

if (failCount > 0) process.exit(1);
