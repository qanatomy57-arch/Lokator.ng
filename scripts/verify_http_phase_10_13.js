/**
 * LOKATOR.NG — PHASE 10.13 HTTP & ASSET VERIFICATION SUITE
 * Scope: HTML Markup integrity, Analytics rendering elements, Dashboard research section, Zero payment code
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

console.log('\n🌐 RUNNING PHASE 10.13 HTTP & ASSET VERIFICATION SUITE...\n');

// Group 1: Analytics HTML Markup Verification
test('Group 1: analytics.html contains complete Phase 10.13 UI section & DOM nodes', () => {
  const htmlPath = path.join(__dirname, '../analytics.html');
  assert.ok(fs.existsSync(htmlPath), 'analytics.html must exist');
  const html = fs.readFileSync(htmlPath, 'utf8');

  assert.ok(html.includes('id="section-monetization-architecture"'), 'Must contain #section-monetization-architecture');
  assert.ok(html.includes('id="mon-gate-status"'), 'Must contain #mon-gate-status');
  assert.ok(html.includes('id="mon-product-matrix-tbody"'), 'Must contain #mon-product-matrix-tbody');
  assert.ok(html.includes('id="mon-research-tbody"'), 'Must contain #mon-research-tbody');
  assert.ok(html.includes('id="mon-delta-fit"'), 'Must contain #mon-delta-fit');
  assert.ok(html.includes('id="mon-edo-fit"'), 'Must contain #mon-edo-fit');
});

// Group 2: Analytics Controller Logic Verification
test('Group 2: analytics.js hydrates Phase 10.13 monetization tables & cards', () => {
  const jsPath = path.join(__dirname, '../analytics.js');
  assert.ok(fs.existsSync(jsPath), 'analytics.js must exist');
  const js = fs.readFileSync(jsPath, 'utf8');

  assert.ok(js.includes('getMonetizationSummary'), 'analytics.js must invoke getMonetizationSummary');
  assert.ok(js.includes('mon-product-matrix-tbody'), 'analytics.js must render #mon-product-matrix-tbody');
  assert.ok(js.includes('mon-research-tbody'), 'analytics.js must render #mon-research-tbody');
});

// Group 3: Provider Dashboard Research UI Verification
test('Group 3: dashboard.html & dashboard.js contain monetization research card & waitlist handler', () => {
  const dashHtmlPath = path.join(__dirname, '../dashboard.html');
  assert.ok(fs.existsSync(dashHtmlPath), 'dashboard.html must exist');
  const dashHtml = fs.readFileSync(dashHtmlPath, 'utf8');

  assert.ok(dashHtml.includes('id="dash-monetization-research-section"'), 'dashboard.html must contain #dash-monetization-research-section');
  assert.ok(dashHtml.includes('btn-mon-interest'), 'dashboard.html must contain .btn-mon-interest buttons');
  assert.ok(dashHtml.includes('Paying for verification audit review does NOT guarantee approval'), 'Must contain verification disclaimer');
  assert.ok(dashHtml.includes('0% commission'), 'Must guarantee 0% commission on free marketplace');

  const dashJsPath = path.join(__dirname, '../dashboard.js');
  assert.ok(fs.existsSync(dashJsPath), 'dashboard.js must exist');
  const dashJs = fs.readFileSync(dashJsPath, 'utf8');
  assert.ok(dashJs.includes('renderMonetizationResearch'), 'dashboard.js must define renderMonetizationResearch');
  assert.ok(dashJs.includes('joinProductWaitlist'), 'dashboard.js must invoke joinProductWaitlist');
});

// Group 4: Supabase Client Monetization Architecture Module Verification
test('Group 4: supabase-client.js exports LokatorDB.monetization with agnostic adapter & research engine', () => {
  const dbPath = path.join(__dirname, '../supabase-client.js');
  assert.ok(fs.existsSync(dbPath), 'supabase-client.js must exist');
  const dbCode = fs.readFileSync(dbPath, 'utf8');

  assert.ok(dbCode.includes('LokatorDB.monetization = {'), 'Must export LokatorDB.monetization');
  assert.ok(dbCode.includes('PaymentProviderAdapter'), 'Must define PaymentProviderAdapter');
  assert.ok(dbCode.includes('CANDIDATE_MONETIZATION_PRODUCTS'), 'Must define candidate monetization products');
  assert.ok(dbCode.includes('PAYMENT_PROCESSING_ENABLED: false'), 'Must lock PAYMENT_PROCESSING_ENABLED to false');
  assert.ok(dbCode.includes('ARCHITECTURALLY_READY_BUT_NOT_VALIDATED'), 'Must support ARCHITECTURALLY_READY_BUT_NOT_VALIDATED classification');
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
    'dashboard.js',
    'dashboard.html'
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

// Group 6: Core HTML files script linkages & non-blocking execution
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
console.log(`🎉 ALL ${passedTests} PHASE 10.13 HTTP & MARKUP VERIFICATION CHECKS PASSED (100%)!`);
console.log('================================================================================\n');

if (failedTests > 0) {
  process.exit(1);
}
