// ============================================================================
// LOKATOR.NG — PHASE 10.12H PRODUCTION DEPLOYMENT EDGE VERIFICATION
// Verifies live production at https://lokator-ng.vercel.app/
// ============================================================================

const https = require('https');
const assert = require('assert');

console.log('🚀 VERIFYING LIVE PRODUCTION EDGE DEPLOYMENT (PHASE 10.12H)...\n');

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
  console.log('--- TEST 1: LIVE PROFILE.HTML ENDPOINT ---');
  const profRes = await fetchUrl('https://lokator-ng.vercel.app/profile.html');
  assert.strictEqual(profRes.statusCode, 200, 'Live /profile.html returns HTTP 200');
  assert(profRes.body.includes('id="hero-verified-badge"'), 'Live profile.html contains dynamic hero badge container');
  assert(!profRes.body.includes('>NIN Verified Pro<'), 'Live profile.html has removed static NIN badge');
  assert(profRes.body.includes('class="provider-supplied-tag"'), 'Live profile.html contains Self-Reported tag');
  assert(profRes.body.includes('Trust & Safety Guidelines'), 'Live profile.html contains Trust & Safety Guidelines');
  assert(profRes.body.includes('id="report-modal"'), 'Live profile.html contains Report Modal');
  console.log('  ✅ [PASS] Live profile.html verified with authentic trust transparency & report modal');

  console.log('\n--- TEST 2: LIVE DASHBOARD.HTML ENDPOINT ---');
  const dashRes = await fetchUrl('https://lokator-ng.vercel.app/dashboard.html');
  assert.strictEqual(dashRes.statusCode, 200, 'Live /dashboard.html returns HTTP 200');
  assert(dashRes.body.includes('Trust & Credential Verification Center'), 'Live dashboard.html contains Trust & Credential Verification Center');
  assert(dashRes.body.includes('id="dash-ver-status-chip"'), 'Live dashboard.html contains status chip');
  assert(dashRes.body.includes('id="form-request-verification"'), 'Live dashboard.html contains request form');
  console.log('  ✅ [PASS] Live dashboard.html contains authentic Trust & Verification Center');

  console.log('\n--- TEST 3: LIVE STYLES & TRUST BADGE TOKENS ---');
  const cssRes = await fetchUrl('https://lokator-ng.vercel.app/profile.css');
  assert.strictEqual(cssRes.statusCode, 200, 'Live /profile.css returns HTTP 200');
  assert(cssRes.body.includes('.profile-verified-pill.verified'), 'Live profile.css contains .profile-verified-pill.verified');
  assert(cssRes.body.includes('.profile-verified-pill.pending'), 'Live profile.css contains .profile-verified-pill.pending');
  assert(cssRes.body.includes('.profile-verified-pill.unverified'), 'Live profile.css contains .profile-verified-pill.unverified');
  assert(cssRes.body.includes('.provider-supplied-tag'), 'Live profile.css contains .provider-supplied-tag');
  console.log('  ✅ [PASS] Live CSS contains all Phase 10.12H trust badge and tag styles');

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
