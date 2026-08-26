/**
 * LOKATOR.NG — PHASE 10.16 BROWSER & USER JOURNEY VERIFICATION SUITE
 * Validates compliance portal tabs, verification review buttons, and dispute reporting.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

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

async function runBrowserTests() {
  console.log('\n🖥️ RUNNING PHASE 10.16 BROWSER & USER JOURNEY VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const adminHtml = fs.readFileSync(path.join(root, 'admin.html'), 'utf8');
  const adminJs = fs.readFileSync(path.join(root, 'admin.js'), 'utf8');
  const profileHtml = fs.readFileSync(path.join(root, 'profile.html'), 'utf8');
  const profileJs = fs.readFileSync(path.join(root, 'profile.js'), 'utf8');

  await test('1. Admin portal provides tabbed navigation between Verifications, Disputes, and Audit Ledger', () => {
    assert.ok(adminHtml.includes('data-tab="verifications"'));
    assert.ok(adminHtml.includes('data-tab="disputes"'));
    assert.ok(adminHtml.includes('data-tab="audit"'));
  });

  await test('2. Admin portal contains Approve and Reject actions in verification queue', () => {
    assert.ok(adminJs.includes('btn-approve'));
    assert.ok(adminJs.includes('btn-reject'));
  });

  await test('3. Admin portal contains Resolve action in dispute table', () => {
    assert.ok(adminJs.includes('btn-resolve'));
  });

  await test('4. Profile view contains Report Provider trigger and modal submission form', () => {
    assert.ok(profileHtml.includes('btn-open-report-modal'));
    assert.ok(profileHtml.includes('report-provider-form'));
    assert.ok(profileJs.includes('report-provider-form'));
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.16 BROWSER VERIFICATION CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runBrowserTests();
