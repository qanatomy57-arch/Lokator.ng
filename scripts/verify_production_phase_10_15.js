/**
 * LOKATOR.NG — PHASE 10.15 PRODUCTION EDGE VERIFICATION
 * Verifies live deployment on https://lokator-ng.vercel.app/ for Phase 10.15
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
          headers: { 'User-Agent': 'LokatorNG-Audit/10.15' },
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
  console.log('\n🌍 RUNNING PHASE 10.15 PRODUCTION EDGE VERIFICATION\n');
  console.log('Target: https://lokator-ng.vercel.app/\n');

  // 1. Core Pages Serve 200 OK
  const pages = ['index.html', 'search.html', 'register.html', 'profile.html',
    'dashboard.html', 'analytics.html', 'join.html', 'login.html'];

  for (const page of pages) {
    await test(`${page} serves 200 OK`, async () => {
      const res = await get(`https://lokator-ng.vercel.app/${page}`);
      assert.strictEqual(res.status, 200, `${page} returned ${res.status}`);
    });
  }

  // 2. Service Worker version verification
  await test('sw.js serves updated cache version lokator-v10.15', async () => {
    const res = await get('https://lokator-ng.vercel.app/sw.js');
    assert.ok(res.body.includes('lokator-v10.15'), 'Must contain lokator-v10.15');
  });

  // 3. Search contains Saved Hands and Data Saver buttons
  await test('search.html contains Saved Hands and Data Saver buttons', async () => {
    const res = await get('https://lokator-ng.vercel.app/search.html');
    assert.ok(res.body.includes('nav-saved-artisans-btn'), 'Must contain nav-saved-artisans-btn');
    assert.ok(res.body.includes('btn-toggle-data-saver'), 'Must contain btn-toggle-data-saver');
  });

  // 4. Profile contains Saved Hands and bookmark button
  await test('profile.html contains bookmark button', async () => {
    const res = await get('https://lokator-ng.vercel.app/profile.html');
    assert.ok(res.body.includes('btn-profile-bookmark'), 'Must contain btn-profile-bookmark');
  });

  // 5. supabase-client.js exports LokatorDB.offline module
  await test('supabase-client.js exports LokatorDB.offline module', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    assert.ok(res.body.includes('LokatorDB.offline'), 'Must export LokatorDB.offline');
    assert.ok(res.body.includes('PAYMENT_LIVE_MODE: false'), 'Must maintain safe default');
  });

  console.log('\n================================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${passCount} PHASE 10.15 PRODUCTION EDGE CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passCount} PASSED, ${failCount} FAILED`);
  }
  console.log('================================================================================\n');

  if (failCount > 0) process.exit(1);
}

run();
