// ============================================================================
// LOKATOR.NG — PHASE 10.12J PRODUCTION DEPLOYMENT EDGE VERIFICATION
// Verifies live production at https://lokator-ng.vercel.app/
// ============================================================================

const https = require('https');
const assert = require('assert');

console.log('🚀 VERIFYING LIVE PRODUCTION EDGE DEPLOYMENT (PHASE 10.12J)...\n');

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
  console.log('--- TEST 1: LIVE ANALYTICS.HTML MONETIZATION READINESS GATE MARKUP ---');
  const analyticsRes = await fetchUrl('https://lokator-ng.vercel.app/analytics.html');
  assert.strictEqual(analyticsRes.statusCode, 200, 'Live /analytics.html returns HTTP 200');
  assert(analyticsRes.body.includes('id="section-monetization-readiness"'), 'Live analytics.html contains section-monetization-readiness');
  assert(analyticsRes.body.includes('id="mrg-readiness-badge"'), 'Live analytics.html contains mrg-readiness-badge');
  assert(analyticsRes.body.includes('id="mrg-dim-supply"'), 'Live analytics.html contains mrg-dim-supply');
  assert(analyticsRes.body.includes('id="mrg-dim-demand"'), 'Live analytics.html contains mrg-dim-demand');
  assert(analyticsRes.body.includes('id="mrg-dim-liquidity"'), 'Live analytics.html contains mrg-dim-liquidity');
  console.log('  ✅ [PASS] Live analytics.html verified with Phase 10.12J Monetization Readiness Gate markup');

  console.log('\n--- TEST 2: LIVE ANALYTICS.JS CONTROLLER HOOKS ---');
  const analyticsJsRes = await fetchUrl('https://lokator-ng.vercel.app/analytics.js');
  assert.strictEqual(analyticsJsRes.statusCode, 200, 'Live /analytics.js returns HTTP 200');
  assert(analyticsJsRes.body.includes('getMonetizationReadiness'), 'Live analytics.js contains getMonetizationReadiness');
  console.log('  ✅ [PASS] Live analytics.js contains getMonetizationReadiness controller integration');

  console.log('\n--- TEST 3: LIVE SUPABASE-CLIENT.JS ENGINE EXPORTS ---');
  const dbRes = await fetchUrl('https://lokator-ng.vercel.app/supabase-client.js');
  assert.strictEqual(dbRes.statusCode, 200, 'Live /supabase-client.js returns HTTP 200');
  assert(dbRes.body.includes('computeMonetizationReadinessGate'), 'Live supabase-client.js contains computeMonetizationReadinessGate');
  assert(dbRes.body.includes('LokatorDB.monetizationReadiness ='), 'Live supabase-client.js exports LokatorDB.monetizationReadiness');
  console.log('  ✅ [PASS] Live supabase-client.js contains Monetization Readiness Gate Engine');

  console.log('\n--- TEST 4: ZERO PAYMENT SDK OR BILLING SCRIPTS ENFORCEMENT ---');
  assert(!analyticsRes.body.includes('paystack'), 'Zero Paystack script on live analytics page');
  assert(!analyticsRes.body.includes('flutterwave'), 'Zero Flutterwave script on live analytics page');
  assert(!analyticsRes.body.includes('stripe'), 'Zero Stripe script on live analytics page');
  console.log('  ✅ [PASS] Zero payment gateways or active monetization billing scripts on production');

  console.log('\n================================================================================');
  console.log('🎉 LIVE PRODUCTION VERIFICATION COMPLETE: ALL CHECKS 100% GREEN ON VERCEL EDGE!');
  console.log('================================================================================\n');
}

// Allow brief Vercel build cycle if needed
setTimeout(() => {
  verifyProduction().catch(err => {
    console.error('Edge verification note:', err.message);
    console.log('Retrying in 6 seconds...');
    setTimeout(() => {
      verifyProduction().catch(err2 => {
        console.error('Failed edge verification:', err2);
        process.exit(1);
      });
    }, 6000);
  });
}, 3000);
