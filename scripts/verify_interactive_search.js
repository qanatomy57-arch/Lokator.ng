/**
 * Lokator.NG — Search Interactivity & Autocomplete Verification Suite
 */
const assert = require('assert');
const fs = require('fs');
const path = require('path');

console.log('================================================================================');
console.log('⚡ LOKATOR.NG — SEARCH INTERACTIVITY & AUTOCOMPLETE VERIFICATION');
console.log('================================================================================');

const root = path.join(__dirname, '..');
const searchHtml = fs.readFileSync(path.join(root, 'search.html'), 'utf8');
const searchJs = fs.readFileSync(path.join(root, 'search.js'), 'utf8');
const locationsJs = fs.readFileSync(path.join(root, 'locations.js'), 'utf8');
const catJs = fs.readFileSync(path.join(root, 'categories.js'), 'utf8');
const langJs = fs.readFileSync(path.join(root, 'search-language.js'), 'utf8');
const provJs = fs.readFileSync(path.join(root, 'providers-data.js'), 'utf8');
const supabaseJs = fs.readFileSync(path.join(root, 'supabase-client.js'), 'utf8');

// Mock browser environment
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.sessionStorage = { ...global.localStorage };
global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

// Load environment in Node
eval(locationsJs);
eval(catJs);
eval(langJs);
eval(provJs);
eval(supabaseJs);

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

async function run() {
  console.log('\n--- 1. DOM SELECTORS & MARKUP INTEGRITY (search.html) ---');

  await test('1.1 Search hero contains input and suggestion dropdown elements', () => {
    assert.ok(searchHtml.includes('id="keyword-search"'));
    assert.ok(searchHtml.includes('id="search-suggestions"'));
    assert.ok(searchHtml.includes('id="location-search"'));
    assert.ok(searchHtml.includes('id="location-suggestions"'));
    assert.ok(searchHtml.includes('id="apply-main-search"'));
  });

  await test('1.2 Filter sidebar contains cascading state/LGA dropdowns and distance slider', () => {
    assert.ok(searchHtml.includes('id="category-select"'));
    assert.ok(searchHtml.includes('id="state-select"'));
    assert.ok(searchHtml.includes('id="lga-select"'));
    assert.ok(searchHtml.includes('id="distance-range"'));
    assert.ok(searchHtml.includes('id="verified-only"'));
    assert.ok(searchHtml.includes('id="available-only"'));
  });

  await test('1.3 Results area contains provider container and view mode toggles', () => {
    assert.ok(searchHtml.includes('id="providers-container"'));
    assert.ok(searchHtml.includes('id="search-map"'));
    assert.ok(searchHtml.includes('id="empty-state"'));
    assert.ok(searchHtml.includes('id="btn-view-list"'));
    assert.ok(searchHtml.includes('id="btn-view-map"'));
  });

  console.log('\n--- 2. SCRIPT ARCHITECTURE & FUNCTION DEFINITIONS (search.js) ---');

  await test('2.1 search.js implements live skill suggestion dropdowns', () => {
    assert.ok(searchJs.includes('function renderSuggestions('));
    assert.ok(searchJs.includes('function hideSuggestions('));
    assert.ok(searchJs.includes('suggestionsDropdown.innerHTML ='));
  });

  await test('2.2 search.js implements live Nigerian location suggestion dropdowns', () => {
    assert.ok(searchJs.includes('function renderLocationSuggestions('));
    assert.ok(searchJs.includes('function hideLocationSuggestions('));
    assert.ok(searchJs.includes('NigeriaLocations.searchLocations('));
  });

  await test('2.3 search.js implements pagination controls and map updater', () => {
    assert.ok(searchJs.includes('function renderPagination('));
    assert.ok(searchJs.includes('function updateSearchMap('));
    assert.ok(searchJs.includes('function renderRecentSearches('));
  });

  console.log('\n--- 3. LIVE QUERY RESOLUTION: "plumb" & "warr" ---');

  await test('3.1 LokatorDB.getSkillSuggestions("plumb") returns Plumber', () => {
    const suggs = LokatorDB.getSkillSuggestions('plumb', 5);
    assert.ok(suggs.length > 0);
    assert.ok(suggs.some(s => s.toLowerCase().includes('plumb')));
  });

  await test('3.2 NigeriaLocations.searchLocations("warr") resolves Warri South & Delta State', () => {
    const locs = NigeriaLocations.searchLocations('warr', 5);
    assert.ok(locs.length > 0);
    assert.ok(locs.some(l => l.state === 'Delta' && l.formatted.includes('Warri')));
  });

  await test('3.3 LokatorDB.getProviders for Plumber in Delta/Warri returns verified artisans', async () => {
    const res = await LokatorDB.getProviders({
      category: 'plumber',
      state: 'Delta',
      lga: 'Warri South',
      pageSize: 10
    });
    assert.ok(res);
    assert.ok(res.data);
    assert.ok(res.data.length >= 1, 'Expected at least 1 plumber provider in Warri/Delta');
    assert.strictEqual(res.data[0].trade, 'Master Plumber & Sanitary Engineer');
    console.log(`      Found ${res.data.length} providers for plumber in Delta/Warri: ${res.data[0].name} (${res.data[0].phoneDisplay || res.data[0].phone})`);
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} INTERACTIVE SEARCH CHECKS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
    process.exit(1);
  }
  console.log('================================================================================\n');
}

run();
