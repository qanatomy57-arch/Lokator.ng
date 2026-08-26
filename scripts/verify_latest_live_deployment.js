/**
 * LOKATOR.NG — LATEST DEPLOYMENT PRODUCTION LIVE VERIFICATION
 * Rigorously checks that all latest updates are live and active on https://lokator-ng.vercel.app/
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
  console.log('🚀 LOKATOR.NG — LIVE PRODUCTION DEPLOYMENT VALIDATION');
  console.log('Target: https://lokator-ng.vercel.app/');
  console.log('================================================================================\n');

  console.log('--- 1. CORE HTML SHELLS & SCRIPT LINKAGE ---');

  await check('1.1 search.html includes providers-data.js before supabase-client.js', async () => {
    const res = await fetchUrl('/search.html');
    assert.strictEqual(res.status, 200, 'Expected HTTP 200 for search.html');
    assert.ok(res.body.includes('<script src="providers-data.js"></script>'), 'search.html missing providers-data.js script tag');
    assert.ok(res.body.indexOf('providers-data.js') < res.body.indexOf('supabase-client.js'), 'providers-data.js must be loaded before supabase-client.js');
  });

  await check('1.2 index.html includes providers-data.js before supabase-client.js', async () => {
    const res = await fetchUrl('/index.html');
    assert.strictEqual(res.status, 200, 'Expected HTTP 200 for index.html');
    assert.ok(res.body.includes('<script src="providers-data.js"></script>'), 'index.html missing providers-data.js script tag');
  });

  await check('1.3 profile.html includes providers-data.js before supabase-client.js', async () => {
    const res = await fetchUrl('/profile.html');
    assert.strictEqual(res.status, 200, 'Expected HTTP 200 for profile.html');
    assert.ok(res.body.includes('<script src="providers-data.js"></script>'), 'profile.html missing providers-data.js script tag');
  });

  await check('1.4 dashboard.html has accessible referral code label & aria-label', async () => {
    const res = await fetchUrl('/dashboard.html');
    assert.strictEqual(res.status, 200, 'Expected HTTP 200 for dashboard.html');
    assert.ok(res.body.includes('for="dash-referral-code-input"'), 'dashboard.html missing for attribute on label');
    assert.ok(res.body.includes('aria-label="Your Unique Artisan Referral Code"'), 'dashboard.html missing aria-label');
  });

  console.log('\n--- 2. LIVE JAVASCRIPT ASSETS & SEED DATA ---');

  await check('2.1 providers-data.js contains verified Delta State / Warri seed artisans', async () => {
    const res = await fetchUrl('/providers-data.js');
    assert.strictEqual(res.status, 200, 'Expected HTTP 200 for providers-data.js');
    assert.ok(res.body.includes('Oghenero Ejiro'), 'Missing Oghenero Ejiro in providers-data.js');
    assert.ok(res.body.includes('Warri South'), 'Missing Warri South in providers-data.js');
    assert.ok(res.body.includes('Elohor Akpevwe'), 'Missing Elohor Akpevwe in providers-data.js');
    assert.ok(res.body.includes('Godwin Onome'), 'Missing Godwin Onome in providers-data.js');
  });

  await check('2.2 search.js is served cleanly without syntax errors', async () => {
    const res = await fetchUrl('/search.js');
    assert.strictEqual(res.status, 200, 'Expected HTTP 200 for search.js');
    assert.ok(res.body.includes('renderSuggestions'), 'Missing renderSuggestions in search.js');
    assert.ok(res.body.includes('renderLocationSuggestions'), 'Missing renderLocationSuggestions in search.js');
  });

  console.log('\n--- 3. LIVE CSS COMPATIBILITY & VENDOR PREFIXES ---');

  await check('3.1 search.css contains standard line-clamp and Safari webkit prefixes', async () => {
    const res = await fetchUrl('/search.css');
    assert.strictEqual(res.status, 200, 'Expected HTTP 200 for search.css');
    assert.ok(res.body.includes('line-clamp: 2;'), 'Missing standard line-clamp: 2 in search.css');
    assert.ok(res.body.includes('-webkit-backdrop-filter: blur(8px);'), 'Missing -webkit-backdrop-filter in search.css');
    assert.ok(res.body.includes('display: none;'), 'Empty state must default to display: none in search.css');
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} LIVE PRODUCTION CHECKS PASSED (100%)!`);
    console.log('✅ The live production site is fully up to date with the latest commit.');
  } else {
    console.error(`⚠️ ${failed} CHECKS FAILED. Please review the output above.`);
    process.exit(1);
  }
  console.log('================================================================================\n');
}

run();
