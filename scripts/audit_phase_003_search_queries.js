const fs = require('fs');
const path = require('path');

const window = { LOKATOR_MOCK_DELAY: 0 };
global.window = window;
global.document = { 
  addEventListener: () => {},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

eval(fs.readFileSync(path.join(__dirname, '..', 'locations.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '..', 'phone-utils.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '..', 'categories.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '..', 'search-language.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '..', 'providers-data.js'), 'utf-8'));
eval(fs.readFileSync(path.join(__dirname, '..', 'supabase-client.js'), 'utf-8'));

const testQueries = [
  // 15 core Nigerian queries
  'plumber',
  'electrician',
  'mechanic',
  'AC repair',
  'phone repair',
  'barber',
  'tailor',
  'cleaner',
  'photographer',
  'painter',
  'welder',
  'carpenter',
  'generator repair',
  'makeup artist',
  'hair stylist',
  // Misspellings & variations
  'plumba',
  'electrishan',
  'plumbers',
  'electricians',
  // Natural language & Location
  'need plumber in ikeja',
  'who fit fix my generator for warri',
  'Ikeja',
  'Wuse',
  // Edge cases
  '',
  'spaceshuttle astronaut'
];

async function run() {
  console.log('='.repeat(70));
  console.log('PADIFIX SEARCH RESOLUTION AUDIT (search-language.js + LokatorDB)');
  console.log('='.repeat(70));

  for (const q of testQueries) {
    const parsed = window.NigeriaSearchLanguage.parseQuery(q);
    const res = await window.LokatorDB.getProviders({
      keyword: q,
      naturalLanguage: parsed
    });

    const intent = parsed.serviceIntent ? parsed.serviceIntent.canonicalSlug : 'none';
    const loc = parsed.locationHierarchy ? parsed.locationHierarchy.cleanLocation : (parsed.extractedLocation || 'none');
    console.log(`Query: "${q.padEnd(35)}" | Intent: ${intent.padEnd(12)} | Loc: ${loc.padEnd(10)} | Count: ${res.totalCount}`);
  }
}

run().catch(console.error);
