/**
 * LOKATOR.NG — PHASE 10.12C HTTP INTEGRITY TEST
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

function fetchPath(p) {
  return new Promise((resolve, reject) => {
    http.get(BASE_URL + p, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

async function runHttpTests() {
  console.log('\n' + '='.repeat(60));
  console.log('📡 HTTP ENDPOINT & DOM INTEGRITY VERIFICATION (10.12C)');
  console.log('='.repeat(60) + '\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
      failed++;
    }
  }

  const pages = [
    '/index.html',
    '/search.html',
    '/register.html',
    '/profile.html',
    '/dashboard.html',
    '/login.html'
  ];

  for (const page of pages) {
    await test(`Endpoint ${page} returns HTTP 200`, async () => {
      const res = await fetchPath(page);
      assert.strictEqual(res.status, 200);
    });

    await test(`${page} loads search-language.js script tag`, async () => {
      const res = await fetchPath(page);
      assert.ok(res.body.includes('search-language.js'), `${page} is missing search-language.js script tag`);
    });
  }

  await test(`Endpoint /search-language.js returns HTTP 200`, async () => {
    const res = await fetchPath('/search-language.js');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('NigeriaSearchLanguage'));
  });

  console.log('\n' + '='.repeat(60));
  console.log(`HTTP BATTERY RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(60) + '\n');

  if (failed > 0) process.exit(1);
}

runHttpTests().catch(err => {
  console.error('Fatal HTTP test runner error:', err);
  process.exit(1);
});
