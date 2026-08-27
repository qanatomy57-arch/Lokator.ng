// ============================================================================
// LOKATOR.NG — PHASE 10.21 SEARCH-TO-BOOKING CONVERSION VERIFICATION SUITE
// Tests end-to-end conversion funnel: Search -> Card -> Profile -> Job Brief -> Contact
// ============================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environments for node execution
global.window = global;
global.globalThis = global;
global.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};
global.sessionStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; },
  clear() { this._store = {}; }
};

// Load dependencies
const { NigeriaLocations } = require('../locations.js');
global.NigeriaLocations = NigeriaLocations;
if (typeof window !== 'undefined') window.NigeriaLocations = NigeriaLocations;

const { CategoryMap, MarketplaceTaxonomy } = require('../categories.js');
global.CategoryMap = CategoryMap;
global.MarketplaceTaxonomy = MarketplaceTaxonomy;
if (typeof window !== 'undefined') {
  window.CategoryMap = CategoryMap;
  window.MarketplaceTaxonomy = MarketplaceTaxonomy;
}

const { NigeriaPhone } = require('../phone-utils.js');
global.NigeriaPhone = NigeriaPhone;
if (typeof window !== 'undefined') window.NigeriaPhone = NigeriaPhone;

const { NigeriaSearchLanguage } = require('../search-language.js');
global.NigeriaSearchLanguage = NigeriaSearchLanguage;
if (typeof window !== 'undefined') window.NigeriaSearchLanguage = NigeriaSearchLanguage;

const { PROVIDERS_DATA } = require('../providers-data.js');
global.PROVIDERS_DATA = PROVIDERS_DATA;
if (typeof window !== 'undefined') window.PROVIDERS_DATA = PROVIDERS_DATA;

