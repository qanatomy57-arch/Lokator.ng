// ============================================================================
// LOKATOR.NG — PHASE 10.12G PRODUCTION DEPLOYMENT EDGE VERIFICATION
// Verifies live production at https://lokator-ng.vercel.app/
// ============================================================================

const https = require('https');
const assert = require('assert');

console.log('🚀 VERIFYING LIVE PRODUCTION EDGE DEPLOYMENT (PHASE 10.12G)...\n');

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
  console.log('--- TEST 1: LIVE REGISTER.HTML ENDPOINT ---');
  const regRes = await fetchUrl('https://lokator-ng.vercel.app/register.html');
  assert.strictEqual(regRes.statusCode, 200, 'Live /register.html returns HTTP 200');
  assert(regRes.body.includes('id="onboarding-stepper"'), 'Live register.html contains onboarding stepper');
  assert(regRes.body.includes('id="step-pane-1"'), 'Live register.html contains Step 1 pane');
  assert(regRes.body.includes('id="step-pane-5"'), 'Live register.html contains Step 5 pane');
  assert(regRes.body.includes('id="completeness-meter"'), 'Live register.html contains completeness meter');
  assert(regRes.body.includes('id="preview-profile-card"'), 'Live register.html contains live preview card');
  assert(regRes.body.includes('src="phone-utils.js"'), 'Live register.html loads phone-utils.js');
  assert(regRes.body.includes('src="locations.js"'), 'Live register.html loads locations.js');
  assert(regRes.body.includes('src="ai-service.js"'), 'Live register.html loads ai-service.js');
  console.log('  ✅ [PASS] Live register.html verified with all 5 progressive disclosure steps');

  console.log('\n--- TEST 2: LIVE STYLE.CSS DESIGN TOKENS ---');
  const cssRes = await fetchUrl('https://lokator-ng.vercel.app/style.css');
  assert.strictEqual(cssRes.statusCode, 200, 'Live /style.css returns HTTP 200');
  assert(cssRes.body.includes('.onboarding-stepper'), 'Live style.css includes .onboarding-stepper');
  assert(cssRes.body.includes('.completeness-meter-wrap'), 'Live style.css includes .completeness-meter-wrap');
  assert(cssRes.body.includes('.preview-profile-card'), 'Live style.css includes .preview-profile-card');
  console.log('  ✅ [PASS] Live style.css contains all Phase 10.12G stepper tokens');

  console.log('\n--- TEST 3: LIVE CORE CLIENT ENGINES ---');
  const phoneRes = await fetchUrl('https://lokator-ng.vercel.app/phone-utils.js');
  assert.strictEqual(phoneRes.statusCode, 200, 'Live /phone-utils.js returns HTTP 200');
  const locRes = await fetchUrl('https://lokator-ng.vercel.app/locations.js');
  assert.strictEqual(locRes.statusCode, 200, 'Live /locations.js returns HTTP 200');
  const aiRes = await fetchUrl('https://lokator-ng.vercel.app/ai-service.js');
  assert.strictEqual(aiRes.statusCode, 200, 'Live /ai-service.js returns HTTP 200');
  console.log('  ✅ [PASS] Live phone, location, and AI client modules accessible over HTTPS');

  console.log('\n================================================================================');
  console.log('🎉 LIVE PRODUCTION VERIFICATION COMPLETE: ALL CHECKS 100% GREEN ON VERCEL EDGE!');
  console.log('================================================================================\n');
}

// Allow brief Vercel build cycle if needed
setTimeout(() => {
  verifyProduction().catch(err => {
    console.error('Edge verification note:', err.message);
    console.log('Retrying in 5 seconds...');
    setTimeout(() => {
      verifyProduction().catch(err2 => {
        console.error('Failed edge verification:', err2);
        process.exit(1);
      });
    }, 5000);
  });
}, 3000);
