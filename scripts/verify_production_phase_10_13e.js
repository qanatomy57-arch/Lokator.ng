/**
 * LOKATOR.NG — PHASE 10.13E PRODUCTION EDGE VERIFICATION
 * Verifies live production deployment at lokator-ng.vercel.app for Phase 10.13E
 */

const https = require('https');
const assert = require('assert');

let passCount = 0;
let failCount = 0;

function get(urlStr) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const options = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname + url.search,
      method: 'GET',
      headers: { 'User-Agent': 'LokatorNG-Audit/10.13E' },
      timeout: 15000
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
  console.log('\n🌍 RUNNING PHASE 10.13E PRODUCTION EDGE VERIFICATION\n');
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

  // 2. Dashboard contains Paystack Starter Pilot trigger button
  await test('Dashboard contains Paystack Starter Pilot trigger button', async () => {
    const res = await get('https://lokator-ng.vercel.app/dashboard.html');
    assert.ok(res.body.includes('btn-start-paystack-pilot'), 'Must contain btn-start-paystack-pilot');
    assert.ok(res.body.includes('Launch 14-Day Pilot'), 'Must contain Launch 14-Day Pilot');
  });

  // 3. Analytics contains Phase 10.13E Paystack Pilot Orders and Test Ready status
  await test('Analytics contains Phase 10.13E Paystack Pilot Orders and Test Ready status', async () => {
    const res = await get('https://lokator-ng.vercel.app/analytics.html');
    assert.ok(res.body.includes('Paystack Pilot Payment Integration & Pilot Gate (Phase 10.13E)'), 'Must contain Phase 10.13E title');
    assert.ok(res.body.includes('mon-pilot-orders-tbody'), 'Must contain mon-pilot-orders-tbody');
    assert.ok(res.body.includes('PAYMENT_INTEGRATION_TEST_READY'), 'Must contain PAYMENT_INTEGRATION_TEST_READY');
  });

  // 4. supabase-client.js exports Paystack pilot engine
  await test('supabase-client.js exports Paystack pilot engine and enforces test mode', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    assert.ok(res.body.includes('paystackPilotEngine'));
    assert.ok(res.body.includes('PROMOTED_LISTING_STARTER'));
    assert.ok(res.body.includes('PAYMENT_INTEGRATION_TEST_READY'));
    assert.ok(res.body.includes('PAYMENT_LIVE_MODE: false'));
  });

  // 5. search.js renders explicit sponsored badge
  await test('search.js renders explicit sponsored badge for promoted artisan search results', async () => {
    const res = await get('https://lokator-ng.vercel.app/search.js');
    assert.ok(res.body.includes('badge-tag-sponsored'));
    assert.ok(res.body.includes('⚡ Sponsored'));
  });

  // 6. Zero live secret keys or active live billing SDKs in production assets
  await test('Zero live payment secret keys in production assets', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    const content = res.body.toLowerCase();
    ['sk_live_', 'client_secret_live', 'js.paystack.co', 'checkout.flutterwave.com', 'js.stripe.com'].forEach(token => {
      assert.ok(!content.includes(token), `Forbidden live token "${token}" found in production`);
    });
  });

  console.log('\n================================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${passCount} PHASE 10.13E PRODUCTION EDGE CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passCount} PASSED, ${failCount} FAILED`);
  }
  console.log('================================================================================\n');

  if (failCount > 0) process.exit(1);
}

run();