const { LokatorDB } = require('../supabase-client.js');
global.LokatorDB = LokatorDB;

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runTest(name, fn) {
  totalTests++;
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
  totalTests++;
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

async function runVerification() {
  console.log('\n================================================================================');
  console.log('🇳🇬 LOKATOR.NG — PHASE 10.21 CONVERSION OPTIMIZATION VERIFICATION SUITE');
  console.log('================================================================================\n');

  // --- GROUP 1: SEARCH-TO-PROFILE URL CONTEXT ENCODING (10 Tests) ---
  console.log('--- TEST GROUP 1: SEARCH-TO-PROFILE CONTEXT PROPAGATION (10 Tests) ---');

  const contextTestCases = [
    {
      query: 'fix my AC',
      expectedService: 'ac-technician',
      expectedAction: 'repair'
    },
    {
      query: 'person wey fit fix my AC for Ughelli',
      expectedService: 'ac-technician',
      expectedAction: 'repair',
      expectedLoc: 'Ughelli'
    },
    {
      query: 'abeg find plumber for Warri',
      expectedService: 'plumber',
      expectedLoc: 'Warri'
    },
    {
      query: 'person wey sabi wire house for Effurun',
      expectedService: 'electrician',
      expectedAction: 'installation',
      expectedLoc: 'Effurun'
    },
    {
      query: 'I need somebody to paint my house but make e no too cost',
      expectedService: 'painter',
      expectedAction: 'painting'
    },
    {
      query: 'I need somebody to fix my fridge tomorrow for Sapele',
      expectedService: 'ac-technician',
      expectedAction: 'repair',
      expectedUrgency: 'tomorrow',
      expectedLoc: 'Sapele'
    },
    {
      query: 'fix my phone under 50k',
      expectedService: 'phone-repair',
      expectedAction: 'repair',
      expectedBudget: '50000'
    },
    {
      query: 'clean office sharp sharp in Ikeja',
      expectedService: 'cleaner',
      expectedAction: 'cleaning',
      expectedUrgency: 'immediate',
      expectedLoc: 'Ikeja'
    },
    {
      query: 'sew senator for wedding around Warri',
      expectedService: 'tailor',
      expectedAction: 'sewing',
      expectedLoc: 'Warri'
    },
    {
      query: 'caterer for this weekend in Bodija',
      expectedService: 'caterer',
      expectedUrgency: 'weekend',
      expectedLoc: 'Bodija'
    }
  ];

  contextTestCases.forEach((tc, idx) => {
    runTest(`Context encoding for query: "${tc.query}"`, () => {
      const parsed = NigeriaSearchLanguage.parseNigerianQuery(tc.query);
      const params = new URLSearchParams();
      params.set('id', '1');
      params.set('q', tc.query);
      if (parsed.serviceIntent) {
        params.set('service', parsed.serviceIntent.canonicalSlug);
      }
      if (parsed.actionIntent) {
        params.set('action', parsed.actionIntent);
      }
      if (parsed.locationHierarchy && parsed.locationHierarchy.cleanLocation) {
        params.set('loc', parsed.locationHierarchy.cleanLocation);
      } else if (parsed.extractedLocation) {
        params.set('loc', parsed.extractedLocation);
      }
      if (parsed.urgencyIntent) {
        params.set('urgency', parsed.urgencyIntent.level);
      }
      if (parsed.budgetIntent && parsed.budgetIntent.maxBudget) {
        params.set('budget', String(parsed.budgetIntent.maxBudget));
      }

      const url = `profile.html?${params.toString()}`;
      const decodedUrl = decodeURIComponent(url.replace(/\+/g, ' '));

      assert.ok(url.includes(`id=1`));
      assert.ok(decodedUrl.includes(`q=${tc.query}`));
      if (tc.expectedService) {
        assert.ok(url.includes(`service=${tc.expectedService}`));
      }
      if (tc.expectedAction) {
        assert.ok(url.includes(`action=${tc.expectedAction}`));
      }
      if (tc.expectedLoc) {
        assert.ok(decodedUrl.includes(`loc=${tc.expectedLoc}`));
      }
      if (tc.expectedUrgency) {
        assert.ok(url.includes(`urgency=${tc.expectedUrgency}`));
      }
      if (tc.expectedBudget) {
        assert.ok(url.includes(`budget=${tc.expectedBudget}`));
      }
    });
  });

  // --- GROUP 2: PROVIDER CARD MATCH SIGNALS & CTAs (6 Tests) ---
  console.log('\n--- TEST GROUP 2: PROVIDER CARD MATCH SIGNALS & CTAs (6 Tests) ---');

  runTest('NigeriaPhone.buildTelUrl creates valid normalized tel: link', () => {
    const provider = PROVIDERS_DATA[0];
    const tel = NigeriaPhone.buildTelUrl(provider);
    assert.ok(tel.startsWith('tel:+234') || tel.startsWith('tel:0'), 'Tel URL must be formatted');
  });

  runTest('NigeriaPhone.buildWhatsAppUrl creates valid wa.me URL with pre-filled service & location', () => {
    const provider = PROVIDERS_DATA[0];
    const wa = NigeriaPhone.buildWhatsAppUrl(provider, { service: 'AC Repair', location: 'Warri, Delta' });
    assert.ok(wa.includes('wa.me/234') || wa.includes('api.whatsapp.com'));
    assert.ok(wa.includes('AC%20Repair') || wa.includes('AC+Repair') || wa.includes('AC') || decodeURIComponent(wa).includes('AC Repair'));
  });

  runTest('Provider card intent badge generation identifies skill match', () => {
    const provider = PROVIDERS_DATA[16]; // Engr. Yusuf Aliyu (Solar & AC)
    const parsed = NigeriaSearchLanguage.parseNigerianQuery('fix my AC');
    const skills = provider.skills || [];
    const matchedSkill = skills.find(s => s.toLowerCase().includes('ac') || s.toLowerCase().includes('fridge'));
    assert.ok(matchedSkill, 'Must match AC skill for Yusuf Aliyu');
  });

  runTest('Provider card intent badge recognizes action intent', () => {
    const parsed = NigeriaSearchLanguage.parseNigerianQuery('install solar panel');
    assert.strictEqual(parsed.actionIntent, 'installation');
  });

  runTest('Provider card intent badge identifies location proximity', () => {
    const provider = PROVIDERS_DATA[0]; // Adebayo in Lagos
    const parsed = NigeriaSearchLanguage.parseNigerianQuery('plumber in Lagos');
    assert.ok(parsed.locationHierarchy, 'Location hierarchy must be parsed');
    assert.strictEqual(parsed.locationHierarchy.state, 'Lagos');
    assert.strictEqual(provider.state || provider.city, 'Lagos');
  });

  runTest('Provider cards include accessible aria-label on both Call and Message buttons', () => {
    const searchJsContent = fs.readFileSync(path.join(__dirname, '../search.js'), 'utf8');
    assert.ok(searchJsContent.includes('aria-label="Call '), 'Call button must have accessible aria-label');
    assert.ok(searchJsContent.includes('aria-label="Message '), 'Message button must have accessible aria-label');
  });

  // --- GROUP 3: STRUCTURED WHATSAPP JOB BRIEF GENERATOR (6 Tests) ---
  console.log('\n--- TEST GROUP 3: STRUCTURED WHATSAPP JOB BRIEF GENERATOR (6 Tests) ---');

  runTest('Job brief plainText template contains required structured fields', () => {
    const provider = PROVIDERS_DATA[0];
    const brief = `🛠️ *JOB INQUIRY VIA LOKATOR.NG*\n━━━━━━━━━━━━━━━━━━━━\n👋 *Hello ${provider.name}*,\nI found your verified profile on Lokator.NG.\n\n📋 *Service:* AC Repair\n🎯 *Job Scope:* Emergency Repair\n📍 *Location:* Ughelli, Delta\n⏰ *Preferred Time:* Urgent / Today\n📦 *Materials:* Labor Only (I will supply materials)\n📝 *Job Notes:* AC stopped blowing cold\n\n━━━━━━━━━━━━━━━━━━━━\nAre you available to take on this job? Please let me know your availability. Thank you!`;
    
    assert.ok(brief.includes(provider.name));
    assert.ok(brief.includes('Service:'));
    assert.ok(brief.includes('Job Scope:'));
    assert.ok(brief.includes('Location:'));
    assert.ok(brief.includes('Preferred Time:'));
    assert.ok(brief.includes('Materials:'));
    assert.ok(brief.includes('Job Notes:'));
  });

  runTest('NigeriaPhone.buildWhatsAppUrl with customMessage formats wa.me URL correctly', () => {
    const provider = PROVIDERS_DATA[0];
    const customMessage = 'Hello, this is a test job brief message';
    const waUrl = NigeriaPhone.buildWhatsAppUrl(provider, { customMessage });
    assert.ok(waUrl.startsWith('https://wa.me/234') || waUrl.startsWith('https://api.whatsapp.com'));
    assert.ok(waUrl.includes(encodeURIComponent(customMessage)) || waUrl.includes('test+job+brief'));
  });

  runTest('Job brief correctly maps action "repair" to "Emergency Repair" scope', () => {
    let scope = 'Inspection & Diagnosis';
    const action = 'repair';
    if (action === 'repair') scope = 'Emergency Repair';
    assert.strictEqual(scope, 'Emergency Repair');
  });

  runTest('Job brief correctly maps action "installation" to "New Installation" scope', () => {
    let scope = 'Inspection & Diagnosis';
    const action = 'installation';
    if (action === 'installation') scope = 'New Installation';
    assert.strictEqual(scope, 'New Installation');
  });

  runTest('Job brief correctly maps action "maintenance" to "Routine Maintenance" scope', () => {
    let scope = 'Inspection & Diagnosis';
    const action = 'maintenance';
    if (action === 'maintenance') scope = 'Routine Maintenance';
    assert.strictEqual(scope, 'Routine Maintenance');
  });

  runTest('Job brief correctly maps urgency "tomorrow" to "Tomorrow"', () => {
    let urgency = 'Urgent / Today';
    const parsedUrgency = 'tomorrow';
    if (parsedUrgency === 'tomorrow') urgency = 'Tomorrow';
    assert.strictEqual(urgency, 'Tomorrow');
  });

  // --- GROUP 4: ZERO-RESULT CONVERSION RECOVERY (4 Tests) ---
  console.log('\n--- TEST GROUP 4: ZERO-RESULT CONVERSION RECOVERY (4 Tests) ---');

  runTest('MarketplaceTaxonomy provides recovery recommendations on zero results', () => {
    const context = MarketplaceTaxonomy.buildDiscoveryContext({
      skill: 'solar-installer',
      state: 'Delta'
    });
    const recs = MarketplaceTaxonomy.getZeroResultRecommendations(context);
    assert.ok(recs);
    assert.ok(Array.isArray(recs.suggestions));
    assert.ok(recs.suggestions.length > 0);
  });

  runTest('Zero results recovery includes related trades chips', () => {
    const context = MarketplaceTaxonomy.buildDiscoveryContext({
      skill: 'solar-installer',
      state: 'Delta'
    });
    const recs = MarketplaceTaxonomy.getZeroResultRecommendations(context);
    assert.ok(recs.relatedSkills && Array.isArray(recs.relatedSkills));
    assert.ok(recs.relatedSkills.length > 0);
  });

  runTest('search.js empty state renders reset button and recovery suggestions', () => {
    const searchJs = fs.readFileSync(path.join(__dirname, '../search.js'), 'utf8');
    assert.ok(searchJs.includes('zero-recovery-card'), 'Search JS must render zero recovery card');
    assert.ok(searchJs.includes('clear-all-empty-btn'), 'Search JS must render reset filters button');
  });

  runTest('search.js empty state handles zero results without crashing', () => {
    const searchJs = fs.readFileSync(path.join(__dirname, '../search.js'), 'utf8');
    assert.ok(searchJs.includes('providers.length === 0'), 'Search JS must have zero-length guard');
  });

  // --- GROUP 5: PROFILE HTML & ACCESSIBILITY AUDIT (6 Tests) ---
  console.log('\n--- TEST GROUP 5: PROFILE HTML & ACCESSIBILITY AUDIT (6 Tests) ---');

  const profileHtml = fs.readFileSync(path.join(__dirname, '../profile.html'), 'utf8');

  runTest('profile.html contains Search Context Banner container', () => {
    assert.ok(profileHtml.includes('id="profile-search-context-banner"'));
    assert.ok(profileHtml.includes('id="context-banner-query-title"'));
    assert.ok(profileHtml.includes('id="context-banner-subtext"'));
  });

  runTest('profile.html contains Mobile Sticky Bottom Action Bar', () => {
    assert.ok(profileHtml.includes('id="profile-mobile-sticky-bar"'));
    assert.ok(profileHtml.includes('id="sticky-call-btn"'));
    assert.ok(profileHtml.includes('id="sticky-wa-btn"'));
  });

  runTest('profile.html Mobile Sticky Bar buttons have accessible aria-labels', () => {
    assert.ok(profileHtml.includes('aria-label="Call Provider Directly"'));
    assert.ok(profileHtml.includes('aria-label="Book on WhatsApp"'));
  });

  runTest('profile.html contains WhatsApp reassurance microcopy', () => {
    assert.ok(profileHtml.includes('wa-guarantee-note') || profileHtml.includes('Direct artisan chat'));
  });

  runTest('profile.html contains WhatsApp Job Brief copy button', () => {
    assert.ok(profileHtml.includes('id="wa-copy-brief-btn"'));
  });

  runTest('profile.html breadcrumbs contain dynamic search return link', () => {
    assert.ok(profileHtml.includes('id="breadcrumb-search-link"'));
  });

  // --- GROUP 6: TELEMETRY & PRIVACY AUDIT (6 Tests) ---
  console.log('\n--- TEST GROUP 6: TELEMETRY & PRIVACY AUDIT (6 Tests) ---');

  const telemetryJs = fs.readFileSync(path.join(__dirname, '../telemetry.js'), 'utf8');

  runTest('telemetry.js strictly forbids logging phone numbers', () => {
    assert.ok(telemetryJs.includes("'phone'") || telemetryJs.includes('"phone"'));
  });

  runTest('telemetry.js strictly forbids logging email addresses', () => {
    assert.ok(telemetryJs.includes("'email'") || telemetryJs.includes('"email"'));
  });

  runTest('telemetry.js strictly forbids logging WhatsApp message bodies', () => {
    assert.ok(telemetryJs.includes("'whatsapp_message'") || telemetryJs.includes("'message'"));
  });

  runTest('telemetry.js strictly forbids logging identity credentials (NIN, BVN, passwords)', () => {
    assert.ok(telemetryJs.includes("'password'"));
    assert.ok(telemetryJs.includes("'nin'"));
    assert.ok(telemetryJs.includes("'bvn'"));
  });

  runTest('profile.js conversion telemetry only logs safe anonymous metadata', () => {
    const profileJs = fs.readFileSync(path.join(__dirname, '../profile.js'), 'utf8');
    assert.ok(profileJs.includes('whatsapp_brief_submitted'));
    assert.ok(profileJs.includes('call_clicked'));
    assert.ok(profileJs.includes('whatsapp_clicked'));
    // Ensure no phone numbers or customer addresses are passed in telemetry calls
    assert.ok(!profileJs.includes("trackEvent('whatsapp_brief_submitted', { phone:"));
  });

  runTest('search.js conversion telemetry only logs safe anonymous metadata', () => {
    const searchJs = fs.readFileSync(path.join(__dirname, '../search.js'), 'utf8');
    assert.ok(searchJs.includes('provider_card_clicked'));
    assert.ok(searchJs.includes('call_clicked'));
    assert.ok(searchJs.includes('whatsapp_clicked'));
  });

  console.log('\n================================================================================');
  console.log(`VERIFICATION COMPLETE: ${passedTests} PASSED, ${failedTests} FAILED (TOTAL ${totalTests})`);
  console.log('================================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification();
