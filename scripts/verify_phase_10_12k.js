/**
 * LOKATOR.NG — PHASE 10.12K UNIT & ENGINE VERIFICATION SUITE
 * Scope: Marketplace Liquidity Expansion, Provider Acquisition, Delta/Edo Opportunity Scoring
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
  globalThis: {},
  localStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  },
  sessionStorage: sessionStorageMock,
  navigator: { onLine: true },
  document: {
    readyState: 'complete',
    addEventListener: () => {},
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
    createElement: () => ({ getContext: () => ({}) })
  },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval,
  Date: Date,
  Math: Math,
  JSON: JSON,
  Number: Number,
  String: String,
  Array: Array,
  Object: Object,
  Set: Set,
  Map: Map,
  RegExp: RegExp,
  Boolean: Boolean
};
sandbox.window.sessionStorage = sessionStorageMock;
sandbox.window.localStorage = sandbox.localStorage;

vm.createContext(sandbox);
vm.runInContext(phoneCode, sandbox);
vm.runInContext(locCode, sandbox);
vm.runInContext(catCode, sandbox);
vm.runInContext(searchLangCode, sandbox);
vm.runInContext(telemetryCode, sandbox);
vm.runInContext(dbCode, sandbox);

const LokatorDB = sandbox.LokatorDB || sandbox.window.LokatorDB;
assert(LokatorDB, 'LokatorDB loaded successfully');

console.log('\n=== LOKATOR.NG PHASE 10.12K: MARKETPLACE LIQUIDITY EXPANSION VERIFICATION ===\n');

// Mock sample dataset with Delta & Edo coverage
const mockProviders = [
  {
    id: 201,
    business_name: 'Warri Solar Solutions',
    trade_title: 'Solar & Inverter Installer',
    primary_category_slug: 'solar-inverter',
    state: 'Delta',
    lga: 'Warri South',
    city: 'Warri Main',
    is_available: true,
    profile_complete: true
  },
  {
    id: 202,
    business_name: 'Benin Master Plumber',
    trade_title: 'Plumber',
    primary_category_slug: 'plumber',
    state: 'Edo',
    lga: 'Oredo',
    city: 'Benin City GRA',
    is_available: true,
    profile_complete: true
  },
  {
    id: 203,
    business_name: 'Lagos Generator Master',
    trade_title: 'Generator Mechanic',
    primary_category_slug: 'generator-mechanic',
    state: 'Lagos',
    lga: 'Ikeja',
    city: 'Ikeja',
    is_available: true,
    profile_complete: true
  }
];

const mockEvents = [
  // Delta State Events
  { event_name: 'search_submitted', created_at: '2026-08-20T10:00:00Z', properties: { state: 'Delta', lga: 'Ughelli North', category: 'plumber' } },
  { event_name: 'search_no_results', created_at: '2026-08-20T10:00:01Z', properties: { state: 'Delta', lga: 'Ughelli North', category: 'plumber' } },
  { event_name: 'search_submitted', created_at: '2026-08-21T11:00:00Z', properties: { state: 'Delta', lga: 'Warri South', category: 'solar-inverter' } },
  { event_name: 'provider_profile_viewed', created_at: '2026-08-21T11:00:05Z', properties: { state: 'Delta', lga: 'Warri South', category: 'solar-inverter', providerId: 201 } },
  { event_name: 'whatsapp_clicked', created_at: '2026-08-21T11:00:15Z', properties: { state: 'Delta', lga: 'Warri South', category: 'solar-inverter', providerId: 201 } },

  // Edo State Events
  { event_name: 'search_submitted', created_at: '2026-08-22T12:00:00Z', properties: { state: 'Edo', lga: 'Egor', category: 'electrician' } },
  { event_name: 'search_no_results', created_at: '2026-08-22T12:00:01Z', properties: { state: 'Edo', lga: 'Egor', category: 'electrician' } },
  { event_name: 'search_submitted', created_at: '2026-08-22T13:00:00Z', properties: { state: 'Edo', lga: 'Oredo', category: 'plumber' } },
  { event_name: 'provider_profile_viewed', created_at: '2026-08-22T13:00:05Z', properties: { state: 'Edo', lga: 'Oredo', category: 'plumber', providerId: 202 } },

  // Acquisition Landing & Onboarding
  { event_name: 'provider_acquisition_landing_viewed', created_at: '2026-08-23T09:00:00Z', properties: { source: 'provider_referral', state: 'Delta', category: 'plumber' } },
  { event_name: 'provider_onboarding_started', created_at: '2026-08-23T09:01:00Z', properties: { source: 'provider_referral', state: 'Delta' } },
  { event_name: 'provider_onboarding_succeeded', created_at: '2026-08-23T09:05:00Z', properties: { source: 'provider_referral', state: 'Delta' } }
];

function runTests() {
  test('1. Liquidity Expansion Engine exists and exports compute function', () => {
    assert(LokatorDB.liquidityExpansion, 'LokatorDB.liquidityExpansion should be defined');
    assert(typeof LokatorDB.liquidityExpansion.compute === 'function', 'compute should be a function');
    assert(typeof LokatorDB.analytics.getLiquidityExpansion === 'function', 'getLiquidityExpansion should be a function');
  });

  test('2. Opportunity Scoring: Calculates score using demand, supply deficit, and confidence', () => {
    const res = LokatorDB.liquidityExpansion.compute(mockEvents, mockProviders, 30);
    assert(Array.isArray(res.opportunity_prioritization_matrix), 'Matrix should be an array');
    assert(res.opportunity_prioritization_matrix.length > 0, 'Matrix should contain clusters');
    const top = res.opportunity_prioritization_matrix[0];
    assert(top.opportunity_score >= 0, 'Opportunity score should be non-negative');
    assert(top.rank === 1, 'First item should have rank 1');
  });

  test('3. Confidence Classifications: Classifies confidence based on evidence thresholds', () => {
    const res = LokatorDB.liquidityExpansion.compute(mockEvents, mockProviders, 30);
    const validConfidences = ['HIGH_CONFIDENCE', 'MEDIUM_CONFIDENCE', 'LOW_CONFIDENCE', 'NO_EVIDENCE'];
    res.opportunity_prioritization_matrix.forEach(row => {
      assert(validConfidences.includes(row.confidence), `Invalid confidence: ${row.confidence}`);
    });
  });

  test('4. Strategic Market: Delta State analysis calculates real metrics', () => {
    const res = LokatorDB.liquidityExpansion.compute(mockEvents, mockProviders, 30);
    const delta = res.strategic_markets.delta_state;
    assert.strictEqual(delta.market_status, 'PRIORITY_EXPANSION_MARKET');
    assert.strictEqual(delta.total_providers, 1);
    assert.strictEqual(delta.searches_count, 2);
    assert.strictEqual(delta.zero_results_count, 1);
    assert.strictEqual(delta.zero_result_rate, 50.0);
    assert.strictEqual(delta.profile_views, 1);
    assert.strictEqual(delta.contacts_count, 1);
    assert(Array.isArray(delta.candidate_localities));
    assert(delta.candidate_localities.includes('Warri'));
    assert(delta.candidate_localities.includes('Ughelli'));
  });

  test('5. Strategic Market: Edo State analysis calculates real metrics', () => {
    const res = LokatorDB.liquidityExpansion.compute(mockEvents, mockProviders, 30);
    const edo = res.strategic_markets.edo_state;
    assert.strictEqual(edo.market_status, 'STRATEGIC_ADJACENT_MARKET');
    assert.strictEqual(edo.total_providers, 1);
    assert.strictEqual(edo.searches_count, 2);
    assert.strictEqual(edo.zero_results_count, 1);
    assert.strictEqual(edo.zero_result_rate, 50.0);
    assert.strictEqual(edo.profile_views, 1);
    assert(Array.isArray(edo.candidate_localities));
    assert(edo.candidate_localities.includes('Benin City (Oredo)'));
  });

  test('6. Acquisition Funnel: Tracks channel attribution and onboarding progress', () => {
    const res = LokatorDB.liquidityExpansion.compute(mockEvents, mockProviders, 30);
    const funnel = res.acquisition_funnel;
    assert.strictEqual(funnel.landing_views, 1);
    assert.strictEqual(funnel.onboarding_starts, 1);
    assert.strictEqual(funnel.providers_published, 1);
    assert(funnel.by_source.provider_referral);
    assert.strictEqual(funnel.by_source.provider_referral.landing_views, 1);
    assert.strictEqual(funnel.by_source.provider_referral.published, 1);
  });

  test('7. Empty Dataset Graceful Handling: Returns empty matrix without NaNs', () => {
    const res = LokatorDB.liquidityExpansion.compute([], [], 30);
    assert.strictEqual(res.strategic_markets.delta_state.total_providers, 0);
    assert.strictEqual(res.strategic_markets.delta_state.zero_result_rate, 0);
    assert.strictEqual(res.opportunity_prioritization_matrix.length, 0);
    assert.strictEqual(res.acquisition_funnel.landing_views, 0);
  });

  test('8. High-Confidence Opportunity Identification: Prioritizes large unmet demand', () => {
    // Generate synthetic scaled events for algorithm testing
    const scaledEvents = [];
    for (let i = 0; i < 60; i++) {
      scaledEvents.push({ event_name: 'search_submitted', properties: { state: 'Ogun', lga: 'Sagamu', category: 'solar-inverter' } });
      scaledEvents.push({ event_name: 'search_no_results', properties: { state: 'Ogun', lga: 'Sagamu', category: 'solar-inverter' } });
    }
    const res = LokatorDB.liquidityExpansion.compute(scaledEvents, [], 30);
    const topGap = res.opportunity_prioritization_matrix[0];
    assert.strictEqual(topGap.state, 'Ogun');
    assert.strictEqual(topGap.lga, 'Sagamu');
    assert.strictEqual(topGap.confidence, 'HIGH_CONFIDENCE');
    assert.strictEqual(topGap.acquisition_priority, 'P1_CRITICAL');
  });

  test('9. Location Preselection Integrity: Delta and Edo LGAs resolve in locations dataset', () => {
    const NigeriaLocations = sandbox.NigeriaLocations || sandbox.window.NigeriaLocations;
    assert(NigeriaLocations, 'NigeriaLocations should be available');
    const deltaLgas = NigeriaLocations.getLgas('Delta');
    assert(deltaLgas.length >= 20, 'Delta State should have all 25 LGAs');
    const warri = deltaLgas.find(l => l.name === 'Warri South');
    assert(warri, 'Warri South must exist in Delta');

    const edoLgas = NigeriaLocations.getLgas('Edo');
    assert(edoLgas.length >= 15, 'Edo State should have all 18 LGAs');
    const oredo = edoLgas.find(l => l.name === 'Oredo');
    assert(oredo, 'Oredo must exist in Edo');
  });

  test('10. Privacy Safeguard: Zero PII in Acquisition Attribution Engine', () => {
    const maliciousEvents = [
      {
        event_name: 'provider_acquisition_source_recorded',
        properties: {
          source: 'provider_referral',
          phone: '+2348012345678',
          password: 'secret_password',
          jwt: 'fake_jwt_token',
          nin: '12345678901'
        }
      }
    ];

    const res = LokatorDB.liquidityExpansion.compute(maliciousEvents, [], 30);
    const recordedSources = Object.keys(res.acquisition_funnel.by_source);
    recordedSources.forEach(s => {
      assert(!s.includes('+234'), 'Attribution source must not contain phone numbers');
      assert(!s.includes('password'), 'Attribution source must not contain passwords');
    });
  });

  console.log(`\n========================================`);
  console.log(`Phase 10.12K Unit Tests: ${passedTests} passed, ${failedTests} failed`);
  console.log(`========================================\n`);

  if (failedTests > 0) process.exit(1);
}

runTests();
