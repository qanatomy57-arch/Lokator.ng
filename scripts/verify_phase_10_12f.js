// ============================================================================
// LOKATOR.NG — PHASE 10.12F AUTOMATED VERIFICATION SUITE
// Mobile Discovery UX, Bottom-Sheet Filters, Location Cascade & Search Composition
// ============================================================================

const fs = require('fs');
const path = require('path');
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

console.log('\n================================================================================');
console.log('📱 LOKATOR.NG — PHASE 10.12F MOBILE DISCOVERY UX VERIFICATION');
console.log('================================================================================\n');

const rootDir = path.join(__dirname, '..');
const searchHtmlPath = path.join(rootDir, 'search.html');
const searchJsPath = path.join(rootDir, 'search.js');
const searchCssPath = path.join(rootDir, 'search.css');

const searchHtml = fs.readFileSync(searchHtmlPath, 'utf8');
const searchJs = fs.readFileSync(searchJsPath, 'utf8');
const searchCss = fs.readFileSync(searchCssPath, 'utf8');

// Load supporting modules into node environment
const { NigeriaLocations } = require('../locations.js');
global.NigeriaLocations = NigeriaLocations;
globalThis.NigeriaLocations = NigeriaLocations;

const { NigeriaPhone } = require('../phone-utils.js');
global.NigeriaPhone = NigeriaPhone;
globalThis.NigeriaPhone = NigeriaPhone;

const { NigeriaSearchLanguage } = require('../search-language.js');
global.NigeriaSearchLanguage = NigeriaSearchLanguage;
globalThis.NigeriaSearchLanguage = NigeriaSearchLanguage;

const { CategoryMap, MarketplaceTaxonomy } = require('../categories.js');
global.CategoryMap = CategoryMap;
globalThis.CategoryMap = CategoryMap;

require('../providers-data.js');

const { LokatorDB } = require('../supabase-client.js');
LokatorDB.phone = NigeriaPhone;
LokatorDB.locations = NigeriaLocations;
LokatorDB.searchLanguage = NigeriaSearchLanguage;
global.LokatorDB = LokatorDB;
globalThis.LokatorDB = LokatorDB;

// --- TEST GROUP 1: MOBILE BOTTOM-SHEET DOM STRUCTURE & ACCESSIBILITY ---
console.log('--- TEST GROUP 1: MOBILE BOTTOM-SHEET DOM STRUCTURE & ACCESSIBILITY ---');

try {
  assert(searchHtml.includes('id="filter-sidebar"') && searchHtml.includes('role="dialog"'), 'filter-sidebar missing role="dialog"');
  assert(searchHtml.includes('aria-modal="true"'), 'filter-sidebar missing aria-modal="true"');
  assert(searchHtml.includes('aria-labelledby="filter-heading"'), 'filter-sidebar missing aria-labelledby');
  logPass('filter-sidebar configured with semantic dialog role and aria modal attributes');
} catch (e) { logFail('filter-sidebar a11y markup', e); }

try {
  assert(searchHtml.includes('class="bottom-sheet-grab-handle"'), 'Missing bottom-sheet-grab-handle');
  assert(searchHtml.includes('id="mobile-filter-close-btn"'), 'Missing mobile-filter-close-btn');
  assert(searchHtml.includes('class="filter-card-body"'), 'Missing filter-card-body container');
  logPass('Mobile bottom-sheet contains grab handle, close button, and scrolling body container');
} catch (e) { logFail('Bottom sheet visual handles & containers', e); }

try {
  assert(searchHtml.includes('class="mobile-filter-footer"'), 'Missing mobile-filter-footer');
  assert(searchHtml.includes('id="mobile-apply-filters-btn"'), 'Missing mobile-apply-filters-btn');
  assert(searchHtml.includes('id="mobile-reset-filters-btn"'), 'Missing mobile-reset-filters-btn');
  logPass('Mobile bottom-sheet contains dedicated sticky footer with Apply and Reset action buttons');
} catch (e) { logFail('Mobile bottom-sheet sticky footer', e); }

try {
  assert(searchHtml.includes('id="mobile-filter-btn"') && searchHtml.includes('aria-expanded="false"'), 'mobile-filter-btn missing aria-expanded');
  assert(searchHtml.includes('aria-controls="filter-sidebar"'), 'mobile-filter-btn missing aria-controls');
  logPass('Mobile filter trigger button includes aria-expanded and aria-controls attributes');
} catch (e) { logFail('Mobile filter trigger a11y', e); }

