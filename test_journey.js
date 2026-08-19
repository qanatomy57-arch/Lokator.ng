const fs = require('fs');

const localStorageMock = (function() {
  let store = {};
  return {
    getItem: function(key) { return store[key] || null; },
    setItem: function(key, value) { store[key] = value.toString(); },
    clear: function() { store = {}; },
    removeItem: function(key) { delete store[key]; }
  };
})();

global.window = global;
global.localStorage = localStorageMock;
global.navigator = { geolocation: {} };
global.sessionStorage = localStorageMock;

// Load components
eval(fs.readFileSync('c:/All workspace/Locator.NG/lokator/categories.js', 'utf8'));
eval(fs.readFileSync('c:/All workspace/Locator.NG/lokator/providers-data.js', 'utf8'));
eval(fs.readFileSync('c:/All workspace/Locator.NG/lokator/supabase-client.js', 'utf8'));

async function testCompleteFlow() {
  console.log('==================================================');
  console.log('TESTING COMPLETE HERO TO DISCOVERY & BOOKING FLOW');
  console.log('==================================================');

  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      passed++;
      console.log('✓ PASS:', message);
    } else {
      console.error('✗ FAIL:', message);
    }
  }

  // --- TEST A: End-to-End Hero to WhatsApp Conversion ---
  console.log('\n--- TEST A: Hero to WhatsApp Booking Journey ---');
  // 1. User clicks Electrician CTA from hero (service=electrician)
  const discoveryA = await LokatorDB.getProviders({ category: 'electrician', city: 'all' });
  assert(discoveryA.data.length > 0, 'Hero Electrician CTA loads provider results');
  
  // 2. Select first provider (e.g. Adebayo Okafor)
  const selectedProviderId = discoveryA.data[0].id;
  const profileA = await LokatorDB.getProviderById(selectedProviderId);
  assert(profileA !== null && profileA.id === selectedProviderId, 'Provider Profile loads for id ' + selectedProviderId);
  assert(Array.isArray(profileA.skills) && profileA.skills.length > 0, 'Provider profile contains skills list');
  assert(Array.isArray(profileA.pricingGuide) && profileA.pricingGuide.length > 0, 'Provider profile contains pricing guide');

  // 3. Generate structured WhatsApp message
  const serviceVal = profileA.skills[0] || profileA.trade;
  const locVal = profileA.area;
  const cleanWa = (profileA.whatsappNumber || profileA.phone).replace(/[^0-9]/g, '');
  const formattedMessage = `Hello ${profileA.name},\n\nI found you on Locator.NG.\n\nI need your ${serviceVal} service.\n\nLocation:\n${locVal}\n\nPreferred time:\nUrgent\n\nAre you available? Thank you.`;
  const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(formattedMessage)}`;
  assert(waUrl.includes(cleanWa) && waUrl.includes(encodeURIComponent(profileA.name)), 'WhatsApp booking URL contains provider phone & name');
  assert(waUrl.includes(encodeURIComponent(locVal)), 'WhatsApp booking URL contains provider location');

  // --- TEST B: Direct Search ---
  console.log('\n--- TEST B: Direct Search ---');
  const searchB1 = await LokatorDB.getProviders({ query: 'Recording Studio' });
  assert(searchB1.data.length > 0 && searchB1.data[0].name.includes('SoundWave'), 'Direct search for Recording Studio returns David Okon');
  const searchB2 = await LokatorDB.getProviders({ query: 'solar installer' });
  assert(searchB2.data.length > 0 && searchB2.data.some(p => p.name.includes('Yusuf')), 'Direct search for solar installer includes Engr. Yusuf');

  // --- TEST C: Nonexistent Search (Empty State) ---
  console.log('\n--- TEST C: Empty State ---');
  const searchC = await LokatorDB.getProviders({ query: 'Nuclear Rocket Propulsion Specialist' });
  assert(searchC.data.length === 0, 'Nonexistent query returns 0 results to trigger custom helpful empty state');

  // --- TEST D: Manual Location Selection ---
  console.log('\n--- TEST D: Manual Location Filtering ---');
  const searchD = await LokatorDB.getProviders({ city: 'Abuja' });
  assert(searchD.data.length > 0 && searchD.data.every(p => p.city.toLowerCase().includes('abuja') || p.area.toLowerCase().includes('abuja') || p.state.toLowerCase().includes('abuja')), 'Location filter city=Abuja returns providers in Abuja');

  // --- TEST E: URL State Parameter Parsing & Synchronization ---
  console.log('\n--- TEST E: URL State Structure ---');
  const testUrlParams = new URLSearchParams('service=electrician&city=Lagos&verified=true');
  const catParam = testUrlParams.get('service');
  const cityParam = testUrlParams.get('city');
  const verParam = testUrlParams.get('verified') === 'true';
  const searchE = await LokatorDB.getProviders({ category: catParam, city: cityParam, isVerified: verParam });
  assert(searchE.data.length > 0 && searchE.data.every(p => p.isVerified), 'URL state parameters correctly execute filtered search');

  // --- TEST F & G: Hero and HTML files integrity ---
  console.log('\n--- TEST F & G: HTML & Assets File Integrity ---');
  const indexHtml = fs.readFileSync('c:/All workspace/Locator.NG/lokator/index.html', 'utf8');
  assert(indexHtml.includes('id="hero-timeline-nav"'), 'index.html contains vertical hero navigation indicator');
  assert(indexHtml.includes('id="service-input"') && indexHtml.includes('id="search-btn"'), 'index.html contains functional hero search card');
  assert(indexHtml.includes('id="hero-cta-electrician"') && indexHtml.includes('id="hero-cta-plumber"'), 'index.html contains contextual category CTAs');

  const searchHtml = fs.readFileSync('c:/All workspace/Locator.NG/lokator/search.html', 'utf8');
  assert(searchHtml.includes('id="keyword-search"') && searchHtml.includes('id="search-suggestions"'), 'search.html contains keyword search and suggestions dropdown');
  assert(searchHtml.includes('id="empty-state"') && searchHtml.includes('id="providers-container"'), 'search.html contains providers list and empty state container');

  const profileHtml = fs.readFileSync('c:/All workspace/Locator.NG/lokator/profile.html', 'utf8');
  assert(profileHtml.includes('id="wa-send-btn"') && profileHtml.includes('id="skills-container"'), 'profile.html contains WhatsApp booking and skills container');

  console.log('\n==================================================');
  console.log(`ALL ASSERTIONS: ${passed} / ${total} PASSED`);
  console.log('==================================================');
}

testCompleteFlow();
