// ============================================================================
// LOKATOR.NG — PHASE 10.12A AUTOMATED VERIFICATION SUITE
// Validates Nigerian Location Intelligence, 36 States + FCT dataset,
// LGA and Locality lookups, search query extraction, database filtering,
// registration persistence, and PWA shell integrity.
// ============================================================================

const fs = require('fs');
const path = require('path');

console.log('\n================================================================================');
console.log('🇳🇬 LOKATOR.NG — PHASE 10.12A NIGERIAN LOCATION INTELLIGENCE VERIFICATION');
console.log('================================================================================\n');

let passCount = 0;
let failCount = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passCount++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    failCount++;
  }
}

// 1. Load Locations and Categories Modules
const locationsModule = require('../locations.js');
const { NigeriaLocations, NIGERIA_LOCATIONS_DATA } = locationsModule;

global.NigeriaLocations = NigeriaLocations;
global.NIGERIA_LOCATIONS_DATA = NIGERIA_LOCATIONS_DATA;

const categoriesModule = require('../categories.js');
const { CategoryMap, MarketplaceTaxonomy } = categoriesModule;
global.CategoryMap = CategoryMap;
global.MarketplaceTaxonomy = MarketplaceTaxonomy;

const providersModule = require('../providers-data.js');
global.PROVIDERS_DATA = providersModule.PROVIDERS_DATA;

const supabaseModule = require('../supabase-client.js');
const { LokatorDB } = supabaseModule;

console.log('--- TEST GROUP 1: NIGERIAN LOCATIONS DATASET & LOOKUPS ---');

// 1.1 All 36 States + FCT
const states = NigeriaLocations.getStates();
assert(states.length === 37, `Expected 37 administrative divisions (36 States + FCT), found: ${states.length}`);

// 1.2 State Lookup by Name, Code, and Alias
const lagos = NigeriaLocations.getState('lagos');
assert(lagos && lagos.name === 'Lagos', 'Lookup state by code "lagos" returned Lagos');

const fctByAbuja = NigeriaLocations.getState('Abuja');
assert(fctByAbuja && fctByAbuja.code === 'fct', 'Lookup state by alias "Abuja" resolved to FCT');

const riversByPhc = NigeriaLocations.getState('port harcourt');
assert(riversByPhc && riversByPhc.code === 'rivers', 'Lookup state by alias "port harcourt" resolved to Rivers');

// 1.3 LGA Lookups
const lagosLgas = NigeriaLocations.getLgas('Lagos');
assert(lagosLgas.length >= 18, `Lagos has ${lagosLgas.length} LGAs (expected >= 18)`);

const ikejaLga = NigeriaLocations.getLga('Lagos', 'Ikeja');
assert(ikejaLga && ikejaLga.name === 'Ikeja', 'Found LGA "Ikeja" in Lagos');

const etiOsaLga = NigeriaLocations.getLga('Lagos', 'Eti-Osa');
assert(etiOsaLga && etiOsaLga.name === 'Eti-Osa', 'Found LGA "Eti-Osa" in Lagos');

const amacLga = NigeriaLocations.getLga('FCT', 'Abuja Municipal (AMAC)');
assert(amacLga && amacLga.code === 'amac', 'Found LGA "AMAC" in FCT');

// 1.4 Locality / Neighborhood Lookups
const etiOsaLocalities = NigeriaLocations.getLocalities('Lagos', 'Eti-Osa');
assert(etiOsaLocalities.includes('Lekki Phase 1'), 'Eti-Osa contains "Lekki Phase 1"');
assert(etiOsaLocalities.includes('Victoria Island (VI)'), 'Eti-Osa contains "Victoria Island (VI)"');
assert(etiOsaLocalities.includes('Ikoyi'), 'Eti-Osa contains "Ikoyi"');

const amacLocalities = NigeriaLocations.getLocalities('FCT', 'amac');
assert(amacLocalities.includes('Wuse 2'), 'AMAC contains "Wuse 2"');
assert(amacLocalities.includes('Maitama'), 'AMAC contains "Maitama"');
assert(amacLocalities.includes('Garki 2'), 'AMAC contains "Garki 2"');