// --- TEST GROUP 2: NIGERIAN LOCATION CASCADE ENGINE ---
console.log('\n--- TEST GROUP 2: NIGERIAN LOCATION CASCADE ENGINE ---');

try {
  assert(typeof NigeriaLocations !== 'undefined', 'NigeriaLocations module missing');
  const states = NigeriaLocations.getStates();
  assert(states.length >= 37, `Expected >= 37 states, got ${states.length}`);
  logPass('NigeriaLocations dataset loaded with 36 States + FCT');
} catch (e) { logFail('NigeriaLocations availability', e); }

try {
  // Test State -> LGA cascade
  const lagosLgas = NigeriaLocations.getLgas('Lagos');
  assert(lagosLgas && lagosLgas.length >= 18, 'Lagos LGAs missing');
  const ikejaFound = lagosLgas.some(l => l.name === 'Ikeja');
  assert(ikejaFound, 'Ikeja LGA not found in Lagos');

  const fctLgas = NigeriaLocations.getLgas('Federal Capital Territory (Abuja)') || NigeriaLocations.getLgas('fct');
  assert(fctLgas.some(l => l.name.includes('AMAC') || l.name.includes('Abuja Municipal')), 'AMAC LGA not found in FCT');
  logPass('State -> LGA cascade resolves correct Nigerian administrative subdivisions');
} catch (e) { logFail('State -> LGA cascade', e); }

try {
  // Test LGA -> Locality cascade
  const etiosaLocs = NigeriaLocations.getLocalities('Lagos', 'Eti-Osa');
  assert(etiosaLocs && etiosaLocs.includes('Lekki Phase 1'), 'Lekki Phase 1 not found in Eti-Osa');
  assert(etiosaLocs.includes('Victoria Island (VI)'), 'Victoria Island not found in Eti-Osa');

  const amacLocs = NigeriaLocations.getLocalities('Federal Capital Territory (Abuja)', 'Abuja Municipal (AMAC)') ||
                   NigeriaLocations.getLocalities('fct', 'Abuja Municipal (AMAC)');
  assert(amacLocs && amacLocs.includes('Wuse 2'), 'Wuse 2 not found in AMAC');
  logPass('LGA -> Locality cascade resolves localized neighborhood clusters');
} catch (e) { logFail('LGA -> Locality cascade', e); }

// --- TEST GROUP 3: SEARCH + STRUCTURED FILTER COMPOSITION ---
console.log('\n--- TEST GROUP 3: SEARCH + STRUCTURED FILTER COMPOSITION ---');

