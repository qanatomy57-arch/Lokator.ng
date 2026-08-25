/**
 * verify_phase_10_12h.js
 * Comprehensive automated verification for Phase 10.12H — Trust & Verification Layer
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

console.log('\n=== LOKATOR.NG PHASE 10.12H: TRUST & VERIFICATION LAYER VERIFICATION ===\n');

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

const testStorage = {};
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
  sessionStorage: {
    _data: {},
    getItem(k) { return this._data[k] || null; },
    setItem(k, v) { this._data[k] = String(v); },
    removeItem(k) { delete this._data[k]; },
    clear() { this._data = {}; }
  },
  navigator: { onLine: true },
  document: { readyState: 'complete', addEventListener: () => {}, querySelector: () => null, querySelectorAll: () => [], getElementById: () => null },
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  Date: Date
};

vm.createContext(sandbox);
vm.runInContext(phoneCode, sandbox);
vm.runInContext(locCode, sandbox);
vm.runInContext(catCode, sandbox);
vm.runInContext(searchLangCode, sandbox);
vm.runInContext(telemetryCode, sandbox);
vm.runInContext(dbCode, sandbox);

const LokatorDB = sandbox.LokatorDB || sandbox.window.LokatorDB;
assert(LokatorDB, 'LokatorDB client loaded successfully');

async function runAllTests() {
  // Test 1: Trust signals sanitization for unverified provider
  test('1. _sanitizeProviderDetail generates accurate trust signals and badgeTitle for unverified provider', () => {
    const raw = {
      id: 9901,
      name: 'Chidi Okafor',
      trade: 'Plumber',
      state: 'Lagos',
      city: 'Ikeja',
      is_verified: false,
      nin_verified: false,
      phone_verified: false,
      phone: '08031234567'
    };
    const sanitized = LokatorDB._sanitizeProviderDetail(raw);
    assert.strictEqual(sanitized.isVerified, false);
    assert.strictEqual(sanitized.ninVerified, false);
    assert.strictEqual(sanitized.phoneVerified, false);
    assert.strictEqual(sanitized.verificationStatus, 'unverified');
    assert.strictEqual(sanitized.badgeTitle, 'Self-Reported Profile');
    assert.ok(sanitized.trustSignals);
    assert.strictEqual(sanitized.trustSignals.isIdentityVerified, false);
    assert.strictEqual(sanitized.trustSignals.isPlatformReviewed, false);
    assert.strictEqual(sanitized.trustSignals.verificationStatus, 'unverified');
  });

  test('2. _sanitizeProviderDetail generates NIN Verified badge only when nin_verified is true', () => {
    const raw = {
      id: 9902,
      name: 'Tunde Bakare',
      trade: 'Electrician',
      state: 'Lagos',
      city: 'Surulere',
      is_verified: true,
      nin_verified: true,
      phone_verified: true,
      phone: '08022223333'
    };
    const sanitized = LokatorDB._sanitizeProviderDetail(raw);
    assert.strictEqual(sanitized.isVerified, true);
    assert.strictEqual(sanitized.ninVerified, true);
    assert.strictEqual(sanitized.phoneVerified, true);
    assert.strictEqual(sanitized.verificationStatus, 'verified');
    assert.strictEqual(sanitized.badgeTitle, 'National NIN Verified');
    assert.strictEqual(sanitized.trustSignals.isIdentityVerified, true);
  });

  test('3. _sanitizeProviderDetail generates Platform Reviewed badge when is_verified is true but nin_verified is false', () => {
    const raw = {
      id: 9903,
      name: 'Emeka Nwosu',
      trade: 'Carpenter',
      state: 'Enugu',
      city: 'Enugu',
      is_verified: true,
      nin_verified: false,
      phone_verified: true,
      phone: '08055556666'
    };
    const sanitized = LokatorDB._sanitizeProviderDetail(raw);
    assert.strictEqual(sanitized.isVerified, true);
    assert.strictEqual(sanitized.ninVerified, false);
    assert.strictEqual(sanitized.badgeTitle, 'Platform Reviewed');
    assert.strictEqual(sanitized.trustSignals.isIdentityVerified, false);
    assert.strictEqual(sanitized.trustSignals.isPlatformReviewed, true);
  });

  // Test 4: Anti-Abuse Self-Review Prevention
  await asyncTest('4. submitReview blocks self-reviews by authenticated provider', async () => {
    const mockSession = {
      access_token: 'mock_token',
      user: {
        id: 'usr_101',
        email: 'provider101@test.com',
        user_metadata: { provider_id: 101 }
      }
    };
    sandbox.localStorage.setItem('lokator_supabase_auth_session', JSON.stringify(mockSession));

    const result = await LokatorDB.submitReview(101, {
      author: 'Test Provider',
      rating: 5,
      comment: 'I am the best artisan in Lagos!'
    });

    assert.strictEqual(result.status, 'REMOTE_FAILURE');
    assert.ok(result.message.toLowerCase().includes('self-review') || result.message.toLowerCase().includes('cannot review'));
  });

  // Test 5: Anti-Abuse Duplicate Review Flood Prevention
  await asyncTest('5. submitReview blocks duplicate identical reviews', async () => {
    sandbox.localStorage.removeItem('lokator_supabase_auth_session');

    // First review submission
    const res1 = await LokatorDB.submitReview(9901, {
      author: 'Amaka Obi',
      rating: 5,
      comment: 'Excellent plumbing repair, arrived in 20 minutes.'
    });
    assert.ok(res1.status === 'REMOTE_SUCCESS' || res1.status === 'OFFLINE_PENDING');

    // Duplicate submission attempt
    const res2 = await LokatorDB.submitReview(9901, {
      author: 'Amaka Obi',
      rating: 5,
      comment: 'Excellent plumbing repair, arrived in 20 minutes.'
    });
    assert.strictEqual(res2.status, 'REMOTE_FAILURE');
    assert.ok(res2.message.toLowerCase().includes('duplicate'));
  });

  // Test 6: Report Provider Method
  await asyncTest('6. reportProvider creates structured report and tracks telemetry', async () => {
    const reportRes = await LokatorDB.reportProvider(9901, {
      reason: 'wrong_contact',
      details: 'Phone number does not connect on calls or WhatsApp.'
    });
    assert.strictEqual(reportRes.status, 'REMOTE_SUCCESS');
    assert.strictEqual(reportRes.entity, 'report');
    assert.ok(reportRes.data.id.startsWith('rep_'));

    const rawReports = sandbox.localStorage.getItem('lokator_supabase_reports_db');
    assert.ok(rawReports, 'Reports should be persisted in local storage');
    const reports = JSON.parse(rawReports);
    const target = reports.find(r => r.target_id === 9901 && r.target_type === 'provider');
    assert.ok(target, 'Target report should be present in store');
    assert.strictEqual(target.reason, 'wrong_contact');
  });

  // Test 7: Report Review Method
  await asyncTest('7. reportReview creates structured review report', async () => {
    const revReportRes = await LokatorDB.reportReview(12345, {
      providerId: 9901,
      reason: 'spam_or_fake',
      details: 'Suspected bot spam review.'
    });
    assert.strictEqual(revReportRes.status, 'REMOTE_SUCCESS');
    assert.ok(revReportRes.data.id.startsWith('rev_rep_'));

    const rawReports = sandbox.localStorage.getItem('lokator_supabase_reports_db');
    const reports = JSON.parse(rawReports);
    const revTarget = reports.find(r => r.target_id === 12345 && r.target_type === 'review');
    assert.ok(revTarget);
    assert.strictEqual(revTarget.reason, 'spam_or_fake');
  });

  // Test 8: Provider Verification Request Workflow
  await asyncTest('8. requestProviderVerification marks status as pending and creates verification record', async () => {
    const store = [{ id: 9901, name: 'Chidi Okafor', is_verified: false, nin_verified: false }];
    sandbox.localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(store));

    const verRes = await LokatorDB.requestProviderVerification(9901, {
      docType: 'nin',
      docRef: '12345678901'
    });
    assert.strictEqual(verRes.status, 'REMOTE_SUCCESS');
    assert.strictEqual(verRes.data.status, 'pending');

    const updatedProviders = JSON.parse(sandbox.localStorage.getItem('lokator_supabase_providers_db'));
    const p = updatedProviders.find(i => i.id === 9901);
    assert.strictEqual(p.verification_status, 'pending');
    assert.strictEqual(p.verification_requested, true);

    const verReqs = JSON.parse(sandbox.localStorage.getItem('lokator_supabase_verifications_db') || '[]');
    assert.ok(verReqs.length > 0);
    assert.strictEqual(verReqs[0].provider_id, 9901);
    assert.strictEqual(verReqs[0].status, 'pending');
  });

  // Test 9: Upgrade Plan does NOT fabricate identity verification
  await asyncTest('9. upgradeSubscriptionPlan preserves authentic verification status without fabrication', async () => {
    const store = [{ id: 9904, name: 'Funke Alabi', is_verified: false, nin_verified: false, subscription_plan: 'basic' }];
    sandbox.localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(store));

    const upgraded = await LokatorDB.upgradeSubscriptionPlan(9904, 'verified');
    assert.strictEqual(upgraded.subscriptionPlan, 'verified');
    assert.strictEqual(upgraded.ninVerified, false);
    assert.strictEqual(upgraded.badgeTitle, 'Self-Reported Profile');
    assert.strictEqual(upgraded.trustSignals.isIdentityVerified, false);
  });

  // Test 10: HTML file structures
  test('10. profile.html contains dynamic hero verified badge container', () => {
    const profileHtml = fs.readFileSync(path.join(__dirname, '../profile.html'), 'utf8');
    assert.ok(profileHtml.includes('id="hero-verified-badge"'));
    assert.ok(!profileHtml.includes('>NIN Verified Pro<'));
  });

  test('11. profile.html contains transparent self-reported and pricing tags', () => {
    const profileHtml = fs.readFileSync(path.join(__dirname, '../profile.html'), 'utf8');
    assert.ok(profileHtml.includes('class="provider-supplied-tag"'));
    assert.ok(profileHtml.includes('Self-Reported'));
    assert.ok(profileHtml.includes('Standard benchmark estimates provided by the artisan'));
  });

  test('12. profile.html contains Trust & Safety Notice and Report modal dialog', () => {
    const profileHtml = fs.readFileSync(path.join(__dirname, '../profile.html'), 'utf8');
    assert.ok(profileHtml.includes('Trust & Safety Guidelines'));
    assert.ok(profileHtml.includes('id="btn-open-report-modal"'));
    assert.ok(profileHtml.includes('id="report-modal"'));
    assert.ok(profileHtml.includes('id="report-provider-form"'));
  });

  test('13. dashboard.html contains Trust & Verification Center and request form', () => {
    const dashHtml = fs.readFileSync(path.join(__dirname, '../dashboard.html'), 'utf8');
    assert.ok(dashHtml.includes('Trust & Credential Verification Center'));
    assert.ok(dashHtml.includes('id="dash-ver-status-chip"'));
    assert.ok(dashHtml.includes('id="dash-ver-status-text"'));
    assert.ok(dashHtml.includes('id="form-request-verification"'));
    assert.ok(dashHtml.includes('id="btn-submit-verification"'));
  });

  test('14. CSS files define verified, pending, and unverified trust badge styles', () => {
    const profileCss = fs.readFileSync(path.join(__dirname, '../profile.css'), 'utf8');
    const styleCss = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');
    assert.ok(profileCss.includes('.profile-verified-pill.verified'));
    assert.ok(profileCss.includes('.profile-verified-pill.pending'));
    assert.ok(profileCss.includes('.profile-verified-pill.unverified'));
    assert.ok(styleCss.includes('.profile-verified-pill.verified'));
    assert.ok(styleCss.includes('.profile-verified-pill.pending'));
    assert.ok(styleCss.includes('.profile-verified-pill.unverified'));
  });

  console.log(`\n========================================`);
  console.log(`Phase 10.12H Unit Tests: ${passed} passed, ${failed} failed`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runAllTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