// 1.5 Hierarchical Search Autocomplete
const lekkiSearch = NigeriaLocations.searchLocations('Lekki', 5);
assert(lekkiSearch.length > 0 && lekkiSearch[0].state === 'Lagos' && lekkiSearch[0].lga === 'Eti-Osa', 'Autocomplete for "Lekki" identifies Eti-Osa, Lagos');

const wuseSearch = NigeriaLocations.searchLocations('Wuse', 5);
assert(wuseSearch.length > 0 && wuseSearch[0].state.includes('Federal Capital Territory'), 'Autocomplete for "Wuse" identifies FCT');

const bodijaSearch = NigeriaLocations.searchLocations('Bodija', 5);
assert(bodijaSearch.length > 0 && bodijaSearch[0].state === 'Oyo' && bodijaSearch[0].lga === 'Ibadan North', 'Autocomplete for "Bodija" identifies Ibadan North, Oyo');

const rumuokoroSearch = NigeriaLocations.searchLocations('Rumuokoro', 5);
assert(rumuokoroSearch.length > 0 && rumuokoroSearch[0].state === 'Rivers' && rumuokoroSearch[0].lga === 'Obio/Akpor', 'Autocomplete for "Rumuokoro" identifies Obio/Akpor, Rivers');

console.log('\n--- TEST GROUP 2: NATURAL QUERY PARSER & INTENT EXTRACTION ---');

const q1 = LokatorDB.parseSearchQuery('plumber in Ikeja');
assert(q1.cleanQuery === 'plumber', `q1 cleanQuery expected 'plumber', got '${q1.cleanQuery}'`);
assert(q1.extractedLocation === 'Ikeja', `q1 extractedLocation expected 'Ikeja', got '${q1.extractedLocation}'`);
assert(q1.locationHierarchy && q1.locationHierarchy.state === 'Lagos', 'q1 resolved state as Lagos');

const q2 = LokatorDB.parseSearchQuery('mechanic around Lekki');
assert(q2.cleanQuery === 'mechanic', `q2 cleanQuery expected 'mechanic', got '${q2.cleanQuery}'`);
assert(q2.extractedLocation === 'Lekki', `q2 extractedLocation expected 'Lekki', got '${q2.extractedLocation}'`);
assert(q2.locationHierarchy && q2.locationHierarchy.lga === 'Eti-Osa', 'q2 resolved LGA as Eti-Osa');

const q3 = LokatorDB.parseSearchQuery('tailor in Surulere');
assert(q3.cleanQuery === 'tailor', `q3 cleanQuery expected 'tailor', got '${q3.cleanQuery}'`);
assert(q3.extractedLocation === 'Surulere', `q3 extractedLocation expected 'Surulere', got '${q3.extractedLocation}'`);

const q4 = LokatorDB.parseSearchQuery('electrician in Wuse 2');
assert(q4.cleanQuery === 'electrician', `q4 cleanQuery expected 'electrician', got '${q4.cleanQuery}'`);
assert(q4.extractedLocation === 'Wuse 2', `q4 extractedLocation expected 'Wuse 2', got '${q4.extractedLocation}'`);
assert(q4.locationHierarchy && q4.locationHierarchy.state.includes('Federal Capital Territory'), 'q4 resolved state as FCT');

const q5 = LokatorDB.parseSearchQuery('caterer at Bodija');
assert(q5.cleanQuery === 'caterer', `q5 cleanQuery expected 'caterer', got '${q5.cleanQuery}'`);
assert(q5.extractedLocation === 'Bodija', `q5 extractedLocation expected 'Bodija', got '${q5.extractedLocation}'`);
assert(q5.locationHierarchy && q5.locationHierarchy.state === 'Oyo', 'q5 resolved state as Oyo');

console.log('\n--- TEST GROUP 3: PROVIDER DIRECTORY HIERARCHICAL QUERYING ---');

