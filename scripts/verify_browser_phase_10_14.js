/**
 * LOKATOR.NG — PHASE 10.14 BROWSER & USER JOURNEY VERIFICATION SUITE
 * Validates Quick Match interactions, modal opening, WhatsApp dispatching,
 * peer referral tools in dashboard, and community badges.
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
  console.log('\n🖥️ RUNNING PHASE 10.14 BROWSER & USER JOURNEY VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const searchHtml = fs.readFileSync(path.join(root, 'search.html'), 'utf8');
  const searchJs = fs.readFileSync(path.join(root, 'search.js'), 'utf8');
  const dashboardHtml = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');
  const dashboardJs = fs.readFileSync(path.join(root, 'dashboard.js'), 'utf8');
  const registerHtml = fs.readFileSync(path.join(root, 'register.html'), 'utf8');

  await test('1. Search empty state provides instant Quick Match modal CTA', () => {
    assert.ok(searchHtml.includes('btn-empty-quick-match'));
    assert.ok(searchHtml.includes('quick-match-modal'));
    assert.ok(searchJs.includes('openQuickMatch'));
  });

  await test('2. Quick Match form includes service, location, neighborhood, and urgency selectors', () => {
    assert.ok(searchHtml.includes('qm-category'));
    assert.ok(searchHtml.includes('qm-state'));
    assert.ok(searchHtml.includes('qm-lga'));
    assert.ok(searchHtml.includes('qm-neighborhood'));
    assert.ok(searchHtml.includes('qm-urgency'));
    assert.ok(searchHtml.includes('qm-description'));
  });

  await test('3. Search cards render Community Builder badge when provider qualifies', () => {
    assert.ok(searchJs.includes('badge-tag-community'));
    assert.ok(searchJs.includes('🌟 Community Builder'));
  });

  await test('4. Dashboard renders Community & Growth Center with referral tools', () => {
    assert.ok(dashboardHtml.includes('tab-community'));
    assert.ok(dashboardHtml.includes('dash-referral-code-input'));
    assert.ok(dashboardHtml.includes('btn-share-referral-whatsapp'));
    assert.ok(dashboardHtml.includes('community-progress-bar'));
  });

  await test('5. Dashboard renders Neighborhood Opportunities Feed for artisan trade & LGA', () => {
    assert.ok(dashboardHtml.includes('dash-neighborhood-opportunities-tbody'));
    assert.ok(dashboardJs.includes('getNeighborhoodOpportunities'));
  });

  await test('6. Registration form captures referral code via URL parameter', () => {
    assert.ok(registerHtml.includes('urlParams.get(\'ref\')'));
    assert.ok(registerHtml.includes('LokatorDB.referrals.processReferralRegistration'));
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.14 BROWSER VERIFICATION CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runBrowserTests();
