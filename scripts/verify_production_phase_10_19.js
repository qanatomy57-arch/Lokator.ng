/**
 * LOKATOR.NG — PHASE 10.19 PRODUCTION EDGE DEPLOYMENT VERIFIER
 * Validates that all Phase 10.19 assets, real location map engine, and mobile navigation drawer are live on https://lokator-ng.vercel.app/
 */

const https = require('https');
const assert = require('assert');

let passed = 0;
let failed = 0;

function fetchUrl(path) {
  return new Promise((resolve, reject) => {
    const url = `https://lokator-ng.vercel.app${path}`;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
    }).on('error', reject);
  });
}

async function check(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function run() {
  console.log('================================================================================');
  console.log('🚀 LOKATOR.NG — PHASE 10.19 PRODUCTION EDGE VERIFICATION');
  console.log('Target: https://lokator-ng.vercel.app/');
  console.log('================================================================================\n');

  console.log('--- 1. CORE HTML SHELLS & MOBILE DRAWER MARKUP ---');

  await check('1.1 profile.html serves 200 OK and includes service-location-card & mobile-nav-drawer', async () => {
    const res = await fetchUrl('/profile.html');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('id="service-location-card"'), 'profile.html missing #service-location-card');
    assert.ok(res.body.includes('id="profile-service-map"'), 'profile.html missing #profile-service-map');
    assert.ok(res.body.includes('id="btn-profile-gps"'), 'profile.html missing #btn-profile-gps');
    assert.ok(res.body.includes('id="mobile-nav-drawer"'), 'profile.html missing #mobile-nav-drawer');
    assert.ok(res.body.includes('id="mobile-nav-backdrop"'), 'profile.html missing #mobile-nav-backdrop');
  });

  await check('1.2 index.html serves 200 OK and includes mobile-nav-drawer', async () => {
    const res = await fetchUrl('/index.html');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('id="mobile-nav-drawer"'), 'index.html missing #mobile-nav-drawer');
  });

  await check('1.3 search.html serves 200 OK and includes mobile-nav-drawer', async () => {
    const res = await fetchUrl('/search.html');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('id="mobile-nav-drawer"'), 'search.html missing #mobile-nav-drawer');
  });

  await check('1.4 dashboard.html serves 200 OK and includes dash-service-map & GPS confirmation', async () => {
    const res = await fetchUrl('/dashboard.html');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('id="dash-service-map"'), 'dashboard.html missing #dash-service-map');
    assert.ok(res.body.includes('id="dash-gps-btn"'), 'dashboard.html missing #dash-gps-btn');
    assert.ok(res.body.includes('id="btn-confirm-location"'), 'dashboard.html missing #btn-confirm-location');
  });

  console.log('\n--- 2. MAP SERVICE ENGINE & SCRIPT ASSETS ---');

  await check('2.1 map-service.js serves 200 OK and exports LokatorMapService', async () => {
    const res = await fetchUrl('/map-service.js');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('LokatorMapService'), 'map-service.js missing LokatorMapService definition');
    assert.ok(res.body.includes('calculateDistanceKm'), 'map-service.js missing calculateDistanceKm');
  });

  console.log('\n--- 3. CSS COMPATIBILITY & MOBILE DRAWER STYLES ---');

  await check('3.1 style.css contains .mobile-nav-drawer, min 44px hamburger, and GPS styles', async () => {
    const res = await fetchUrl('/style.css');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('.mobile-nav-drawer'), 'style.css missing .mobile-nav-drawer');
    assert.ok(res.body.includes('min-width: 44px;'), 'style.css missing min-width: 44px');
    assert.ok(res.body.includes('body.mobile-nav-open'), 'style.css missing body.mobile-nav-open');
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.19 PRODUCTION EDGE CHECKS PASSED (100%)!`);
  } else {
    console.error(`⚠️ ${failed} CHECKS FAILED.`);
    process.exit(1);
  }
  console.log('================================================================================\n');
}

run();
