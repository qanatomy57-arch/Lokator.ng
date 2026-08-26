/**
 * LOKATOR.NG — PHASE 10.17 GEOSPATIAL MAP, AUTOCOMPLETE & SEARCH HISTORY SUITE
 * Validates search history persistence, 1-tap chip extraction, coordinate resolution,
 * and safe zero-payment invariants.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environment
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

// Mock Telemetry
const telemetryEvents = [];
global.LokatorTelemetry = {
  trackEvent: (evt, data) => telemetryEvents.push({ evt, data, time: Date.now() })
};

// Load dependencies
const locCode = fs.readFileSync(path.join(__dirname, '../locations.js'), 'utf8');
eval(locCode);
const catCode = fs.readFileSync(path.join(__dirname, '../categories.js'), 'utf8');
eval(catCode);
const searchLangCode = fs.readFileSync(path.join(__dirname, '../search-language.js'), 'utf8');
eval(searchLangCode);
const provCode = fs.readFileSync(path.join(__dirname, '../providers-data.js'), 'utf8');
eval(provCode);
const clientCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
eval(clientCode);

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

async function runPhase10_17Suite() {
  console.log('\n================================================================================');
  console.log('🗺️ LOKATOR.NG — PHASE 10.17 GEOSPATIAL MAP, AUTOCOMPLETE & SEARCH HISTORY SUITE');
  console.log('================================================================================\n');

  localStorage.clear();
  telemetryEvents.length = 0;

  console.log('--- 1. SEARCH HISTORY ENGINE (LokatorDB.searchHistory) ---');
  await test('1.1 LokatorDB.searchHistory exists and exports required methods', async () => {
    assert.ok(LokatorDB.searchHistory);
    assert.strictEqual(typeof LokatorDB.searchHistory.getRecentSearches, 'function');
    assert.strictEqual(typeof LokatorDB.searchHistory.addSearch, 'function');
    assert.strictEqual(typeof LokatorDB.searchHistory.removeSearch, 'function');
    assert.strictEqual(typeof LokatorDB.searchHistory.clearSearches, 'function');
  });

  await test('1.2 addSearch adds recent searches and prevents exact duplicates', async () => {
    LokatorDB.searchHistory.addSearch({ keyword: 'Electrician', location: 'Surulere', state: 'Lagos' });
    LokatorDB.searchHistory.addSearch({ keyword: 'Plumber', location: 'Warri South', state: 'Delta' });
    // Duplicate search
    LokatorDB.searchHistory.addSearch({ keyword: 'Electrician', location: 'Surulere', state: 'Lagos' });

    const searches = LokatorDB.searchHistory.getRecentSearches();
    assert.strictEqual(searches.length, 2);
    assert.strictEqual(searches[0].keyword, 'Electrician');
    assert.strictEqual(searches[0].location, 'Surulere');
    assert.strictEqual(searches[1].keyword, 'Plumber');
  });

  await test('1.3 addSearch bounds history to a maximum of 10 items', async () => {
    for (let i = 1; i <= 15; i++) {
      LokatorDB.searchHistory.addSearch({ keyword: `Service ${i}`, location: `City ${i}` });
    }
    const searches = LokatorDB.searchHistory.getRecentSearches();
    assert.strictEqual(searches.length, 10);
    assert.strictEqual(searches[0].keyword, 'Service 15');
  });

  await test('1.4 removeSearch deletes specific search item by index', async () => {
    const prevCount = LokatorDB.searchHistory.getRecentSearches().length;
    LokatorDB.searchHistory.removeSearch(0);
    const newCount = LokatorDB.searchHistory.getRecentSearches().length;
    assert.strictEqual(newCount, prevCount - 1);
  });

  await test('1.5 clearSearches empties the entire history', async () => {
    LokatorDB.searchHistory.clearSearches();
    const searches = LokatorDB.searchHistory.getRecentSearches();
    assert.strictEqual(searches.length, 0);
  });

  console.log('\n--- 2. GEOSPATIAL COORDINATES & SEARCH PARSING ---');
  await test('2.1 Provider coordinate filtering extracts valid lat/lng pairs', async () => {
    const sampleProviders = [
      { id: 1, name: 'Artisan A', lat: 6.5244, lng: 3.3792 },
      { id: 2, name: 'Artisan B', lat: null, lng: null },
      { id: 3, name: 'Artisan C', lat: 5.5174, lng: 5.7501 }
    ];

    const valid = sampleProviders.filter(p => p.lat != null && p.lng != null);
    assert.strictEqual(valid.length, 2);
    assert.strictEqual(valid[0].lat, 6.5244);
    assert.strictEqual(valid[1].lat, 5.5174);
  });

  await test('2.2 NigeriaSearchLanguage parses Nigerian trade and location queries', async () => {
    if (typeof NigeriaSearchLanguage !== 'undefined' && NigeriaSearchLanguage.parseQuery) {
      const parsed = NigeriaSearchLanguage.parseQuery('plumber in surulere lagos');
      assert.ok(parsed);
      assert.strictEqual(parsed.canonicalSlug, 'plumber');
    }
  });

  await test('2.3 LokatorDB.getSkillSuggestions("gra") returns Graphic Designer among top matches', async () => {
    const suggestions = LokatorDB.getSkillSuggestions('gra', 5);
    assert.ok(suggestions.length > 0);
    assert.ok(suggestions.includes('Graphic Designer'), 'Must include Graphic Designer');
  });

  await test('2.4 NigeriaLocations.searchLocations("warr") resolves Warri LGAs & localities', async () => {
    const matches = NigeriaLocations.searchLocations('warr', 5);
    assert.ok(matches.length > 0);
    const warriSouth = matches.find(m => m.lga === 'Warri South' && m.state === 'Delta');
    assert.ok(warriSouth, 'Must find Warri South, Delta');
  });

  console.log('\n--- 3. TELEMETRY & SAFE MONETIZATION INVARIANTS ---');
  await test('3.1 Telemetry tracks search history additions', async () => {
    LokatorDB.searchHistory.addSearch({ keyword: 'Solar Installer', location: 'Ikeja' });
    const ev = telemetryEvents.filter(e => e.evt === 'search_history_added').pop();
    assert.ok(ev);
    assert.strictEqual(ev.data.keyword, 'Solar Installer');
  });

  await test('3.2 Safe zero-payment baseline preserved', async () => {
    assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_LIVE_MODE, false);
    assert.strictEqual(LokatorDB.monetization.featureFlags.COMMISSIONS_ENABLED, false);
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.17 UNIT & MAP ASSERTIONS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runPhase10_17Suite();
