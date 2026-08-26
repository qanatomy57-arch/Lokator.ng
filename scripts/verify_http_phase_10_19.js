/**
 * LOKATOR.NG — PHASE 10.19 HTTP ASSET & MARKUP VERIFICATION SUITE
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

console.log('================================================================================');
console.log('🌐 RUNNING PHASE 10.19 HTTP & ASSET VERIFICATION SUITE');
console.log('================================================================================\n');

const ROOT = path.join(__dirname, '..');

// Start local static HTTP server for fast offline testing
const server = http.createServer((req, res) => {
  let reqPath = req.url.split('?')[0];
  if (reqPath === '/') reqPath = '/index.html';
  const filePath = path.join(ROOT, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    let contentType = 'text/plain';
    if (filePath.endsWith('.html')) contentType = 'text/html';
    else if (filePath.endsWith('.js')) contentType = 'application/javascript';
    else if (filePath.endsWith('.css')) contentType = 'text/css';
    else if (filePath.endsWith('.json')) contentType = 'application/json';

    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
  }
});

server.listen(4190, async () => {
  function get(urlPath) {
    return new Promise((resolve, reject) => {
      http.get(`http://localhost:4190${urlPath}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
      }).on('error', reject);
    });
  }

  try {
    console.log('--- 1. STATIC ASSET SERVING & INTEGRITY ---');

    const mapServiceRes = await get('/map-service.js');
    check('1.1 map-service.js serves HTTP 200 OK', () => {
      assert.strictEqual(mapServiceRes.status, 200);
      assert.ok(mapServiceRes.body.includes('LokatorMapService'));
    });

    const profileRes = await get('/profile.html');
    check('1.2 profile.html serves HTTP 200 OK and includes map-service.js', () => {
      assert.strictEqual(profileRes.status, 200);
      assert.ok(profileRes.body.includes('<script src="map-service.js"></script>'));
      assert.ok(profileRes.body.includes('id="service-location-card"'));
      assert.ok(profileRes.body.includes('id="mobile-nav-drawer"'));
    });

    const dashRes = await get('/dashboard.html');
    check('1.3 dashboard.html serves HTTP 200 OK and includes map-service.js', () => {
      assert.strictEqual(dashRes.status, 200);
      assert.ok(dashRes.body.includes('<script src="map-service.js"></script>'));
      assert.ok(dashRes.body.includes('id="dash-service-map"'));
    });

    const indexRes = await get('/index.html');
    check('1.4 index.html serves HTTP 200 OK and includes mobile drawer', () => {
      assert.strictEqual(indexRes.status, 200);
      assert.ok(indexRes.body.includes('id="mobile-nav-drawer"'));
    });

    const searchRes = await get('/search.html');
    check('1.5 search.html serves HTTP 200 OK and includes mobile drawer', () => {
      assert.strictEqual(searchRes.status, 200);
      assert.ok(searchRes.body.includes('id="mobile-nav-drawer"'));
    });

    console.log('\n================================================================================');
    if (failed === 0) {
      console.log(`🎉 ALL ${passed} PHASE 10.19 HTTP CHECKS PASSED (100%)!`);
    } else {
      console.error(`⚠️ ${failed} HTTP CHECKS FAILED.`);
      process.exitCode = 1;
    }
    console.log('================================================================================\n');
  } catch (err) {
    console.error('HTTP Test Error:', err);
    process.exitCode = 1;
  } finally {
    server.close();
  }
});
