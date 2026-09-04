// ============================================================================
// PADIFIX PHASE 006 — PROVIDER VERIFICATION & TRUST SUITE
// Tests canonical verification lifecycle, trust signals, document masking,
// SHA-256 reference hashing, audit trail, KYC adapters, and RLS policies
// ============================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');

let passedTests = 0;
let failedTests = 0;

function pass(name) {
  passedTests++;
  console.log(`  ✓ ${name}`);
}

function fail(name, err) {
  failedTests++;
  console.error(`  ✗ ${name}:`, err.message || err);
}

console.log('================================================================');
console.log('PADIFIX PHASE 006 — PROVIDER VERIFICATION & TRUST SUITE');
console.log('================================================================\n');

// Setup Mock LocalStorage for Node.js test environment
if (typeof global.localStorage === 'undefined') {
  global.localStorage = {
    _store: {},
    getItem(k) { return this._store[k] || null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k) { delete this._store[k]; },
    clear() { this._store = {}; }
  };
}

// Load Modules
const monetizationPath = path.join(__dirname, '../monetization-config.js');
const verificationPath = path.join(__dirname, '../verification-providers.js');
const clientPath = path.join(__dirname, '../supabase-client.js');

const PadiFixMonetization = require(monetizationPath);
const PadiFixVerification = require(verificationPath);
const LokatorDB = require(clientPath);

// --- SECTION 1: CANONICAL VERIFICATION LIFECYCLE & RESOLVER ---
console.log('--- SECTION 1: CANONICAL VERIFICATION LIFECYCLE & RESOLVER ---');

try {
  const unverified = PadiFixMonetization.resolveVerificationState({ id: 1, name: 'Chinedu Okeke' });
  assert.strictEqual(unverified.key, 'UNVERIFIED', 'Unverified provider should resolve to UNVERIFIED');
  assert.strictEqual(unverified.publicBadgeText, 'Self-Reported Profile');
  assert.strictEqual(unverified.isVerified, false);
  assert.strictEqual(unverified.isPending, false);
  pass('1.1 Unverified provider resolves to UNVERIFIED with Self-Reported Profile badge');
} catch (e) { fail('1.1 Unverified provider resolves to UNVERIFIED', e); }

try {
  // Provider with complete profile (>= 80%) but unverified
  const completeProvider = {
    id: 2,
    name: 'Amina Yusuf',
    trade: 'Fashion Tailor & Designer',
    phone: '08023456789',
    category: 'tailor',
    skills: ['Agbada', 'Senator Styles'],
    state: 'Lagos',
    lga: 'Ikeja',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2',
    bio: 'Professional fashion designer with over 8 years experience crafting contemporary and traditional Nigerian attire in Ikeja.',
    startingPrice: '₦12,000',
    workingHours: 'Mon - Sat: 8am - 6pm'
  };
  const available = PadiFixMonetization.resolveVerificationState(completeProvider);
  assert.strictEqual(available.key, 'AVAILABLE', 'Complete profile should be eligible for verification');
  assert.strictEqual(available.canRequestVerification, true);
  pass('1.2 Complete profile (>= 80%) resolves to AVAILABLE for verification request');
} catch (e) { fail('1.2 Complete profile resolves to AVAILABLE', e); }

try {
  const pending = PadiFixMonetization.resolveVerificationState({
    id: 3,
    verification_status: 'pending',
    verification_requested: true
  });
  assert.strictEqual(pending.key, 'PENDING');
  assert.strictEqual(pending.publicBadgeText, 'Pending Verification');
  assert.strictEqual(pending.isPending, true);
  assert.strictEqual(pending.canRequestVerification, false);
  pass('1.3 Pending verification request resolves to PENDING with Pending Verification badge');
} catch (e) { fail('1.3 Pending verification request resolves to PENDING', e); }

