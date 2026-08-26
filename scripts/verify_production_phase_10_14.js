/**
 * LOKATOR.NG — PHASE 10.14 PRODUCTION EDGE VERIFICATION
 * Verifies live production deployment at lokator-ng.vercel.app for Phase 10.14
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
          headers: { 'User-Agent': 'LokatorNG-Audit/10.14' },
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
  console.log('\n🌍 RUNNING PHASE 10.14 PRODUCTION EDGE VERIFICATION\n');
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

  // 2. Search contains Quick Match modal & CTA
  await test('search.html contains Quick Match modal and trigger', async () => {
    const res = await get('https://lokator-ng.vercel.app/search.html');
    assert.ok(res.body.includes('quick-match-modal'), 'Must contain quick-match-modal');
    assert.ok(res.body.includes('btn-empty-quick-match'), 'Must contain btn-empty-quick-match');
  });

  // 3. Dashboard contains Community tab and referral code input
  await test('dashboard.html contains Community & Growth tab with referral tools', async () => {
    const res = await get('https://lokator-ng.vercel.app/dashboard.html');
    assert.ok(res.body.includes('tab-community'), 'Must contain tab-community');
    assert.ok(res.body.includes('dash-referral-code-input'), 'Must contain dash-referral-code-input');
    assert.ok(res.body.includes('dash-neighborhood-opportunities-tbody'), 'Must contain neighborhood opportunities table');
  });

  // 4. Analytics contains Section 10: Cluster Liquidity & Dispatch Observability
  await test('analytics.html contains Section 10 Cluster Liquidity Observability', async () => {
    const res = await get('https://lokator-ng.vercel.app/analytics.html');
    assert.ok(res.body.includes('section-liquidity-dispatch'), 'Must contain section-liquidity-dispatch');
    assert.ok(res.body.includes('qm-dispatches-tbody'), 'Must contain qm-dispatches-tbody');
  });

  // 5. supabase-client.js exports liquidityEngine and referrals managers
  await test('supabase-client.js exports liquidityEngine and referrals managers', async () => {
    const res = await get('https://lokator-ng.vercel.app/supabase-client.js');
    assert.ok(res.body.includes('LokatorDB.liquidityEngine'), 'Must export liquidityEngine');
    assert.ok(res.body.includes('LokatorDB.referrals'), 'Must export referrals');
    assert.ok(res.body.includes('PAYMENT_LIVE_MODE: false'), 'Must maintain safe default');
  });

  console.log('\n================================================================================');
  if (failCount === 0) {
    console.log(`🎉 ALL ${passCount} PHASE 10.14 PRODUCTION EDGE CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passCount} PASSED, ${failCount} FAILED`);
  }
  console.log('================================================================================\n');

  if (failCount > 0) process.exit(1);
}

run();
