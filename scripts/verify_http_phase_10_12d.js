/**
 * LOKATOR.NG — PHASE 10.12D HTTP & ASSET INTEGRITY TEST
 */

const http = require('http');
const assert = require('assert');

const BASE_URL = 'http://localhost:3000';

function fetchPath(p, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(p, BASE_URL);
    const reqOptions = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: options.method || 'GET',
      headers: options.headers || {}
    };

    const req = http.request(reqOptions, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ status: res.statusCode, headers: res.headers, body: data });
      });
    });

    req.on('error', reject);
    if (options.body) req.write(typeof options.body === 'string' ? options.body : JSON.stringify(options.body));
    req.end();
  });
}

async function runHttpTests() {
  console.log('\n' + '='.repeat(60));
  console.log('📡 HTTP ENDPOINT & DOM INTEGRITY VERIFICATION (10.12D)');
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

  // 1. Static Pages & AI Script Inclusions
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

    await test(`${page} loads ai-service.js script tag`, async () => {
      const res = await fetchPath(page);
      assert.ok(res.body.includes('ai-service.js'), `${page} is missing ai-service.js script tag`);
    });
  }

  // 2. Static Asset AI Module Endpoint
  await test('Endpoint /ai-service.js returns HTTP 200', async () => {
    const res = await fetchPath('/ai-service.js');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.includes('LokatorAIService'));
  });

  // 3. AI Health Check Endpoint
  await test('GET /api/ai/health returns 200 OK', async () => {
    const res = await fetchPath('/api/ai/health');
    assert.strictEqual(res.status, 200);
    const json = JSON.parse(res.body);
    assert.strictEqual(json.success, true);
    assert.strictEqual(json.status, 'healthy');
  });

  // 4. AI Auth Gating
  await test('POST /api/ai/generate-bio rejects unauthenticated request (401)', async () => {
    const res = await fetchPath('/api/ai/generate-bio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { trade: 'Electrician' }
    });
    assert.strictEqual(res.status, 401);
  });

  await test('POST /api/ai/generate-bio accepts authenticated request (200)', async () => {
    const res = await fetchPath('/api/ai/generate-bio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-bearer-token'
      },
      body: {
        trade: 'Plumber',
        skills: ['Pipe Fitting', 'Water Heater Repair'],
        state: 'Lagos',
        experienceYrs: 4
      }
    });
    assert.strictEqual(res.status, 200);
    const json = JSON.parse(res.body);
    assert.strictEqual(json.success, true);
    assert.ok(json.data && json.data.bio);
  });

  await test('POST /api/ai/pricing-guidance accepts authenticated request (200)', async () => {
    const res = await fetchPath('/api/ai/pricing-guidance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer test-bearer-token'
      },
      body: {
        trade: 'Electrician',
        state: 'Delta'
      }
    });
    assert.strictEqual(res.status, 200);
    const json = JSON.parse(res.body);
    assert.strictEqual(json.success, true);
    assert.ok(json.data && json.data.suggested_range);
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
