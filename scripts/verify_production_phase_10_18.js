/**
 * LOKATOR.NG — PHASE 10.18 PRODUCTION EDGE VERIFICATION
 * Verifies live deployment on https://lokator-ng.vercel.app/ for Phase 10.18
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
          headers: { 'User-Agent': 'LokatorNG-Audit/10.18' },
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
  console.log('\n🌍 RUNNING PHASE 10.18 PRODUCTION EDGE VERIFICATION\n');
  console.log('Target: https://lokator-ng.vercel.app/\n');

  // 1. Core Pages Serve 200 OK
  const pages = ['index.html', 'search.html', 'register.html', 'profile.html',
    'dashboard.html', 'analytics.html', 'admin.html', 'join.html', 'login.html'];

  for (const page of pages) {
    await test(`${page} serves 200 OK`, async () => {
      const res = await get(`https://lokator-ng.vercel.app/${page}`);
      assert.strictEqual(res.status, 200);
    });
  }

  // 2. Profile page has reviews section, histogram and review modal
  await test('profile.html contains reviews histogram and review filter pills', async () => {
    const res = await get('https://lokator-ng.vercel.app/profile.html');
    assert.ok(res.body.includes('reviews-histogram'));
    assert.ok(res.body.includes('review-filter-pills'));
    assert.ok(res.body.includes('review-modal'));
  });

  // 3. Dashboard page has reviews tab
  await test('dashboard.html contains reviews tab panel and review desk', async () => {
    const res = await get('https://lokator-ng.vercel.app/dashboard.html');
    assert.ok(res.body.includes('data-tab="reviews"'));
    assert.ok(res.body.includes('all-reviews-list'));
  });

  // 4. supabase-client.js exports LokatorDB.reviews
  await test('supabase-client.js exports LokatorDB.reviews module', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    assert.ok(res.body.includes('LokatorDB.reviews = reviewsManager'));
    assert.ok(res.body.includes('getReviewSummary'));
  });

  console.log('\n================================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${passCount} PHASE 10.18 PRODUCTION EDGE CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passCount} PASSED, ${failCount} FAILED`);
    process.exit(1);
  }
  console.log('================================================================================\n');
}

run();
