// ============================================================================
// LOKATOR.NG — PHASE 10.12I PRODUCTION DEPLOYMENT EDGE VERIFICATION
// Verifies live production at https://lokator-ng.vercel.app/
// ============================================================================

const https = require('https');
const assert = require('assert');

console.log('🚀 VERIFYING LIVE PRODUCTION EDGE DEPLOYMENT (PHASE 10.12I)...\n');

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
  console.log('--- TEST 1: LIVE REGISTER.HTML FUNNEL TELEMETRY ---');
  const regRes = await fetchUrl('https://lokator-ng.vercel.app/register.html');
  assert.strictEqual(regRes.statusCode, 200, 'Live /register.html returns HTTP 200');
  assert(regRes.body.includes('provider_onboarding_started'), 'Live register.html contains provider_onboarding_started');
  assert(regRes.body.includes('provider_onboarding_preview_reached'), 'Live register.html contains provider_onboarding_preview_reached');
  console.log('  ✅ [PASS] Live register.html verified with all onboarding funnel telemetry hooks');

  console.log('\n--- TEST 2: LIVE SEARCH.JS & PROFILE.JS FUNNEL TELEMETRY ---');
  const searchRes = await fetchUrl('https://lokator-ng.vercel.app/search.js');
  assert.strictEqual(searchRes.statusCode, 200, 'Live /search.js returns HTTP 200');
  assert(searchRes.body.includes('search_no_results'), 'Live search.js contains search_no_results');

  const profRes = await fetchUrl('https://lokator-ng.vercel.app/profile.js');
  assert.strictEqual(profRes.statusCode, 200, 'Live /profile.js returns HTTP 200');
  assert(profRes.body.includes('provider_profile_viewed'), 'Live profile.js contains provider_profile_viewed');
  console.log('  ✅ [PASS] Live search.js & profile.js contain customer funnel events');

  console.log('\n--- TEST 3: LIVE ANALYTICS.HTML & ANALYTICS.JS ---');
  const analyticsRes = await fetchUrl('https://lokator-ng.vercel.app/analytics.html');
  assert.strictEqual(analyticsRes.statusCode, 200, 'Live /analytics.html returns HTTP 200');
  assert(analyticsRes.body.includes('id="section-funnel-intelligence"'), 'Live analytics.html contains funnel intelligence section');
  assert(analyticsRes.body.includes('id="mfi-supply-demand-tbody"'), 'Live analytics.html contains supply & demand matrix table');

  const analyticsJsRes = await fetchUrl('https://lokator-ng.vercel.app/analytics.js');
  assert.strictEqual(analyticsJsRes.statusCode, 200, 'Live /analytics.js returns HTTP 200');
  assert(analyticsJsRes.body.includes('getMarketplaceFunnelIntelligence'), 'Live analytics.js contains getMarketplaceFunnelIntelligence');
  console.log('  ✅ [PASS] Live analytics dashboard contains Marketplace Funnel Intelligence view');

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
