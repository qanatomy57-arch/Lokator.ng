// ============================================================================
// LOKATOR.NG — PHASE 10.13 PRODUCTION DEPLOYMENT EDGE VERIFICATION
// Verifies live production at https://lokator-ng.vercel.app/
// ============================================================================

const https = require('https');
const assert = require('assert');

console.log('🚀 VERIFYING LIVE PRODUCTION EDGE DEPLOYMENT (PHASE 10.13)...\n');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

async function verifyProduction() {
  console.log('--- TEST 1: LIVE ANALYTICS MONETIZATION ARCHITECTURE SECTION ---');
  const analyticsRes = await fetchUrl('https://lokator-ng.vercel.app/analytics.html');
  assert.strictEqual(analyticsRes.statusCode, 200, 'Live /analytics.html returns HTTP 200');
  assert(analyticsRes.body.includes('id="section-monetization-architecture"'), 'Live analytics.html contains section-monetization-architecture');
  assert(analyticsRes.body.includes('id="mon-product-matrix-tbody"'), 'Live analytics.html contains product matrix table');
  assert(analyticsRes.body.includes('id="mon-research-tbody"'), 'Live analytics.html contains research waitlist table');
  assert(analyticsRes.body.includes('id="mon-gate-status"'), 'Live analytics.html contains gate status');
  console.log('  ✅ [PASS] Live analytics contains Phase 10.13 Monetization Architecture & Research sections');

  console.log('\n--- TEST 2: LIVE ANALYTICS CONTROLLER LOGIC ---');
  const analyticsJsRes = await fetchUrl('https://lokator-ng.vercel.app/analytics.js');
  assert.strictEqual(analyticsJsRes.statusCode, 200, 'Live /analytics.js returns HTTP 200');
  assert(analyticsJsRes.body.includes('getMonetizationSummary'), 'Live analytics.js contains getMonetizationSummary');
  assert(analyticsJsRes.body.includes('mon-product-matrix-tbody'), 'Live analytics.js hydrates monetization tables');
  console.log('  ✅ [PASS] Live analytics.js hydrates Phase 10.13 monetization tables');

  console.log('\n--- TEST 3: LIVE DASHBOARD RESEARCH CARD & TRUST DISCLAIMER ---');
  const dashRes = await fetchUrl('https://lokator-ng.vercel.app/dashboard.html');
  assert.strictEqual(dashRes.statusCode, 200, 'Live /dashboard.html returns HTTP 200');
  assert(dashRes.body.includes('id="dash-monetization-research-section"'), 'Live dashboard.html contains dash-monetization-research-section');
  assert(dashRes.body.includes('Paying for verification audit review does NOT guarantee approval'), 'Live dashboard.html contains verification approval disclaimer');
  assert(dashRes.body.includes('0% commission'), 'Live dashboard.html guarantees 0% commission');

  const dashJsRes = await fetchUrl('https://lokator-ng.vercel.app/dashboard.js');
  assert.strictEqual(dashJsRes.statusCode, 200, 'Live /dashboard.js returns HTTP 200');
  assert(dashJsRes.body.includes('renderMonetizationResearch'), 'Live dashboard.js contains renderMonetizationResearch');
  console.log('  ✅ [PASS] Live provider dashboard contains monetization research card with trust separation');

  console.log('\n--- TEST 4: LIVE SUPABASE CLIENT MONETIZATION MODULE ---');
  const supabaseJsRes = await fetchUrl('https://lokator-ng.vercel.app/supabase-client.js');
  assert.strictEqual(supabaseJsRes.statusCode, 200, 'Live /supabase-client.js returns HTTP 200');
  assert(supabaseJsRes.body.includes('LokatorDB.monetization = {'), 'Live supabase-client.js exports LokatorDB.monetization');
  assert(supabaseJsRes.body.includes('ARCHITECTURALLY_READY_BUT_NOT_VALIDATED'), 'Live supabase-client.js defines payment readiness gate');
  assert(supabaseJsRes.body.includes('PaymentProviderAdapter'), 'Live supabase-client.js defines PaymentProviderAdapter');
  console.log('  ✅ [PASS] Live supabase-client.js exports Monetization Architecture module');

  console.log('\n--- TEST 5: ZERO ACTIVE PAYMENT GATEWAYS SDKS ENFORCEMENT ---');
  const forbiddenTokens = ['paystack', 'flutterwave', 'stripe', 'checkout.session', 'chargeCard'];
  forbiddenTokens.forEach(token => {
    assert(!analyticsJsRes.body.toLowerCase().includes(token), `No ${token} in analytics.js`);
    assert(!supabaseJsRes.body.toLowerCase().includes(token), `No ${token} in supabase-client.js`);
    assert(!dashJsRes.body.toLowerCase().includes(token), `No ${token} in dashboard.js`);
  });
  console.log('  ✅ [PASS] Strictly zero billing tokens / active payment code in production');

  console.log('\n================================================================================');
  console.log('🎉 ALL 5 PHASE 10.13 PRODUCTION EDGE ASSERTIONS PASSED (100%)!');
  console.log('================================================================================\n');
}

verifyProduction().catch(err => {
  console.error('❌ Phase 10.13 Production Verification Failed:', err.message);
  process.exit(1);
});
