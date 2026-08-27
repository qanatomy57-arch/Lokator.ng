/**
 * ============================================================================
 * LOKATOR.NG — PHASE 10.20 AUTOMATED SEARCH INTELLIGENCE VERIFICATION SUITE
 * Comprehensive coverage for Nigerian English, Pidgin, Location Prepositions,
 * Action Intents, Urgency, Budget, Disambiguation & End-to-End Search Quality
 * ============================================================================
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Load environment and modules
const { NigeriaLocations } = require('../locations.js');
global.NigeriaLocations = NigeriaLocations;
globalThis.NigeriaLocations = NigeriaLocations;

const { CategoryMap, MarketplaceTaxonomy } = require('../categories.js');
global.CategoryMap = CategoryMap;
global.MarketplaceTaxonomy = MarketplaceTaxonomy;

const { PROVIDERS_DATA } = require('../providers-data.js');
global.PROVIDERS_DATA = PROVIDERS_DATA;

const { NigeriaSearchLanguage } = require('../search-language.js');
global.NigeriaSearchLanguage = NigeriaSearchLanguage;
globalThis.NigeriaSearchLanguage = NigeriaSearchLanguage;

const { LokatorDB } = require('../supabase-client.js');
global.LokatorDB = LokatorDB;
LokatorDB.searchLanguage = NigeriaSearchLanguage;

let passed = 0;
let failed = 0;
const failures = [];

function runTest(description, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failed++;
    failures.push({ description, error: err.message });
  }
}

async function runAsyncTest(description, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${description}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${description}`);
    console.error(`     Error: ${err.message}`);
    failed++;
    failures.push({ description, error: err.message });
  }
}

async function runSuite() {
  console.log('\n' + '='.repeat(80));
  console.log('🇳🇬 LOKATOR.NG — PHASE 10.20 NIGERIAN SEARCH INTELLIGENCE VERIFICATION');
  console.log('='.repeat(80));

  // --- GROUP 1: CANONICAL SERVICE RECOGNITION (21 Tests) ---
  console.log('\n--- TEST GROUP 1: CANONICAL SERVICE RECOGNITION (21 Tests) ---');
  const canonicalServices = [
    { query: 'tailor', expectedSlug: 'tailor' },
    { query: 'laundry', expectedSlug: 'laundry' },
    { query: 'mechanic', expectedSlug: 'mechanic' },
    { query: 'electrician', expectedSlug: 'electrician' },
    { query: 'ac technician', expectedSlug: 'ac-technician' },
    { query: 'fridge repairer', expectedSlug: 'ac-technician' },
    { query: 'phone repairer', expectedSlug: 'phone-repair' },
    { query: 'solar installer', expectedSlug: 'solar-installer' },
    { query: 'plumber', expectedSlug: 'plumber' },
    { query: 'welder', expectedSlug: 'welder' },
    { query: 'carpenter', expectedSlug: 'carpenter' },
    { query: 'painter', expectedSlug: 'painter' },
    { query: 'mason', expectedSlug: 'mason' },
    { query: 'tiler', expectedSlug: 'tiler' },
    { query: 'barber', expectedSlug: 'barber' },
    { query: 'nail technician', expectedSlug: 'nail-technician' },
    { query: 'makeup artist', expectedSlug: 'makeup-artist' },
    { query: 'cleaner', expectedSlug: 'cleaner' },
    { query: 'caterer', expectedSlug: 'caterer' },
    { query: 'event planner', expectedSlug: 'event-planner' },
    { query: 'dispatch rider', expectedSlug: 'dispatch' }
  ];

  canonicalServices.forEach(s => {
    runTest(`Service recognition for "${s.query}" maps to ${s.expectedSlug}`, () => {
      const parsed = NigeriaSearchLanguage.parseNigerianQuery(s.query);
      assert.ok(parsed.serviceIntent, `Service intent should be detected for ${s.query}`);
      assert.strictEqual(parsed.serviceIntent.canonicalSlug, s.expectedSlug);
    });
  });

  // --- GROUP 2: PIDGIN & MIXED NIGERIAN ENGLISH COVERAGE (20 Tests) ---
  console.log('\n--- TEST GROUP 2: PIDGIN & CONVERSATIONAL QUERY PARSING (20 Tests) ---');
  const pidginCases = [
    { q: 'person wey fit fix my AC for Ughelli', slug: 'ac-technician', loc: 'Ughelli' },
    { q: 'who fit repair my fridge', slug: 'ac-technician' },
    { q: 'abeg find plumber for me', slug: 'plumber' },
    { q: 'person wey sabi wire house for Effurun', slug: 'electrician', loc: 'Effurun' },
    { q: 'who fit sew cloth for me', slug: 'tailor' },
    { q: 'who fit paint my house', slug: 'painter' },
    { q: 'I need person wey go clean house', slug: 'cleaner' },
    { q: 'plumber wey dey close to me', slug: 'plumber', isNear: true },
    { q: 'electrician wey dey around here', slug: 'electrician', isNear: true },
    { q: 'person wey fit fix my generator', slug: 'electrician' },
    { q: 'generator person near me', slug: 'electrician', isNear: true },
    { q: 'welder wey dey nearby', slug: 'welder', isNear: true },
    { q: 'who fit repair my AC', slug: 'ac-technician' },
    { q: 'my AC don spoil, who fit fix am for Warri', slug: 'ac-technician', loc: 'Warri' },
    { q: 'abeg I need tailor wey fit sew senator around Warri', slug: 'tailor', loc: 'Warri' },
    { q: 'person wey sabi lay tile for compound', slug: 'tiler' },
    { q: 'who fit do POP for my sitting room', slug: 'painter' },
    { q: 'person wey sabi braid hair well well', slug: 'nail-technician' },
    { q: 'abeg who fit bake birthday cake for me', slug: 'caterer' },
    { q: 'person wey sabi drive dispatch bike', slug: 'dispatch' }
  ];

  pidginCases.forEach(p => {
    runTest(`Pidgin parse: "${p.q}"`, () => {
      const res = NigeriaSearchLanguage.parseNigerianQuery(p.q);
      assert.ok(res.serviceIntent, `Service intent should resolve for "${p.q}"`);
      assert.strictEqual(res.serviceIntent.canonicalSlug, p.slug);
      if (p.loc) {
        assert.ok(res.extractedLocation, `Location should be extracted for "${p.q}"`);
        assert.strictEqual(res.extractedLocation.toLowerCase(), p.loc.toLowerCase());
      }
      if (p.isNear) {
        assert.strictEqual(res.isNearMe, true, `Proximity intent should be true for "${p.q}"`);
      }
    });
  });

  // --- GROUP 3: SERVICE + LOCATION COMPOSITION (16 Tests) ---
  console.log('\n--- TEST GROUP 3: SERVICE + LOCATION COMPOSITION (16 Tests) ---');
  const locCases = [
    { q: 'plumber in Ughelli', slug: 'plumber', state: 'Delta' },
    { q: 'plumber for Ughelli', slug: 'plumber', state: 'Delta' },
    { q: 'plumber around Ughelli', slug: 'plumber', state: 'Delta' },
    { q: 'plumber near Ughelli', slug: 'plumber', state: 'Delta' },
    { q: 'AC guy for Warri', slug: 'ac-technician', state: 'Delta' },
    { q: 'electrician around Effurun', slug: 'electrician', state: 'Delta' },
    { q: 'tailor near Sapele', slug: 'tailor', state: 'Delta' },
    { q: 'painter for Ikeja', slug: 'painter', state: 'Lagos' },
    { q: 'generator mechanic in Onitsha', slug: 'electrician', state: 'Anambra' },
    { q: 'tailor around Aba', slug: 'tailor', state: 'Abia' },
    { q: 'caterer in Bodija', slug: 'caterer', state: 'Oyo' },
    { q: 'electrician in Wuse 2', slug: 'electrician', state: 'Federal Capital Territory (Abuja)' },
    { q: 'plumber in Awka', slug: 'plumber', state: 'Anambra' },
    { q: 'auto mechanic in Surulere', slug: 'mechanic', state: 'Lagos' },
    { q: 'drycleaner in Lekki', slug: 'laundry', state: 'Lagos' },
    { q: 'barber in Ikeja', slug: 'barber', state: 'Lagos' }
  ];

  locCases.forEach(l => {
    runTest(`Location composition: "${l.q}"`, () => {
      const res = NigeriaSearchLanguage.parseNigerianQuery(l.q);
      assert.ok(res.serviceIntent, `Service intent should resolve for "${l.q}"`);
      assert.strictEqual(res.serviceIntent.canonicalSlug, l.slug);
      assert.ok(res.locationHierarchy, `Location hierarchy should resolve for "${l.q}"`);
      assert.strictEqual(res.locationHierarchy.state, l.state);
    });
  });

  // --- GROUP 4: ACTION / INTENT RECOGNITION (10 Tests) ---
  console.log('\n--- TEST GROUP 4: ACTION / INTENT RECOGNITION (10 Tests) ---');
  const actionCases = [
    { q: 'fix my AC', expectedAction: 'repair' },
    { q: 'install AC in bedroom', expectedAction: 'installation' },
    { q: 'wire house for new building', expectedAction: 'installation' },
    { q: 'paint my house exterior', expectedAction: 'painting' },
    { q: 'clean my office tomorrow', expectedAction: 'cleaning' },
    { q: 'build wall for compound', expectedAction: 'construction' },
    { q: 'sew senator for wedding', expectedAction: 'sewing' },
    { q: 'maintain generator regularly', expectedAction: 'maintenance' },
    { q: 'service fridge compressor', expectedAction: 'maintenance' },
    { q: 'deep clean four bedroom flat', expectedAction: 'cleaning' }
  ];

  actionCases.forEach(a => {
    runTest(`Action intent: "${a.q}" -> ${a.expectedAction}`, () => {
      const res = NigeriaSearchLanguage.parseNigerianQuery(a.q);
      assert.strictEqual(res.actionIntent, a.expectedAction);
    });
  });

  // --- GROUP 5: BUDGET & PRICE SENSITIVITY (6 Tests) ---
  console.log('\n--- TEST GROUP 5: BUDGET & PRICE SENSITIVITY (6 Tests) ---');
  const budgetCases = [
    { q: 'I need somebody to paint my house but make e no too cost', isSensitive: true },
    { q: 'cheap plumber in Ikeja', isSensitive: true },
    { q: 'affordable tailor around Warri', isSensitive: true },
    { q: 'fix my phone under 50k', isSensitive: true, maxBudget: 50000 },
    { q: 'electrician below ₦20,000', isSensitive: true, maxBudget: 20000 },
    { q: 'cleaner on a budget', isSensitive: true }
  ];

  budgetCases.forEach(b => {
    runTest(`Budget intent: "${b.q}"`, () => {
      const res = NigeriaSearchLanguage.parseNigerianQuery(b.q);
      assert.ok(res.budgetIntent, `Budget intent should be detected for "${b.q}"`);
      assert.strictEqual(res.budgetIntent.isCostSensitive, true);
      if (b.maxBudget) {
        assert.strictEqual(res.budgetIntent.maxBudget, b.maxBudget);
      }
    });
  });

  // --- GROUP 6: URGENCY & TIME SENSITIVITY (6 Tests) ---
  console.log('\n--- TEST GROUP 6: URGENCY & TIME SENSITIVITY (6 Tests) ---');
  const urgencyCases = [
    { q: 'I need somebody to fix my fridge tomorrow for Sapele', expectedLevel: 'tomorrow' },
    { q: 'my AC don spoil and I need person today for Sapele', expectedLevel: 'today' },
    { q: 'abeg I need plumber wey fit come now', expectedLevel: 'immediate' },
    { q: 'electrician emergency right now', expectedLevel: 'immediate' },
    { q: 'caterer for this weekend', expectedLevel: 'weekend' },
    { q: 'cleaner sharp sharp', expectedLevel: 'immediate' }
  ];

  urgencyCases.forEach(u => {
    runTest(`Urgency intent: "${u.q}" -> ${u.expectedLevel}`, () => {
      const res = NigeriaSearchLanguage.parseNigerianQuery(u.q);
      assert.ok(res.urgencyIntent, `Urgency intent should be detected for "${u.q}"`);
      assert.strictEqual(res.urgencyIntent.level, u.expectedLevel);
    });
  });

  // --- GROUP 7: AMBIGUOUS & LOW-CONFIDENCE QUERIES (10 Tests) ---
  console.log('\n--- TEST GROUP 7: AMBIGUOUS & LOW-CONFIDENCE QUERIES (10 Tests) ---');
  const ambiguousCases = [
    'hello',
    'I need help',
    'something',
    'find somebody',
    'help me',
    'what is Lokator',
    'who are you',
    'good morning',
    'services',
    'engineer'
  ];

  ambiguousCases.forEach(q => {
    runTest(`Ambiguous rejection for "${q}" prevents trade hallucination`, () => {
      const res = NigeriaSearchLanguage.parseNigerianQuery(q);
      assert.strictEqual(res.serviceIntent, null, `Should NOT hallucinate trade intent for "${q}"`);
      assert.ok(res.confidence === 'LOW' || res.confidence === 'UNKNOWN', `Confidence should be LOW or UNKNOWN, got ${res.confidence}`);
    });
  });

  // --- GROUP 8: NOISE, SPELLING & TYPO TOLERANCE (10 Tests) ---
  console.log('\n--- TEST GROUP 8: NOISE, SPELLING & TYPO TOLERANCE (10 Tests) ---');
  const noiseCases = [
    { q: 'FIX MY AC!!!', slug: 'ac-technician' },
    { q: 'fix   my   AC', slug: 'ac-technician' },
    { q: 'fix my a.c', slug: 'ac-technician' },
    { q: 'plumberrr', slug: 'plumber' },
    { q: 'electrican', slug: 'electrician' },
    { q: 'tailor in warrri', slug: 'tailor' },
    { q: 'abeggg find plumber', slug: 'plumber' },
    { q: 'photograper in ikeja', slug: 'photographer' },
    { q: 'dry-cleaner', slug: 'laundry' },
    { q: 'panel-beater', slug: 'mechanic' }
  ];

  noiseCases.forEach(n => {
    runTest(`Noise & typo tolerance: "${n.q}" -> ${n.slug}`, () => {
      const res = NigeriaSearchLanguage.parseNigerianQuery(n.q);
      assert.ok(res.serviceIntent, `Service intent should resolve for "${n.q}"`);
      assert.strictEqual(res.serviceIntent.canonicalSlug, n.slug);
    });
  });

  // --- GROUP 9: END-TO-END MARKETPLACE DISCOVERY & SCORING (6 Tests) ---
  console.log('\n--- TEST GROUP 9: END-TO-END SEARCH DISCOVERY INTEGRATION (6 Tests) ---');

  await runAsyncTest('LokatorDB.getProviders finds AC providers for "fix my AC"', async () => {
    const res = await LokatorDB.getProviders({ query: 'fix my AC' });
    assert.ok(res.data && res.data.length > 0, 'Should return matching providers');
    const topProvider = res.data[0];
    assert.ok(
      topProvider.category === 'AC & Refrigeration' || 
      topProvider.slug === 'ac-technician' || 
      (topProvider.skills || []).some(s => s.toLowerCase().includes('ac') || s.toLowerCase().includes('fridge')),
      'Top provider should be an AC/refrigeration artisan'
    );
  });

  await runAsyncTest('LokatorDB.getProviders finds Plumber in Lagos for "plumber in Ikeja"', async () => {
    const res = await LokatorDB.getProviders({ query: 'plumber in Ikeja' });
    assert.ok(res.data && res.data.length > 0);
    const hasPlumberInLagos = res.data.some(p => (p.slug === 'plumber' || p.category === 'Plumber') && (p.city === 'Lagos' || p.state === 'Lagos'));
    assert.ok(hasPlumberInLagos, 'Should find plumber in Lagos');
  });

  await runAsyncTest('LokatorDB.getProviders finds Electricians for "wire house"', async () => {
    const res = await LokatorDB.getProviders({ query: 'wire house' });
    assert.ok(res.data && res.data.length > 0);
    const hasElectrician = res.data.some(p => p.slug === 'electrician' || p.category === 'Electrician');
    assert.ok(hasElectrician, 'Should find electrician for wire house');
  });

  await runAsyncTest('LokatorDB.getProviders finds Tailors for "sew senator"', async () => {
    const res = await LokatorDB.getProviders({ query: 'sew senator' });
    assert.ok(res.data && res.data.length > 0);
    const hasTailor = res.data.some(p => p.slug === 'tailor' || p.category === 'Tailor');
    assert.ok(hasTailor, 'Should find tailor for sew senator');
  });

  await runAsyncTest('LokatorDB.getProviders handles zero-intent query without crashing', async () => {
    const res = await LokatorDB.getProviders({ query: 'hello' });
    assert.ok(Array.isArray(res.data));
  });

  // --- GROUP 10: PWA SHELL & SCRIPT TAG INTEGRITY (7 Tests) ---
  console.log('\n--- TEST GROUP 10: PWA SHELL & SCRIPT TAG INTEGRITY (7 Tests) ---');
  const rootDir = path.join(__dirname, '..');
  const pages = ['index.html', 'search.html', 'register.html', 'profile.html', 'dashboard.html', 'login.html'];

  const swContent = fs.readFileSync(path.join(rootDir, 'sw.js'), 'utf8');
  runTest('sw.js includes /search-language.js in SHELL_ASSETS pre-cache list', () => {
    assert.ok(swContent.includes('/search-language.js') || swContent.includes('search-language.js'));
  });

  pages.forEach(p => {
    runTest(`${p} includes <script src="search-language.js"></script>`, () => {
      const html = fs.readFileSync(path.join(rootDir, p), 'utf8');
      assert.ok(html.includes('search-language.js'), `${p} must load search-language.js`);
    });
  });

  // --- FINAL SUMMARY ---
  console.log('\n' + '='.repeat(80));
  console.log(`VERIFICATION COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80) + '\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch(err => {
  console.error('Fatal Suite Error:', err);
  process.exit(1);
});