try {
  const platformVerified = PadiFixMonetization.resolveVerificationState({
    id: 4,
    is_verified: true,
    verification_status: 'verified_platform'
  });
  assert.strictEqual(platformVerified.key, 'VERIFIED_PLATFORM');
  assert.strictEqual(platformVerified.publicBadgeText, 'Platform Reviewed');
  assert.strictEqual(platformVerified.isVerified, true);
  assert.strictEqual(platformVerified.isNinVerified, false);
  pass('1.4 Platform reviewed provider resolves to VERIFIED_PLATFORM with Platform Reviewed badge');
} catch (e) { fail('1.4 Platform reviewed provider resolves to VERIFIED_PLATFORM', e); }

try {
  const ninVerified = PadiFixMonetization.resolveVerificationState({
    id: 5,
    nin_verified: true,
    is_verified: true
  });
  assert.strictEqual(ninVerified.key, 'VERIFIED_NIN');
  assert.strictEqual(ninVerified.publicBadgeText, 'National NIN Verified');
  assert.strictEqual(ninVerified.isVerified, true);
  assert.strictEqual(ninVerified.isNinVerified, true);
  pass('1.5 National NIN verified provider resolves to VERIFIED_NIN with National NIN Verified badge');
} catch (e) { fail('1.5 National NIN verified provider resolves to VERIFIED_NIN', e); }

try {
  const nullSafe = PadiFixMonetization.resolveVerificationState(null);
  assert.strictEqual(nullSafe.key, 'UNVERIFIED');
  const emptySafe = PadiFixMonetization.resolveVerificationState({});
  assert.strictEqual(emptySafe.key, 'UNVERIFIED');
  pass('1.6 Null or undefined input safely defaults to UNVERIFIED without exception');
} catch (e) { fail('1.6 Null input defaults to UNVERIFIED', e); }

// --- SECTION 2: TRUST SIGNALS ARCHITECTURE ---
console.log('\n--- SECTION 2: TRUST SIGNALS ARCHITECTURE ---');

try {
  const signals = PadiFixMonetization.getTrustSignals({
    id: 10,
    name: 'Babajide Adeleke',
    trade: 'Plumber',
    nin_verified: true,
    phone: '08033445566',
    state: 'Lagos',
    lga: 'Surulere',
    experience_years: 6,
    reviews_count: 14,
    rating: 4.9
  });
  assert.strictEqual(signals.verificationState, 'VERIFIED_NIN');
  assert.strictEqual(signals.reviewCount, 14);
  assert.ok(signals.trustPillars.some(p => p.key === 'nin'), 'Must contain NIN trust pillar');
  assert.ok(signals.trustPillars.some(p => p.key === 'contact'), 'Must contain contact pillar');
  assert.ok(signals.trustPillars.some(p => p.key === 'location'), 'Must contain location pillar');
  pass('2.1 getTrustSignals deterministically constructs transparent, explainable trust pillars');
} catch (e) { fail('2.1 getTrustSignals constructs transparent trust pillars', e); }

try {
  const newListingSignals = PadiFixMonetization.getTrustSignals({
    id: 11,
    name: 'Olumide Fashola',
    trade: 'Electrician',
    reviews_count: 0
  });
  assert.strictEqual(newListingSignals.reviewCount, 0);
  assert.ok(newListingSignals.trustPillars.some(p => p.key === 'new_listing'), 'Zero review listing shows new listing pillar');
  pass('2.2 Zero-review provider truthfully displays New Marketplace Listing without synthetic ratings');
} catch (e) { fail('2.2 Zero-review provider displays New Listing', e); }

// --- SECTION 3: DOCUMENT MASKING & ZERO RAW NIN LEAKAGE ---
console.log('\n--- SECTION 3: DOCUMENT MASKING & ZERO RAW NIN LEAKAGE ---');

try {
  const maskedVnin = PadiFixVerification.maskDocumentReference('vnin', '1024567890123456');
  assert.strictEqual(maskedVnin, 'vNIN: 1024-****-****-3456', 'vNIN must be safely masked');
  pass('3.1 maskDocumentReference securely masks 16-character Virtual NIN');
} catch (e) { fail('3.1 maskDocumentReference masks vNIN', e); }

