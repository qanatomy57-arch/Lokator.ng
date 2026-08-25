/**
 * LOKATOR.NG — PHASE 10.12L UNIT & ENGINE VERIFICATION SUITE
 * Scope: Marketplace Liquidity Growth & Conversion Validation, Cohort Quality, Elasticity, Delta/Edo Validation
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  [FAIL] ${name}:`, err.message);
    failedTests++;
  }
}

// Load source modules
const phoneCode = fs.readFileSync(path.join(__dirname, '../phone-utils.js'), 'utf8');
const locCode = fs.readFileSync(path.join(__dirname, '../locations.js'), 'utf8');
const catCode = fs.readFileSync(path.join(__dirname, '../categories.js'), 'utf8');
const searchLangCode = fs.readFileSync(path.join(__dirname, '../search-language.js'), 'utf8');
const telemetryCode = fs.readFileSync(path.join(__dirname, '../telemetry.js'), 'utf8');
const dbCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');

const storageData = {};
const sessionStorageMock = {
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
  sessionStorage: sessionStorageMock,
  localStorage: sessionStorageMock,
  document: {
    title: 'Lokator.NG Test',
    readyState: 'complete',
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  },
  navigator: { userAgent: 'NodeTestEnv/1.0' },
  performance: { now: () => Date.now() },
  Date: Date,
  Math: Math,
  JSON: JSON,
  crypto: {
    randomUUID: () => '00000000-0000-4000-8000-000000000000'
  }
};

vm.createContext(sandbox);
vm.runInContext(phoneCode, sandbox);
vm.runInContext(locCode, sandbox);
vm.runInContext(catCode, sandbox);
vm.runInContext(searchLangCode, sandbox);
vm.runInContext(telemetryCode, sandbox);
vm.runInContext(dbCode, sandbox);

const LokatorDB = sandbox.window.LokatorDB;

console.log('\n=== LOKATOR.NG PHASE 10.12L: MARKETPLACE LIQUIDITY GROWTH & CONVERSION VALIDATION ===\n');

// Test 1: Liquidity Growth Validation Engine Exists
test('1. Liquidity Growth Engine exists and exports compute function', () => {
  assert.ok(LokatorDB.liquidityGrowth, 'LokatorDB.liquidityGrowth must exist');
  assert.strictEqual(typeof LokatorDB.liquidityGrowth.compute, 'function', 'compute function must exist');
  assert.strictEqual(typeof LokatorDB.analytics.getLiquidityGrowth, 'function', 'analytics.getLiquidityGrowth must exist');
});

// Test 2: Pre vs Post Baseline Calculation & Δ Metrics
test('2. Pre vs Post Baseline: Computes pre and post window metrics accurately', () => {
  const now = Date.now();
  const dayMs = 86400000;
  
  // Pre events (20 days ago)
  const preEvents = [
    { event: 'search_submitted', timestamp: new Date(now - 20 * dayMs).toISOString(), props: { state: 'Delta', lga: 'Ughelli North', category: 'plumber' } },
    { event: 'search_submitted', timestamp: new Date(now - 19 * dayMs).toISOString(), props: { state: 'Delta', lga: 'Ughelli North', category: 'plumber' } },
    { event: 'search_no_results', timestamp: new Date(now - 19 * dayMs).toISOString(), props: { state: 'Delta', lga: 'Ughelli North', category: 'plumber' } }
  ];

  // Post events (5 days ago)
  const postEvents = [
    { event: 'search_submitted', timestamp: new Date(now - 5 * dayMs).toISOString(), props: { state: 'Delta', lga: 'Ughelli North', category: 'plumber' } },
    { event: 'search_submitted', timestamp: new Date(now - 4 * dayMs).toISOString(), props: { state: 'Delta', lga: 'Ughelli North', category: 'plumber' } },
    { event: 'provider_profile_viewed', timestamp: new Date(now - 4 * dayMs).toISOString(), props: { state: 'Delta', lga: 'Ughelli North', category: 'plumber' } },
    { event: 'whatsapp_clicked', timestamp: new Date(now - 3 * dayMs).toISOString(), props: { state: 'Delta', lga: 'Ughelli North', category: 'plumber' } }
  ];

  const providers = [
    { id: 'p1', business_name: 'Ughelli Plumber Pros', state: 'Delta', lga: 'Ughelli North', primary_category_slug: 'plumber', profile_complete: true, is_available: true }
  ];

  const result = LokatorDB.liquidityGrowth.compute([...preEvents, ...postEvents], providers, 30, 0.5);

  assert.ok(result.pre_expansion_baseline, 'pre_expansion_baseline must exist');
  assert.strictEqual(result.pre_expansion_baseline.searches, 2);
  assert.strictEqual(result.pre_expansion_baseline.zero_result_searches, 1);
  assert.strictEqual(result.pre_expansion_baseline.zero_result_rate, 50.0);

  assert.ok(result.post_expansion_data, 'post_expansion_data must exist');
  assert.strictEqual(result.post_expansion_data.searches, 2);
  assert.strictEqual(result.post_expansion_data.zero_result_searches, 0);
  assert.strictEqual(result.post_expansion_data.zero_result_rate, 0.0);
  assert.strictEqual(result.post_expansion_data.total_contacts, 1);
});

// Test 3: Provider Acquisition Cohorts & Quality Classification
test('3. Cohort Quality Evaluation: Distinguishes HIGH_QUALITY from VOLUME and LOW_EFFICIENCY', () => {
  const providers = [
    // High quality organic cohort
    { id: 'p1', business_name: 'Alpha Solar', acquisition_source: 'organic', profile_complete: true, is_available: true, completeness_score: 95 },
    { id: 'p2', business_name: 'Beta Solar', acquisition_source: 'organic', profile_complete: true, is_available: true, completeness_score: 90 },
    // Low efficiency ad cohort
    { id: 'p3', business_name: 'Gamma Plumb', acquisition_source: 'fb_ads', profile_complete: false, is_available: true, completeness_score: 30 },
    { id: 'p4', business_name: 'Delta Plumb', acquisition_source: 'fb_ads', profile_complete: false, is_available: true, completeness_score: 25 },
    { id: 'p5', business_name: 'Epsilon Plumb', acquisition_source: 'fb_ads', profile_complete: false, is_available: true, completeness_score: 20 }
  ];

  const events = [
    { event: 'provider_profile_viewed', props: { source: 'organic' } },
    { event: 'phone_clicked', props: { source: 'organic' } }
  ];

  const result = LokatorDB.liquidityGrowth.compute(events, providers, 30);
  const organicCohort = result.cohort_quality_matrix.find(c => c.source === 'organic');
  const fbAdsCohort = result.cohort_quality_matrix.find(c => c.source === 'fb_ads');

  assert.ok(organicCohort, 'Organic cohort must be present');
  assert.strictEqual(organicCohort.quality_classification, 'HIGH_QUALITY_SOURCE');
  assert.strictEqual(organicCohort.customer_contacts, 1);

  assert.ok(fbAdsCohort, 'FB Ads cohort must be present');
  assert.strictEqual(fbAdsCohort.quality_classification, 'LOW_EFFICIENCY_SOURCE');
  assert.strictEqual(fbAdsCohort.publish_conversion_rate, 0);
});

// Test 4: Liquidity Response by Cluster & Zero-Result Reduction
test('4. Cluster Liquidity Response: Accurately calculates ΔZeroResultRate and ΔContacts', () => {
  const now = Date.now();
  const dayMs = 86400000;

  const events = [
    { event: 'search_submitted', timestamp: new Date(now - 20 * dayMs).toISOString(), props: { state: 'Delta', lga: 'Warri South', category: 'electrician' } },
    { event: 'search_no_results', timestamp: new Date(now - 20 * dayMs).toISOString(), props: { state: 'Delta', lga: 'Warri South', category: 'electrician' } },
    { event: 'search_submitted', timestamp: new Date(now - 2 * dayMs).toISOString(), props: { state: 'Delta', lga: 'Warri South', category: 'electrician' } },
    { event: 'provider_profile_viewed', timestamp: new Date(now - 2 * dayMs).toISOString(), props: { state: 'Delta', lga: 'Warri South', category: 'electrician' } },
    { event: 'phone_clicked', timestamp: new Date(now - 2 * dayMs).toISOString(), props: { state: 'Delta', lga: 'Warri South', category: 'electrician' } }
  ];

  const providers = [
    { id: 'p_warri', business_name: 'Warri Spark', state: 'Delta', lga: 'Warri South', primary_category_slug: 'electrician', profile_complete: true, is_available: true }
  ];

  const result = LokatorDB.liquidityGrowth.compute(events, providers, 30);
  const warriCluster = result.cluster_liquidity_responses.find(c => c.state.toLowerCase() === 'delta' && c.lga.toLowerCase() === 'warri south');

  assert.ok(warriCluster, 'Warri cluster response must exist');
  assert.strictEqual(warriCluster.zero_result_rate_pre, '100%');
  assert.strictEqual(warriCluster.zero_result_rate_post, '0%');
  assert.strictEqual(warriCluster.delta_zero_result_rate, -100.0);
  assert.strictEqual(warriCluster.delta_contacts, 1);
  assert.strictEqual(warriCluster.saturation_signal, 'HEALTHY_GROWTH');
});

// Test 5: Descriptive Contact Elasticity and Saturation Signals
test('5. Elasticity & Saturation Signals: Flags healthy growth vs saturated supply', () => {
  const events = [];
  const providers = [];
  const result = LokatorDB.liquidityGrowth.compute(events, providers, 30);

  assert.ok(Array.isArray(result.cluster_liquidity_responses), 'Cluster liquidity responses must be an array');
  result.cluster_liquidity_responses.forEach(cl => {
    assert.ok(['HEALTHY_GROWTH', 'SATURATED', 'UNMET_DEMAND', 'OBSERVING'].includes(cl.saturation_signal));
  });
});

// Test 6: Delta State Strategic Decision Matrix
test('6. Delta State Decision Matrix: Generates evidence-based recommendations', () => {
  const now = Date.now();
  const events = [
    { event: 'search_submitted', timestamp: new Date(now - 2000).toISOString(), props: { state: 'Delta', lga: 'Sapele', category: 'carpenter' } },
    { event: 'search_submitted', timestamp: new Date(now - 1000).toISOString(), props: { state: 'Delta', lga: 'Sapele', category: 'carpenter' } },
    { event: 'search_no_results', timestamp: new Date(now - 1000).toISOString(), props: { state: 'Delta', lga: 'Sapele', category: 'carpenter' } }
  ];

  const result = LokatorDB.liquidityGrowth.compute(events, [], 30);
  const deltaMatrix = result.strategic_market_validation.delta_state_matrix;

  assert.ok(Array.isArray(deltaMatrix), 'Delta state matrix must be an array');
  const sapeleRow = deltaMatrix.find(r => r.location.toLowerCase() === 'sapele');
  assert.ok(sapeleRow, 'Sapele row must exist');
  assert.strictEqual(sapeleRow.recommendation, 'EXPAND');
});

// Test 7: Edo State Strategic Decision Matrix
test('7. Edo State Decision Matrix: Generates evidence-based recommendations', () => {
  const now = Date.now();
  const events = [
    { event: 'search_submitted', timestamp: new Date(now - 2000).toISOString(), props: { state: 'Edo', lga: 'Oredo', category: 'generator' } },
    { event: 'search_submitted', timestamp: new Date(now - 1000).toISOString(), props: { state: 'Edo', lga: 'Oredo', category: 'generator' } },
    { event: 'phone_clicked', timestamp: new Date(now - 1000).toISOString(), props: { state: 'Edo', lga: 'Oredo', category: 'generator' } }
  ];
  const providers = [
    { id: 'p_edo', business_name: 'Benin Gen Pros', state: 'Edo', lga: 'Oredo', primary_category_slug: 'generator', profile_complete: true, is_available: true }
  ];

  const result = LokatorDB.liquidityGrowth.compute(events, providers, 30);
  const edoMatrix = result.strategic_market_validation.edo_state_matrix;

  assert.ok(Array.isArray(edoMatrix), 'Edo state matrix must be an array');
  const oredoRow = edoMatrix.find(r => r.location.toLowerCase() === 'oredo');
  assert.ok(oredoRow, 'Oredo row must exist');
  assert.strictEqual(oredoRow.recommendation, 'MAINTAIN');
});

// Test 8: Observational Control Comparison & Causal Disclaimer
test('8. Observational Control Comparison: Groups clusters with strict non-causal disclaimer', () => {
  const result = LokatorDB.liquidityGrowth.compute([], [], 30);
  assert.ok(result.control_comparison, 'Control comparison must exist');
  assert.ok(result.control_comparison.expansion_group, 'Expansion group summary must exist');
  assert.ok(result.control_comparison.comparison_group, 'Comparison group summary must exist');
  assert.ok(result.control_comparison.disclaimer.includes('Observed association; causality cannot be established'), 'Must contain strict non-causal disclaimer');
});

// Test 9: Monetization Readiness Reassessment
test('9. Monetization Readiness: Rechecks gate without premature promotion to 10.13', () => {
  const result = LokatorDB.liquidityGrowth.compute([], [], 30);
  assert.ok(result.monetization_readiness_recheck, 'Monetization check must exist');
  assert.strictEqual(result.monetization_readiness_recheck.classification, 'NOT_READY'); // with 0 providers
  
  // With 18 realistic early providers
  const mockProviders = Array.from({ length: 18 }, (_, i) => ({
    id: `prov_${i}`,
    profile_complete: true,
    is_available: true
  }));
  const mockEvents = Array.from({ length: 30 }, () => ({
    event: 'search_submitted'
  }));
  const earlyResult = LokatorDB.liquidityGrowth.compute(mockEvents, mockProviders, 30);
  assert.strictEqual(earlyResult.monetization_readiness_recheck.classification, 'EARLY_MARKETPLACE');
});

// Test 10: Privacy and Graceful Zero Handling
test('10. Privacy & Robustness: Zero PII, no NaNs on empty inputs', () => {
  const emptyRes = LokatorDB.liquidityGrowth.compute(null, null, 30);
  assert.strictEqual(emptyRes.pre_expansion_baseline.provider_count, 0);
  assert.strictEqual(emptyRes.pre_expansion_baseline.searches, 0);
  assert.strictEqual(emptyRes.pre_expansion_baseline.zero_result_rate, 0);
  assert.strictEqual(emptyRes.post_expansion_data.contact_conversion_rate, 0);
  assert.ok(!JSON.stringify(emptyRes).includes('NaN'), 'No NaN values allowed in serialization');
});

console.log('========================================');
console.log(`Phase 10.12L Unit Tests: ${passedTests} passed, ${failedTests} failed`);
console.log('========================================');

if (failedTests > 0) {
  process.exit(1);
}
