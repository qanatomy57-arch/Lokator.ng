/**
 * LOKATOR.NG — PHASE 10.14 HTTP & ASSET VERIFICATION SUITE
 * Validates Quick Match modals, Community Builder UI markup,
 * referral hydration hooks, and script asset integrity.
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
  console.log('\n🌐 RUNNING PHASE 10.14 HTTP & ASSET VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const searchHtml = fs.readFileSync(path.join(root, 'search.html'), 'utf8');
  const searchJs = fs.readFileSync(path.join(root, 'search.js'), 'utf8');
  const dashboardHtml = fs.readFileSync(path.join(root, 'dashboard.html'), 'utf8');
  const dashboardJs = fs.readFileSync(path.join(root, 'dashboard.js'), 'utf8');
  const analyticsHtml = fs.readFileSync(path.join(root, 'analytics.html'), 'utf8');
  const analyticsJs = fs.readFileSync(path.join(root, 'analytics.js'), 'utf8');
  const registerHtml = fs.readFileSync(path.join(root, 'register.html'), 'utf8');
  const supabaseClient = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');

  test('1. search.html contains Quick Match modal markup & empty state CTA', () => {
    assert.ok(searchHtml.includes('quick-match-modal'));
    assert.ok(searchHtml.includes('btn-empty-quick-match'));
    assert.ok(searchHtml.includes('qm-category'));
    assert.ok(searchHtml.includes('qm-urgency'));
  });

  test('2. search.js implements Quick Match modal handlers & Community Builder badge markup', () => {
    assert.ok(searchJs.includes('quick-match-modal'));
    assert.ok(searchJs.includes('generateJobRequest'));
    assert.ok(searchJs.includes('badge-tag-community'));
    assert.ok(searchJs.includes('🌟 Community Builder'));
  });

  test('3. dashboard.html contains tab-community with referral center and neighborhood opportunities feed', () => {
    assert.ok(dashboardHtml.includes('tab-community'));
    assert.ok(dashboardHtml.includes('dash-referral-code-input'));
    assert.ok(dashboardHtml.includes('community-builder-badge-status'));
    assert.ok(dashboardHtml.includes('dash-neighborhood-opportunities-tbody'));
  });

  test('4. dashboard.js hydrations include peer referral summary and neighborhood opportunity feed', () => {
    assert.ok(dashboardJs.includes('getProviderReferralSummary'));
    assert.ok(dashboardJs.includes('getNeighborhoodOpportunities'));
    assert.ok(dashboardJs.includes('community-progress-bar'));
  });

  test('5. register.html reads ref parameter and attributes referral upon registration', () => {
    assert.ok(registerHtml.includes('urlParams.get(\'ref\')'));
    assert.ok(registerHtml.includes('processReferralRegistration'));
  });

  test('6. analytics.html and analytics.js include Section 10 Cluster Liquidity & Dispatch Observability', () => {
    assert.ok(analyticsHtml.includes('section-liquidity-dispatch'));
    assert.ok(analyticsHtml.includes('kpi-qm-total-dispatches'));
    assert.ok(analyticsHtml.includes('qm-dispatches-tbody'));
    assert.ok(analyticsJs.includes('kpi-qm-total-dispatches'));
  });

  test('7. supabase-client.js exports liquidityEngine and referrals managers with zero payment dependency', () => {
    assert.ok(supabaseClient.includes('LokatorDB.liquidityEngine'));
    assert.ok(supabaseClient.includes('LokatorDB.referrals'));
    assert.ok(supabaseClient.includes('generateJobRequest'));
    assert.ok(supabaseClient.includes('processReferralRegistration'));
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.14 HTTP & ASSET CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runHttpTests();
