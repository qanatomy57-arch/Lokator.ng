/**
 * LOKATOR.NG — PHASE 10.12J UNIT & ENGINE VERIFICATION SUITE
 * Scope: Production Marketplace Validation & Monetization Readiness Gate Engine
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

async function asyncTest(name, fn) {
  try {
    await fn();
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

console.log('\n=== LOKATOR.NG PHASE 10.12J: PRODUCTION MARKETPLACE VALIDATION GATE VERIFICATION ===\n');

// Mock sample dataset
const mockProviders = [
  {
    id: 101,
    business_name: 'Alaba Generator Pro',
    trade_title: 'Generator Mechanic',
    primary_category_slug: 'generator-mechanic',
    state: 'Lagos',
    lga: 'Ikeja',
    city: 'Ikeja',
    rating: 4.9,
    reviews_count: 14,
    is_verified: true,
    nin_verified: true,
    is_available: true,
    profile_complete: true,
    created_at: '2026-08-01T10:00:00Z'
  },
  {
    id: 102,
    business_name: 'Abuja Solar Kings',
    trade_title: 'Solar & Inverter Installer',
    primary_category_slug: 'solar-inverter',
    state: 'FCT',
    lga: 'Abuja Municipal',
    city: 'Wuse 2',
    rating: 4.8,
    reviews_count: 8,
    is_verified: true,
    nin_verified: false,
    is_available: true,
    profile_complete: true,
    created_at: '2026-08-05T12:00:00Z'
  },
  {
    id: 103,
    business_name: 'Ibadan AC Specialist',
    trade_title: 'AC & Refrigeration',
    primary_category_slug: 'ac-refrigeration',
    state: 'Oyo',
    lga: 'Ibadan North',
    city: 'Bodija',
    rating: 4.7,
    reviews_count: 3,
    is_verified: false,
    nin_verified: false,
    is_available: true,
    profile_complete: true,
    created_at: '2026-08-10T14:00:00Z'
  }
];

const mockEvents = [
  // Day 1
  { event_name: 'search_submitted', created_at: '2026-08-20T08:00:00Z', properties: { category: 'generator-mechanic', state: 'Lagos' } },
  { event_name: 'search_result_viewed', created_at: '2026-08-20T08:00:01Z', properties: { category: 'generator-mechanic', state: 'Lagos' } },
  { event_name: 'provider_card_clicked', created_at: '2026-08-20T08:00:05Z', properties: { providerId: 101 } },
  { event_name: 'provider_profile_viewed', created_at: '2026-08-20T08:00:06Z', properties: { providerId: 101, category: 'generator-mechanic' } },
  { event_name: 'whatsapp_clicked', created_at: '2026-08-20T08:00:15Z', properties: { providerId: 101 } },

  // Day 2
  { event_name: 'search_submitted', created_at: '2026-08-21T09:00:00Z', properties: { category: 'solar-inverter', state: 'FCT' } },
  { event_name: 'search_result_viewed', created_at: '2026-08-21T09:00:01Z', properties: { category: 'solar-inverter', state: 'FCT' } },
  { event_name: 'provider_profile_viewed', created_at: '2026-08-21T09:00:10Z', properties: { providerId: 102, category: 'solar-inverter' } },
  { event_name: 'phone_clicked', created_at: '2026-08-21T09:00:20Z', properties: { providerId: 102 } },

  // Day 3 (Zero Result Search)
  { event_name: 'search_submitted', created_at: '2026-08-22T10:00:00Z', properties: { category: 'plumbing', state: 'Kano' } },
  { event_name: 'search_no_results', created_at: '2026-08-22T10:00:01Z', properties: { category: 'plumbing', state: 'Kano' } }
];

async function runTests() {
  test('1. Monetization Readiness Engine exists and exports pure compute function', () => {
    assert(LokatorDB.monetizationReadiness, 'LokatorDB.monetizationReadiness should be defined');
    assert(typeof LokatorDB.monetizationReadiness.compute === 'function', 'compute should be a function');
    assert(typeof LokatorDB.analytics.getMonetizationReadiness === 'function', 'getMonetizationReadiness should be a function');
  });

  test('2. Supply Dimension: Accurately evaluates registered, published, and category/geographic breadth', () => {
    const res = LokatorDB.monetizationReadiness.compute(mockEvents, mockProviders, 30);
    const supply = res.dimensions.supply;
    assert.strictEqual(supply.total_registered, 3);
    assert.strictEqual(supply.total_published, 3);
    assert.strictEqual(supply.publication_rate, 100);
    assert.strictEqual(supply.active_categories_count, 3);
    assert.strictEqual(supply.active_states_count, 3);
  });

  test('3. Demand Dimension: Calculates search results, zero-results, and rates accurately', () => {
    const res = LokatorDB.monetizationReadiness.compute(mockEvents, mockProviders, 30);
    const demand = res.dimensions.demand;
    assert.strictEqual(demand.searches_started, 3);
    assert.strictEqual(demand.searches_with_results, 2);
    assert.strictEqual(demand.zero_result_searches, 1);
    assert.strictEqual(demand.search_result_rate, 66.7);
    assert.strictEqual(demand.zero_result_rate, 33.3);
  });

  test('4. Liquidity Dimension: Accurately measures provider profile views and contact ratio', () => {
    const res = LokatorDB.monetizationReadiness.compute(mockEvents, mockProviders, 30);
    const liq = res.dimensions.liquidity;
    assert.strictEqual(liq.published_providers, 3);
    assert.strictEqual(liq.providers_with_profile_views, 2); // 101 and 102
    assert.strictEqual(liq.providers_with_contacts, 2); // 101 (whatsapp) and 102 (phone)
    assert.strictEqual(liq.liquidity_ratio, 66.7); // 2 out of 3 = 66.7%
  });

  test('5. Engagement & Contact Dimension: Separates WhatsApp vs Phone clicks and evaluates channel preference', () => {
    const res = LokatorDB.monetizationReadiness.compute(mockEvents, mockProviders, 30);
    const con = res.dimensions.contact;
    assert.strictEqual(con.phone_clicks, 1);
    assert.strictEqual(con.whatsapp_clicks, 1);
    assert.strictEqual(con.total_contacts, 2);
    assert.strictEqual(con.whatsapp_preference_ratio, 50.0);
  });

  test('6. Repeatability & Time-based: Accurately counts distinct observation days', () => {
    const res = LokatorDB.monetizationReadiness.compute(mockEvents, mockProviders, 30);
    const rep = res.dimensions.repeatability;
    assert.strictEqual(rep.active_days_count, 3);
    assert.strictEqual(rep.is_repeatable, false); // Target is >= 7 days
  });

  test('7. Data Quality Dimension: Verifies pristine telemetry integrity', () => {
    const res = LokatorDB.monetizationReadiness.compute(mockEvents, mockProviders, 30);
    const dq = res.dimensions.data_quality;
    assert.strictEqual(dq.total_events, 11);
    assert.strictEqual(dq.client_errors, 0);
    assert.strictEqual(dq.error_rate, 0);
    assert.strictEqual(dq.status, 'PRISTINE_INTEGRITY');
  });

  test('8. Classification Gate: Evaluates EARLY_MARKETPLACE when volume is below scale thresholds without manufacturing numbers', () => {
    const res = LokatorDB.monetizationReadiness.compute(mockEvents, mockProviders, 30);
    assert.strictEqual(res.readiness_classification, 'EARLY_MARKETPLACE');
    assert(res.readiness_score > 0 && res.readiness_score < 90, 'Score should reflect early ramp');
    assert(res.blockers.length > 0, 'Blockers should identify supply and search volume ramp requirements');
    assert(res.recommended_next_action.includes('Continue controlled production observation'));
  });

  test('9. Monetization Strategy Ranking: Prioritizes trust badges and locality placement without payment code', () => {
    const res = LokatorDB.monetizationReadiness.compute(mockEvents, mockProviders, 30);
    const ranking = res.monetization_models_ranking;
    assert(Array.isArray(ranking) && ranking.length === 4);
    assert.strictEqual(ranking[0].rank, 1);
    assert(ranking[0].model.includes('Verified Trust Badge'));
    assert.strictEqual(ranking[3].model, 'Marketplace Checkout Commission');
    assert.strictEqual(ranking[3].suitability, 'LOW');
  });

  test('10. NIN/CAC Security & Privacy: Verifies air-gapped security checklist', () => {
    const res = LokatorDB.monetizationReadiness.compute(mockEvents, mockProviders, 30);
    const sec = res.security_audit;
    assert.strictEqual(sec.evidence_storage_isolated, true);
    assert.strictEqual(sec.rls_policy_verified, true);
    assert.strictEqual(sec.service_role_credentials_exposed, false);
    assert.strictEqual(sec.telemetry_pii_clean, true);
    assert.strictEqual(sec.retention_period_days, 60);
  });

  test('11. Empty Dataset Behavior: Gracefully returns NOT_READY with zero NaN or crashes', () => {
    const res = LokatorDB.monetizationReadiness.compute([], [], 30);
    assert.strictEqual(res.readiness_classification, 'NOT_READY');
    assert.strictEqual(res.readiness_score, 0);
    assert.strictEqual(res.dimensions.liquidity.liquidity_ratio, 0);
    assert.strictEqual(res.dimensions.demand.search_result_rate, 0);
    assert.strictEqual(res.dimensions.contact.contact_conversion_rate, 0);
  });

  test('12. High-Scale Dataset Behavior: Returns READY_FOR_10_13 only when meeting full thresholds', () => {
    // Generate scaled synthetic test dataset in memory (for algorithm verification only)
    const scaledProviders = [];
    for (let i = 1; i <= 60; i++) {
      scaledProviders.push({
        id: 1000 + i,
        business_name: `Provider ${i}`,
        trade_title: `Trade ${i % 8}`,
        primary_category_slug: `trade-${i % 8}`,
        state: `State ${i % 6}`,
        is_verified: i % 2 === 0,
        is_available: true,
        profile_complete: true
      });
    }
    const scaledEvents = [];
    for (let d = 1; d <= 10; d++) {
      const dateStr = `2026-08-${String(d + 10).padStart(2, '0')}T10:00:00Z`;
      for (let s = 1; s <= 25; s++) {
        scaledEvents.push({ event_name: 'search_submitted', created_at: dateStr, properties: { category: `trade-${s % 8}` } });
        scaledEvents.push({ event_name: 'search_result_viewed', created_at: dateStr, properties: { category: `trade-${s % 8}` } });
      }
      for (let p = 1; p <= 12; p++) {
        const pid = 1000 + ((d * 5 + p) % 60) + 1;
        scaledEvents.push({ event_name: 'provider_profile_viewed', created_at: dateStr, properties: { providerId: pid } });
        scaledEvents.push({ event_name: 'whatsapp_clicked', created_at: dateStr, properties: { providerId: pid } });
      }
    }

    const scaledRes = LokatorDB.monetizationReadiness.compute(scaledEvents, scaledProviders, 30);
    assert.strictEqual(scaledRes.readiness_classification, 'READY_FOR_10_13');
    assert.strictEqual(scaledRes.readiness_score, 92.0);
    assert.strictEqual(scaledRes.recommended_next_action, 'Proceed to Phase 10.13 — Monetization Architecture.');
  });

  console.log(`\n========================================`);
  console.log(`Phase 10.12J Unit Tests: ${passedTests} passed, ${failedTests} failed`);
  console.log(`========================================\n`);

  if (failedTests > 0) process.exit(1);
}

runTests();