async function testProviderQueries() {
  // Test State Query
  const lagosResult = await LokatorDB.getProviders({ state: 'Lagos' });
  assert(lagosResult && Array.isArray(lagosResult.data), 'getProviders with state: "Lagos" returned results');
  const allLagos = lagosResult.data.every(p => !p.state || p.state.toLowerCase().includes('lagos'));
  assert(allLagos, 'All returned providers match Lagos state filter');

  // Test Natural Query with Location
  const parsedSearchRes = await LokatorDB.getProviders({ query: 'plumber in Ikeja' });
  assert(parsedSearchRes && Array.isArray(parsedSearchRes.data), 'getProviders with "plumber in Ikeja" returned results');

  // Test Distance Ranking with User Coordinates (GPS)
  const gpsRes = await LokatorDB.getProviders({
    category: 'electrician',
    userLat: 6.5925,
    userLng: 3.3429, // Ikeja Coordinates
    sortBy: 'distance-asc'
  });
  assert(gpsRes && gpsRes.data.length > 0, 'getProviders with GPS coordinates returned ranked results');
  if (gpsRes.data.length >= 2) {
    const hasDistances = gpsRes.data.every(p => typeof p.distanceKm === 'number');
    assert(hasDistances, 'Calculated Haversine distanceKm on all returned providers');
    const isSorted = gpsRes.data[0].distanceKm <= gpsRes.data[1].distanceKm;
    assert(isSorted, 'Providers are sorted in ascending order of geographic distance');
  }
}

console.log('\n--- TEST GROUP 4: PROVIDER REGISTRATION WITH CASCADING LOCATION ---');

async function testRegistration() {
  const newProviderData = {
    fname: 'Adeola',
    lname: 'Babatunde',
    phone: '08023456789',
    email: `test_adeola_${Date.now()}@example.com`,
    service: 'Solar & Inverter Technician',
    skills: ['Solar Panels', 'Inverter Setup', 'Tubular Batteries'],
    state: 'Lagos',
    lga: 'Eti-Osa',
    locality: 'Lekki Phase 1',
    city: 'Eti-Osa',
    experience: '3-5',
    bio: 'Certified solar energy installer in Lekki and Victoria Island.',
    lat: 6.4474,
    lng: 3.4723
  };

  const registered = await LokatorDB.registerProvider(newProviderData);
  assert(registered && registered.id, 'Provider registered successfully with ID: ' + (registered ? registered.id : null));
  assert(registered.state === 'Lagos', 'Registered provider state preserved as Lagos');
  assert(registered.lga === 'Eti-Osa', 'Registered provider LGA preserved as Eti-Osa');
  assert(registered.area.includes('Lekki Phase 1'), `Registered provider area includes locality (${registered.area})`);
  assert(registered.latitude === 6.4474 && registered.longitude === 3.4723, 'Registered provider latitude/longitude coordinates preserved');

  // Query back newly registered provider
  const queried = await LokatorDB.getProviderById(registered.id);
  assert(queried && queried.id === registered.id, 'Retrieved registered provider by ID from database');
  assert(queried.state === 'Lagos' && queried.lga === 'Eti-Osa', 'Retrieved provider retains structured State & LGA hierarchy');
}

console.log('\n--- TEST GROUP 5: PWA SHELL & SCRIPT TAG INTEGRITY ---');

const swContent = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
assert(swContent.includes("'/locations.js'"), 'sw.js includes /locations.js in SHELL_ASSETS pre-cache list');

const htmlPages = ['index.html', 'search.html', 'register.html', 'profile.html', 'dashboard.html', 'login.html'];
htmlPages.forEach(page => {
  const content = fs.readFileSync(path.join(__dirname, `../${page}`), 'utf8');
  const hasScript = content.includes('src="locations.js"');
  assert(hasScript, `${page} includes <script src="locations.js"></script>`);
});

// Run async tests
(async function() {
  await testProviderQueries();
  await testRegistration();

  console.log('\n================================================================================');
  console.log(`VERIFICATION COMPLETE: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================================\n');

  if (failCount > 0) {
    process.exit(1);
  }
})();
