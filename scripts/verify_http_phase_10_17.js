/**
 * LOKATOR.NG — PHASE 10.17 HTTP & ASSET VERIFICATION SUITE
 * Validates Leaflet CDN assets, search map container, view toggles,
 * search history markup, and hero search card integration.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

function runHttpTests() {
  console.log('\n🌐 RUNNING PHASE 10.17 HTTP & ASSET VERIFICATION SUITE...\n');

  const root = path.join(__dirname, '..');
  const indexHtml = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const searchHtml = fs.readFileSync(path.join(root, 'search.html'), 'utf8');
  const searchCss = fs.readFileSync(path.join(root, 'search.css'), 'utf8');
  const searchJs = fs.readFileSync(path.join(root, 'search.js'), 'utf8');
  const appJs = fs.readFileSync(path.join(root, 'app.js'), 'utf8');
  const styleCss = fs.readFileSync(path.join(root, 'style.css'), 'utf8');
  const supabaseClient = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');

  test('1. search.html includes Leaflet CSS & JS CDN tags', () => {
    assert.ok(searchHtml.includes('leaflet.css'));
    assert.ok(searchHtml.includes('leaflet.js'));
  });

  test('2. search.html contains view-mode-toggle, search-map-container, and mobile-map-toggle-pill', () => {
    assert.ok(searchHtml.includes('view-mode-toggle'));
    assert.ok(searchHtml.includes('search-map-container'));
    assert.ok(searchHtml.includes('search-map'));
    assert.ok(searchHtml.includes('btn-mobile-map-toggle'));
  });

  test('3. search.html contains recent-searches-bar and recent-searches-chips container', () => {
    assert.ok(searchHtml.includes('recent-searches-bar'));
    assert.ok(searchHtml.includes('recent-searches-chips'));
    assert.ok(searchHtml.includes('btn-clear-history'));
  });

  test('4. index.html hero contains service & location inputs with suggestion containers', () => {
    assert.ok(indexHtml.includes('service-input'));
    assert.ok(indexHtml.includes('location-input'));
    assert.ok(indexHtml.includes('hero-service-suggestions'));
    assert.ok(indexHtml.includes('hero-location-suggestions'));
    assert.ok(indexHtml.includes('search-btn'));
    assert.ok(indexHtml.includes('gps-btn'));
  });

  test('5. app.js implements setupHeroSearchCard with GPS and Enter redirection', () => {
    assert.ok(appJs.includes('setupHeroSearchCard'));
    assert.ok(appJs.includes('search.html?'));
  });

  test('6. search.js implements updateSearchMap, setViewMode, and renderRecentSearches', () => {
    assert.ok(searchJs.includes('updateSearchMap'));
    assert.ok(searchJs.includes('setViewMode'));
    assert.ok(searchJs.includes('renderRecentSearches'));
    assert.ok(searchJs.includes('searchHistory'));
  });

  test('7. search.css contains styles for split-view, map-container, and recent-chip', () => {
    assert.ok(searchCss.includes('.recent-chip'));
    assert.ok(searchCss.includes('.search-map-container'));
    assert.ok(searchCss.includes('.mobile-map-toggle-pill'));
    assert.ok(searchCss.includes('.is-split-view'));
  });

  test('8. supabase-client.js exports LokatorDB.searchHistory module', () => {
    assert.ok(supabaseClient.includes('LokatorDB.searchHistory'));
    assert.ok(supabaseClient.includes('getRecentSearches'));
    assert.ok(supabaseClient.includes('addSearch'));
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.17 HTTP & ASSET CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runHttpTests();
