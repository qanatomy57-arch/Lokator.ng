// ============================================================================
// LOKATOR.NG — PHASE 10.12F HTTP ASSET & DISCOVERY VERIFICATION
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
  console.log('📡 HTTP DISCOVERY & MOBILE UX VERIFICATION (10.12F)');
  console.log('============================================================\n');

  try {
    const res = await fetchUrl('/search.html');
    assert.strictEqual(res.status, 200, 'search.html did not return 200');
    logPass('Endpoint /search.html returns HTTP 200');

    assert(res.data.includes('role="dialog"'), 'search.html missing role="dialog"');
    assert(res.data.includes('aria-modal="true"'), 'search.html missing aria-modal="true"');
    logPass('search.html serves dialog accessibility metadata over HTTP');

    assert(res.data.includes('class="bottom-sheet-grab-handle"'), 'search.html missing bottom-sheet-grab-handle');
    assert(res.data.includes('id="mobile-apply-filters-btn"'), 'search.html missing mobile-apply-filters-btn');
    assert(res.data.includes('id="mobile-reset-filters-btn"'), 'search.html missing mobile-reset-filters-btn');
    assert(res.data.includes('id="mobile-filter-close-btn"'), 'search.html missing mobile-filter-close-btn');
    logPass('search.html serves complete bottom-sheet elements and action buttons');
  } catch (e) { logFail('search.html HTTP checks', e); }

  try {
    const res = await fetchUrl('/search.css');
    assert.strictEqual(res.status, 200, 'search.css did not return 200');
    logPass('Endpoint /search.css returns HTTP 200');

    assert(res.data.includes('.bottom-sheet-grab-handle'), 'search.css missing grab handle CSS');
    assert(res.data.includes('.mobile-filter-footer'), 'search.css missing footer CSS');
    assert(res.data.includes('body.filter-drawer-open'), 'search.css missing body scroll lock');
    assert(res.data.includes('transform: translateY(100%)'), 'search.css missing slide transform');
    logPass('search.css serves valid mobile bottom-sheet styling rules over HTTP');
  } catch (e) { logFail('search.css HTTP checks', e); }

  try {
    const res = await fetchUrl('/search.js');
    assert.strictEqual(res.status, 200, 'search.js did not return 200');
    logPass('Endpoint /search.js returns HTTP 200');

    assert(res.data.includes('openFilterDrawer'), 'search.js missing openFilterDrawer');
    assert(res.data.includes('closeFilterDrawer'), 'search.js missing closeFilterDrawer');
    assert(res.data.includes('mobileApplyFiltersBtn'), 'search.js missing mobileApplyFiltersBtn');
    assert(res.data.includes('mobileResetFiltersBtn'), 'search.js missing mobileResetFiltersBtn');
    assert(res.data.includes('updateLgaSelect'), 'search.js missing updateLgaSelect cascade');
    assert(res.data.includes('updateLocalitySelect'), 'search.js missing updateLocalitySelect cascade');
    logPass('search.js serves complete mobile discovery logic and cascade handlers over HTTP');
  } catch (e) { logFail('search.js HTTP checks', e); }

  try {
    const res = await fetchUrl('/locations.js');
    assert.strictEqual(res.status, 200, 'locations.js did not return 200');
    assert(res.data.includes('NigeriaLocations'), 'locations.js missing NigeriaLocations');
    logPass('Endpoint /locations.js returns HTTP 200 with NigeriaLocations data');
  } catch (e) { logFail('locations.js HTTP check', e); }

  try {
    const res = await fetchUrl('/phone-utils.js');
    assert.strictEqual(res.status, 200, 'phone-utils.js did not return 200');
    assert(res.data.includes('NigeriaPhone'), 'phone-utils.js missing NigeriaPhone');
    logPass('Endpoint /phone-utils.js returns HTTP 200 with NigeriaPhone utility');
  } catch (e) { logFail('phone-utils.js HTTP check', e); }

  try {
    const res = await fetchUrl('/search-language.js');
    assert.strictEqual(res.status, 200, 'search-language.js did not return 200');
    assert(res.data.includes('NigeriaSearchLanguage'), 'search-language.js missing NigeriaSearchLanguage');
    logPass('Endpoint /search-language.js returns HTTP 200 with NigeriaSearchLanguage');
  } catch (e) { logFail('search-language.js HTTP check', e); }

  console.log('\n============================================================');
  console.log(`HTTP VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('============================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runHttpSuite().catch(err => {
  console.error('Fatal HTTP verification error:', err);
  process.exit(1);
});
