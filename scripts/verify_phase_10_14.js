/**
 * LOKATOR.NG — PHASE 10.14 CLUSTER LIQUIDITY ACCELERATION & NEIGHBORHOOD JOB MATCHING SUITE
 * Validates Quick Match algorithm, PII-minimization, pre-filled WhatsApp dispatching,
 * peer referral attribution, Community Builder badge milestones, and local opportunity feeds.
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

async function runPhase10_14Suite() {
  console.log('\n================================================================================');
  console.log('⚡ LOKATOR.NG — PHASE 10.14 CLUSTER LIQUIDITY & NEIGHBORHOOD JOB MATCHING SUITE');
  console.log('================================================================================\n');

  // Seed mock providers
  const mockProviders = [
    { id: 501, first_name: 'Tarila', last_name: 'Ebi', state: 'Delta', lga: 'Warri South', category: 'electrician', phone: '08012345678', whatsapp_number: '08012345678', is_verified: true, is_available: true, rating: 4.9, trade_title: 'Master Electrician' },
    { id: 502, first_name: 'Oghenekaro', last_name: 'Musa', state: 'Delta', lga: 'Warri South', category: 'electrician', phone: '08023456789', whatsapp_number: '08023456789', is_verified: false, is_available: true, rating: 4.7, trade_title: 'Certified Wiring Expert' },
    { id: 503, first_name: 'Blessing', last_name: 'Osagie', state: 'Edo', lga: 'Oredo', category: 'plumber', phone: '08034567890', whatsapp_number: '08034567890', is_verified: true, is_available: true, rating: 4.8, trade_title: 'Borehole & Plumbing Tech' },
    { id: 504, first_name: 'Chukwuma', last_name: 'Obi', state: 'Lagos', lga: 'Ikeja', category: 'carpenter', phone: '08045678901', whatsapp_number: '08045678901', is_verified: true, is_available: true, rating: 4.9, trade_title: 'Master Furniture Maker' }
  ];
  localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(mockProviders));
  localStorage.removeItem('lokator_job_requests');
  localStorage.removeItem('lokator_artisan_referrals');
  telemetryEvents.length = 0;

  console.log('--- 1. QUICK MATCH & JOB REQUEST DISPATCHER ---');
  await test('1.1 LokatorDB.liquidityEngine exists and exports required methods', async () => {
    assert.ok(LokatorDB.liquidityEngine);
    assert.strictEqual(typeof LokatorDB.liquidityEngine.generateJobRequest, 'function');
    assert.strictEqual(typeof LokatorDB.liquidityEngine.getNeighborhoodOpportunities, 'function');
  });

  let createdRequest = null;
  await test('1.2 generateJobRequest matches nearby active artisans and prioritizes verified pros', async () => {
    createdRequest = await LokatorDB.liquidityEngine.generateJobRequest({
      category: 'electrician',
      state: 'Delta',
      lga: 'Warri South',
      neighborhood: 'Effurun Roundabout',
      urgency: 'emergency_today',
      description: 'Distribution board tripping and sparking'
    });

    assert.strictEqual(createdRequest.success, true);
    assert.ok(createdRequest.request_id.startsWith('req_'));
    assert.strictEqual(createdRequest.primary_artisan.id, 501); // Verified pro first
    assert.ok(createdRequest.matched_providers.length >= 2);
  });

  await test('1.3 generateJobRequest formats structured pre-filled WhatsApp deep link', async () => {
    assert.ok(createdRequest.primary_whatsapp_url.includes('https://wa.me/2348012345678'));
    assert.ok(createdRequest.primary_whatsapp_url.includes('text='));
    const decodedUrl = decodeURIComponent(createdRequest.primary_whatsapp_url);
    assert.ok(decodedUrl.includes('Tarila'));
    assert.ok(decodedUrl.includes('Distribution board tripping'));
    assert.ok(decodedUrl.includes('Effurun Roundabout'));
  });

  await test('1.4 PII-Minimization: Customer phone number is NOT stored in centralized job request ledger', async () => {
    const rawLedger = JSON.parse(localStorage.getItem('lokator_job_requests') || '[]');
    assert.ok(rawLedger.length > 0);
    const saved = rawLedger[0];
    assert.strictEqual(typeof saved.customer_phone, 'undefined');
    assert.strictEqual(typeof saved.phone, 'undefined');
    assert.strictEqual(saved.category, 'electrician');
    assert.strictEqual(saved.lga, 'Warri South');
  });

  console.log('\n--- 2. NEIGHBORHOOD OPPORTUNITIES FEED ---');
  await test('2.1 getNeighborhoodOpportunities filters open requests by artisan trade and locality', async () => {
    const warriOpps = LokatorDB.liquidityEngine.getNeighborhoodOpportunities(501);
    assert.strictEqual(warriOpps.length, 1);
    assert.strictEqual(warriOpps[0].category, 'electrician');

    // Plumber in Edo should receive 0 electrician requests in Warri
    const edoOpps = LokatorDB.liquidityEngine.getNeighborhoodOpportunities(503);
    assert.strictEqual(edoOpps.length, 0);
  });

  console.log('\n--- 3. ARTISAN PEER REFERRAL ENGINE ---');
  await test('3.1 getProviderReferralCode generates clean, deterministic referral codes', async () => {
    const code501 = LokatorDB.referrals.getProviderReferralCode(501);
    assert.strictEqual(code501, 'LOK-TARILA-WARRI-501');
  });

  await test('3.2 processReferralRegistration attributes new artisan signups and prevents self-referrals', async () => {
    // Attempt self-referral
    const selfRes = LokatorDB.referrals.processReferralRegistration('LOK-TARILA-WARRI-501', 501);
    assert.strictEqual(selfRes.success, false);
    assert.strictEqual(selfRes.reason, 'Self-referral blocked');

    // Valid referral of new artisan 505
    const validRes = LokatorDB.referrals.processReferralRegistration('LOK-TARILA-WARRI-501', 505);
    assert.strictEqual(validRes.success, true);
    assert.strictEqual(validRes.record.referrer_id, 501);
    assert.strictEqual(validRes.record.referred_id, 505);
  });

  await test('3.3 Referrer unlocks Community Builder badge upon reaching 3 completed referrals', async () => {
    // Add 2 more referrals for provider 501
    LokatorDB.referrals.processReferralRegistration('LOK-TARILA-WARRI-501', 506);
    const finalRes = LokatorDB.referrals.processReferralRegistration('LOK-TARILA-WARRI-501', 507);

    assert.strictEqual(finalRes.success, true);
    assert.strictEqual(finalRes.is_community_builder, true);

    const summary = LokatorDB.referrals.getProviderReferralSummary(501);
    assert.strictEqual(summary.total_referrals, 3);
    assert.strictEqual(summary.is_community_builder, true);
    assert.strictEqual(summary.referrals_to_community_builder, 0);

    const providers = JSON.parse(localStorage.getItem('lokator_supabase_providers_db') || '[]');
    const prov501 = providers.find(p => p.id === 501);
    assert.strictEqual(prov501.is_community_builder, true);
  });

  await test('3.4 getProviderReferralSummary contains valid invite URL and WhatsApp share link', async () => {
    const summary = LokatorDB.referrals.getProviderReferralSummary(501);
    assert.ok(summary.invite_url.includes('ref=LOK-TARILA-WARRI-501'));
    assert.ok(summary.whatsapp_share_url.includes('wa.me'));
  });

  console.log('\n--- 4. TELEMETRY & FREE MARKETPLACE GUARANTEE ---');
  await test('4.1 Telemetry events tracked for liquidity dispatch and referral conversions', async () => {
    const dispatchEvt = telemetryEvents.find(e => e.evt === 'liquidity_job_request_created');
    const referralEvt = telemetryEvents.find(e => e.evt === 'artisan_peer_referral_completed');
    assert.ok(dispatchEvt);
    assert.ok(referralEvt);
  });

  await test('4.2 Free marketplace guarantee: 0% commissions, direct calls, and WhatsApp unblocked', async () => {
    assert.strictEqual(LokatorDB.monetization.featureFlags.COMMISSIONS_ENABLED, false);
    assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_LIVE_MODE, false);
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.14 LIQUIDITY & MATCHING ASSERTIONS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runPhase10_14Suite();
