/**
 * LOKATOR.NG — PHASE 10.16 HTTP & ASSET VERIFICATION SUITE
 * Validates admin.html, admin.js, compliance endpoints, and report modal wiring.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

function runHttpTests() {
  console.log('\n🌐 RUNNING PHASE 10.16 HTTP & ASSET VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
  const profileHtml = fs.readFileSync(path.join(root, 'profile.html'), 'utf8');
  const profileJs = fs.readFileSync(path.join(root, 'profile.js'), 'utf8');
  const supabaseClient = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');

  test('1. admin.html contains Verification Queue, Dispute Desk, and Audit Ledger tables', () => {
    assert.ok(adminHtml.includes('tbody-verifications'));
    assert.ok(adminHtml.includes('tbody-disputes'));
    assert.ok(adminHtml.includes('tbody-audit'));
    assert.ok(adminHtml.includes('kpi-pending-verifications'));
  });

  test('2. admin.js implements approve, reject, and dispute resolution handlers', () => {
    assert.ok(adminJs.includes('approveVerification'));
    assert.ok(adminJs.includes('rejectVerification'));
    assert.ok(adminJs.includes('resolveReport'));
    assert.ok(adminJs.includes('getAuditLogs'));
  });

  test('3. profile.html & profile.js include report modal trigger and submission form', () => {
    assert.ok(profileHtml.includes('report-modal'));
    assert.ok(profileHtml.includes('btn-open-report-modal'));
    assert.ok(profileJs.includes('reportProvider'));
  });

  test('4. supabase-client.js exports LokatorDB.compliance module with all methods', () => {
    assert.ok(supabaseClient.includes('LokatorDB.compliance'));
    assert.ok(supabaseClient.includes('getPendingVerifications'));
    assert.ok(supabaseClient.includes('approveVerification'));
    assert.ok(supabaseClient.includes('rejectVerification'));
    assert.ok(supabaseClient.includes('reportProvider'));
  });

  test('5. Safe zero-payment baseline and 0% commission preserved in compliance workflows', () => {
    assert.ok(supabaseClient.includes('PAYMENT_LIVE_MODE: false'));
    assert.ok(supabaseClient.includes('COMMISSIONS_ENABLED: false'));
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.16 HTTP & ASSET CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runHttpTests();
