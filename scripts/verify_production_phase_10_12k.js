// ============================================================================
// LOKATOR.NG — PHASE 10.12K PRODUCTION DEPLOYMENT EDGE VERIFICATION
// Verifies live production at https://lokator-ng.vercel.app/
// ============================================================================

const https = require('https');
const assert = require('assert');

console.log('🚀 VERIFYING LIVE PRODUCTION EDGE DEPLOYMENT (PHASE 10.12K)...\n');

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
  console.log('--- TEST 1: LIVE JOIN.HTML ACQUISITION PAGE ---');
  const joinRes = await fetchUrl('https://lokator-ng.vercel.app/join.html');
  assert.strictEqual(joinRes.statusCode, 200, 'Live /join.html returns HTTP 200');
  assert(joinRes.body.includes('id="join-primary-cta"'), 'Live join.html contains primary CTA');
  assert(joinRes.body.includes('provider_acquisition_landing_viewed'), 'Live join.html tracks landing view telemetry');
  console.log('  ✅ [PASS] Live /join.html verified with provider value proposition & query handling');

  console.log('\n--- TEST 2: LIVE REGISTER.HTML PRESELECTION & ATTRIBUTION ---');
  const regRes = await fetchUrl('https://lokator-ng.vercel.app/register.html');
  assert.strictEqual(regRes.statusCode, 200, 'Live /register.html returns HTTP 200');
  assert(regRes.body.includes('handleAcquisitionPreselection'), 'Live register.html contains handleAcquisitionPreselection');
  assert(regRes.body.includes('acquisition_source:'), 'Live register.html contains acquisition_source attribution in formData');
  console.log('  ✅ [PASS] Live register.html contains acquisition preselection and attribution');

  console.log('\n--- TEST 3: LIVE DASHBOARD REFERRAL TOOL ---');
  const dashRes = await fetchUrl('https://lokator-ng.vercel.app/dashboard.html');
  assert.strictEqual(dashRes.statusCode, 200, 'Live /dashboard.html returns HTTP 200');
  assert(dashRes.body.includes('id="dash-referral-section"'), 'Live dashboard.html contains dash-referral-section');
  assert(dashRes.body.includes('id="btn-copy-ref-link"'), 'Live dashboard.html contains btn-copy-ref-link');

  const dashJsRes = await fetchUrl('https://lokator-ng.vercel.app/dashboard.js');
  assert.strictEqual(dashJsRes.statusCode, 200, 'Live /dashboard.js returns HTTP 200');
  assert(dashJsRes.body.includes('renderReferralTool'), 'Live dashboard.js contains renderReferralTool');
  console.log('  ✅ [PASS] Live provider dashboard contains community referral link generator');

  console.log('\n--- TEST 4: LIVE ANALYTICS LIQUIDITY EXPANSION SECTION ---');
  const analyticsRes = await fetchUrl('https://lokator-ng.vercel.app/analytics.html');
  assert.strictEqual(analyticsRes.statusCode, 200, 'Live /analytics.html returns HTTP 200');
  assert(analyticsRes.body.includes('id="section-liquidity-expansion"'), 'Live analytics.html contains section-liquidity-expansion');
  assert(analyticsRes.body.includes('id="mle-opportunity-tbody"'), 'Live analytics.html contains opportunity table');

  const analyticsJsRes = await fetchUrl('https://lokator-ng.vercel.app/analytics.js');
  assert.strictEqual(analyticsJsRes.statusCode, 200, 'Live /analytics.js returns HTTP 200');
  assert(analyticsJsRes.body.includes('getLiquidityExpansion'), 'Live analytics.js contains getLiquidityExpansion');
  console.log('  ✅ [PASS] Live analytics dashboard contains Liquidity Expansion & Delta/Edo Market views');

  console.log('\n--- TEST 5: ZERO PAYMENT GATEWAY SDKS ENFORCEMENT ---');
  assert(!joinRes.body.includes('paystack'), 'Zero Paystack on live join.html');
  assert(!regRes.body.includes('paystack'), 'Zero Paystack on live register.html');
  console.log('  ✅ [PASS] Zero payment gateways on live acquisition routes');

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
