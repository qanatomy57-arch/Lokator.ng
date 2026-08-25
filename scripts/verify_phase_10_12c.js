/**
 * LOKATOR.NG — PHASE 10.12C AUTOMATED TEST SUITE
 * NIGERIAN SEARCH LANGUAGE EXPANSION VERIFICATION
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Load environment dependencies in order
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

async function runPhase10_12CVerification() {
  console.log('\n' + '='.repeat(80));
  console.log('🇳🇬 LOKATOR.NG — PHASE 10.12C NIGERIAN SEARCH LANGUAGE EXPANSION VERIFICATION');
  console.log('='.repeat(80) + '\n');

  let passedTests = 0;
  let failedTests = 0;

  function runTest(name, fn) {
    try {
      fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failedTests++;
    }
  }

  async function runAsyncTest(name, fn) {
    try {
      await fn();
      console.log(`  ✅ [PASS] ${name}`);
      passedTests++;
    } catch (err) {
      console.error(`  ❌ [FAIL] ${name}`);
      console.error(`     Error: ${err.message}`);
      failedTests++;
    }
  }

  // --- GROUP 1: CANONICAL TERMS RECOGNITION ---
  console.log('--- TEST GROUP 1: CANONICAL TERMS RECOGNITION ---');

  const canonicalTerms = [
    { query: 'plumber', expectedSlug: 'plumber' },
    { query: 'electrician', expectedSlug: 'electrician' },
    { query: 'tailor', expectedSlug: 'tailor' },
    { query: 'barber', expectedSlug: 'barber' },
    { query: 'welder', expectedSlug: 'welder' },
    { query: 'mechanic', expectedSlug: 'mechanic' },
    { query: 'carpenter', expectedSlug: 'carpenter' },
    { query: 'painter', expectedSlug: 'painter' },
    { query: 'caterer', expectedSlug: 'caterer' },
    { query: 'photographer', expectedSlug: 'photographer' }
  ];

  canonicalTerms.forEach(t => {
    runTest(`Canonical term "${t.query}" resolves to "${t.expectedSlug}"`, () => {
      const intent = NigeriaSearchLanguage.resolveTradeIntent(t.query);
      assert.ok(intent, `Intent should be found for ${t.query}`);
      assert.strictEqual(intent.canonicalSlug, t.expectedSlug);
    });
  });

  // --- GROUP 2: NIGERIAN SPACING & TRADE VARIANTS ---
  console.log('\n--- TEST GROUP 2: NIGERIAN SPACING & TRADE VARIANTS ---');

  const nigerianVariants = [
    { query: 'drycleaner', expectedSlug: 'laundry' },
    { query: 'dry cleaner', expectedSlug: 'laundry' },
    { query: 'dry-cleaner', expectedSlug: 'laundry' },
    { query: 'dry cleaning', expectedSlug: 'laundry' },
    { query: 'fashion designer', expectedSlug: 'tailor' },
    { query: 'fashion-designer', expectedSlug: 'tailor' },
    { query: 'panel beater', expectedSlug: 'mechanic' },
    { query: 'panel-beater', expectedSlug: 'mechanic' },
    { query: 'panelbeater', expectedSlug: 'mechanic' },
    { query: 'generator mechanic', expectedSlug: 'electrician' },
    { query: 'generator repairer', expectedSlug: 'electrician' },
    { query: 'generator technician', expectedSlug: 'electrician' },
    { query: 'AC person', expectedSlug: 'ac-technician' },
    { query: 'ac repairer', expectedSlug: 'ac-technician' },
    { query: 'phone engineer', expectedSlug: 'phone-repair' },
    { query: 'phone repairer', expectedSlug: 'phone-repair' },
    { query: 'fridge engineer', expectedSlug: 'ac-technician' },
    { query: 'fridge repairer', expectedSlug: 'ac-technician' },
    { query: 'POS agent', expectedSlug: 'phone-repair' },
    { query: 'iron bender', expectedSlug: 'welder' },
    { query: 'iron-bender', expectedSlug: 'welder' },
    { query: 'aluminium person', expectedSlug: 'welder' },
    { query: 'aluminium window person', expectedSlug: 'welder' },
    { query: 'barber man', expectedSlug: 'barber' },
    { query: 'hair dresser', expectedSlug: 'nail-technician' },
    { query: 'makeup artist', expectedSlug: 'makeup-artist' },
    { query: 'gele tier', expectedSlug: 'makeup-artist' },
    { query: 'car painter', expectedSlug: 'mechanic' }
  ];

  nigerianVariants.forEach(v => {
    runTest(`Nigerian variant "${v.query}" resolves canonical slug "${v.expectedSlug}"`, () => {
      const intent = NigeriaSearchLanguage.resolveTradeIntent(v.query);
      assert.ok(intent, `Intent should be found for ${v.query}`);
      assert.strictEqual(intent.canonicalSlug, v.expectedSlug);
    });
  });

  // --- GROUP 3: PIDGIN & INFORMAL QUERY PARSING ---
  console.log('\n--- TEST GROUP 3: PIDGIN & INFORMAL QUERY PARSING ---');

  runTest('Parse "plumber wey dey close to me"', () => {
    const res = NigeriaSearchLanguage.parseNigerianQuery('plumber wey dey close to me');
    assert.strictEqual(res.isNearMe, true, 'Proximity intent should be true');
    assert.strictEqual(res.cleanQuery, 'plumber');
    assert.ok(res.serviceIntent && res.serviceIntent.canonicalSlug === 'plumber');
  });

  runTest('Parse "electrician wey dey around here"', () => {
    const res = NigeriaSearchLanguage.parseNigerianQuery('electrician wey dey around here');
    assert.strictEqual(res.isNearMe, true, 'Proximity intent should be true');
    assert.strictEqual(res.cleanQuery, 'electrician');
    assert.ok(res.serviceIntent && res.serviceIntent.canonicalSlug === 'electrician');
  });

  runTest('Parse "person wey fit fix my generator"', () => {
    const res = NigeriaSearchLanguage.parseNigerianQuery('person wey fit fix my generator');
    assert.strictEqual(res.cleanQuery, 'generator');
    assert.ok(res.serviceIntent && res.serviceIntent.canonicalSlug === 'electrician');
  });

  runTest('Parse "generator person near me"', () => {
    const res = NigeriaSearchLanguage.parseNigerianQuery('generator person near me');
    assert.strictEqual(res.isNearMe, true);
    assert.ok(res.serviceIntent && res.serviceIntent.canonicalSlug === 'electrician');
  });

  runTest('Parse "welder wey dey nearby"', () => {
    const res = NigeriaSearchLanguage.parseNigerianQuery('welder wey dey nearby');
    assert.strictEqual(res.isNearMe, true);
    assert.strictEqual(res.cleanQuery, 'welder');
    assert.ok(res.serviceIntent && res.serviceIntent.canonicalSlug === 'welder');
  });

  runTest('Parse "who fit repair my AC"', () => {
    const res = NigeriaSearchLanguage.parseNigerianQuery('who fit repair my AC');
    assert.strictEqual(res.cleanQuery, 'ac');
    assert.ok(res.serviceIntent && res.serviceIntent.canonicalSlug === 'ac-technician');
  });

  runTest('Parse "I need person for fridge repair"', () => {
    const res = NigeriaSearchLanguage.parseNigerianQuery('I need person for fridge repair');
    assert.strictEqual(res.cleanQuery, 'fridge');
    assert.ok(res.serviceIntent && res.serviceIntent.canonicalSlug === 'ac-technician');
  });

  // --- GROUP 4: LOCATION + SERVICE COMPOSITION ---
  console.log('\n--- TEST GROUP 4: LOCATION + SERVICE COMPOSITION ---');

  runTest('Compose "plumber in Awka"', () => {
    const res = NigeriaSearchLanguage.parseNigerianQuery('plumber in Awka');
    assert.strictEqual(res.cleanQuery, 'plumber');
    assert.strictEqual(res.extractedLocation, 'Awka');
    assert.ok(res.locationHierarchy, 'Location hierarchy should be resolved');
    assert.strictEqual(res.locationHierarchy.state, 'Anambra');
    assert.ok(res.serviceIntent && res.serviceIntent.canonicalSlug === 'plumber');
  });

  runTest('Compose "generator mechanic in Onitsha"', () => {
    const res = NigeriaSearchLanguage.parseNigerianQuery('generator mechanic in Onitsha');
    assert.strictEqual(res.extractedLocation, 'Onitsha');
    assert.ok(res.locationHierarchy, 'Location hierarchy should be resolved');
    assert.strictEqual(res.locationHierarchy.state, 'Anambra');
    assert.ok(res.serviceIntent && res.serviceIntent.canonicalSlug === 'electrician');
  });

  runTest('Compose "tailor around Aba"', () => {
    const res = NigeriaSearchLanguage.parseNigerianQuery('tailor around Aba');
    assert.strictEqual(res.extractedLocation, 'Aba');
    assert.ok(res.locationHierarchy, 'Location hierarchy should be resolved');
    assert.strictEqual(res.locationHierarchy.state, 'Abia');
    assert.ok(res.serviceIntent && res.serviceIntent.canonicalSlug === 'tailor');
  });

  runTest('Compose "panel beater near me"', () => {
    const res = NigeriaSearchLanguage.parseNigerianQuery('panel beater near me');
    assert.strictEqual(res.isNearMe, true);
    assert.ok(res.serviceIntent && res.serviceIntent.canonicalSlug === 'mechanic');
  });

  runTest('Compose "electrician wey dey close to me"', () => {
    const res = NigeriaSearchLanguage.parseNigerianQuery('electrician wey dey close to me');
    assert.strictEqual(res.isNearMe, true);
    assert.ok(res.serviceIntent && res.serviceIntent.canonicalSlug === 'electrician');
  });

  runTest('Compose "fashion designer in Ikeja"', () => {
    const res = NigeriaSearchLanguage.parseNigerianQuery('fashion designer in Ikeja');
    assert.strictEqual(res.extractedLocation, 'Ikeja');
    assert.strictEqual(res.locationHierarchy.state, 'Lagos');
    assert.strictEqual(res.locationHierarchy.lga, 'Ikeja');
    assert.ok(res.serviceIntent && res.serviceIntent.canonicalSlug === 'tailor');
  });

  // --- GROUP 5: FALSE-POSITIVE PROTECTION ---
  console.log('\n--- TEST GROUP 5: FALSE-POSITIVE PROTECTION ---');

  const ambiguousStandalone = ['engineer', 'designer', 'person', 'repair'];

  ambiguousStandalone.forEach(w => {
    runTest(`Ambiguous standalone "${w}" does not force a single trade intent`, () => {
      const intent = NigeriaSearchLanguage.resolveTradeIntent(w);
      assert.strictEqual(intent, null, `"${w}" standalone should remain null to allow broad multi-field search`);
    });
  });

  runTest('Standalone "mechanic" resolves to Auto Mechanic', () => {
    const intent = NigeriaSearchLanguage.resolveTradeIntent('mechanic');
    assert.ok(intent);
    assert.strictEqual(intent.canonicalSlug, 'mechanic');
  });

  runTest('Contextual combination "phone engineer" maps specifically to phone-repair', () => {
    const intent = NigeriaSearchLanguage.resolveTradeIntent('phone engineer');
    assert.ok(intent);
    assert.strictEqual(intent.canonicalSlug, 'phone-repair');
  });

  runTest('Contextual combination "fashion designer" maps specifically to tailor', () => {
    const intent = NigeriaSearchLanguage.resolveTradeIntent('fashion designer');
    assert.ok(intent);
    assert.strictEqual(intent.canonicalSlug, 'tailor');
  });

  runTest('Contextual combination "generator mechanic" maps specifically to electrician', () => {
    const intent = NigeriaSearchLanguage.resolveTradeIntent('generator mechanic');
    assert.ok(intent);
    assert.strictEqual(intent.canonicalSlug, 'electrician');
  });

  // --- GROUP 6: MARKETPLACE DISCOVERY & SCORING INTEGRATION ---
  console.log('\n--- TEST GROUP 6: MARKETPLACE DISCOVERY & SCORING INTEGRATION ---');

  await runAsyncTest('LokatorDB.getProviders finds providers for "drycleaner"', async () => {
    const res = await LokatorDB.getProviders({ query: 'drycleaner' });
    assert.ok(res && Array.isArray(res.data), 'Returns data array');
    assert.ok(res.data.length > 0, 'Should find at least 1 laundry / dry cleaning provider');
    assert.ok(res.data.some(p => p.slug === 'laundry' || (p.skills && p.skills.some(s => /dry clean|laundry/i.test(s)))));
  });

  await runAsyncTest('LokatorDB.getProviders finds providers for "fashion designer"', async () => {
    const res = await LokatorDB.getProviders({ query: 'fashion designer' });
    assert.ok(res && Array.isArray(res.data), 'Returns data array');
    assert.ok(res.data.length > 0, 'Should find tailor / fashion designer');
    assert.ok(res.data.some(p => p.slug === 'tailor' || p.trade.toLowerCase().includes('tailor') || p.trade.toLowerCase().includes('fashion')));
  });

  await runAsyncTest('LokatorDB.getProviders finds providers for "generator mechanic"', async () => {
    const res = await LokatorDB.getProviders({ query: 'generator mechanic' });
    assert.ok(res && Array.isArray(res.data), 'Returns data array');
    assert.ok(res.data.length > 0, 'Should find generator repair / electrician');
  });

  await runAsyncTest('LokatorDB.getProviders finds providers for "plumber wey dey close to me"', async () => {
    const res = await LokatorDB.getProviders({ query: 'plumber wey dey close to me' });
    assert.ok(res && Array.isArray(res.data), 'Returns data array');
    assert.ok(res.data.length > 0, 'Should find plumbers');
    assert.ok(res.data.every(p => p.slug === 'plumber' || p.trade.toLowerCase().includes('plumber')));
  });

  // --- GROUP 7: PWA SHELL & SCRIPT TAG INTEGRITY ---
  console.log('\n--- TEST GROUP 7: PWA SHELL & SCRIPT TAG INTEGRITY ---');

  const swContent = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
  runTest('sw.js includes /search-language.js in SHELL_ASSETS', () => {
    assert.ok(swContent.includes("'/search-language.js'"), 'sw.js must pre-cache /search-language.js');
  });

  const htmlFiles = ['index.html', 'search.html', 'register.html', 'profile.html', 'dashboard.html', 'login.html'];
  htmlFiles.forEach(hf => {
    const htmlContent = fs.readFileSync(path.join(__dirname, '..', hf), 'utf8');
    runTest(`${hf} includes <script src="search-language.js"></script>`, () => {
      assert.ok(htmlContent.includes('search-language.js'), `${hf} must include search-language.js script tag`);
    });
  });

  console.log('\n' + '='.repeat(80));
  console.log(`VERIFICATION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED`);
  console.log('='.repeat(80) + '\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runPhase10_12CVerification().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
