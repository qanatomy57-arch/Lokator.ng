/**
 * LOKATOR.NG — PHASE 10.13C PRODUCTION EDGE VERIFICATION
 * Verifies live production deployment at lokator-ng.vercel.app for Phase 10.13C
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
      headers: { 'User-Agent': 'LokatorNG-Audit/10.13C' },
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
  console.log('\n🌍 RUNNING PHASE 10.13C PRODUCTION EDGE VERIFICATION\n');
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

  // 2. Dashboard contains feedback selector and submit button
  await test('Dashboard contains Phase 10.13C structured feedback selector and submit button', async () => {
    const res = await get('https://lokator-ng.vercel.app/dashboard.html');
    assert.ok(res.body.includes('mon-feedback-reason-select'), 'Must contain mon-feedback-reason-select');
    assert.ok(res.body.includes('btn-submit-mon-feedback'), 'Must contain btn-submit-mon-feedback');
    assert.ok(res.body.includes('Why are you interested in these future artisan tools?'), 'Must contain feedback question');
  });

  // 3. Analytics contains Phase 10.13C 5-Stage Funnel and Monetization Validation Center
  await test('Analytics contains Phase 10.13C 5-Stage Funnel and Preference Overlap matrices', async () => {
    const res = await get('https://lokator-ng.vercel.app/analytics.html');
    assert.ok(res.body.includes('Monetization Product & Pricing Validation Center (Phase 10.13C)'), 'Must contain Phase 10.13C header');
    assert.ok(res.body.includes('mon-product-matrix-tbody'), 'Must contain mon-product-matrix-tbody');
    assert.ok(res.body.includes('mon-preference-container'), 'Must contain mon-preference-container');
    assert.ok(res.body.includes('mon-feedback-container'), 'Must contain mon-feedback-container');
    assert.ok(res.body.includes('kpi-mon-repeat'), 'Must contain kpi-mon-repeat');
  });

  // 4. supabase-client.js exports complete Phase 10.13C research engine
  await test('supabase-client.js exports Phase 10.13C monetization research engine', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    assert.ok(res.body.includes('recordResearchFeedback'));
    assert.ok(res.body.includes('monetization_product_repeat_interest'));
    assert.ok(res.body.includes('PROMISING_BUT_UNVALIDATED'));
    assert.ok(res.body.includes('PAYMENT_PROCESSING_ENABLED: false'));
    assert.ok(res.body.includes('LIVE_BILLING_ENABLED: false'));
  });

  // 5. Zero payment SDKs or credentials in production
  await test('Zero payment SDKs in production assets', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    const content = res.body.toLowerCase();
    ['paystack', 'flutterwave', 'stripe', 'razorpay', 'sk_live_', 'pk_live_'].forEach(token => {
      assert.ok(!content.includes(token), `Forbidden token "${token}" found in production`);
    });
  });

  console.log('\n================================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${passCount} PHASE 10.13C PRODUCTION EDGE CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passCount} PASSED, ${failCount} FAILED`);
  }
  console.log('================================================================================\n');

  if (failCount > 0) process.exit(1);
}

run();