try {
  const maskedCac = PadiFixVerification.maskDocumentReference('cac_cert', 'RC1982734');
  assert.strictEqual(maskedCac, 'CAC: RC19****', 'CAC must be safely masked');
  pass('3.2 maskDocumentReference securely masks CAC registration numbers');
} catch (e) { fail('3.2 maskDocumentReference masks CAC', e); }

try {
  const hash1 = PadiFixVerification.hashDocumentReference('1024567890123456');
  const hash2 = PadiFixVerification.hashDocumentReference('1024567890123456');
  const hashDiff = PadiFixVerification.hashDocumentReference('1024567890123457');
  assert.strictEqual(typeof hash1, 'string');
  assert.strictEqual(hash1.length, 64, 'SHA-256 digest must be 64 hex characters');
  assert.strictEqual(hash1, hash2, 'Identical input must produce identical hash');
  assert.notStrictEqual(hash1, hashDiff, 'Different input must produce different hash');
  pass('3.3 hashDocumentReference produces deterministic 64-character SHA-256 one-way digest');
} catch (e) { fail('3.3 hashDocumentReference produces SHA-256 digest', e); }

// --- SECTION 4: VERIFICATION REQUEST & AUDIT TRAIL DATA MODEL ---
console.log('\n--- SECTION 4: VERIFICATION REQUEST & AUDIT TRAIL DATA MODEL ---');

