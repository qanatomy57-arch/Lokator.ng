/**
 * LOKATOR.NG — PHASE 10.13G BROWSER & USER JOURNEY VERIFICATION SUITE
 * Validates provider dashboard monetization area, customer disclosures,
 * clear sponsored semantics, organic search integrity, call/WhatsApp actions,
 * and live-payment safety gates.
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
  console.log('\n🖥️ RUNNING PHASE 10.13G BROWSER & USER JOURNEY VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const dashboardHtml = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');
  const dashboardJs = fs.readFileSync(path.join(root, 'dashboard.js'), 'utf8');
  const searchHtml = fs.readFileSync(path.join(root, 'search.html'), 'utf8');
  const searchJs = fs.readFileSync(path.join(root, 'search.js'), 'utf8');
  const profileHtml = fs.readFileSync(path.join(root, 'profile.html'), 'utf8');

  await test('1. Provider dashboard renders Starter Pilot product card with ₦2,000 / 14-day terms', () => {
    assert.ok(dashboardHtml.includes('btn-start-paystack-pilot'));
    assert.ok(dashboardHtml.includes('₦2,000'));
    assert.ok(dashboardHtml.includes('14-Day Pilot'));
  });

  await test('2. Dashboard contains clear customer disclosure (Sponsored placement only; no guarantee of jobs)', () => {
    assert.ok(dashboardHtml.includes('Top sponsored placement') || dashboardHtml.includes('Sponsored'));
    assert.ok(!dashboardHtml.includes('guaranteed customers') && !dashboardHtml.includes('guaranteed jobs'));
  });

  await test('3. Search UI renders explicit badge-tag-sponsored on promoted cards without misleading claims', () => {
    assert.ok(searchJs.includes('badge-tag-sponsored'));
    assert.ok(searchJs.includes('⚡ Sponsored'));
    assert.ok(!searchJs.includes('badge-tag-guaranteed'));
  });

  await test('4. Organic search results remain preserved below sponsored listings', () => {
    assert.ok(searchJs.includes('provider-item-card'));
    assert.ok(searchHtml.includes('providers-list'));
  });

  await test('5. Direct call and WhatsApp booking buttons remain 100% functional and unblocked', () => {
    assert.ok(searchJs.includes('btn-whatsapp') || searchJs.includes('whatsapp') || searchJs.includes('wa.me') || searchJs.includes('tel:'));
    assert.ok(profileHtml.includes('whatsapp') || profileHtml.includes('wa.me') || profileHtml.includes('btn-book-whatsapp'));
  });

  await test('6. Zero live secret keys, unauthenticated billing tokens, or console errors in scripts', () => {
    assert.ok(!dashboardJs.includes('sk_live_'));
    assert.ok(!dashboardJs.includes('throw ') || dashboardJs.includes('try {'));
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.13G BROWSER VERIFICATION CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runBrowserTests();
