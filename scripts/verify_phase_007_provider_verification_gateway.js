// ============================================================================
// PADIFIX PHASE 007 — PROVIDER VERIFICATION OPERATIONS & IDENTITY GATEWAY SUITE
// Tests the formalized verification provider interface, state machine,
// hard verification invariant, idempotency guard, duplicate reference detection,
// reviewer authorization boundary, fail-closed gateway, webhook receiver, and zero-PII telemetry.
// ============================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

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
console.log('PADIFIX PHASE 007 — PROVIDER VERIFICATION OPERATIONS & GATEWAY');
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
const webhookPath = path.join(__dirname, '../api/kyc-webhook.js');

const PadiFixMonetization = require(monetizationPath);
const PadiFixVerification = require(verificationPath);
const LokatorDB = require(clientPath);
const kycWebhookHandler = require(webhookPath);

(async function runAllPhase007Tests() {

  // --- SECTION 1: VERIFICATION PROVIDER INTERFACE & CAPABILITIES ---
  console.log('--- SECTION 1: VERIFICATION PROVIDER INTERFACE & CAPABILITIES ---');

  try {
    const manualProvider = new PadiFixVerification.ManualPlatformVerificationProvider();
    assert.strictEqual(typeof manualProvider.verifyIdentity, 'function', 'Must implement verifyIdentity()');
    assert.strictEqual(typeof manualProvider.getCapabilities, 'function', 'Must implement getCapabilities()');
    assert.strictEqual(typeof manualProvider.normalizeResult, 'function', 'Must implement normalizeResult()');
    assert.strictEqual(typeof manualProvider.healthCheck, 'function', 'Must implement healthCheck()');
    const caps = manualProvider.getCapabilities();
    assert.strictEqual(caps.manualReview, true);
    assert.strictEqual(caps.liveAutomated, false);
    pass('1.1 ManualPlatformVerificationProvider implements the complete provider interface with declared capabilities');
  } catch (e) { fail('1.1 ManualPlatformVerificationProvider interface', e); }

  try {
    const mockProvider = new PadiFixVerification.MockVerificationProvider();
    const caps = mockProvider.getCapabilities();
    assert.strictEqual(caps.source, 'MOCK');
    assert.strictEqual(caps.liveAutomated, true);
    const health = await mockProvider.healthCheck();
    assert.strictEqual(health.healthy, true);
    pass('1.2 MockVerificationProvider declares MOCK identity source and passes healthcheck');
  } catch (e) { fail('1.2 MockVerificationProvider interface', e); }

  try {
    const ninProvider = new PadiFixVerification.NinVerificationProvider();
    const caps = ninProvider.getCapabilities();
    assert.strictEqual(caps.adapter, 'NinVerificationProvider');
    assert.ok(caps.supportedDocs.includes('vnin'));
    pass('1.3 NinVerificationProvider implements interface ready for future NIMC automated gateways');
  } catch (e) { fail('1.3 NinVerificationProvider interface', e); }

  try {
    const mockProvider = new PadiFixVerification.MockVerificationProvider();
    const normApproved = mockProvider.normalizeResult({ status: 'approved', state: 'VERIFIED_NIN', message: 'OK' });
    assert.strictEqual(normApproved.outcome, 'VERIFIED');
    assert.strictEqual(normApproved.safeResultCode, 'APPROVED');

    const normRejected = mockProvider.normalizeResult({ status: 'rejected', error: 'Doc mismatch' });
    assert.strictEqual(normRejected.outcome, 'REJECTED');
    assert.strictEqual(normRejected.safeResultCode, 'REJECTED');

    const normGated = mockProvider.normalizeResult({ gated: true, error: 'Pilot gated' });
    assert.strictEqual(normGated.outcome, 'UNAVAILABLE');
    assert.strictEqual(normGated.safeResultCode, 'GATEWAY_UNAVAILABLE');
    pass('1.4 normalizeResult standardizes vendor outcomes into safe PadiFix result codes');
  } catch (e) { fail('1.4 normalizeResult standardizes vendor outcomes', e); }


  // --- SECTION 2: HARD VERIFICATION INVARIANT & STATE MACHINE ---
  console.log('\n--- SECTION 2: HARD VERIFICATION INVARIANT & STATE MACHINE ---');

  try {
    const SM = PadiFixVerification.VerificationStateMachine;
    assert.ok(SM, 'VerificationStateMachine must be defined');

    // Legal Transitions
    assert.ok(SM.canTransition('UNVERIFIED', 'REQUESTED'));
    assert.ok(SM.canTransition('REQUESTED', 'PENDING'));
    assert.ok(SM.canTransition('PENDING', 'VERIFIED_PLATFORM'));
    assert.ok(SM.canTransition('PENDING', 'VERIFIED_NIN'));
    assert.ok(SM.canTransition('PENDING', 'REJECTED'));
    assert.ok(SM.canTransition('PENDING', 'FAILED'));
    assert.ok(SM.canTransition('REJECTED', 'REQUESTED'));
    assert.ok(SM.canTransition('FAILED', 'REQUESTED'));
    pass('2.1 VerificationStateMachine approves all canonical legal state transitions');
  } catch (e) { fail('2.1 Legal state transitions', e); }

  try {
    const SM = PadiFixVerification.VerificationStateMachine;
    // HARD INVARIANT TEST: UNVERIFIED -> VERIFIED_NIN without compliance/gateway must throw
    assert.throws(() => {
      SM.validateTransition('UNVERIFIED', 'VERIFIED_NIN');
    }, /HARD INVARIANT VIOLATION/);

    // REQUESTED -> VERIFIED_NIN must throw
    assert.throws(() => {
      SM.validateTransition('REQUESTED', 'VERIFIED_NIN');
    }, /HARD INVARIANT VIOLATION/);

    // AVAILABLE -> VERIFIED_NIN must throw
    assert.throws(() => {
      SM.validateTransition('AVAILABLE', 'VERIFIED_NIN');
    }, /HARD INVARIANT VIOLATION/);

    pass('2.2 Hard Verification Invariant: Direct transition from unverified submission to VERIFIED_NIN is strictly blocked');
  } catch (e) { fail('2.2 Hard Verification Invariant direct transition blocked', e); }

  try {
    // Attempting client-side form submission NEVER assigns VERIFIED_NIN directly
    const testProvId = 70001;
    const providers = [{ id: testProvId, name: 'Emeka Anya', is_verified: false, nin_verified: false, verification_status: 'unverified' }];
    global.localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(providers));
    global.localStorage.setItem('lokator_supabase_verifications_db', JSON.stringify([]));
    global.localStorage.setItem('lokator_supabase_verification_audits_db', JSON.stringify([]));

    const subRes = await LokatorDB.requestProviderVerification(testProvId, {
      docType: 'vnin',
      docRef: '1024567890123456'
    });

    const storedProv = JSON.parse(global.localStorage.getItem('lokator_supabase_providers_db'))[0];
    assert.strictEqual(storedProv.verification_status, 'pending', 'Status MUST be pending');
    assert.strictEqual(storedProv.is_verified, false, 'is_verified MUST remain false on initial submission');
    assert.strictEqual(storedProv.nin_verified, false, 'nin_verified MUST remain false on initial submission');
    pass('2.3 Provider submission transitions request to PENDING and preserves unverified provider state');
  } catch (e) { fail('2.3 Provider submission transitions to PENDING', e); }


  // --- SECTION 3: IDEMPOTENCY & REPEAT SUBMISSION PROTECTION ---
  console.log('\n--- SECTION 3: IDEMPOTENCY & REPEAT SUBMISSION PROTECTION ---');

  try {
    const provId = 70002;
    const providers = [{ id: provId, name: 'Sadiq Bello', is_verified: false, nin_verified: false }];
    global.localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(providers));
    global.localStorage.setItem('lokator_supabase_verifications_db', JSON.stringify([]));
    global.localStorage.setItem('lokator_supabase_verification_audits_db', JSON.stringify([]));

    const idempotencyKey = 'idem_unique_test_key_001';

    // First submission
    const res1 = await LokatorDB.requestProviderVerification(provId, {
      docType: 'vnin',
      docRef: '1024567890123456',
      idempotencyKey
    });
    assert.strictEqual(res1.status, 'REMOTE_SUCCESS');
    assert.strictEqual(res1.isDuplicate, undefined);

    // Immediate repeat submission with same idempotency key (e.g. double click or network retry)
    const res2 = await LokatorDB.requestProviderVerification(provId, {
      docType: 'vnin',
      docRef: '1024567890123456',
      idempotencyKey
    });
    assert.strictEqual(res2.status, 'REMOTE_SUCCESS');
    assert.strictEqual(res2.idempotent, true, 'Repeat submission must be flagged as idempotent');

    // Confirm only 1 verification request and 1 audit record was created
    const history = await LokatorDB.getProviderVerificationHistory(provId);
    assert.strictEqual(history.length, 1, 'Idempotency must prevent duplicate verification request rows');

    const audits = await LokatorDB.getProviderVerificationAudits(provId);
    assert.strictEqual(audits.length, 1, 'Idempotency must prevent duplicate audit ledger entries');

    pass('3.1 Repeated submissions with identical idempotency key produce exactly 1 logical request and 1 audit record');
  } catch (e) { fail('3.1 Idempotency prevents duplicate operations', e); }


  // --- SECTION 4: CROSS-PROVIDER DUPLICATE IDENTITY PROTECTION ---
  console.log('\n--- SECTION 4: CROSS-PROVIDER DUPLICATE IDENTITY PROTECTION ---');

  try {
    const provA = 70010;
    const provB = 70020;
    const sharedVnin = '9988776655443322';

    const providers = [
      { id: provA, name: 'Provider Alpha', is_verified: false },
      { id: provB, name: 'Provider Beta', is_verified: false }
    ];
    global.localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(providers));
    global.localStorage.setItem('lokator_supabase_verifications_db', JSON.stringify([]));
    global.localStorage.setItem('lokator_supabase_verification_audits_db', JSON.stringify([]));

    // Provider A submits first
    await LokatorDB.requestProviderVerification(provA, { docType: 'vnin', docRef: sharedVnin });

    // Provider B attempts to submit the identical vNIN reference
    const resB = await LokatorDB.requestProviderVerification(provB, { docType: 'vnin', docRef: sharedVnin });

    assert.strictEqual(resB.status, 'REMOTE_SUCCESS');
    // Result code must identify duplicate reference internally
    assert.strictEqual(resB.data.safe_result_code, 'DUPLICATE_IDENTITY_REFERENCE');

    const historyB = await LokatorDB.getProviderVerificationHistory(provB);
    assert.strictEqual(historyB[0].safe_result_code, 'DUPLICATE_IDENTITY_REFERENCE');
    assert.strictEqual(historyB[0].duplicate_flag, true);

    // Ensure Provider B's record does NOT leak Provider A's identity details
    assert.ok(!JSON.stringify(historyB[0]).includes('Provider Alpha'));
    assert.ok(!JSON.stringify(historyB[0]).includes(String(provA)));

    pass('4.1 Cross-provider duplicate identity artifact flags DUPLICATE_IDENTITY_REFERENCE without leaking owner information');
  } catch (e) { fail('4.1 Cross-provider duplicate identity protection', e); }


  // --- SECTION 5: REVIEWER AUTHORIZATION & AUTHORITY BOUNDARY ---
  console.log('\n--- SECTION 5: REVIEWER AUTHORIZATION & AUTHORITY BOUNDARY ---');

  try {
    const provId = 70030;
    const providers = [{ id: provId, name: 'Kelechi Okafor', is_verified: false }];
    global.localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(providers));
    global.localStorage.setItem('lokator_supabase_verifications_db', JSON.stringify([]));
    global.localStorage.setItem('lokator_supabase_verification_audits_db', JSON.stringify([]));

    await LokatorDB.requestProviderVerification(provId, { docType: 'vnin', docRef: '1234567890123456' });
    const history = await LokatorDB.getProviderVerificationHistory(provId);
    const reqId = history[0].id;

    // Attempt 1: Unauthorized provider/customer tries to approve verification -> MUST THROW
    await assert.rejects(async () => {
      await LokatorDB.processProviderVerificationReview(reqId, {
        status: 'approved',
        reviewerId: 'customer_999',
        reviewerRole: 'customer'
      });
    }, /UNAUTHORIZED_REVIEWER/);
    pass('5.1 Unauthorized customer role is strictly rejected from approving verification');

    // Attempt 2: Unauthorized artisan provider tries to approve own verification -> MUST THROW
    await assert.rejects(async () => {
      await LokatorDB.processProviderVerificationReview(reqId, {
        status: 'approved',
        reviewerId: String(provId),
        reviewerRole: 'provider'
      });
    }, /UNAUTHORIZED_REVIEWER/);
    pass('5.2 Artisan provider role is strictly rejected from approving own verification');

    // Attempt 3: Authorized compliance officer executes review -> MUST SUCCEED
    const approvedRes = await LokatorDB.processProviderVerificationReview(reqId, {
      status: 'approved',
      reviewerId: 'officer_funke',
      reviewerRole: 'compliance_officer',
      isNin: true
    });
    assert.strictEqual(approvedRes.status, 'REMOTE_SUCCESS');
    assert.strictEqual(approvedRes.data.status, 'approved');

    const updatedProv = JSON.parse(global.localStorage.getItem('lokator_supabase_providers_db'))[0];
    assert.strictEqual(updatedProv.nin_verified, true);
    assert.strictEqual(updatedProv.badge_title, 'National NIN Verified');
    pass('5.3 Authorized compliance officer successfully executes trusted verification transition');
  } catch (e) { fail('5.x Reviewer authorization boundary', e); }


  // --- SECTION 6: GATEWAY FAIL-CLOSED BEHAVIOR & MOCK SANDBOX ---
  console.log('\n--- SECTION 6: GATEWAY FAIL-CLOSED BEHAVIOR & MOCK SANDBOX ---');

  try {
    const ninProvider = new PadiFixVerification.NinVerificationProvider();
    const res = await ninProvider.verifyIdentity({ docType: 'vnin', docRef: '1024567890123456' });
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.outcome, 'UNAVAILABLE');
    assert.strictEqual(res.gated, true);
    assert.strictEqual(res.safeResultCode, 'LIVE_GATEWAY_GATED');
    pass('6.1 Live KYC gateway fails closed safely when liveKycGatewayEnabled is false');
  } catch (e) { fail('6.1 Live KYC gateway fails closed', e); }

  try {
    const mockProvider = new PadiFixVerification.MockVerificationProvider();
    const mockResult = await mockProvider.verifyIdentity({ docType: 'vnin', docRef: '1024567890123456' });
    assert.strictEqual(mockResult.verification_source, 'MOCK');
    assert.strictEqual(mockResult.success, true);
    assert.strictEqual(mockResult.state, 'VERIFIED_NIN');
    pass('6.2 MockVerificationProvider accurately identifies MOCK verification source');
  } catch (e) { fail('6.2 Mock provider source identification', e); }

  try {
    const mockProvider = new PadiFixVerification.MockVerificationProvider();
    // Simulate production environment
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      await assert.rejects(async () => {
        await mockProvider.verifyIdentity({ docType: 'vnin', docRef: '1024567890123456' });
      }, /SECURITY VIOLATION/);
      pass('6.3 MockVerificationProvider throws security error in production mode');
    } finally {
      process.env.NODE_ENV = prevEnv;
    }
  } catch (e) { fail('6.3 Mock provider blocked in production', e); }


  // --- SECTION 7: RATE LIMITING & ABUSE PROTECTION ---
  console.log('\n--- SECTION 7: RATE LIMITING & ABUSE PROTECTION ---');

  try {
    const provId = 70040;
    const providers = [{ id: provId, name: 'Tarila Prince', is_verified: false }];
    global.localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(providers));
    
    // Seed 5 recent verification requests within the last hour
    const now = Date.now();
    const seededRequests = [1, 2, 3, 4, 5].map(i => ({
      id: `seed_req_${i}`,
      provider_id: provId,
      doc_type: 'vnin',
      document_reference_hash: `seed_hash_${i}`,
      status: 'rejected',
      submitted_at: new Date(now - (i * 1000 * 60)).toISOString()
    }));
    global.localStorage.setItem('lokator_supabase_verifications_db', JSON.stringify(seededRequests));

    // 6th attempt within 24h must be blocked by rate limit
    await assert.rejects(async () => {
      await LokatorDB.requestProviderVerification(provId, { docType: 'vnin', docRef: '1024567890123456' });
    }, /rate limit/i);

    pass('7.1 Verification rate limiter rejects rapid repeat attempts exceeding 5 per 24 hours');
  } catch (e) { fail('7.1 Verification rate limiting', e); }


  // --- SECTION 8: SERVERLESS KYC WEBHOOK BOUNDARY ---
  console.log('\n--- SECTION 8: SERVERLESS KYC WEBHOOK BOUNDARY ---');

  try {
    // 1. Missing signature header -> 401
    const reqMissingSig = {
      method: 'POST',
      headers: {},
      body: JSON.stringify({ event: 'verification.approved', id: 'evt_1' })
    };
    let resStatus = null;
    let resJson = null;
    const resMock1 = {
      status(code) { resStatus = code; return this; },
      json(data) { resJson = data; return this; }
    };
    await kycWebhookHandler(reqMissingSig, resMock1);
    assert.strictEqual(resStatus, 401);
    assert.strictEqual(resJson.safeCode, 'UNAUTHENTICATED_WEBHOOK');
    pass('8.1 KYC Webhook handler rejects unsigned requests with HTTP 401');

    // 2. Invalid signature -> 401
    const reqBadSig = {
      method: 'POST',
      headers: { 'x-kyc-signature': '00112233445566778899aabbccddeeff' },
      body: JSON.stringify({ event: 'verification.approved', id: 'evt_2' })
    };
    await kycWebhookHandler(reqBadSig, resMock1);
    assert.strictEqual(resStatus, 401);
    assert.strictEqual(resJson.safeCode, 'INVALID_SIGNATURE');
    pass('8.2 KYC Webhook handler rejects forged HMAC signatures with HTTP 401');

    // 3. Valid HMAC-SHA512 signature -> 200 OK
    const secret = 'test_kyc_webhook_secret_padifix_2026';
    const validPayload = JSON.stringify({
      event: 'verification.approved',
      id: 'evt_valid_001',
      provider_id: 88801,
      data: {
        verification_type: 'vnin',
        status: 'approved',
        reference: 'evt_valid_001'
      }
    });
    const validSignature = crypto.createHmac('sha512', secret).update(validPayload).digest('hex');

    const reqValid = {
      method: 'POST',
      headers: { 'x-kyc-signature': validSignature },
      body: validPayload
    };
    await kycWebhookHandler(reqValid, resMock1);
    assert.strictEqual(resStatus, 200);
    assert.strictEqual(resJson.status, 'success');
    assert.strictEqual(resJson.normalizedOutcome, 'VERIFIED_NIN');
    assert.strictEqual(resJson.safeResultCode, 'APPROVED');
    // Ensure response contains ZERO raw credentials
    assert.ok(!JSON.stringify(resJson).includes('nin'));
    pass('8.3 KYC Webhook handler validates valid signature, normalizes to VERIFIED_NIN, and exposes zero PII');

    // 4. Duplicate Webhook Idempotency
    await kycWebhookHandler(reqValid, resMock1);
    assert.strictEqual(resStatus, 200);
    assert.strictEqual(resJson.idempotent, true);
    pass('8.4 KYC Webhook handler idempotently acknowledges repeated delivery without re-processing');
  } catch (e) { fail('8.x KYC Webhook boundary', e); }


  // --- SECTION 9: ZERO-PII TELEMETRY & ADVERSARIAL SANITIZATION ---
  console.log('\n--- SECTION 9: ZERO-PII TELEMETRY & ADVERSARIAL SANITIZATION ---');

  try {
    const maliciousPayload = {
      event: 'verification_submitted',
      provider_id: 12345,
      doc_type: 'vnin',
      // Adversarial injections:
      nin: '12345678901',
      vnin: '1024567890123456',
      bvn: '22334455667',
      password: 'supersecretpassword',
      token: 'bearer_token_xyz',
      jwt: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      apiKey: 'sk_live_123456789',
      identityDocument: 'base64_encoded_slip_data...',
      document: 'sensitive_slip.pdf',
      rawResponse: { nimc_full_name: 'John Doe', nin: '12345678901' }
    };

    const sanitized = PadiFixMonetization.sanitizeTelemetryPayload(maliciousPayload);

    // Proved stripped:
    assert.strictEqual(sanitized.nin, undefined);
    assert.strictEqual(sanitized.vnin, undefined);
    assert.strictEqual(sanitized.bvn, undefined);
    assert.strictEqual(sanitized.password, undefined);
    assert.strictEqual(sanitized.token, undefined);
    assert.strictEqual(sanitized.jwt, undefined);
    assert.strictEqual(sanitized.apiKey, undefined);
    assert.strictEqual(sanitized.identityDocument, undefined);
    assert.strictEqual(sanitized.document, undefined);
    assert.strictEqual(sanitized.rawResponse, undefined);

    // Preserved safe keys:
    assert.strictEqual(sanitized.event, 'verification_submitted');
    assert.strictEqual(sanitized.provider_id, 12345);
    assert.strictEqual(sanitized.doc_type, 'vnin');

    pass('9.1 sanitizeTelemetryPayload rigorously strips raw NIN, vNIN, BVN, passwords, tokens, and raw KYC payloads');
  } catch (e) { fail('9.1 Telemetry sanitization against adversarial injection', e); }


  // --- SECTION 10: SUPABASE MIGRATION 033 SCHEMA ASSERTIONS ---
  console.log('\n--- SECTION 10: SUPABASE MIGRATION 033 SCHEMA ASSERTIONS ---');

  try {
    const migPath = path.join(__dirname, '../supabase/migrations/033_padifix_provider_verification_operations_gateway.sql');
    assert.ok(fs.existsSync(migPath), 'Migration 033 file must exist');
    const migContent = fs.readFileSync(migPath, 'utf8');

    assert.ok(migContent.includes('idempotency_key'), 'Must add idempotency_key');
    assert.ok(migContent.includes('correlation_id'), 'Must add correlation_id');
    assert.ok(migContent.includes('adapter_name'), 'Must add adapter_name');
    assert.ok(migContent.includes('safe_result_code'), 'Must add safe_result_code');
    assert.ok(migContent.includes('is_compliance_reviewer'), 'Must define is_compliance_reviewer() security function');
    assert.ok(migContent.includes('idx_verification_requests_idempotency'), 'Must index idempotency_key');
    assert.ok(migContent.includes('idx_verification_requests_doc_hash'), 'Must index document_reference_hash');
    pass('10.1 Migration 033 defines idempotency keys, correlation tracking, indexes, and reviewer RLS');
  } catch (e) { fail('10.1 Migration 033 schema assertions', e); }


  // --- SECTION 11: UI SURFACES & COMPLIANCE QUEUE ---
  console.log('\n--- SECTION 11: UI SURFACES & COMPLIANCE QUEUE ---');

  try {
    const queue = await LokatorDB.getVerificationQueue();
    assert.ok(Array.isArray(queue));
    pass('11.1 LokatorDB.getVerificationQueue compiles compliance operational queue');
  } catch (e) { fail('11.1 Compliance queue compilation', e); }

  try {
    const dashHtml = fs.readFileSync(path.join(__dirname, '../dashboard.html'), 'utf8');
    assert.ok(dashHtml.includes('dash-ver-pending-notice'), 'dashboard.html must contain pending notice');
    assert.ok(dashHtml.includes('dash-ver-approved-notice'), 'dashboard.html must contain approved notice');
    assert.ok(dashHtml.includes('dash-ver-rejected-notice'), 'dashboard.html must contain rejected notice');
    assert.ok(dashHtml.includes('btn-resubmit-verification'), 'dashboard.html must contain resubmit button');

    const adminJs = fs.readFileSync(path.join(__dirname, '../admin.js'), 'utf8');
    assert.ok(adminJs.includes('maskedRef'), 'admin.js must use maskedRef for privacy');

    const profileHtml = fs.readFileSync(path.join(__dirname, '../profile.html'), 'utf8');
    assert.ok(profileHtml.includes('modal-trust-explainer'), 'profile.html must contain trust explainer modal');

    pass('11.2 UI templates provide accessible trust centers, rejected/resubmit notices, and masked compliance queues');
  } catch (e) { fail('11.2 UI templates verification', e); }


  console.log('\n================================================================');
  console.log(`PHASE 007 VERIFICATION SUMMARY: ${passedTests} passed, ${failedTests} failed`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
})();