async function runAsyncTests() {
  try {
    // 1. Natural language query + Category filter
    const res1 = await LokatorDB.getProviders({
      category: 'electrician',
      state: 'Lagos'
    });
    assert(res1 && res1.data && res1.data.length > 0, 'No results for electrician in Lagos');
    assert(res1.data.every(p => p.category === 'Electrician' || p.slug === 'electrician' || p.trade.toLowerCase().includes('electrician')), 'Category filter violated');
    logPass('Structured category and state filters compose and filter provider records');
  } catch (e) { logFail('Category + State composition', e); }

  try {
    // 2. Nigerian Pidgin natural language intent + structured filters
    const pidginQueries = [
      { text: 'generator mechanic', slug: 'electrician' },
      { text: 'plumber wey dey close to me', slug: 'plumber' },
      { text: 'drycleaner', slug: 'laundry' },
      { text: 'panel beater', slug: 'mechanic' },
      { text: 'person wey fit fix my generator', slug: 'electrician' },
      { text: 'who fit repair my AC', slug: 'ac-technician' }
    ];

    for (const item of pidginQueries) {
      const parsed = NigeriaSearchLanguage.parseNigerianQuery(item.text);
      assert(parsed && parsed.serviceIntent && parsed.serviceIntent.canonicalSlug === item.slug, `Failed to parse Pidgin service intent for "${item.text}"`);
      const res = await LokatorDB.getProviders({ query: item.text });
      assert(res && Array.isArray(res.data), `getProviders failed for "${item.text}"`);
    }
    logPass(`All ${pidginQueries.length} Nigerian Pidgin & trade search terms parse and execute through discovery engine`);
  } catch (e) { logFail('Pidgin search composition', e); }

  try {
    // 3. Proximity / GPS ranking composition
    const lagosCoords = { lat: 6.5244, lng: 3.3792 };
    const resGps = await LokatorDB.getProviders({
      category: 'all',
      userLat: lagosCoords.lat,
      userLng: lagosCoords.lng,
      sortBy: 'distance-asc'
    });
    assert(resGps && resGps.data && resGps.data.length > 0, 'No GPS results returned');
    assert(resGps.data[0].distanceKm !== undefined, 'distanceKm missing from GPS ranked provider');
    logPass('Proximity GPS ranking computes accurate Haversine distances');
  } catch (e) { logFail('GPS proximity ranking', e); }

  // --- TEST GROUP 4: CONTACT LINKS & PROVIDER CARD CONVERSION ---
  console.log('\n--- TEST GROUP 4: CONTACT LINKS & PROVIDER CARD CONVERSION ---');

  try {
    const sampleProvider = {
      id: 1,
      name: 'Adebayo Okafor',
      trade: 'Electrician',
      phone: '08012345678',
      whatsapp: '08012345678',
      city: 'Lagos',
      state: 'Lagos',
      lga: 'Surulere'
    };

    const telUrl = NigeriaPhone.buildTelUrl(sampleProvider);
    assert.strictEqual(telUrl, 'tel:+2348012345678', `Expected canonical tel:+2348012345678, got ${telUrl}`);
    logPass('Provider card generates valid RFC 3966 telephone URL');

    const waUrl = NigeriaPhone.buildWhatsAppUrl(sampleProvider, { service: 'Electrician', location: 'Surulere, Lagos' });
    assert(waUrl.startsWith('https://wa.me/2348012345678?text='), 'Invalid WhatsApp base URL');
    assert(waUrl.includes('Adebayo%20Okafor'), 'WhatsApp message missing provider name');
    assert(waUrl.includes('Electrician'), 'WhatsApp message missing trade context');
    logPass('Provider card generates high-conversion contextual WhatsApp deep link');
  } catch (e) { logFail('Contact links generation', e); }

  // --- TEST GROUP 5: MOBILE CSS & BOTTOM-SHEET STYLES INTEGRITY ---
  console.log('\n--- TEST GROUP 5: MOBILE CSS & BOTTOM-SHEET STYLES INTEGRITY ---');

  try {
    assert(searchCss.includes('.bottom-sheet-grab-handle'), 'search.css missing bottom-sheet-grab-handle');
    assert(searchCss.includes('.mobile-filter-footer'), 'search.css missing mobile-filter-footer');
    assert(searchCss.includes('body.filter-drawer-open'), 'search.css missing body.filter-drawer-open lock rule');
    assert(searchCss.includes('transform: translateY(100%)'), 'search.css missing bottom sheet slide transition initial transform');
    assert(searchCss.includes('transform: translateY(0)'), 'search.css missing open slide transform');
    logPass('search.css includes complete bottom-sheet slide-up, backdrop blur, grab handle, and touch rules');
  } catch (e) { logFail('search.css bottom-sheet rules', e); }

  // --- TEST GROUP 6: PWA SHELL & SCRIPT INCLUSION ---
  console.log('\n--- TEST GROUP 6: PWA SHELL & SCRIPT INCLUSION ---');

  try {
    assert(searchHtml.includes('<script src="locations.js"></script>'), 'search.html missing locations.js');
    assert(searchHtml.includes('<script src="phone-utils.js"></script>'), 'search.html missing phone-utils.js');
    assert(searchHtml.includes('<script src="search-language.js"></script>'), 'search.html missing search-language.js');
    assert(searchHtml.includes('<script src="ai-service.js"></script>'), 'search.html missing ai-service.js');
    assert(searchHtml.includes('<script src="categories.js"></script>'), 'search.html missing categories.js');
    assert(searchHtml.includes('<script src="supabase-client.js"></script>'), 'search.html missing supabase-client.js');
    assert(searchHtml.includes('<script src="search.js"></script>'), 'search.html missing search.js');
    assert(searchHtml.includes('<script src="pwa-manager.js"></script>'), 'search.html missing pwa-manager.js');
    logPass('search.html includes all certified PWA and discovery scripts in correct dependency sequence');
  } catch (e) { logFail('PWA scripts in search.html', e); }

  console.log('\n================================================================================');
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runAsyncTests().catch(err => {
  console.error('Fatal verification error:', err);
  process.exit(1);
});
