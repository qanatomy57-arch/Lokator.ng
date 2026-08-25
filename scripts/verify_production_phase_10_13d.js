/**
 * LOKATOR.NG — PHASE 10.13D PRODUCTION EDGE VERIFICATION
 * Verifies live production deployment at lokator-ng.vercel.app for Phase 10.13D
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
      headers: { 'User-Agent': 'LokatorNG-Audit/10.13D' },
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
  console.log('\n🌍 RUNNING PHASE 10.13D PRODUCTION EDGE VERIFICATION\n');
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

  // 2. Dashboard marks Promoted Category Placement as First Pilot Candidate
  await test('Dashboard marks Promoted Category Placement as First Pilot Candidate', async () => {
    const res = await get('https://lokator-ng.vercel.app/dashboard.html');
    assert.ok(res.body.includes('First Pilot Candidate'), 'Must contain First Pilot Candidate badge');
    assert.ok(res.body.includes('PROMOTED_DISCOVERY'), 'Must contain PROMOTED_DISCOVERY');
  });

  // 3. Analytics contains Phase 10.13D Finalist Evaluation & Pilot Readiness Panels
  await test('Analytics contains Phase 10.13D Finalist Evaluation and Pilot Specification', async () => {
    const res = await get('https://lokator-ng.vercel.app/analytics.html');
    assert.ok(res.body.includes('Monetization Pilot Readiness & First-Paid-Product Gate (Phase 10.13D)'), 'Must contain Phase 10.13D title');
    assert.ok(res.body.includes('SELECTED: PROMOTED_DISCOVERY_FIRST'), 'Must contain selected winner badge');
    assert.ok(res.body.includes('mon-finalist-tbody'), 'Must contain mon-finalist-tbody');
  });

  // 4. supabase-client.js exports complete Phase 10.13D pilot decision engine
  await test('supabase-client.js exports Phase 10.13D pilot decision engine and gate', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    assert.ok(res.body.includes('PROMOTED_DISCOVERY_FIRST'));
    assert.ok(res.body.includes('PILOT_READY_PAYMENT_STILL_DISABLED'));
    assert.ok(res.body.includes('PAYMENT_PROCESSING_ENABLED: false'));
    assert.ok(res.body.includes('LIVE_BILLING_ENABLED: false'));
  });

  // 5. Zero live payment SDKs or credentials in production
  await test('Zero live payment SDKs in production assets', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    const content = res.body.toLowerCase();
    ['js.paystack.co', 'checkout.flutterwave.com', 'js.stripe.com', 'sk_live_', 'pk_live_'].forEach(token => {
      assert.ok(!content.includes(token), `Forbidden live token "${token}" found in production`);
    });
  });

  console.log('\n================================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${passCount} PHASE 10.13D PRODUCTION EDGE CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passCount} PASSED, ${failCount} FAILED`);
  }
  console.log('================================================================================\n');

  if (failCount > 0) process.exit(1);
}

run();
