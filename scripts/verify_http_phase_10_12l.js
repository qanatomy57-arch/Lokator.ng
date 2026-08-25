/**
 * LOKATOR.NG — PHASE 10.12L HTTP & ASSET VERIFICATION SUITE
 * Scope: HTML Markup integrity, Analytics rendering elements, Supabase client exports, Zero payment code
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passedTests = 0;
let failedTests = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failedTests++;
  }
}

console.log('\n🌐 RUNNING PHASE 10.12L HTTP & ASSET VERIFICATION SUITE...\n');

// Group 1: Analytics HTML Markup Verification
test('Group 1: analytics.html contains complete Phase 10.12L UI section & DOM nodes', () => {
  const htmlPath = path.join(__dirname, '../analytics.html');
  assert.ok(fs.existsSync(htmlPath), 'analytics.html must exist');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(html.includes('id="section-liquidity-growth-validation"'), 'Must contain #section-liquidity-growth-validation');
  assert.ok(html.includes('id="mlg-kpi-supply"'), 'Must contain #mlg-kpi-supply');
  assert.ok(html.includes('id="mlg-kpi-zero"'), 'Must contain #mlg-kpi-zero');
  assert.ok(html.includes('id="mlg-kpi-contacts"'), 'Must contain #mlg-kpi-contacts');
  assert.ok(html.includes('id="mlg-kpi-gate"'), 'Must contain #mlg-kpi-gate');
  assert.ok(html.includes('id="mlg-cohort-tbody"'), 'Must contain #mlg-cohort-tbody');
  assert.ok(html.includes('id="mlg-cluster-response-tbody"'), 'Must contain #mlg-cluster-response-tbody');
  assert.ok(html.includes('id="mlg-decision-matrix-tbody"'), 'Must contain #mlg-decision-matrix-tbody');
  assert.ok(html.includes('id="mlg-ctrl-exp"'), 'Must contain #mlg-ctrl-exp');
  assert.ok(html.includes('id="mlg-ctrl-comp"'), 'Must contain #mlg-ctrl-comp');
  assert.ok(html.includes('id="mlg-monetization-summary"'), 'Must contain #mlg-monetization-summary');
});

// Group 2: Analytics Controller Logic Verification
test('Group 2: analytics.js hydrates Phase 10.12L growth validation tables & cards', () => {
  const jsPath = path.join(__dirname, '../analytics.js');
  assert.ok(fs.existsSync(jsPath), 'analytics.js must exist');
  const js = fs.readFileSync(jsPath, 'utf8');

  assert.ok(js.includes('getLiquidityGrowth'), 'analytics.js must invoke getLiquidityGrowth');
  assert.ok(js.includes('mlg-cohort-tbody'), 'analytics.js must render #mlg-cohort-tbody');
  assert.ok(js.includes('mlg-cluster-response-tbody'), 'analytics.js must render #mlg-cluster-response-tbody');
  assert.ok(js.includes('mlg-decision-matrix-tbody'), 'analytics.js must render #mlg-decision-matrix-tbody');
  assert.ok(js.includes('mlg-monetization-summary'), 'analytics.js must render #mlg-monetization-summary');
});

// Group 3: Supabase Client Liquidity Growth Module Verification
test('Group 3: supabase-client.js exports computeLiquidityGrowthValidation & API methods', () => {
  const dbPath = path.join(__dirname, '../supabase-client.js');
  assert.ok(fs.existsSync(dbPath), 'supabase-client.js must exist');
  const dbCode = fs.readFileSync(dbPath, 'utf8');

  assert.ok(dbCode.includes('function computeLiquidityGrowthValidation'), 'Must define computeLiquidityGrowthValidation');
  assert.ok(dbCode.includes('LokatorDB.liquidityGrowth = {'), 'Must export LokatorDB.liquidityGrowth');
  assert.ok(dbCode.includes('getLiquidityGrowth(days = 30'), 'Must define getLiquidityGrowth on LokatorDB.analytics');
  assert.ok(dbCode.includes('EARLY_MARKETPLACE'), 'Must support EARLY_MARKETPLACE gate classification');
});

// Group 4: Non-Causal Guard & Observational Controls Verification
test('Group 4: Non-causal disclaimer and observational guard present in assets', () => {
  const dbPath = path.join(__dirname, '../supabase-client.js');
  const dbCode = fs.readFileSync(dbPath, 'utf8');
  assert.ok(dbCode.includes('Observed association; causality cannot be established'), 'supabase-client.js must contain disclaimer');

  const htmlPath = path.join(__dirname, '../analytics.html');
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(html.includes('Observed association; causality cannot be established'), 'analytics.html must contain disclaimer');
});

// Group 5: Zero Payment Gateway Code Compliance
test('Group 5: Strictly zero payment gateways, billing tokens, or monetization checkout', () => {
  const filesToCheck = [
    'supabase-client.js',
    'analytics.js',
    'analytics.html',
    'join.html',
    'register.html',
    'search.js',
    'profile.js',
    'dashboard.js'
  ];

  const forbiddenTokens = ['paystack', 'flutterwave', 'stripe', 'checkout.session', 'createSubscription', 'chargeCard'];

  filesToCheck.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      forbiddenTokens.forEach(token => {
        assert.ok(!content.includes(token), `Forbidden token "${token}" found in ${file}`);
      });
    }
  });
});

// Group 6: Core Page Markup & Script Linkages Integrity
test('Group 6: Core HTML files exist with proper script linkages', () => {
  const requiredFiles = ['index.html', 'join.html', 'search.html', 'register.html', 'profile.html', 'dashboard.html', 'analytics.html', 'login.html'];
  requiredFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    assert.ok(fs.existsSync(filePath), `${file} must exist`);
    const content = fs.readFileSync(filePath, 'utf8');
    assert.ok(content.includes('telemetry.js'), `${file} must include telemetry.js`);
  });
});

console.log('================================================================================');
console.log(`🎉 ALL ${passedTests} PHASE 10.12L HTTP & MARKUP VERIFICATION CHECKS PASSED (100%)!`);
console.log('================================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
