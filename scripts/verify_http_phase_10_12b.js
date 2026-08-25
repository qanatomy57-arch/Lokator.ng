/**
 * LOKATOR.NG — HTTP & DOM INTEGRATION TEST FOR PHASE 10.12B
 */

const http = require('http');
const assert = require('assert');

function fetchPage(path) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, body: data }));
    }).on('error', reject);
  });
}

async function run() {
  console.log('\n========================================================');
  console.log('📡 HTTP ENDPOINT & DOM INTEGRITY VERIFICATION (10.12B)');
  console.log('========================================================\n');

  let passed = 0;
  let failed = 0;

  function test(name, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } catch (e) {
      console.error(`  ❌ [FAIL] ${name}: ${e.message}`);
      failed++;
    }
  }

  const pages = ['/index.html', '/search.html', '/register.html', '/profile.html', '/dashboard.html', '/login.html', '/phone-utils.js'];

  for (const page of pages) {
    const res = await fetchPage(page);
    test(`Endpoint ${page} returns HTTP 200`, () => {
      assert.strictEqual(res.status, 200);
      assert.ok(res.body.length > 0);
    });

    if (page.endsWith('.html')) {
      test(`${page} loads phone-utils.js script tag`, () => {
        assert.ok(res.body.includes('phone-utils.js'), `${page} must include phone-utils.js`);
      });
    }
  }

  console.log('\n========================================================');
  console.log(`HTTP BATTERY RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('========================================================\n');

  if (failed > 0) process.exit(1);
}

run();