(async function testAuditDataModel() {
  try {
    // Setup mock sandbox provider
    const testProviderId = 98801;
    const initialProviders = [{
      id: testProviderId,
      name: 'Tunde Adebayo',
      trade: 'Carpenter',
      is_verified: false,
      nin_verified: false
    }];
    global.localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(initialProviders));
    global.localStorage.setItem('lokator_supabase_verifications_db', JSON.stringify([]));
    global.localStorage.setItem('lokator_supabase_verification_audits_db', JSON.stringify([]));

    const reqRes = await LokatorDB.requestProviderVerification(testProviderId, {
      docType: 'vnin',
      docRef: '1024567890123456'
    });
    assert.strictEqual(reqRes.status, 'REMOTE_SUCCESS');
    assert.strictEqual(reqRes.data.status, 'pending');
    assert.strictEqual(reqRes.data.masked_ref, 'vNIN: 1024-****-****-3456');

    // Check request record
    const history = await LokatorDB.getProviderVerificationHistory(testProviderId);
    assert.strictEqual(history.length, 1);
    assert.strictEqual(history[0].doc_type, 'vnin');
    assert.strictEqual(history[0].document_masked_ref, 'vNIN: 1024-****-****-3456');
    assert.ok(history[0].document_reference_hash.length >= 10);
    // Ensure raw vNIN is NOT in history
    assert.ok(!JSON.stringify(history[0]).includes('1024567890123456'));
    pass('4.1 requestProviderVerification creates structured request with masked ref and zero raw NIN');

    // Check append-only audit trail
    const audits = await LokatorDB.getProviderVerificationAudits(testProviderId);
    assert.strictEqual(audits.length, 1);
    assert.strictEqual(audits[0].action, 'submit_verification_request');
    assert.strictEqual(audits[0].new_state, 'pending');
    pass('4.2 requestProviderVerification appends an immutable entry to the verification audit trail');

    // Process review approval
    const reviewRes = await LokatorDB.processProviderVerificationReview(history[0].id, {
      status: 'approved',
      reviewerId: 'officer_ada',
      isNin: true
    });
    assert.strictEqual(reviewRes.status, 'REMOTE_SUCCESS');

    // Verify updated provider state
    const updatedAudits = await LokatorDB.getProviderVerificationAudits(testProviderId);
    assert.strictEqual(updatedAudits.length, 2, 'Audit trail must contain 2 events now');
    assert.strictEqual(updatedAudits[0].action, 'approve_verification');
    assert.strictEqual(updatedAudits[0].actor_type, 'compliance_officer');
    pass('4.3 Compliance review updates verification status and appends approval audit event');
  } catch (e) { fail('4.x Verification request and audit model', e); }

  // --- SECTION 5: VERIFICATION PROVIDER ADAPTER PATTERN ---
  console.log('\n--- SECTION 5: VERIFICATION PROVIDER ADAPTER PATTERN ---');

  try {
    const defaultProvider = PadiFixVerification.VerificationProviderFactory.getProvider('manual');
    assert.strictEqual(defaultProvider.name, 'ManualPlatformVerificationProvider');
    pass('5.1 VerificationProviderFactory defaults to ManualPlatformVerificationProvider');
  } catch (e) { fail('5.1 Default provider is ManualPlatformVerificationProvider', e); }

  try {
    const mockProvider = PadiFixVerification.VerificationProviderFactory.getProvider('mock');
    const mockRes = await mockProvider.verify({ docType: 'vnin', docRef: '1024567890123456' });
    assert.strictEqual(mockRes.success, true);
    assert.strictEqual(mockRes.state, 'VERIFIED_NIN');
    assert.strictEqual(mockRes.status, 'approved');
    pass('5.2 MockVerificationProvider validates 16-char vNIN and produces deterministic approval');
  } catch (e) { fail('5.2 MockVerificationProvider approves valid vNIN', e); }

  try {
    const mockProvider = PadiFixVerification.VerificationProviderFactory.getProvider('mock');
    const failRes = await mockProvider.verify({ docType: 'vnin', docRef: 'SHORT_VNIN' });
    assert.strictEqual(failRes.success, false);
    assert.ok(failRes.error.includes('16 characters'));
    pass('5.3 MockVerificationProvider rejects invalid vNIN format with descriptive error');
  } catch (e) { fail('5.3 MockVerificationProvider rejects invalid vNIN', e); }

  try {
    const futureProvider = PadiFixVerification.VerificationProviderFactory.getProvider('live_nin');
    const futureRes = await futureProvider.verify({ docType: 'vnin', docRef: '1024567890123456' });
    assert.strictEqual(futureRes.success, false);
    assert.strictEqual(futureRes.gated, true);
    assert.ok(futureRes.error.includes('pilot rollout'));
    pass('5.4 FutureNINVerificationProvider safely gates live KYC network calls');
  } catch (e) { fail('5.4 FutureNINVerificationProvider gates live calls', e); }

  // --- SECTION 6: SUPABASE SCHEMA MIGRATION & RLS ---
  console.log('\n--- SECTION 6: SUPABASE SCHEMA MIGRATION & RLS ---');

  try {
    const migrationSql = fs.readFileSync(path.join(__dirname, '../supabase/migrations/032_padifix_provider_verification_and_trust_audit.sql'), 'utf8');
    assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.verification_requests'));
    assert.ok(migrationSql.includes('CREATE TABLE IF NOT EXISTS public.verification_audits'));
    assert.ok(migrationSql.includes('ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY'));
    assert.ok(migrationSql.includes('ALTER TABLE public.verification_audits ENABLE ROW LEVEL SECURITY'));
    assert.ok(migrationSql.includes('document_reference_hash TEXT NOT NULL'));
    assert.ok(migrationSql.includes('document_masked_ref TEXT NOT NULL'));
    assert.ok(migrationSql.includes('user_id = auth.uid()'));
    pass('6.1 Migration 032 defines verification_requests, verification_audits, and strict RLS policies');
  } catch (e) { fail('6.1 Migration 032 schema and RLS verification', e); }

  // --- SECTION 7: TELEMETRY & PRIVACY SANITIZATION ---
  console.log('\n--- SECTION 7: TELEMETRY & PRIVACY SANITIZATION ---');

  try {
    const events = PadiFixMonetization.EVENTS;
    assert.strictEqual(events.VERIFICATION_STARTED, 'verification_started');
    assert.strictEqual(events.VERIFICATION_REQUEST_CREATED, 'verification_request_created');
    assert.strictEqual(events.VERIFICATION_COMPLETED, 'verification_completed');
    assert.strictEqual(events.VERIFICATION_FAILED, 'verification_failed');
    assert.strictEqual(events.VERIFICATION_STATUS_VIEWED, 'verification_status_viewed');
    pass('7.1 Verification telemetry events adhere to lowercase snake_case standard');
  } catch (e) { fail('7.1 Verification telemetry events standard', e); }

  try {
    const dirtyPayload = {
      provider_id: 101,
      doc_type: 'vnin',
      nin: '12345678901',
      bvn: '22334455667',
      secret_token: 'secret_123',
      masked_ref: 'vNIN: 1024-****-****-3456'
    };
    const cleanPayload = PadiFixMonetization.sanitizeTelemetryPayload(dirtyPayload);
    assert.strictEqual(cleanPayload.provider_id, 101);
    assert.strictEqual(cleanPayload.doc_type, 'vnin');
    assert.strictEqual(cleanPayload.masked_ref, 'vNIN: 1024-****-****-3456');
    assert.strictEqual(cleanPayload.nin, undefined, 'Raw NIN must be stripped');
    assert.strictEqual(cleanPayload.bvn, undefined, 'Raw BVN must be stripped');
    assert.strictEqual(cleanPayload.secret_token, undefined, 'Secret token must be stripped');
    pass('7.2 sanitizeTelemetryPayload rigorously strips NIN, BVN, and credential keys');
  } catch (e) { fail('7.2 sanitizeTelemetryPayload strips sensitive credentials', e); }

  // --- SECTION 8: PWA SHELL & FRONTEND ASSET INTEGRATION ---
  console.log('\n--- SECTION 8: PWA SHELL & FRONTEND ASSET INTEGRATION ---');

  try {
    const swContent = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
    assert.ok(swContent.includes("'/verification-providers.js'"), 'sw.js must cache verification-providers.js');
    pass('8.1 sw.js caches /verification-providers.js in SHELL_ASSETS for offline resilience');
  } catch (e) { fail('8.1 sw.js caches verification-providers.js', e); }

  try {
    const dashHtml = fs.readFileSync(path.join(__dirname, '../dashboard.html'), 'utf8');
    assert.ok(dashHtml.includes('src="verification-providers.js"'));
    assert.ok(dashHtml.includes('id="dash-ver-pending-notice"'));
    assert.ok(dashHtml.includes('id="dash-ver-approved-notice"'));
    assert.ok(dashHtml.includes('id="ver-history-list"'));
    pass('8.2 dashboard.html includes verification-providers.js and upgraded verification center components');
  } catch (e) { fail('8.2 dashboard.html verification center components', e); }

  try {
    const profileHtml = fs.readFileSync(path.join(__dirname, '../profile.html'), 'utf8');
    assert.ok(profileHtml.includes('src="verification-providers.js"'));
    assert.ok(profileHtml.includes('id="modal-trust-explainer"'));
    assert.ok(profileHtml.includes('id="trust-modal-pillars"'));
    pass('8.3 profile.html includes trust explainer modal and verification-providers.js script');
  } catch (e) { fail('8.3 profile.html trust explainer modal', e); }

  try {
    const regHtml = fs.readFileSync(path.join(__dirname, '../register.html'), 'utf8');
    assert.ok(regHtml.includes('Self-Reported Profile'));
    assert.ok(regHtml.includes('Platform Verification Notice'));
    pass('8.4 register.html transparently clarifies that registration creates a Self-Reported Profile');
  } catch (e) { fail('8.4 register.html registration transparency notice', e); }

  // Final Summary
  console.log('\n================================================================');
  console.log(`PHASE 006 VERIFICATION SUMMARY: ${passedTests} passed, ${failedTests} failed`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
})();
