/**
 * verify_phase_10_12i.js
 * Comprehensive automated verification for Phase 10.12I — Marketplace Funnel Intelligence
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('\n=== LOKATOR.NG PHASE 10.12I: MARKETPLACE FUNNEL INTELLIGENCE VERIFICATION ===\n');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${name}`);
    console.error(`         ${err.message}`);
    failed++;
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
  document: { readyState: 'complete', addEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Date: Date
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
const LokatorTelemetry = sandbox.LokatorTelemetry || sandbox.window.LokatorTelemetry;
assert(LokatorDB, 'LokatorDB loaded successfully');
assert(LokatorTelemetry, 'LokatorTelemetry loaded successfully');

async function runAllTests() {
  // Test 1: Provider Funnel Calculation
  await asyncTest('1. Provider Funnel: Computes exact step conversions and drop-off rates', async () => {
    const mockEvents = [
      // 10 starts
      ...Array(10).fill({ event: 'provider_onboarding_started', props: { device_class: 'mobile' } }),
      // 8 complete Step 1
      ...Array(8).fill({ event: 'provider_onboarding_step_completed', props: { step: 1 } }),
      // 6 complete Step 2
      ...Array(6).fill({ event: 'provider_onboarding_step_completed', props: { step: 2 } }),
      // 5 complete Step 3
      ...Array(5).fill({ event: 'provider_onboarding_step_completed', props: { step: 3 } }),
      // 4 enhance profile (Step 4)
      ...Array(4).fill({ event: 'provider_onboarding_step_completed', props: { step: 4 } }),
      // 4 reach preview (Step 5)
      ...Array(4).fill({ event: 'provider_onboarding_preview_reached', props: { completeness: 85 } }),
      // 3 submit onboarding
      ...Array(3).fill({ event: 'provider_onboarding_submitted', props: { trade: 'Electrician', state: 'Lagos' } }),
      // 3 successfully created/published
      ...Array(3).fill({ event: 'provider_onboarding_succeeded', props: { provider_id: 101, trade: 'Electrician', state: 'Lagos', device_class: 'mobile' } })
    ];

    const result = LokatorDB.funnelIntelligence.compute(mockEvents, [], 30);
    const pf = result.provider_funnel;
    const rates = pf.step_conversion_rates;

    assert.strictEqual(pf.registration_started, 10, 'Starts should be 10');
    assert.strictEqual(pf.step_1_completed, 8, 'Step 1 should be 8');
    assert.strictEqual(pf.step_2_completed, 6, 'Step 2 should be 6');
    assert.strictEqual(pf.step_3_completed, 5, 'Step 3 should be 5');
    assert.strictEqual(pf.enhancement_reached, 4, 'Enhancement should be 4');
    assert.strictEqual(pf.preview_reached, 4, 'Preview should be 4');
    assert.strictEqual(pf.published_succeeded, 3, 'Published should be 3');

    // Denominators
    assert.strictEqual(rates.step_1_rate, 80.0, 'Step 1 rate: 8/10 = 80.0%');
    assert.strictEqual(rates.step_2_rate, 75.0, 'Step 2 rate: 6/8 = 75.0%');
    assert.strictEqual(rates.step_3_rate, 83.3, 'Step 3 rate: 5/6 = 83.3%');
    assert.strictEqual(rates.enhancement_rate, 80.0, 'Enhance rate: 4/5 = 80.0%');
    assert.strictEqual(rates.preview_rate, 100.0, 'Preview rate: 4/4 = 100.0%');
    assert.strictEqual(rates.publish_rate, 75.0, 'Publish rate: 3/4 = 75.0%');
    assert.strictEqual(rates.overall_completion_rate, 30.0, 'Overall rate: 3/10 = 30.0%');
  });

  // Test 2: Customer Funnel Calculation
  await asyncTest('2. Customer Funnel: Computes search to contact conversion with accurate denominators', async () => {
    const mockEvents = [
      // 20 searches started
      ...Array(20).fill({ event: 'search_submitted', props: { category: 'plumber', state: 'Lagos', device_class: 'mobile' } }),
      // 16 with results
      ...Array(16).fill({ event: 'search_result_viewed', props: { totalCount: 5 } }),
      // 4 zero results
      ...Array(4).fill({ event: 'search_no_results', props: { category: 'plumber', state: 'Lagos', query: 'drainage engineer' } }),
      // 12 provider card views
      ...Array(12).fill({ event: 'provider_card_clicked', props: { providerId: 1 } }),
      // 8 profile views
      ...Array(8).fill({ event: 'provider_profile_viewed', props: { providerId: 1, trade: 'Plumber', state: 'Lagos', device_class: 'mobile' } }),
      // 2 phone calls
      ...Array(2).fill({ event: 'phone_clicked', props: { providerId: 1, trade: 'Plumber', state: 'Lagos', device_class: 'mobile' } }),
      // 4 whatsapp clicks
      ...Array(4).fill({ event: 'whatsapp_clicked', props: { providerId: 1, trade: 'Plumber', state: 'Lagos', device_class: 'mobile' } }),
      // 1 review
      { event: 'provider_review_submitted', props: { rating: 5 } }
    ];

    const result = LokatorDB.funnelIntelligence.compute(mockEvents, [], 30);
    const cf = result.customer_funnel;

    assert.strictEqual(cf.searches_started, 20);
    assert.strictEqual(cf.searches_with_results, 16);
    assert.strictEqual(cf.zero_result_searches, 4);
    assert.strictEqual(cf.search_result_rate, 80.0, '16/20 = 80.0%');
    assert.strictEqual(cf.zero_result_rate, 20.0, '4/20 = 20.0%');
    assert.strictEqual(cf.provider_card_views, 12);
    assert.strictEqual(cf.profile_views, 8);
    assert.strictEqual(cf.profile_conversion_rate, 50.0, '8/16 = 50.0%');
    assert.strictEqual(cf.phone_clicks, 2);
    assert.strictEqual(cf.whatsapp_clicks, 4);
    assert.strictEqual(cf.total_contacts, 6);
    assert.strictEqual(cf.contact_conversion_rate, 75.0, '6/8 = 75.0%');
    assert.strictEqual(cf.whatsapp_preference_ratio, 66.7, '4/6 = 66.7%');
    assert.strictEqual(cf.reviews_submitted, 1);
  });

  // Test 3: Zero-Result Intelligence
  await asyncTest('3. Zero-Result Intelligence: Aggregates zero-result searches by category and location', async () => {
    const mockEvents = [
      { event: 'search_no_results', props: { category: 'solar-installer', state: 'Ogun', query: 'inverter tech in Sagamu' } },
      { event: 'search_no_results', props: { category: 'solar-installer', state: 'Ogun', query: 'solar battery fix' } },
      { event: 'search_no_results', props: { category: 'welder', state: 'Delta', query: 'tank stand welder' } }
    ];

    const result = LokatorDB.funnelIntelligence.compute(mockEvents, [], 30);
    const z = result.zero_result_intelligence;

    assert.strictEqual(z.total_zero_results, 3);
    assert.strictEqual(z.by_category['solar-installer'], 2);
    assert.strictEqual(z.by_category['welder'], 1);
    assert.strictEqual(z.by_location['Ogun'], 2);
    assert.strictEqual(z.by_location['Delta'], 1);
    assert.strictEqual(z.recurring_intents.length, 3);
    assert.strictEqual(z.recurring_intents[0].category, 'solar-installer');
  });

  // Test 4: Supply vs Demand Matrix
  await asyncTest('4. Supply vs Demand Matrix: Identifies critical supply gaps and high conversion opportunities', async () => {
    const mockProviders = [
      { id: 1, primary_category_slug: 'electrician', profileCompleteness: 90 },
      { id: 2, primary_category_slug: 'electrician', profileCompleteness: 80 }
    ];

    const mockEvents = [
      // Searches for solar-installer with 0 providers (Critical Supply Gap)
      { event: 'search_submitted', props: { category: 'solar-installer', state: 'Lagos' } },
      { event: 'search_no_results', props: { category: 'solar-installer', state: 'Lagos' } },
      // Searches for electrician with 2 providers and 1 contact (High Conversion Opportunity)
      { event: 'search_submitted', props: { category: 'electrician', state: 'Lagos' } },
      { event: 'search_result_viewed', props: { totalCount: 2 } },
      { event: 'provider_profile_viewed', props: { providerId: 1, trade: 'Electrician', category: 'electrician' } },
      { event: 'whatsapp_clicked', props: { providerId: 1, trade: 'Electrician', category: 'electrician' } }
    ];

    const result = LokatorDB.funnelIntelligence.compute(mockEvents, mockProviders, 30);
    const matrix = result.supply_demand_matrix;

    const solarRow = matrix.find(r => r.category === 'solar-installer');
    assert.ok(solarRow, 'Solar installer row should exist in matrix');
    assert.strictEqual(solarRow.providers_count, 0);
    assert.strictEqual(solarRow.classification, 'CRITICAL_SUPPLY_GAP');

    const elecRow = matrix.find(r => r.category === 'electrician');
    assert.ok(elecRow, 'Electrician row should exist in matrix');
    assert.strictEqual(elecRow.providers_count, 2);
    assert.strictEqual(elecRow.contacts_count, 1);
    assert.strictEqual(elecRow.classification, 'HIGH_CONVERSION_OPPORTUNITY');
  });

  // Test 5: Profile Completeness Distribution
  await asyncTest('5. Profile Completeness Distribution: Aggregates completeness bands and publish thresholds', async () => {
    const mockProviders = [
      { id: 1, profileCompleteness: 40 },
      { id: 2, profileCompleteness: 65 },
      { id: 3, profileCompleteness: 80 },
      { id: 4, profileCompleteness: 95 }
    ];

    const result = LokatorDB.funnelIntelligence.compute([], mockProviders, 30);
    const q = result.provider_funnel.profile_quality;

    assert.strictEqual(q.total_providers, 4);
    assert.strictEqual(q.below_publish_threshold, 2, 'Completeness < 75%');
    assert.strictEqual(q.at_or_above_publish_threshold, 2, 'Completeness >= 75%');
    assert.strictEqual(q.completeness_bands['0-49%'].providers, 1);
    assert.strictEqual(q.completeness_bands['50-74%'].providers, 1);
    assert.strictEqual(q.completeness_bands['75-89%'].providers, 1);
    assert.strictEqual(q.completeness_bands['90-100%'].providers, 1);
  });

  // Test 6: Device Segmentation
  await asyncTest('6. Device Segmentation: Calculates mobile vs desktop conversion rates accurately', async () => {
    const mockEvents = [
      // Mobile
      { event: 'provider_onboarding_started', props: { device_class: 'mobile' } },
      { event: 'provider_onboarding_succeeded', props: { device_class: 'mobile' } },
      { event: 'search_submitted', props: { device_class: 'mobile' } },
      { event: 'provider_profile_viewed', props: { device_class: 'mobile' } },
      { event: 'phone_clicked', props: { device_class: 'mobile' } },
      // Desktop
      { event: 'provider_onboarding_started', props: { device_class: 'desktop' } },
      { event: 'search_submitted', props: { device_class: 'desktop' } },
      { event: 'provider_profile_viewed', props: { device_class: 'desktop' } }
    ];

    const result = LokatorDB.funnelIntelligence.compute(mockEvents, [], 30);
    const dev = result.device_funnel;

    assert.strictEqual(dev.mobile.onboarding_completion_rate, 100.0, 'Mobile 1/1 = 100%');
    assert.strictEqual(dev.mobile.contact_conversion_rate, 100.0, 'Mobile 1/1 = 100%');
    assert.strictEqual(dev.desktop.onboarding_completion_rate, 0.0, 'Desktop 0/1 = 0%');
    assert.strictEqual(dev.desktop.contact_conversion_rate, 0.0, 'Desktop 0/1 = 0%');
  });

  // Test 7: Trust Signals & Moderation Metrics
  await asyncTest('7. Trust Signals: Aggregates verification requests and moderation reports', async () => {
    const mockEvents = [
      { event: 'provider_verification_requested', props: { docType: 'nin' } },
      { event: 'provider_verification_requested', props: { docType: 'cac' } },
      { event: 'provider_report_submitted', props: { reason: 'wrong_contact' } },
      { event: 'review_report_submitted', props: { reason: 'spam_or_fake' } }
    ];

    const result = LokatorDB.funnelIntelligence.compute(mockEvents, [], 30);
    const t = result.trust_signals;

    assert.strictEqual(t.verification_requests, 2);
    assert.strictEqual(t.provider_reports, 1);
    assert.strictEqual(t.review_reports, 1);
  });

  // Test 8: Privacy & PII Sanitization
  test('8. Privacy Guards: Telemetry strictly strips sensitive PII (phones, passwords, NIN, JWTs)', () => {
    sandbox.sessionStorage.clear();

    LokatorTelemetry.trackEvent('test_privacy_event', {
      phone: '08012345678',
      whatsapp_message: 'Private client text',
      password: 'SuperSecretPassword123!',
      jwt: 'header.payload.signature',
      nin: '12345678901',
      valid_metric: 42,
      category: 'electrician'
    });

    const recent = LokatorTelemetry.getRecentEvents();
    assert.ok(recent.length > 0, 'Event should be recorded in telemetry buffer');
    const props = recent[recent.length - 1].props;

    assert.strictEqual(props.phone, undefined, 'Phone must be stripped');
    assert.strictEqual(props.whatsapp_message, undefined, 'WhatsApp message must be stripped');
    assert.strictEqual(props.password, undefined, 'Password must be stripped');
    assert.strictEqual(props.jwt, undefined, 'JWT must be stripped');
    assert.strictEqual(props.nin, undefined, 'NIN must be stripped');
    assert.strictEqual(props.valid_metric, 42, 'Non-sensitive properties preserved');
    assert.strictEqual(props.category, 'electrician', 'Category preserved');
  });

  // Test 9: Non-Blocking Reliability
  test('9. Non-Blocking Telemetry: Telemetry failures never throw or block core execution', () => {
    assert.doesNotThrow(() => {
      LokatorTelemetry.trackEvent(null, null);
      LokatorTelemetry.trackEvent('invalid event name with spaces !!!', {});
      LokatorTelemetry.reportError(new Error('Simulated client error'));
    });
  });

  // Test 10: Denominator Safety with Zero Events
  test('10. Denominator Safety: Zero events return 0% without NaN or division by zero errors', () => {
    const result = LokatorDB.funnelIntelligence.compute([], [], 30);
    assert.strictEqual(result.provider_funnel.step_conversion_rates.step_1_rate, 0);
    assert.strictEqual(result.provider_funnel.step_conversion_rates.overall_completion_rate, 0);
    assert.strictEqual(result.customer_funnel.contact_conversion_rate, 0);
    assert.strictEqual(result.customer_funnel.search_result_rate, 0);
    assert.strictEqual(result.customer_funnel.whatsapp_preference_ratio, 0);
    assert.strictEqual(result.data_volume_assessment, 'INSUFFICIENT_PRODUCTION_VOLUME');
  });

  console.log('\n========================================');
  console.log(`Phase 10.12I Unit Tests: ${passed} passed, ${failed} failed`);
  console.log('========================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
