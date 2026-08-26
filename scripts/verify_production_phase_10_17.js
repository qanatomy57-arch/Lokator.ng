/**
 * LOKATOR.NG — PHASE 10.17 PRODUCTION EDGE VERIFICATION
 * Verifies live deployment on https://lokator-ng.vercel.app/ for Phase 10.17
 */

const https = require('https');
const assert = require('assert');

let passCount = 0;
let failCount = 0;

async function get(urlStr, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const options = {
          hostname: url.hostname,
          port: 443,
          path: url.pathname + url.search,
          method: 'GET',
          headers: { 'User-Agent': 'LokatorNG-Audit/10.17' },
          timeout: 25000
        };
        const req = https.request(options, (res) => {
          let body = '';
          res.on('data', (d) => body += d);
          res.on('end', () => resolve({ status: res.statusCode, body, headers: res.headers }));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
        req.end();
      });
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 1500));
    }
  }
}

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

async function run() {
  console.log('\n🌍 RUNNING PHASE 10.17 PRODUCTION EDGE VERIFICATION\n');
  console.log('Target: https://lokator-ng.vercel.app/\n');

  // 1. Core Pages Serve 200 OK
  const pages = ['index.html', 'search.html', 'register.html', 'profile.html',
    'dashboard.html', 'analytics.html', 'admin.html', 'join.html', 'login.html'];

  for (const page of pages) {
    await test(`${page} serves 200 OK`, async () => {
      const res = await get(`https://lokator-ng.vercel.app/${page}`);
      assert.strictEqual(res.status, 200, `${page} returned ${res.status}`);
    });
  }

  // 2. search.html contains Leaflet, Map container, and View Modes
  await test('search.html contains Leaflet, map container, and view toggles', async () => {
    const res = await get('https://lokator-ng.vercel.app/search.html');
    assert.ok(res.body.includes('leaflet.css'), 'Must include Leaflet CSS');
    assert.ok(res.body.includes('search-map-container'), 'Must include search-map-container');
    assert.ok(res.body.includes('view-mode-toggle'), 'Must include view-mode-toggle');
    assert.ok(res.body.includes('recent-searches-bar'), 'Must include recent-searches-bar');
    assert.ok(res.body.includes('btn-mobile-map-toggle'), 'Must include mobile map toggle');
  });

  // 3. index.html contains updated hero search form
  await test('index.html contains hero search inputs and suggestions dropdowns', async () => {
    const res = await get('https://lokator-ng.vercel.app/index.html');
    assert.ok(res.body.includes('hero-service-suggestions'), 'Must include hero-service-suggestions');
    assert.ok(res.body.includes('hero-location-suggestions'), 'Must include hero-location-suggestions');
  });

  // 4. supabase-client.js exports LokatorDB.searchHistory module
  await test('supabase-client.js exports LokatorDB.searchHistory module', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    assert.ok(res.body.includes('LokatorDB.searchHistory'), 'Must export LokatorDB.searchHistory');
    assert.ok(res.body.includes('getRecentSearches'), 'Must include getRecentSearches');
    assert.ok(res.body.includes('PAYMENT_LIVE_MODE: false'), 'Must maintain safe default');
  });

  console.log('\n================================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${passCount} PHASE 10.17 PRODUCTION EDGE CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passCount} PASSED, ${failCount} FAILED`);
  }
  console.log('================================================================================\n');

  if (failCount > 0) process.exit(1);
}

run();
