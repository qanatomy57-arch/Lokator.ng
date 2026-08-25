/**
 * LOKATOR.NG — PHASE 10.13A PRODUCTION EDGE VERIFICATION
 * Verifies the live production deployment at lokator-ng.vercel.app
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
      headers: { 'User-Agent': 'LokatorNG-Audit/10.13A' },
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
  console.log('\n🌍 RUNNING PHASE 10.13A PRODUCTION EDGE VERIFICATION\n');
  console.log('Target: https://lokator-ng.vercel.app/\n');

  // 1. Core Pages Serve 200
  const pages = ['index.html', 'search.html', 'register.html', 'profile.html',
    'dashboard.html', 'analytics.html', 'join.html', 'login.html'];

  for (const page of pages) {
    await test(`${page} serves 200 OK`, async () => {
      const res = await get(`https://lokator-ng.vercel.app/${page}`);
      assert.strictEqual(res.status, 200, `${page} returned ${res.status}`);
    });
  }

  // 2. Zero Payment SDK in production supabase-client.js
  await test('supabase-client.js has zero payment SDKs', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    assert.strictEqual(res.status, 200);
    const content = res.body.toLowerCase();
    ['paystack', 'flutterwave', 'stripe', 'razorpay'].forEach(sdk => {
      assert.ok(!content.includes(sdk), `Payment SDK "${sdk}" found in production`);
    });
  });

  // 3. PAYMENT_PROCESSING_ENABLED is false in production
  await test('PAYMENT_PROCESSING_ENABLED locked to false in production', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    assert.ok(res.body.includes('PAYMENT_PROCESSING_ENABLED: false'));
  });

  // 4. LIVE_BILLING_ENABLED is false in production
  await test('LIVE_BILLING_ENABLED locked to false in production', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    assert.ok(res.body.includes('LIVE_BILLING_ENABLED: false'));
  });

  // 5. Zero payment credentials in production
  await test('Zero payment credentials exposed in production', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    ['sk_live_', 'pk_live_', 'sk_test_', 'pk_test_', 'PAYSTACK_SECRET', 'STRIPE_SECRET'].forEach(token => {
      assert.ok(!res.body.includes(token), `Credential "${token}" found in production`);
    });
  });

  // 6. Dashboard monetization research section exists
  await test('Dashboard contains monetization research section', async () => {
    const res = await get('https://lokator-ng.vercel.app/dashboard.html');
    assert.ok(res.body.includes('dash-monetization-research-section'));
    assert.ok(res.body.includes('does NOT guarantee approval'));
  });

  // 7. Analytics monetization architecture section exists
  await test('Analytics contains monetization architecture command center', async () => {
    const res = await get('https://lokator-ng.vercel.app/analytics.html');
    assert.ok(res.body.includes('section-monetization-architecture'));
    assert.ok(res.body.includes('0%_COMMISSION_LOCKED'));
  });

  // 8. Search has zero monetization coupling
  await test('Search page has zero monetization or billing code', async () => {
    const res = await get('https://lokator-ng.vercel.app/search.js');
    const content = res.body.toLowerCase();
    assert.ok(!content.includes('monetization'));
    assert.ok(!content.includes('entitlement'));
    assert.ok(!content.includes('billing'));
  });

  // 9. Free marketplace entitlement exports exist
  await test('LokatorDB.monetization architecture exports exist in production', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    assert.ok(res.body.includes('LokatorDB.monetization = {'));
    assert.ok(res.body.includes('FREE_DEFAULT_ENTITLEMENTS'));
    assert.ok(res.body.includes('PaymentProviderAdapter'));
    assert.ok(res.body.includes('ARCHITECTURALLY_READY_BUT_NOT_VALIDATED'));
  });

  // 10. No payment API endpoints
  await test('No payment API endpoint URLs in production HTML', async () => {
    for (const page of pages) {
      const res = await get(`https://lokator-ng.vercel.app/${page}`);
      const content = res.body.toLowerCase();
      assert.ok(!content.includes('api.paystack.co'));
      assert.ok(!content.includes('api.flutterwave.com'));
      assert.ok(!content.includes('api.stripe.com'));
    }
  });

  console.log('\n================================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${passCount} PRODUCTION EDGE CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passCount} PASSED, ${failCount} FAILED`);
  }
  console.log('================================================================================\n');

  if (failCount > 0) process.exit(1);
}

run();
