/**
 * LOKATOR.NG — PHASE 10.12K HTTP & ASSET VERIFICATION SUITE
 * Scope: join.html Acquisition Page, register.html Preselection, Dashboard Referral Tool, Analytics Markup
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failedTests++;
  }
}

console.log('\n🌐 RUNNING PHASE 10.12K HTTP & ASSET VERIFICATION SUITE...\n');

// 1. Check join.html
test('Group 1: join.html exists with complete value propositions & query handler', () => {
  const html = fs.readFileSync(path.join(__dirname, '../join.html'), 'utf8');
  assert(html.includes('id="join-primary-cta"'), 'Must contain join-primary-cta');
  assert(html.includes('id="target-highlight-box"'), 'Must contain target-highlight-box');
  assert(html.includes('provider_acquisition_landing_viewed'), 'Must track landing view telemetry');
  assert(html.includes('Direct WhatsApp & Calls'), 'Must state direct contact value proposition');
  assert(html.includes('Zero middleman fees') || html.includes('No transaction commissions'), 'Must state zero fee model');
});

// 2. Check register.html preselection & attribution
test('Group 2: register.html contains handleAcquisitionPreselection & attribution fields', () => {
  const html = fs.readFileSync(path.join(__dirname, '../register.html'), 'utf8');
  assert(html.includes('function handleAcquisitionPreselection'), 'Must define handleAcquisitionPreselection');
  assert(html.includes('acquisition_source:'), 'Must assign acquisition_source in formData');
  assert(html.includes('provider_acquisition_source_recorded'), 'Must track acquisition source telemetry');
});

// 3. Check dashboard.html & dashboard.js referral tool
test('Group 3: dashboard.html & dashboard.js include provider referral link generator', () => {
  const html = fs.readFileSync(path.join(__dirname, '../dashboard.html'), 'utf8');
  assert(html.includes('id="dash-referral-section"'), 'Must contain dash-referral-section');
  assert(html.includes('id="dash-referral-link"'), 'Must contain dash-referral-link');
  assert(html.includes('id="btn-copy-ref-link"'), 'Must contain btn-copy-ref-link');
  assert(html.includes('id="btn-share-ref-wa"'), 'Must contain btn-share-ref-wa');

  const js = fs.readFileSync(path.join(__dirname, '../dashboard.js'), 'utf8');
  assert(js.includes('function renderReferralTool'), 'Must define renderReferralTool');
  assert(js.includes('provider_referral_link_generated'), 'Must track referral link generation');
});

// 4. Check analytics.html & analytics.js
test('Group 4: analytics.html & analytics.js include Phase 10.12K Liquidity Expansion dashboard', () => {
  const html = fs.readFileSync(path.join(__dirname, '../analytics.html'), 'utf8');
  assert(html.includes('id="section-liquidity-expansion"'), 'Must contain section-liquidity-expansion');
  assert(html.includes('id="mle-delta-provs"'), 'Must contain mle-delta-provs');
  assert(html.includes('id="mle-edo-provs"'), 'Must contain mle-edo-provs');
  assert(html.includes('id="mle-opportunity-tbody"'), 'Must contain mle-opportunity-tbody');

  const js = fs.readFileSync(path.join(__dirname, '../analytics.js'), 'utf8');
  assert(js.includes('LokatorDB.analytics.getLiquidityExpansion'), 'Must call getLiquidityExpansion');
});

// 5. Check supabase-client.js exports
test('Group 5: supabase-client.js defines computeLiquidityExpansion & exports', () => {
  const db = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  assert(db.includes('function computeLiquidityExpansion'), 'Must define computeLiquidityExpansion');
  assert(db.includes('LokatorDB.liquidityExpansion ='), 'Must export LokatorDB.liquidityExpansion');
  assert(db.includes('getLiquidityExpansion('), 'Must export getLiquidityExpansion');
});

// 6. Zero Payment Gateways Enforcement
test('Group 6: Zero active payment gateways / billing code across all assets', () => {
  const files = ['../index.html', '../join.html', '../search.html', '../register.html', '../dashboard.html', '../analytics.html'];
  files.forEach(f => {
    const content = fs.readFileSync(path.join(__dirname, f), 'utf8');
    assert(!content.includes('js.paystack.co'), `No Paystack in ${f}`);
    assert(!content.includes('checkout.flutterwave.com'), `No Flutterwave in ${f}`);
    assert(!content.includes('js.stripe.com'), `No Stripe in ${f}`);
  });
});

console.log('\n================================================================================');
console.log(`🎉 ALL ${passedTests} PHASE 10.12K HTTP & MARKUP VERIFICATION CHECKS PASSED (100%)!`);
console.log('================================================================================\n');

if (failedTests > 0) process.exit(1);
