// ============================================================================
// LOKATOR.NG — PHASE 10.12E HTTP ASSET & HERO VERIFICATION
// ============================================================================

const http = require('http');
const assert = require('assert');

let passed = 0;
let failed = 0;

function logPass(msg) {
  console.log(`  ✅ [PASS] ${msg}`);
  passed++;
}

function logFail(msg, err) {
  console.error(`  ❌ [FAIL] ${msg}`);
  if (err) console.error(`     Details: ${err.message || err}`);
  failed++;
}

function fetchUrl(pathStr) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:3000${pathStr}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, data, headers: res.headers }));
    }).on('error', reject);
  });
}

async function runHttpSuite() {
  console.log('\n============================================================');
  console.log('📡 HTTP & ASSET INTEGRITY VERIFICATION (10.12E)');
  console.log('============================================================\n');

  try {
    const res = await fetchUrl('/index.html');
    assert.strictEqual(res.status, 200, 'index.html did not return 200');
    logPass('Endpoint /index.html returns HTTP 200');

    assert(res.data.includes('poster="hero/poster_01.jpg"'), 'index.html missing poster_01.jpg');
    logPass('index.html references poster_01.jpg for video-0');

    assert(res.data.includes('preload="none"'), 'index.html missing deferred preload="none"');
    logPass('index.html includes deferred preload="none" attributes');
  } catch (e) { logFail('index.html HTTP checks', e); }

  // Check HTTP 200 for all 9 poster files
  for (let i = 1; i <= 9; i++) {
    try {
      const posterPath = `/hero/poster_0${i}.jpg`;
      const res = await fetchUrl(posterPath);
      assert.strictEqual(res.status, 200, `${posterPath} status was ${res.status}`);
      logPass(`Hero poster ${posterPath} returns HTTP 200 OK`);
    } catch (e) { logFail(`Hero poster ${i} HTTP check`, e); }
  }

  // Check HTTP 200 for active hero video 01_master_marketplace.mp4
  try {
    const res = await fetchUrl('/hero/01_master_marketplace.mp4');
    assert.strictEqual(res.status, 200, '01_master_marketplace.mp4 status was ' + res.status);
    logPass('Active hero video /hero/01_master_marketplace.mp4 returns HTTP 200 OK');
  } catch (e) { logFail('Active hero video HTTP check', e); }

  // Check Service Worker returns 200 OK and contains poster references
  try {
    const res = await fetchUrl('/sw.js');
    assert.strictEqual(res.status, 200, 'sw.js status was ' + res.status);
    assert(res.data.includes('/hero/poster_01.jpg'), 'sw.js missing poster asset path');
    logPass('Service worker /sw.js returns HTTP 200 OK and includes poster assets');
  } catch (e) { logFail('Service worker HTTP check', e); }

  console.log('\n============================================================');
  console.log(`HTTP BATTERY RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runHttpSuite().catch(err => {
  console.error('Fatal error in HTTP suite:', err);
  process.exit(1);
});
