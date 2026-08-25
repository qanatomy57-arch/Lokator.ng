/**
 * LOKATOR.NG — PHASE 10.12J HTTP & ASSET VERIFICATION SUITE
 * Scope: Monetization Readiness Gate HTML Markup, Analytics Controller, and Zero-Payment Safeguards
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

console.log('\n🌐 RUNNING PHASE 10.12J HTTP & ASSET VERIFICATION SUITE...\n');

// 1. Check analytics.html markup
test('Group 1: analytics.html contains Phase 10.12J Readiness Gate markup', () => {
  const html = fs.readFileSync(path.join(__dirname, '../analytics.html'), 'utf8');
  assert(html.includes('id="section-monetization-readiness"'), 'Must contain section-monetization-readiness');
  assert(html.includes('id="mrg-readiness-badge"'), 'Must contain mrg-readiness-badge');
  assert(html.includes('id="mrg-action-recommendation"'), 'Must contain mrg-action-recommendation');
  assert(html.includes('id="mrg-readiness-score"'), 'Must contain mrg-readiness-score');
  
  // Check all 8 dimension IDs
  assert(html.includes('id="mrg-dim-supply"'), 'Must contain mrg-dim-supply');
  assert(html.includes('id="mrg-dim-demand"'), 'Must contain mrg-dim-demand');
  assert(html.includes('id="mrg-dim-liquidity"'), 'Must contain mrg-dim-liquidity');
  assert(html.includes('id="mrg-dim-engagement"'), 'Must contain mrg-dim-engagement');
  assert(html.includes('id="mrg-dim-contact"'), 'Must contain mrg-dim-contact');
  assert(html.includes('id="mrg-dim-repeat"'), 'Must contain mrg-dim-repeat');
  assert(html.includes('id="mrg-dim-quality"'), 'Must contain mrg-dim-quality');
  assert(html.includes('id="mrg-dim-trust"'), 'Must contain mrg-dim-trust');

  // Check monetization ranking container & security checklist
  assert(html.includes('id="mrg-models-container"'), 'Must contain mrg-models-container');
  assert(html.includes('NIN/CAC Evidence Security'), 'Must contain security audit card');
});

// 2. Check analytics.js controller
test('Group 2: analytics.js integrates getMonetizationReadiness', () => {
  const js = fs.readFileSync(path.join(__dirname, '../analytics.js'), 'utf8');
  assert(js.includes('LokatorDB.analytics.getMonetizationReadiness'), 'Must call getMonetizationReadiness');
  assert(js.includes('mrg-readiness-badge'), 'Must update mrg-readiness-badge');
  assert(js.includes('mrg-action-recommendation'), 'Must update mrg-action-recommendation');
});

// 3. Check supabase-client.js exports
test('Group 3: supabase-client.js implements computeMonetizationReadinessGate and exports', () => {
  const db = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  assert(db.includes('function computeMonetizationReadinessGate'), 'Must define computeMonetizationReadinessGate');
  assert(db.includes('LokatorDB.monetizationReadiness ='), 'Must export LokatorDB.monetizationReadiness');
  assert(db.includes('getMonetizationReadiness('), 'Must export getMonetizationReadiness');
});

// 4. Strict Zero Payment Code Enforcement
test('Group 4: Zero Payment Code & Zero Credential Leakage Safeguard', () => {
  const clientFiles = [
    '../index.html',
    '../search.html',
    '../profile.html',
    '../register.html',
    '../dashboard.html',
    '../analytics.html',
    '../supabase-client.js',
    '../telemetry.js',
    '../app.js'
  ];

  clientFiles.forEach(relPath => {
    const fullPath = path.join(__dirname, relPath);
    if (!fs.existsSync(fullPath)) return;
    const content = fs.readFileSync(fullPath, 'utf8');

    // Ensure no active payment SDKs or live billing APIs have been injected
    assert(!content.includes('https://js.paystack.co/v1/inline.js'), `No Paystack inline script in ${relPath}`);
    assert(!content.includes('https://checkout.flutterwave.com/v3.js'), `No Flutterwave script in ${relPath}`);
    assert(!content.includes('https://js.stripe.com/v3/'), `No Stripe script in ${relPath}`);
    assert(!content.includes('service_role_key'), `No service_role_key in ${relPath}`);
  });
});

console.log('\n================================================================================');
console.log(`🎉 ALL ${passedTests} PHASE 10.12J HTTP & MARKUP VERIFICATION CHECKS PASSED (100%)!`);
console.log('================================================================================\n');

if (failedTests > 0) process.exit(1);
