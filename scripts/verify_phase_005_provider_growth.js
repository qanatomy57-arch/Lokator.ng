/**
 * PadiFix Phase 005 — Provider Growth, Trust & Marketplace Liquidity Engine Test Suite
 * File: scripts/verify_phase_005_provider_growth.js
 * 
 * Verifies:
 * 1. Provider Acquisition Funnel & Onboarding Experience
 * 2. Zero-Result Search & Contextual Provider Recruitment CTA
 * 3. Honest Analytics MVP & Non-Fabricated Metrics
 * 4. Deterministic Profile Completeness Engine
 * 5. Trust Architecture & 4 Standardized Verification States
 * 6. Profile Shareability & Telemetry Integration
 * 7. Multi-Skill Matching & Canonical Category Integrity
 * 8. Geographic Liquidity & Density Model
 * 9. Security, RLS & Provider Ownership Guard
 * 10. Zero-PII Telemetry & PWA Shell Integration
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

async function main() {
  console.log('================================================================');
  console.log('PADIFIX PHASE 005 — PROVIDER GROWTH, TRUST & LIQUIDITY SUITE');
  console.log('================================================================\n');

  // Load modules
  const monetizationConfigPath = path.join(ROOT_DIR, 'monetization-config.js');
  const PadiFixMonetization = require(monetizationConfigPath);
  const providersDataPath = path.join(ROOT_DIR, 'providers-data.js');
  const { DEFAULT_PROVIDERS_DATA } = require(providersDataPath);

  // SECTION 1: PROVIDER ONBOARDING & FUNNEL INTEGRITY
  console.log('--- SECTION 1: PROVIDER ONBOARDING & FUNNEL INTEGRITY ---');

  runTest('1.1 register.html contains multi-step onboarding wizard with all 5 steps', () => {
    const regHtml = fs.readFileSync(path.join(ROOT_DIR, 'register.html'), 'utf8');
    assert(regHtml.includes('id="step-pane-1"'), 'Step 1 pane must exist');
    assert(regHtml.includes('id="step-pane-2"'), 'Step 2 pane must exist');
    assert(regHtml.includes('id="step-pane-3"'), 'Step 3 pane must exist');
    assert(regHtml.includes('id="step-pane-4"'), 'Step 4 pane must exist');
    assert(regHtml.includes('id="step-pane-5"'), 'Step 5 pane must exist');
  });

  runTest('1.2 Step 1 requires essential direct contact fields (fname, lname, phone WhatsApp)', () => {
    const regHtml = fs.readFileSync(path.join(ROOT_DIR, 'register.html'), 'utf8');
    assert(regHtml.includes('id="fname"'), 'First name input must exist');
    assert(regHtml.includes('id="lname"'), 'Last name input must exist');
    assert(regHtml.includes('id="phone"'), 'Phone input must exist');
    assert(regHtml.includes('🇳🇬 +234'), 'Nigerian phone prefix badge must be present');
  });

  runTest('1.3 Step 5 preview card enforces honest unverified badge without claiming false verification', () => {
    const regHtml = fs.readFileSync(path.join(ROOT_DIR, 'register.html'), 'utf8');
    assert(regHtml.includes('id="prev-badge"'), 'Preview badge element must exist');
    assert(regHtml.includes('Self-Reported Profile'), 'Step 5 preview card must honestly display Self-Reported Profile');
    assert(!regHtml.includes('>✓ Verified Pro</span>'), 'Step 5 preview card must not claim Verified Pro for unvetted registrants');
  });

  runTest('1.4 Step 5 preview card displays honest New Listing review status', () => {
    const regHtml = fs.readFileSync(path.join(ROOT_DIR, 'register.html'), 'utf8');
    assert(regHtml.includes('id="prev-rating"'), 'Preview rating element must exist');
    assert(regHtml.includes('New Listing (0 reviews)'), 'Preview card must honestly display New Listing without fabricated stars');
  });

  runTest('1.5 Onboarding emits provider_join_started and provider_registration_completed telemetry events', () => {
    const regHtml = fs.readFileSync(path.join(ROOT_DIR, 'register.html'), 'utf8');
    assert(regHtml.includes("trackEvent('provider_join_started'"), 'Must track provider_join_started');
    assert(regHtml.includes("trackEvent('provider_registration_completed'"), 'Must track provider_registration_completed');
  });

  // SECTION 2: ZERO-RESULT SEARCH & CONTEXTUAL PROVIDER RECRUITMENT CTA
  console.log('\n--- SECTION 2: ZERO-RESULT SEARCH & CONTEXTUAL PROVIDER RECRUITMENT ---');

  runTest('2.1 search.js implements contextual provider recruitment CTA when 0 results found', () => {
    const searchJs = fs.readFileSync(path.join(ROOT_DIR, 'search.js'), 'utf8');
    assert(searchJs.includes('search-recruitment-box'), 'search.js must render search-recruitment-box');
    assert(searchJs.includes('zero-state-recruitment-cta'), 'search.js must render zero-state-recruitment-cta button');
    assert(searchJs.includes('providerRecruitmentCtaEnabled'), 'search.js must gate recruitment CTA with feature flag');
  });

  runTest('2.2 Recruitment CTA constructs targeted URL with category, state, lga, and search_zero_results attribution', () => {
    const searchJs = fs.readFileSync(path.join(ROOT_DIR, 'search.js'), 'utf8');
    assert(searchJs.includes("joinParams.set('source', 'search_zero_results')"), 'Must attribute recruitment click to search_zero_results');
    assert(searchJs.includes('join.html?'), 'Must route to join.html with preserved parameters');
  });

  runTest('2.3 Recruitment CTA tracks provider_recruitment_cta_clicked telemetry', () => {
    const searchJs = fs.readFileSync(path.join(ROOT_DIR, 'search.js'), 'utf8');
    assert(searchJs.includes("trackEvent('provider_recruitment_cta_clicked'"), 'Must track provider_recruitment_cta_clicked');
  });

  runTest('2.4 search.css defines responsive styles for recruitment box with touch target >= 44px', () => {
    const searchCss = fs.readFileSync(path.join(ROOT_DIR, 'search.css'), 'utf8');
    assert(searchCss.includes('.search-recruitment-box'), 'search.css must contain .search-recruitment-box');
    assert(searchCss.includes('.search-recruitment-btn'), 'search.css must contain .search-recruitment-btn');
    assert(searchCss.includes('min-height: 44px'), 'Recruitment button must meet accessible touch target of >= 44px');
  });

  // SECTION 3: HONEST ANALYTICS MVP & METRIC NON-FABRICATION
  console.log('\n--- SECTION 3: HONEST ANALYTICS MVP & METRIC NON-FABRICATION ---');

  runTest('3.1 dashboard.js eliminates fabricated || 24 views and || 8 leads defaults', () => {
    const dashJs = fs.readFileSync(path.join(ROOT_DIR, 'dashboard.js'), 'utf8');
    assert(!dashJs.includes('currentMetrics.profileViewsThisMonth || 24'), 'Must not fallback to fake 24 views');
    assert(!dashJs.includes('currentMetrics.leadsThisMonth || 8'), 'Must not fallback to fake 8 leads');
  });

  runTest('3.2 dashboard.js displays New when provider has 0 reviews instead of fake 4.8 star rating', () => {
    const dashJs = fs.readFileSync(path.join(ROOT_DIR, 'dashboard.js'), 'utf8');
    assert(dashJs.includes("'★ New Listing'"), 'Must display New Listing when 0 reviews exist');
    assert(dashJs.includes('hasReviews && currentMetrics.rating'), 'Must gate rating display on actual reviews count');
  });

  runTest('3.3 getProviderDashboardMetrics calculates real telemetry views and leads without multipliers', () => {
    const clientCode = fs.readFileSync(path.join(ROOT_DIR, 'supabase-client.js'), 'utf8');
    assert(!clientCode.includes('Math.round(completedJobs * 8.4'), 'Must eliminate fake 8.4 views multiplier');
    assert(!clientCode.includes('Math.round(completedJobs * 1.8'), 'Must eliminate fake 1.8 leads multiplier');
    assert(clientCode.includes('realViews'), 'Must compute real telemetry views');
    assert(clientCode.includes('realLeads'), 'Must compute real telemetry leads');
  });

  runTest('3.4 dashboard.html overview includes Profile Completeness & Quality widget', () => {
    const dashHtml = fs.readFileSync(path.join(ROOT_DIR, 'dashboard.html'), 'utf8');
    assert(dashHtml.includes('id="dash-completeness-card"'), 'Completeness card must exist in dashboard overview');
    assert(dashHtml.includes('id="dash-completeness-badge"'), 'Completeness badge must exist in dashboard overview');
    assert(dashHtml.includes('id="dash-missing-items-grid"'), 'Missing items grid must exist in dashboard overview');
  });

  runTest('3.5 dashboard.js emits provider_analytics_viewed telemetry event', () => {
    const dashJs = fs.readFileSync(path.join(ROOT_DIR, 'dashboard.js'), 'utf8');
    assert(dashJs.includes("trackEvent('provider_analytics_viewed'"), 'Must track provider_analytics_viewed');
  });

  // SECTION 4: DETERMINISTIC PROFILE COMPLETENESS ENGINE
  console.log('\n--- SECTION 4: DETERMINISTIC PROFILE COMPLETENESS ENGINE ---');

  runTest('4.1 PadiFixMonetization exports calculateProfileCompleteness and PROFILE_COMPLETENESS_WEIGHTS', () => {
    assert(typeof PadiFixMonetization.calculateProfileCompleteness === 'function', 'calculateProfileCompleteness must be a function');
    assert(typeof PadiFixMonetization.PROFILE_COMPLETENESS_WEIGHTS === 'object', 'PROFILE_COMPLETENESS_WEIGHTS must be an object');
  });

  runTest('4.2 Profile completeness weights sum exactly to 100 points', () => {
    const weights = PadiFixMonetization.PROFILE_COMPLETENESS_WEIGHTS;
    const total = Object.values(weights).reduce((sum, w) => sum + w, 0);
    assert.strictEqual(total, 100, `Completeness weights must sum to 100 (Got: ${total})`);
  });

  runTest('4.3 Empty profile evaluates to 0% with all 8 missing actionable items', () => {
    const result = PadiFixMonetization.calculateProfileCompleteness({});
    assert.strictEqual(result.score, 0, 'Empty profile score must be 0');
    assert.strictEqual(result.percentage, '0%', 'Empty profile percentage must be 0%');
    assert.strictEqual(result.isComplete, false, 'Empty profile must not be marked complete');
    assert.strictEqual(result.missingItems.length, 8, 'Empty profile must identify 8 missing items');
  });

  runTest('4.4 Fully filled seed profile evaluates to >= 90% and isComplete === true', () => {
    const seed = DEFAULT_PROVIDERS_DATA[0];
    const result = PadiFixMonetization.calculateProfileCompleteness(seed);
    assert(result.score >= 90, `Seed provider 1 score must be >= 90 (Got: ${result.score})`);
    assert.strictEqual(result.isComplete, true, 'Seed provider 1 must be marked complete');
  });

  // SECTION 5: TRUST ARCHITECTURE & VERIFICATION STATES
  console.log('\n--- SECTION 5: TRUST ARCHITECTURE & VERIFICATION STATES ---');

  runTest('5.1 PadiFixMonetization defines authoritative 5-state verification lifecycle', () => {
    const states = PadiFixMonetization.VERIFICATION_STATES;
    assert.strictEqual(states.UNVERIFIED, 'Self-Reported Profile');
    assert.strictEqual(states.AVAILABLE, 'Verification Available');
    assert.strictEqual(states.PENDING, 'Pending Compliance Review');
    assert.strictEqual(states.VERIFIED_PLATFORM, 'Platform Reviewed');
    assert.strictEqual(states.VERIFIED_NIN, 'National NIN Verified');
  });

  runTest('5.2 profile.js renders honest trust pills based on verified status without fabrication', () => {
    const profileJs = fs.readFileSync(path.join(ROOT_DIR, 'profile.js'), 'utf8');
    assert(profileJs.includes('National NIN Verified'), 'Must support National NIN Verified');
    assert(profileJs.includes('Platform Reviewed'), 'Must support Platform Reviewed');
    assert(profileJs.includes('Pending Verification'), 'Must support Pending Verification');
    assert(profileJs.includes('Self-Reported Profile'), 'Must support Self-Reported Profile fallback');
  });

  // SECTION 6: PROFILE SHAREABILITY & TELEMETRY
  console.log('\n--- SECTION 6: PROFILE SHAREABILITY & TELEMETRY ---');

  runTest('6.1 profile.js share button tracks provider_share_clicked with channel metadata', () => {
    const profileJs = fs.readFileSync(path.join(ROOT_DIR, 'profile.js'), 'utf8');
    assert(profileJs.includes("trackEvent('provider_share_clicked'"), 'Must track provider_share_clicked on profile');
    assert(profileJs.includes('share-copied-toast'), 'Must render non-blocking toast feedback on copy');
  });

  runTest('6.2 dashboard.js share actions track provider_share_clicked for copy and WhatsApp channels', () => {
    const dashJs = fs.readFileSync(path.join(ROOT_DIR, 'dashboard.js'), 'utf8');
    assert(dashJs.includes("channel: 'copy_link'"), 'Must track copy_link share channel in dashboard');
    assert(dashJs.includes("channel: 'whatsapp'"), 'Must track whatsapp share channel in dashboard');
  });

  // SECTION 7: MULTI-SKILL MATCHING & CANONICAL TAXONOMY
  console.log('\n--- SECTION 7: MULTI-SKILL MATCHING & CANONICAL TAXONOMY ---');

  runTest('7.1 DEFAULT_PROVIDERS_DATA contains providers with multiple skills in skills array', () => {
    const multiSkillProviders = DEFAULT_PROVIDERS_DATA.filter(p => Array.isArray(p.skills) && p.skills.length > 1);
    assert(multiSkillProviders.length >= 15, `At least 15 providers should have multiple skills (Found: ${multiSkillProviders.length})`);
    
    // Check Adebayo Okafor has Conduit Wiring and Solar Setup
    const p1 = DEFAULT_PROVIDERS_DATA.find(p => p.id === 1);
    assert(p1.skills.includes('Home Conduit Wiring'), 'P1 must have Home Conduit Wiring');
    assert(p1.skills.includes('Inverter & Solar Setup'), 'P1 must have Inverter & Solar Setup');
  });

  runTest('7.2 schema.sql preserves GIN index on providers skills array for fast multi-skill queries', () => {
    const schemaSql = fs.readFileSync(path.join(ROOT_DIR, 'schema.sql'), 'utf8');
    assert(schemaSql.includes('CREATE INDEX IF NOT EXISTS idx_providers_skills_gin ON public.providers USING gin (skills)'), 'GIN index on skills must be preserved');
  });

  // SECTION 8: GEOGRAPHIC LIQUIDITY & CLUSTER DENSITY SAFEGUARDS
  console.log('\n--- SECTION 8: GEOGRAPHIC LIQUIDITY & CLUSTER DENSITY SAFEGUARDS ---');

  runTest('8.1 Seed provider dataset represents 22 verified published providers across priority states', () => {
    assert.strictEqual(DEFAULT_PROVIDERS_DATA.length, 22, `Expected exactly 22 seed providers (Found: ${DEFAULT_PROVIDERS_DATA.length})`);
    const states = new Set(DEFAULT_PROVIDERS_DATA.map(p => p.city));
    assert(states.has('Lagos'), 'Must include Lagos providers');
    assert(states.has('Warri') || states.has('Ughelli'), 'Must include Delta providers');
    assert(states.has('Abuja'), 'Must include Abuja providers');
    assert(states.has('Edo'), 'Must include Edo providers');
  });

  runTest('8.2 Cluster capacity guard protects organic ranking by capping sponsored listings at max 2', () => {
    const capacity = PadiFixMonetization.checkClusterCapacity('Electrician', 'Lagos', 'Surulere', []);
    assert.strictEqual(capacity.maxCapacity, 2, 'Max capacity per cluster must be 2');
    assert.strictEqual(capacity.available, true, 'Slots should be available with 0 active promotions');
  });

  // SECTION 9: SECURITY, RLS & PRIVACY HARDENING
  console.log('\n--- SECTION 9: SECURITY, RLS & PRIVACY HARDENING ---');

  runTest('9.1 PadiFixMonetization sanitizeTelemetryPayload strips sensitive credentials and PII', () => {
    const dirty = {
      providerId: 10,
      category: 'plumber',
      password: 'mypassword123',
      token: 'jwt.token.here',
      nin: '12345678901',
      bvn: '22334455667',
      card: '5061000000000000'
    };
    const clean = PadiFixMonetization.sanitizeTelemetryPayload(dirty);
    assert.strictEqual(clean.providerId, 10, 'providerId must be preserved');
    assert.strictEqual(clean.category, 'plumber', 'category must be preserved');
    assert.strictEqual(clean.password, undefined, 'password must be removed');
    assert.strictEqual(clean.token, undefined, 'token must be removed');
    assert.strictEqual(clean.nin, undefined, 'nin must be removed');
    assert.strictEqual(clean.bvn, undefined, 'bvn must be removed');
    assert.strictEqual(clean.card, undefined, 'card must be removed');
  });

  runTest('9.2 Telemetry schema defines valid non-PII event names matching ^[a-z0-9_]{3,64}$', () => {
    const events = Object.values(PadiFixMonetization.EVENTS);
    events.forEach(name => {
      assert(/^[a-z0-9_]{3,64}$/.test(name), `Event name "${name}" must match format`);
    });
  });

  // SECTION 10: PWA SHELL & LOW-BANDWIDTH RESILIENCE
  console.log('\n--- SECTION 10: PWA SHELL & LOW-BANDWIDTH RESILIENCE ---');

  runTest('10.1 sw.js caches /join.html and /monetization-config.js in service worker SHELL_ASSETS', () => {
    const swJs = fs.readFileSync(path.join(ROOT_DIR, 'sw.js'), 'utf8');
    assert(swJs.includes("'/join.html'"), 'sw.js must cache /join.html');
    assert(swJs.includes("'/monetization-config.js'"), 'sw.js must cache /monetization-config.js');
    assert(swJs.includes("'/search.js'"), 'sw.js must cache /search.js');
    assert(swJs.includes("'/register.html'"), 'sw.js must cache /register.html');
  });

  console.log('\n================================================================');
  console.log(`PHASE 005 VERIFICATION SUMMARY: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('================================================================\n');

  if (testsFailed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

main().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
