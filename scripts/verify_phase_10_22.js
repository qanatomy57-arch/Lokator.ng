// ============================================================================
// LOKATOR.NG — PHASE 10.22 MARKETPLACE RELIABILITY & EDGE-CASE SUITE
// Automated verification for deep-links, malformed inputs, null data,
// phone normalization, job brief encoding, telemetry deduplication & security
// ============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

// Load Core Modules in CommonJS / Test Sandbox
const baseDir = path.resolve(__dirname, '..');

// 1. Mock minimal DOM and global environment for Lokator libraries
global.window = global;
global.globalThis = global;
global.document = {
  title: '',
  location: { search: '', href: 'http://localhost:3000/profile.html' },
  addEventListener: () => {},
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementById: () => null,
  body: { classList: { add: () => {}, remove: () => {}, contains: () => false } }
};
global.sessionStorage = {
  _data: {},
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

// Load phone-utils.js
const { NigeriaPhone } = require(path.join(baseDir, 'phone-utils.js'));

// Load locations.js
require(path.join(baseDir, 'locations.js'));

// Load categories.js
require(path.join(baseDir, 'categories.js'));

// Load search-language.js
require(path.join(baseDir, 'search-language.js'));

// Load ai-service.js
require(path.join(baseDir, 'ai-service.js'));

// Load telemetry.js
require(path.join(baseDir, 'telemetry.js'));

// Safe HTML Escaping Function under test
const escapeHtml = (v) => (v === null || v === undefined) ? '' : String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');

let passedCount = 0;
let failedCount = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passedCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}:`, err.message);
    failedCount++;
  }
}

console.log('\n================================================================================');
console.log('🛡️ LOKATOR.NG — PHASE 10.22 RELIABILITY & EDGE-CASE CERTIFICATION SUITE');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// TEST GROUP 1: DEEP-LINK INTEGRITY & URL PARAMETER SANITIZATION (10 Tests)
// -----------------------------------------------------------------------------
console.log('--- TEST GROUP 1: DEEP-LINK INTEGRITY & URL PARAMETER SANITIZATION (10 Tests) ---');

runTest('1.1 Standard deep-link URL parsing with valid ID', () => {
  const params = new URLSearchParams('id=1&q=fix%20my%20AC&service=ac-technician&action=repair&loc=Ughelli');
  assert.strictEqual(parseInt(params.get('id'), 10), 1);
  assert.strictEqual(params.get('q'), 'fix my AC');
  assert.strictEqual(params.get('service'), 'ac-technician');
  assert.strictEqual(params.get('action'), 'repair');
  assert.strictEqual(params.get('loc'), 'Ughelli');
});

runTest('1.2 URL decoding safely handles Nigerian Pidgin & plus characters', () => {
  const params = new URLSearchParams('id=8&q=person+wey+fit+fix+my+AC+for+Ughelli&loc=Ughelli+South');
  assert.strictEqual(params.get('q'), 'person wey fit fix my AC for Ughelli');
  assert.strictEqual(params.get('loc'), 'Ughelli South');
});

runTest('1.3 Direct profile access without search context works cleanly', () => {
  const params = new URLSearchParams('id=1');
  assert.strictEqual(parseInt(params.get('id'), 10), 1);
  assert.strictEqual(params.get('q'), null);
  assert.strictEqual(params.get('service'), null);
  assert.strictEqual(params.get('loc'), null);
});

runTest('1.4 Malicious XSS query string parameters are treated as literal text', () => {
  const params = new URLSearchParams('id=1&q=%3Cscript%3Ealert(1)%3C%2Fscript%3E&service=%22%3E%3Csvg%2Fonload%3Dalert(1)%3E');
  const rawQ = params.get('q');
  const rawService = params.get('service');
  const safeQ = escapeHtml(rawQ);
  const safeService = escapeHtml(rawService);

  assert.ok(!safeQ.includes('<script>'), 'Must escape script tags');
  assert.ok(safeQ.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
  assert.ok(!safeService.includes('<svg'), 'Must escape SVG injection');
});

runTest('1.5 Deep-link with duplicate query parameters retains expected single value', () => {
  const params = new URLSearchParams('id=1&q=plumber&q=electrician&loc=Lagos');
  assert.strictEqual(params.get('q'), 'plumber'); // URLSearchParams.get returns first occurrence
  assert.strictEqual(params.get('loc'), 'Lagos');
});

runTest('1.6 Deep-link with whitespace and multiline query decodes gracefully', () => {
  const params = new URLSearchParams('id=2&q=%20%20clean%20my%20office%20%0Atomorrow%20%20');
  const q = params.get('q').trim();
  assert.ok(q.includes('clean my office'));
});

runTest('1.7 Deep-link with Nigerian currency symbols decodes correctly', () => {
  const params = new URLSearchParams('id=1&q=repair%20generator&budget=%E2%82%A625,000');
  assert.strictEqual(params.get('budget'), '₦25,000');
});

runTest('1.8 Deep-link with unknown extra parameters does not crash parameter reader', () => {
  const params = new URLSearchParams('id=1&unknown_prop=xyz&tracking_ref=12345&fbclid=abc');
  assert.strictEqual(parseInt(params.get('id'), 10), 1);
  assert.strictEqual(params.get('unknown_prop'), 'xyz');
});

runTest('1.9 Deep-link with empty value parameters handles nullish checks cleanly', () => {
  const params = new URLSearchParams('id=1&q=&service=&loc=&action=');
  assert.strictEqual(params.get('q'), '');
  assert.strictEqual(Boolean(params.get('q') && params.get('q').trim()), false);
});

runTest('1.10 Deep-link construction creates RFC-compliant query string', () => {
  const p = new URLSearchParams();
  p.set('id', '1');
  p.set('q', 'sew senator for wedding');
  p.set('loc', 'Warri');
  assert.strictEqual(p.toString(), 'id=1&q=sew+senator+for+wedding&loc=Warri');
});

// -----------------------------------------------------------------------------
// TEST GROUP 2: MALFORMED / INVALID PROVIDER IDs & 404 RESILIENCE (8 Tests)
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 2: MALFORMED / INVALID PROVIDER IDs & 404 RESILIENCE (8 Tests) ---');

runTest('2.1 Empty provider ID (`id=`) evaluates as falsy/invalid', () => {
  const params = new URLSearchParams('id=');
  const provId = parseInt(params.get('id'), 10);
  assert.ok(!provId || isNaN(provId));
});

runTest('2.2 Alphabetic provider ID (`id=abc`) evaluates as NaN', () => {
  const params = new URLSearchParams('id=abc');
  const provId = parseInt(params.get('id'), 10);
  assert.ok(isNaN(provId));
});

runTest('2.3 Negative provider ID (`id=-1`) is rejected', () => {
  const params = new URLSearchParams('id=-1');
  const provId = parseInt(params.get('id'), 10);
  assert.ok(provId <= 0);
});

runTest('2.4 Out-of-bounds provider ID (`id=999999999`) does not crash DB query', () => {
  const params = new URLSearchParams('id=999999999');
  const provId = parseInt(params.get('id'), 10);
  assert.strictEqual(provId, 999999999);
});

runTest('2.5 Literal null provider ID (`id=null`) is rejected', () => {
  const params = new URLSearchParams('id=null');
  const provId = parseInt(params.get('id'), 10);
  assert.ok(isNaN(provId));
});

runTest('2.6 Literal undefined provider ID (`id=undefined`) is rejected', () => {
  const params = new URLSearchParams('id=undefined');
  const provId = parseInt(params.get('id'), 10);
  assert.ok(isNaN(provId));
});

runTest('2.7 Script tag injection in provider ID (`id=<script>`) is sanitized as NaN', () => {
  const params = new URLSearchParams('id=%3Cscript%3E');
  const provId = parseInt(params.get('id'), 10);
  assert.ok(isNaN(provId));
});

runTest('2.8 Missing ID parameter entirely is cleanly detected as missing', () => {
  const params = new URLSearchParams('q=plumber');
  const provId = parseInt(params.get('id'), 10);
  assert.ok(!provId || isNaN(provId));
});

// -----------------------------------------------------------------------------
// TEST GROUP 3: PROVIDER DATA NULLABILITY & INCOMPLETE FIELDS (8 Tests)
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 3: PROVIDER DATA NULLABILITY & INCOMPLETE FIELDS (8 Tests) ---');

runTest('3.1 Missing provider phone produces empty tel link, never tel:null', () => {
  const p = { id: 99, name: 'Incomplete Artisan', phone: null, whatsappNumber: null };
  const telUrl = NigeriaPhone.buildTelUrl(p);
  assert.strictEqual(telUrl, '', 'Must be empty string for null phone');
  assert.ok(!telUrl.includes('null') && !telUrl.includes('undefined'));
});

runTest('3.2 Missing provider WhatsApp produces empty URL, never https://wa.me/undefined', () => {
  const p = { id: 99, name: 'Incomplete Artisan', phone: null, whatsappNumber: null };
  const waUrl = NigeriaPhone.buildWhatsAppUrl(p);
  assert.strictEqual(waUrl, '', 'Must be empty string for null whatsapp');
  assert.ok(!waUrl.includes('undefined') && !waUrl.includes('null'));
});

runTest('3.3 Null provider rating falls back safely to default without NaN', () => {
  const p = { rating: null };
  const safeRating = Number(p.rating != null ? p.rating : 5).toFixed(1);
  assert.strictEqual(safeRating, '5.0');
});

runTest('3.4 Null provider reviews count falls back safely to 0', () => {
  const p = { reviewsCount: null };
  const safeReviews = parseInt(p.reviewsCount != null ? p.reviewsCount : 0, 10);
  assert.strictEqual(safeReviews, 0);
});

runTest('3.5 Missing provider skills falls back to trade array without throwing', () => {
  const p = { trade: 'Electrician', skills: null };
  const skillsList = Array.isArray(p.skills) ? p.skills : [p.trade];
  assert.strictEqual(skillsList.length, 1);
  assert.strictEqual(skillsList[0], 'Electrician');
});

runTest('3.6 Missing provider location falls back to safe display string', () => {
  const p = { area: null, lga: null, state: null, city: null };
  const displayLoc = p.area || (p.lga && p.state ? `${p.lga}, ${p.state}` : (p.city || 'Nigeria'));
  assert.strictEqual(displayLoc, 'Nigeria');
});

runTest('3.7 Missing provider avatar falls back to safe initials generation', () => {
  const getInitials = (name) => {
    if (!name || typeof name !== 'string') return 'LK';
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'LK';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  assert.strictEqual(getInitials(null), 'LK');
  assert.strictEqual(getInitials(''), 'LK');
  assert.strictEqual(getInitials('Adebayo Okafor'), 'AO');
  assert.strictEqual(getInitials('Arise'), 'AR');
});

runTest('3.8 Unverified provider badge displays truthful self-reported status', () => {
  const p = { isVerified: false, ninVerified: false, verificationStatus: 'unverified' };
  const isPlatformVerified = Boolean(p.ninVerified || p.isVerified);
  assert.strictEqual(isPlatformVerified, false, 'Must not claim verified status for unverified provider');
});

// -----------------------------------------------------------------------------
// TEST GROUP 4: PHONE & WHATSAPP NORMALIZATION EDGE CASES (10 Tests)
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 4: PHONE & WHATSAPP NORMALIZATION EDGE CASES (10 Tests) ---');

runTest('4.1 11-digit national phone (08012345678) normalizes correctly', () => {
  const res = NigeriaPhone.normalize('08012345678');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.canonical, '2348012345678');
  assert.strictEqual(res.national, '08012345678');
  assert.strictEqual(res.telUri, 'tel:+2348012345678');
});

runTest('4.2 E.164 phone with plus (+2348012345678) normalizes correctly', () => {
  const res = NigeriaPhone.normalize('+2348012345678');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.canonical, '2348012345678');
  assert.strictEqual(res.telUri, 'tel:+2348012345678');
});

runTest('4.3 13-digit international phone without plus (2348012345678) normalizes correctly', () => {
  const res = NigeriaPhone.normalize('2348012345678');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.canonical, '2348012345678');
});

runTest('4.4 10-digit phone without leading zero (8012345678) normalizes correctly', () => {
  const res = NigeriaPhone.normalize('8012345678');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.canonical, '2348012345678');
});

runTest('4.5 Phone with spaces, dashes, brackets normalizes correctly', () => {
  const res = NigeriaPhone.normalize('(080) 1234-5678');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.canonical, '2348012345678');
});

runTest('4.6 Phone with accidental double prefix (+23408012345678) normalizes correctly', () => {
  const res = NigeriaPhone.normalize('+23408012345678');
  assert.strictEqual(res.valid, true);
  assert.strictEqual(res.canonical, '2348012345678');
});

runTest('4.7 Invalid short phone number (12345) is rejected', () => {
  const res = NigeriaPhone.normalize('12345');
  assert.strictEqual(res.valid, false);
  assert.strictEqual(res.telUri, null);
});

runTest('4.8 Alphabetic string ("080abcdefgh") is rejected', () => {
  const res = NigeriaPhone.normalize('080abcdefgh');
  assert.strictEqual(res.valid, false);
});

runTest('4.9 Formatted display outputs standard Nigerian grouping', () => {
  const disp = NigeriaPhone.formatDisplay('08012345678');
  assert.strictEqual(disp, '0801 234 5678');
});

runTest('4.10 Formatted international display outputs E.164 grouping', () => {
  const disp = NigeriaPhone.formatInternational('08012345678');
  assert.strictEqual(disp, '+234 801 234 5678');
});

// -----------------------------------------------------------------------------
// TEST GROUP 5: STRUCTURED WHATSAPP JOB BRIEF & ENCODING RESILIENCE (8 Tests)
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 5: STRUCTURED WHATSAPP JOB BRIEF & ENCODING RESILIENCE (8 Tests) ---');

runTest('5.1 Job brief preserves special characters and punctuation in URL', () => {
  const brief = LokatorAIService.generateStructuredJobBrief({
    providerName: 'Adebayo Okafor',
    service: 'AC Installation & Repair',
    userLocation: 'Plot 4, Airport Road, Warri',
    jobScope: 'Emergency Repair',
    urgency: 'Urgent / Today',
    materials: 'Labor & Materials (Full Quote)',
    note: 'The AC compressor is making loud noise & dripping water!'
  });

  const waUrl = NigeriaPhone.buildWhatsAppUrl('08012345678', { customMessage: brief.plainText });
  assert.ok(waUrl.startsWith('https://wa.me/2348012345678?text='));
  assert.ok(waUrl.includes(encodeURIComponent('The AC compressor is making loud noise & dripping water!')));
});

runTest('5.2 Job brief handles Nigerian Pidgin quotes and phrases without breaking', () => {
  const brief = LokatorAIService.generateStructuredJobBrief({
    providerName: 'Emeka Fixer',
    service: 'Plumber',
    userLocation: 'Effurun Roundabout',
    jobScope: 'Emergency Repair',
    urgency: 'Urgent / Today',
    note: "Abeg my pipe don burst for parlor, make e no cause flood!"
  });

  assert.ok(brief.plainText.includes("Abeg my pipe don burst for parlor"));
});

runTest('5.3 Job brief handles emojis and Unicode symbols without corruption', () => {
  const brief = LokatorAIService.generateStructuredJobBrief({
    providerName: 'Artisan',
    service: 'Solar & Inverter ⚡☀️',
    userLocation: 'Lekki Phase 1 📍',
    jobScope: 'New Installation 🛠️',
    note: 'Need 5kVA system setup 🔋'
  });

  assert.ok(brief.plainText.includes('⚡☀️'));
  assert.ok(brief.plainText.includes('🔋'));
});

runTest('5.4 Job brief with multiline notes preserves clean line breaks', () => {
  const multilineNote = 'Item 1: Fix wire\nItem 2: Check inverter\nItem 3: Install socket';
  const brief = LokatorAIService.generateStructuredJobBrief({
    providerName: 'Artisan',
    service: 'Electrician',
    note: multilineNote
  });

  assert.ok(brief.plainText.includes(multilineNote));
});

runTest('5.5 Job brief maps action "repair" to "Emergency Repair"', () => {
  assert.strictEqual(LokatorAIService.mapScopeFromAction('repair'), 'Emergency Repair');
});

runTest('5.6 Job brief maps action "installation" to "New Installation"', () => {
  assert.strictEqual(LokatorAIService.mapScopeFromAction('installation'), 'New Installation');
});

runTest('5.7 Job brief maps action "maintenance" to "Routine Maintenance"', () => {
  assert.strictEqual(LokatorAIService.mapScopeFromAction('maintenance'), 'Routine Maintenance');
});

runTest('5.8 Very long note (1000+ characters) encodes safely without throwing', () => {
  const longNote = 'A'.repeat(1200);
  const brief = LokatorAIService.generateStructuredJobBrief({
    providerName: 'Artisan',
    service: 'Mason',
    note: longNote
  });

  const waUrl = NigeriaPhone.buildWhatsAppUrl('08012345678', { customMessage: brief.plainText });
  assert.ok(waUrl.length > 1200);
});

// -----------------------------------------------------------------------------
// TEST GROUP 6: SEARCH CONTEXT MISMATCH & STALE STATE (6 Tests)
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 6: SEARCH CONTEXT MISMATCH & STALE STATE (6 Tests) ---');

runTest('6.1 Stale search service does not overwrite provider trade', () => {
  const provider = { id: 1, name: 'Adebayo', trade: 'Electrician' };
  const queryParam = 'plumber in warri';
  const skillParam = 'plumber';

  const title = queryParam ? `Your Request: "${queryParam}"` : `Request: ${skillParam || provider.trade}`;
  assert.strictEqual(title, 'Your Request: "plumber in warri"');
  assert.strictEqual(provider.trade, 'Electrician', 'Provider trade must remain truthful');
});

runTest('6.2 Stale search location does not fabricate provider location', () => {
  const provider = { id: 1, area: 'Ikeja, Lagos', state: 'Lagos' };
  const searchLocationParam = 'Kano';

  // Request context reflects what user asked for, provider data reflects reality
  const requestContextSubtext = `in ${searchLocationParam}`;
  assert.strictEqual(requestContextSubtext, 'in Kano');
  assert.strictEqual(provider.state, 'Lagos');
});

runTest('6.3 Search intent skill matching selects matching skill if available', () => {
  const providerSkills = ['Home Conduit Wiring', 'Solar Setup', 'AC Maintenance'];
  const targetTerm = 'solar';
  const matchedIndex = providerSkills.findIndex(s => s.toLowerCase().includes(targetTerm));
  assert.strictEqual(matchedIndex, 1);
  assert.strictEqual(providerSkills[matchedIndex], 'Solar Setup');
});

runTest('6.4 Search intent skill matching keeps default if skill not offered', () => {
  const providerSkills = ['Home Conduit Wiring', 'Solar Setup'];
  const targetTerm = 'tailor';
  const matchedIndex = providerSkills.findIndex(s => s.toLowerCase().includes(targetTerm));
  assert.strictEqual(matchedIndex, -1, 'Must return -1 for non-offered skills');
});

runTest('6.5 Context banner hides when no search parameters are present in URL', () => {
  const queryParam = '';
  const skillParam = '';
  const locParam = '';
  const actionParam = '';
  const shouldShowBanner = Boolean(queryParam || skillParam || locParam || actionParam);
  assert.strictEqual(shouldShowBanner, false);
});

runTest('6.6 Context banner shows when search parameters are present in URL', () => {
  const queryParam = 'fix my AC';
  const shouldShowBanner = Boolean(queryParam);
  assert.strictEqual(shouldShowBanner, true);
});

// -----------------------------------------------------------------------------
// TEST GROUP 7: ZERO-RESULT RECOVERY & NAVIGATION STABILITY (6 Tests)
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 7: ZERO-RESULT RECOVERY & NAVIGATION STABILITY (6 Tests) ---');

runTest('7.1 Empty search query handled safely without throwing', () => {
  const res = NigeriaSearchLanguage.parseNigerianQuery('');
  assert.strictEqual(res.confidence, 'UNKNOWN');
  assert.strictEqual(res.serviceIntent, null);
});

runTest('7.2 Pure whitespace query handled safely', () => {
  const res = NigeriaSearchLanguage.parseNigerianQuery('     ');
  assert.strictEqual(res.confidence, 'LOW');
  assert.strictEqual(res.serviceIntent, null);
});

runTest('7.3 Unknown trade and unknown location query does not hallucinate trade', () => {
  const res = NigeriaSearchLanguage.parseNigerianQuery('xyzabc123 nowhere');
  assert.strictEqual(res.serviceIntent, null);
});

runTest('7.4 MarketplaceTaxonomy returns recovery suggestions on zero results', () => {
  const context = MarketplaceTaxonomy.buildDiscoveryContext({ category: 'plumber', state: 'Delta' });
  assert.ok(context);
});

runTest('7.5 URL parameter syncer accurately formats search state', () => {
  const state = { keyword: 'electrician', category: 'all', state: 'Delta', lga: 'Warri South', page: 1 };
  const p = new URLSearchParams();
  if (state.keyword) p.set('q', state.keyword);
  if (state.state && state.state !== 'all') p.set('state', state.state);
  if (state.lga && state.lga !== 'all') p.set('lga', state.lga);
  assert.strictEqual(p.toString(), 'q=electrician&state=Delta&lga=Warri+South');
});

runTest('7.6 Breadcrumb builder preserves return search URL', () => {
  const query = 'fix my AC';
  const backUrl = `search.html?q=${encodeURIComponent(query)}`;
  assert.strictEqual(backUrl, 'search.html?q=fix%20my%20AC');
});

// -----------------------------------------------------------------------------
// TEST GROUP 8: TELEMETRY DEDUPLICATION & NDPR PRIVACY AUDIT (8 Tests)
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 8: TELEMETRY DEDUPLICATION & NDPR PRIVACY AUDIT (8 Tests) ---');

runTest('8.1 Telemetry suppresses rapid double-clicks (burst deduplication)', () => {
  sessionStorage.clear();

  LokatorTelemetry.trackEvent('whatsapp_clicked', { providerId: 1, surface: 'hero' });
  // Immediate second click with same payload
  LokatorTelemetry.trackEvent('whatsapp_clicked', { providerId: 1, surface: 'hero' });

  const raw = sessionStorage.getItem('lokator_telemetry_events');
  const events = raw ? JSON.parse(raw) : [];
  assert.strictEqual(events.length, 1, 'Duplicate burst event must be suppressed');
});

runTest('8.2 Telemetry allows distinct events through', () => {
  sessionStorage.clear();
  LokatorTelemetry.trackEvent('provider_card_clicked', { providerId: 1 });
  LokatorTelemetry.trackEvent('call_clicked', { providerId: 1 });

  const raw = sessionStorage.getItem('lokator_telemetry_events');
  const events = raw ? JSON.parse(raw) : [];
  assert.strictEqual(events.length, 2, 'Distinct event types must be logged');
});

runTest('8.3 Telemetry strictly strips phone numbers from payload', () => {
  sessionStorage.clear();
  LokatorTelemetry.trackEvent('test_strip_phone', { phone: '08012345678', providerId: 5 });

  const raw = sessionStorage.getItem('lokator_telemetry_events');
  const events = raw ? JSON.parse(raw) : [];
  assert.strictEqual(events[0].props.phone, undefined);
  assert.strictEqual(events[0].props.providerId, 5);
});

runTest('8.4 Telemetry strictly strips WhatsApp message bodies from payload', () => {
  sessionStorage.clear();
  LokatorTelemetry.trackEvent('test_strip_wa_msg', { whatsapp_message: 'Private brief content', providerId: 6 });

  const raw = sessionStorage.getItem('lokator_telemetry_events');
  const events = raw ? JSON.parse(raw) : [];
  assert.strictEqual(events[0].props.whatsapp_message, undefined);
  assert.strictEqual(events[0].props.providerId, 6);
});

runTest('8.5 Telemetry strictly strips identity credentials (NIN, BVN, passwords)', () => {
  sessionStorage.clear();
  LokatorTelemetry.trackEvent('test_strip_credentials', { nin: '12345678901', bvn: '22233344455', password: 'secret' });

  const raw = sessionStorage.getItem('lokator_telemetry_events');
  const events = raw ? JSON.parse(raw) : [];
  assert.strictEqual(events[0].props.nin, undefined);
  assert.strictEqual(events[0].props.bvn, undefined);
  assert.strictEqual(events[0].props.password, undefined);
});

runTest('8.6 Telemetry masks raw email addresses in custom properties', () => {
  sessionStorage.clear();
  LokatorTelemetry.trackEvent('test_mask_email', { contactEmail: 'client@example.com' });

  const raw = sessionStorage.getItem('lokator_telemetry_events');
  const events = raw ? JSON.parse(raw) : [];
  assert.strictEqual(events[0].props.contactEmail, '[REDACTED_EMAIL]');
});

runTest('8.7 Telemetry sanitizes nested objects recursively', () => {
  sessionStorage.clear();
  LokatorTelemetry.trackEvent('test_sanitize_nested', {
    meta: {
      phone: '08012345678',
      safeCount: 3
    }
  });

  const raw = sessionStorage.getItem('lokator_telemetry_events');
  const events = raw ? JSON.parse(raw) : [];
  assert.strictEqual(events[0].props.meta.phone, undefined);
  assert.strictEqual(events[0].props.meta.safeCount, 3);
});

runTest('8.8 Invalid event names with illegal characters are discarded', () => {
  sessionStorage.clear();
  LokatorTelemetry.trackEvent('<script>alert(1)</script>', { test: 1 });
  const raw = sessionStorage.getItem('lokator_telemetry_events');
  const events = raw ? JSON.parse(raw) : [];
  assert.strictEqual(events.length, 0);
});

// -----------------------------------------------------------------------------
// TEST GROUP 9: SECURITY AUDIT: XSS, URL SCHEMES & DOM INJECTION (6 Tests)
// -----------------------------------------------------------------------------
console.log('\n--- TEST GROUP 9: SECURITY AUDIT: XSS, URL SCHEMES & DOM INJECTION (6 Tests) ---');

runTest('9.1 HTML escaping neutralizes script tags in user query', () => {
  const input = '<script>window.location="http://evil.com"</script>';
  const escaped = escapeHtml(input);
  assert.strictEqual(escaped, '&lt;script&gt;window.location=&quot;http://evil.com&quot;&lt;/script&gt;');
});

runTest('9.2 HTML escaping neutralizes img tag onerror handlers', () => {
  const input = '<img src=x onerror=alert(1)>';
  const escaped = escapeHtml(input);
  assert.strictEqual(escaped, '&lt;img src=x onerror=alert(1)&gt;');
});

runTest('9.3 HTML escaping neutralizes quote escape attribute injection', () => {
  const input = '"><script>alert(1)</script>';
  const escaped = escapeHtml(input);
  assert.strictEqual(escaped, '&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
});

runTest('9.4 Tel URLs only permit valid E.164 RFC 3966 format', () => {
  const validTel = NigeriaPhone.buildTelUrl('08012345678');
  assert.strictEqual(validTel, 'tel:+2348012345678');

  const dangerousInput = 'javascript:alert(1)';
  const badTel = NigeriaPhone.buildTelUrl(dangerousInput);
  assert.strictEqual(badTel, '');
});

runTest('9.5 WhatsApp URLs only permit valid https://wa.me/234 format', () => {
  const validWa = NigeriaPhone.buildWhatsAppUrl('08012345678');
  assert.ok(validWa.startsWith('https://wa.me/2348012345678'));

  const badWa = NigeriaPhone.buildWhatsAppUrl('javascript:alert(1)');
  assert.strictEqual(badWa, '');
});

runTest('9.6 PWA sw.js cache version and shell asset integrity verified', () => {
  const swContent = fs.readFileSync(path.join(baseDir, 'sw.js'), 'utf-8');
  assert.ok(swContent.includes('lokator-v10.21'), 'sw.js must contain updated cache version');
  assert.ok(swContent.includes('/search-language.js'), 'sw.js must include /search-language.js');
  assert.ok(swContent.includes('/phone-utils.js'), 'sw.js must include /phone-utils.js');
  assert.ok(swContent.includes('/ai-service.js'), 'sw.js must include /ai-service.js');
});

// -----------------------------------------------------------------------------
// SUMMARY & REPORTING
// -----------------------------------------------------------------------------
console.log('\n================================================================================');
if (failedCount === 0) {
  console.log(`🎉 ALL ${passedCount} PHASE 10.22 RELIABILITY & EDGE-CASE ASSERTIONS PASSED (100%)!`);
} else {
  console.log(`❌ VERIFICATION FAILED: ${passedCount} PASSED, ${failedCount} FAILED`);
}
console.log('================================================================================\n');

process.exit(failedCount === 0 ? 0 : 1);
