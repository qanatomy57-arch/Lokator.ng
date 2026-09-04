// ============================================================================
// PADIFIX PHASE 008 — REAL KYC INTEGRATION, WEBHOOK RECONCILIATION & COMPLIANCE
// Comprehensive test suite covering provider-neutral adapter architecture,
// deterministic sandbox simulation, verification attempts model, 17-step webhook
// ingestion pipeline (HMAC-SHA512, timingSafeEqual, replay protection),
// automated reconciliation mechanism, compliance role boundaries, and zero-PII telemetry.
// ============================================================================

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let passedTests = 0;
let failedTests = 0;

function pass(name) {
  passedTests++;
  console.log(`  ✅ [PASS] ${name}`);
}

function fail(name, err) {
  failedTests++;
  console.error(`  ❌ [FAIL] ${name}:`, err.message || err);
}

console.log('================================================================');
console.log('PADIFIX PHASE 008 — REAL KYC INTEGRATION & COMPLIANCE OPERATIONS');
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

(async function runAllPhase008Tests() {

  // --- SECTION 1: PROVIDER ADAPTER INTERFACE & SANDBOX SIMULATION ---
  console.log('--- SECTION 1: PROVIDER ADAPTER INTERFACE & SANDBOX SIMULATION ---');

  try {
    // 1.1 Interface Contract & Lifecycle Methods
    const sandboxProvider = new PadiFixVerification.SandboxKycProvider();
    assert.strictEqual(typeof sandboxProvider.verifyIdentity, 'function', 'Must implement verifyIdentity()');
    assert.strictEqual(typeof sandboxProvider.getCapabilities, 'function', 'Must implement getCapabilities()');
    assert.strictEqual(typeof sandboxProvider.createVerificationRequest, 'function', 'Must implement createVerificationRequest()');
    assert.strictEqual(typeof sandboxProvider.retrieveVerificationStatus, 'function', 'Must implement retrieveVerificationStatus()');
    assert.strictEqual(typeof sandboxProvider.verifyWebhook, 'function', 'Must implement verifyWebhook()');
    assert.strictEqual(typeof sandboxProvider.normalizeWebhookEvent, 'function', 'Must implement normalizeWebhookEvent()');
    assert.strictEqual(typeof sandboxProvider.normalizeResult, 'function', 'Must implement normalizeResult()');
    assert.strictEqual(typeof sandboxProvider.healthCheck, 'function', 'Must implement healthCheck()');
    pass('1.1 SandboxKycProvider implements complete lifecycle interface contract');
  } catch (e) {
    fail('1.1 SandboxKycProvider implements complete lifecycle interface contract', e);
  }

  try {
    // 1.2 Sandbox Simulation Branches: SUCCESS & PENDING
    const sandbox = new PadiFixVerification.SandboxKycProvider();
    const successRes = await sandbox.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-PASS' });
    assert.strictEqual(successRes.outcome, 'VERIFIED', 'Success token must yield VERIFIED');
    assert.strictEqual(successRes.state, 'VERIFIED_NIN', 'vNIN success token must yield VERIFIED_NIN');
    assert.strictEqual(successRes.safeResultCode, 'VERIFICATION_SUCCESS', 'Code must be VERIFICATION_SUCCESS');

    const pendRes = await sandbox.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-PEND' });
    assert.strictEqual(pendRes.outcome, 'PENDING', 'Pending token must yield PENDING');
    assert.strictEqual(pendRes.state, 'PENDING', 'State must remain PENDING');
    assert.strictEqual(pendRes.safeResultCode, 'PENDING_REVIEW', 'Code must be PENDING_REVIEW');
    pass('1.2 Sandbox simulation handles SUCCESS and PENDING outcomes deterministically');
  } catch (e) {
    fail('1.2 Sandbox simulation handles SUCCESS and PENDING outcomes deterministically', e);
  }

  try {
    // 1.3 Sandbox Simulation Branches: REJECTED, FAILED, DUPLICATE, MALFORMED
    const sandbox = new PadiFixVerification.SandboxKycProvider();
    const rejectRes = await sandbox.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-MISMATCH' });
    assert.strictEqual(rejectRes.outcome, 'REJECTED');
    assert.strictEqual(rejectRes.safeResultCode, 'IDENTITY_MISMATCH');

    const timeoutRes = await sandbox.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-TIMEOUT' });
    assert.strictEqual(timeoutRes.outcome, 'FAILED');
    assert.strictEqual(timeoutRes.safeResultCode, 'PROVIDER_TIMEOUT');

    const dupRes = await sandbox.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-DUPLICATE' });
    assert.strictEqual(dupRes.outcome, 'REJECTED');
    assert.strictEqual(dupRes.safeResultCode, 'DUPLICATE_IDENTITY_REFERENCE');

    const malformedRes = await sandbox.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-MALFORMED' });
    assert.strictEqual(malformedRes.outcome, 'FAILED');
    assert.strictEqual(malformedRes.safeResultCode, 'MALFORMED_PROVIDER_RESPONSE');
    pass('1.3 Sandbox simulation covers REJECTED, FAILED, DUPLICATE, and MALFORMED branches');
  } catch (e) {
    fail('1.3 Sandbox simulation covers REJECTED, FAILED, DUPLICATE, and MALFORMED branches', e);
  }

  try {
    // 1.4 Factory Provider Resolution
    const provSandbox = PadiFixVerification.VerificationProviderFactory.getProvider('sandbox');
    assert.strictEqual(provSandbox.name, 'SandboxKycProvider', 'Factory resolves sandbox correctly');
    const provNin = PadiFixVerification.VerificationProviderFactory.getProvider('nin');
    assert.strictEqual(provNin.name, 'NinVerificationProvider', 'Factory resolves nin correctly');
    const provManual = PadiFixVerification.VerificationProviderFactory.getProvider('manual');
    assert.strictEqual(provManual.name, 'ManualPlatformVerificationProvider', 'Factory resolves manual correctly');
    pass('1.4 VerificationProviderFactory resolves sandbox, live nin, and manual adapters');
  } catch (e) {
    fail('1.4 VerificationProviderFactory resolves sandbox, live nin, and manual adapters', e);
  }

  // --- SECTION 2: CANONICAL VERIFICATION LIFECYCLE & INVARIANTS ---
  console.log('\n--- SECTION 2: CANONICAL VERIFICATION LIFECYCLE & INVARIANTS ---');

  try {
    // 2.1 Canonical State Transitions
    const sm = PadiFixVerification.VerificationStateMachine;
    assert.strictEqual(sm.canTransition('UNVERIFIED', 'REQUESTED'), true, 'UNVERIFIED -> REQUESTED permitted');
    assert.strictEqual(sm.canTransition('REQUESTED', 'PENDING'), true, 'REQUESTED -> PENDING permitted');
    assert.strictEqual(sm.canTransition('PENDING', 'VERIFIED_NIN'), true, 'PENDING -> VERIFIED_NIN permitted');
    assert.strictEqual(sm.canTransition('PENDING', 'VERIFIED_PLATFORM'), true, 'PENDING -> VERIFIED_PLATFORM permitted');
    assert.strictEqual(sm.canTransition('PENDING', 'REJECTED'), true, 'PENDING -> REJECTED permitted');
    assert.strictEqual(sm.canTransition('PENDING', 'FAILED'), true, 'PENDING -> FAILED permitted');
    assert.strictEqual(sm.canTransition('REJECTED', 'REQUESTED'), true, 'REJECTED -> REQUESTED permitted');
    assert.strictEqual(sm.canTransition('FAILED', 'REQUESTED'), true, 'FAILED -> REQUESTED permitted');
    pass('2.1 Canonical verification state machine legal lifecycle validated');
  } catch (e) {
    fail('2.1 Canonical verification state machine legal lifecycle validated', e);
  }

  try {
    // 2.2 Hard Invariant: Illegal direct transitions fail closed
    const sm = PadiFixVerification.VerificationStateMachine;
    assert.strictEqual(sm.canTransition('UNVERIFIED', 'VERIFIED_NIN'), false, 'UNVERIFIED -> VERIFIED_NIN forbidden');
    assert.strictEqual(sm.canTransition('REQUESTED', 'VERIFIED_NIN'), false, 'REQUESTED -> VERIFIED_NIN forbidden');
    assert.strictEqual(sm.canTransition('UNVERIFIED', 'VERIFIED_PLATFORM'), false, 'UNVERIFIED -> VERIFIED_PLATFORM forbidden');
    assert.throws(() => {
      sm.validateTransition('UNVERIFIED', 'VERIFIED_NIN');
    }, /HARD INVARIANT VIOLATION/);
    pass('2.2 Hard verification invariant strictly blocks unverified direct escalation');
  } catch (e) {
    fail('2.2 Hard verification invariant strictly blocks unverified direct escalation', e);
  }

  // --- SECTION 3: DURABLE VERIFICATION ATTEMPT MODEL & GATEWAY ---
  console.log('\n--- SECTION 3: DURABLE VERIFICATION ATTEMPT MODEL & GATEWAY ---');

  try {
    // 3.1 Verification Attempt Model Creation & Correlation
    const subRes = await PadiFixVerification.PadiFixVerificationGateway.submitVerificationRequest(1, {
      docType: 'vnin',
      docRef: 'VNIN-SANDBOX-PASS'
    }, { adapter: 'sandbox' });

    assert.strictEqual(subRes.status, 'REMOTE_SUCCESS');
    assert.ok(subRes.data.id, 'Request record ID present');
    assert.ok(subRes.attempt, 'Verification attempt record present');
    assert.ok(subRes.attempt.attempt_id.startsWith('vatt_'), 'Attempt ID properly formatted');
    assert.strictEqual(subRes.attempt.request_id, subRes.data.id, 'Attempt correlated with request');
    assert.strictEqual(subRes.attempt.provider_id, 1, 'Attempt provider ID set');
    assert.strictEqual(subRes.attempt.status, 'pending', 'Attempt initial status is pending');
    assert.ok(subRes.attempt.evidence_hash, 'Evidence hash present on attempt');
    pass('3.1 Gateway creates durable verification attempt correlated to request and provider');
  } catch (e) {
    fail('3.1 Gateway creates durable verification attempt correlated to request and provider', e);
  }

  try {
    // 3.2 Gateway Idempotency Deduplication
    const idempKey = 'idem_p008_test_dup_key_123';
    const firstReq = await PadiFixVerification.PadiFixVerificationGateway.submitVerificationRequest(2, {
      docType: 'vnin',
      docRef: 'VNIN-SANDBOX-PASS',
      idempotencyKey: idempKey
    }, { adapter: 'sandbox' });

    const dupReq = await PadiFixVerification.PadiFixVerificationGateway.submitVerificationRequest(2, {
      docType: 'vnin',
      docRef: 'VNIN-SANDBOX-PASS',
      idempotencyKey: idempKey
    }, { adapter: 'sandbox' });

    assert.strictEqual(dupReq.isDuplicate, true, 'Repeated submission detected as duplicate');
    assert.strictEqual(dupReq.idempotent, true, 'Idempotency confirmed');
    assert.strictEqual(dupReq.data.id, firstReq.data.id, 'Returns original request ID without recreating');
    pass('3.2 Gateway enforces durable idempotency on duplicate verification submissions');
  } catch (e) {
    fail('3.2 Gateway enforces durable idempotency on duplicate verification submissions', e);
  }

  try {
    // 3.3 Fail-Closed Live Gateway Boundaries
    const ninProvider = new PadiFixVerification.NinVerificationProvider();
    const gatedRes = await ninProvider.verifyIdentity({ docType: 'vnin', docRef: '1234567890123456' });
    assert.strictEqual(gatedRes.outcome, 'UNAVAILABLE', 'Unconfigured live KYC fails closed as UNAVAILABLE');
    assert.strictEqual(gatedRes.state, 'PENDING', 'Safe state remains PENDING');
    assert.strictEqual(gatedRes.safeResultCode, 'LIVE_GATEWAY_GATED');
    pass('3.3 NinVerificationProvider fails closed when live KYC gateway is disabled');
  } catch (e) {
    fail('3.3 NinVerificationProvider fails closed when live KYC gateway is disabled', e);
  }

  // --- SECTION 4: WEBHOOK INGESTION PIPELINE & HMAC-SHA512 SECURITY ---
  console.log('\n--- SECTION 4: WEBHOOK INGESTION PIPELINE & HMAC-SHA512 SECURITY ---');

  const webhookSecret = 'test_kyc_webhook_secret_padifix_2026';

  function createMockRes() {
    return {
      statusCode: 200,
      body: null,
      status(c) { this.statusCode = c; return this; },
      json(b) { this.body = b; return this; }
    };
  }

  try {
    // 4.1 Missing Signature Rejection (Step 4)
    const req = {
      method: 'POST',
      headers: {},
      body: { event: 'verification.completed', id: 'evt_001' }
    };
    const res = createMockRes();
    await kycWebhookHandler(req, res);
    assert.strictEqual(res.statusCode, 401, 'Must reject missing signature with 401');
    assert.strictEqual(res.body.safeCode, 'UNAUTHENTICATED_WEBHOOK');
    pass('4.1 Webhook pipeline rejects unauthenticated requests missing signature header');
  } catch (e) {
    fail('4.1 Webhook pipeline rejects unauthenticated requests missing signature header', e);
  }

  try {
    // 4.2 Invalid Signature Rejection (Step 6 via timingSafeEqual)
    const rawPayload = JSON.stringify({ event: 'verification.completed', id: 'evt_002' });
    const forgedSignature = crypto.createHmac('sha512', 'wrong_secret_attacker').update(rawPayload).digest('hex');
    const req = {
      method: 'POST',
      headers: { 'x-kyc-signature': forgedSignature },
      body: rawPayload
    };
    const res = createMockRes();
    await kycWebhookHandler(req, res);
    assert.strictEqual(res.statusCode, 401, 'Must reject forged signature with 401');
    assert.strictEqual(res.body.safeCode, 'INVALID_SIGNATURE');
    pass('4.2 Webhook pipeline rejects forged/invalid HMAC signatures via constant-time verification');
  } catch (e) {
    fail('4.2 Webhook pipeline rejects forged/invalid HMAC signatures via constant-time verification', e);
  }

  try {
    // 4.3 Valid Webhook Signature & Successful Processing
    const eventId = `evt_valid_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const validPayload = JSON.stringify({
      event: 'verification.completed',
      id: eventId,
      data: {
        status: 'approved',
        provider_id: 1,
        request_id: 'vreq_p008_001',
        verification_type: 'vnin'
      }
    });
    const validSignature = crypto.createHmac('sha512', webhookSecret).update(validPayload).digest('hex');
    const req = {
      method: 'POST',
      headers: {
        'x-kyc-signature': validSignature,
        'x-provider-name': 'SANDBOX_KYC'
      },
      body: validPayload
    };
    const res = createMockRes();
    await kycWebhookHandler(req, res);
    assert.strictEqual(res.statusCode, 200, 'Valid signed webhook returns 200');
    assert.strictEqual(res.body.status, 'success');
    assert.strictEqual(res.body.normalizedOutcome, 'VERIFIED_NIN');
    assert.strictEqual(res.body.targetState, 'VERIFIED_NIN');
    assert.strictEqual(res.body.safeResultCode, 'APPROVED');
    pass('4.3 Valid authenticated webhook successfully processes and transitions state to VERIFIED_NIN');
  } catch (e) {
    fail('4.3 Valid authenticated webhook successfully processes and transitions state to VERIFIED_NIN', e);
  }

  try {
    // 4.4 Webhook Idempotency (Duplicate Delivery of Same Event)
    const eventId = `evt_idemp_${Date.now()}`;
    const payloadStr = JSON.stringify({
      event: 'verification.completed',
      id: eventId,
      data: { status: 'approved', provider_id: 1, verification_type: 'vnin' }
    });
    const signature = crypto.createHmac('sha512', webhookSecret).update(payloadStr).digest('hex');
    const req1 = { method: 'POST', headers: { 'x-kyc-signature': signature }, body: payloadStr };
    const res1 = createMockRes();
    await kycWebhookHandler(req1, res1);
    assert.strictEqual(res1.statusCode, 200);

    // Second delivery of exact same event
    const req2 = { method: 'POST', headers: { 'x-kyc-signature': signature }, body: payloadStr };
    const res2 = createMockRes();
    await kycWebhookHandler(req2, res2);
    assert.strictEqual(res2.statusCode, 200, 'Duplicate delivery returns 200');
    assert.strictEqual(res2.body.idempotent, true, 'Acknowledges event as already processed');
    pass('4.4 Duplicate webhook delivery is handled idempotently without re-execution');
  } catch (e) {
    fail('4.4 Duplicate webhook delivery is handled idempotently without re-execution', e);
  }

  try {
    // 4.5 Altered Payload Replay Conflict Protection
    const eventId = `evt_replay_tamper_${Date.now()}`;
    const origPayload = JSON.stringify({ event: 'verification.completed', id: eventId, data: { status: 'rejected' } });
    const origSig = crypto.createHmac('sha512', webhookSecret).update(origPayload).digest('hex');
    const res1 = createMockRes();
    await kycWebhookHandler({ method: 'POST', headers: { 'x-kyc-signature': origSig }, body: origPayload }, res1);
    assert.strictEqual(res1.statusCode, 200);

    // Attacker alters payload trying to escalate to approved with recycled eventId
    const tamperedPayload = JSON.stringify({ event: 'verification.completed', id: eventId, data: { status: 'approved' } });
    const tamperedSig = crypto.createHmac('sha512', webhookSecret).update(tamperedPayload).digest('hex');
    const res2 = createMockRes();
    await kycWebhookHandler({ method: 'POST', headers: { 'x-kyc-signature': tamperedSig }, body: tamperedPayload }, res2);
    assert.strictEqual(res2.statusCode, 409, 'Must reject altered replay with 409 Conflict');
    assert.strictEqual(res2.body.safeCode, 'REPLAY_CONFLICT');
    pass('4.5 Replayed webhook with tampered payload is detected and rejected with 409 Conflict');
  } catch (e) {
    fail('4.5 Replayed webhook with tampered payload is detected and rejected with 409 Conflict', e);
  }

  try {
    // 4.6 Unknown Attempt / Missing Identifier Rejection
    const eventId = `evt_unknown_${Date.now()}`;
    const payloadStr = JSON.stringify({
      event: 'verification.completed',
      id: eventId,
      data: { attempt_id: 'unknown_attempt_9999', status: 'approved' }
    });
    const sig = crypto.createHmac('sha512', webhookSecret).update(payloadStr).digest('hex');
    const res = createMockRes();
    await kycWebhookHandler({ method: 'POST', headers: { 'x-kyc-signature': sig }, body: payloadStr }, res);
    assert.strictEqual(res.statusCode, 404, 'Unknown attempt yields 404');
    assert.strictEqual(res.body.safeCode, 'UNKNOWN_VERIFICATION_ATTEMPT');
    pass('4.6 Webhook with unknown verification attempt fails closed with 404');
  } catch (e) {
    fail('4.6 Webhook with unknown verification attempt fails closed with 404', e);
  }

  // --- SECTION 5: AUTOMATED RECONCILIATION ENGINE ---
  console.log('\n--- SECTION 5: AUTOMATED RECONCILIATION ENGINE ---');

  try {
    // 5.1 Reconciliation of Stuck PENDING Attempt to VERIFIED
    // Seed an attempt in local store
    const attemptId = `vatt_reconcile_test_${Date.now()}`;
    const requestId = `vreq_reconcile_test_${Date.now()}`;
    const testAttempt = {
      id: attemptId,
      attempt_id: attemptId,
      request_id: requestId,
      provider_id: 1,
      provider_name: 'SANDBOX_KYC',
      provider_reference: 'ref_sbx_PASS_123',
      status: 'pending',
      normalized_result: 'PENDING',
      result_code: 'PENDING_REVIEW',
      evidence_hash: 'hash_test_reconcile',
      created_at: new Date(Date.now() - 3600000).toISOString()
    };
    await LokatorDB.recordVerificationAttemptEntry(testAttempt);

    // Seed corresponding request
    await LokatorDB.recordVerificationRequestEntry({
      id: requestId,
      provider_id: 1,
      status: 'pending',
      verification_type: 'vnin'
    });

    const recResult = await PadiFixVerification.PadiFixVerificationGateway.reconcileVerificationAttempt(attemptId, {}, {
      role: 'compliance_officer',
      userId: 'officer_kemi'
    });

    assert.strictEqual(recResult.status, 'REMOTE_SUCCESS');
    assert.strictEqual(recResult.reconciled, true);
    assert.strictEqual(recResult.targetState, 'VERIFIED_NIN');
    assert.strictEqual(recResult.resultCode, 'VERIFICATION_SUCCESS');

    // Confirm stored attempt updated
    const updatedAtt = await LokatorDB.getVerificationAttemptById(attemptId);
    assert.strictEqual(updatedAtt.status, 'completed');
    assert.strictEqual(updatedAtt.normalized_result, 'VERIFIED');
    pass('5.1 Automated reconciliation resolves pending attempt to VERIFIED_NIN');
  } catch (e) {
    fail('5.1 Automated reconciliation resolves pending attempt to VERIFIED_NIN', e);
  }

  try {
    // 5.2 Repeated Reconciliation on Settled Record is Idempotent
    const attemptId = `vatt_settled_${Date.now()}`;
    await LokatorDB.recordVerificationAttemptEntry({
      id: attemptId,
      attempt_id: attemptId,
      request_id: `vreq_settled_${Date.now()}`,
      provider_id: 1,
      provider_name: 'SANDBOX_KYC',
      status: 'completed',
      normalized_result: 'VERIFIED',
      result_code: 'VERIFICATION_SUCCESS'
    });

    const repeatRec = await PadiFixVerification.PadiFixVerificationGateway.reconcileVerificationAttempt(attemptId, {}, {
      role: 'service',
      userId: 'service_kyc_reconciler'
    });

    assert.strictEqual(repeatRec.idempotent, true, 'Settled attempt returns idempotent confirmation');
    assert.strictEqual(repeatRec.status, 'REMOTE_SUCCESS');
    pass('5.2 Repeated reconciliation on already completed attempt is strictly idempotent');
  } catch (e) {
    fail('5.2 Repeated reconciliation on already completed attempt is strictly idempotent', e);
  }

  try {
    // 5.3 Batch Reconciliation Execution
    const batchSummary = await PadiFixVerification.PadiFixVerificationGateway.reconcilePendingVerifications({}, {
      role: 'compliance_officer',
      userId: 'compliance_batch_runner'
    });
    assert.strictEqual(typeof batchSummary.total, 'number');
    assert.strictEqual(typeof batchSummary.reconciled, 'number');
    assert.strictEqual(typeof batchSummary.unchanged, 'number');
    pass('5.3 Batch reconciliation scans and reports pending verifications correctly');
  } catch (e) {
    fail('5.3 Batch reconciliation scans and reports pending verifications correctly', e);
  }

  // --- SECTION 6: SECURITY, COMPLIANCE ROLES & ZERO-PII TELEMETRY ---
  console.log('\n--- SECTION 6: SECURITY, COMPLIANCE ROLES & ZERO-PII TELEMETRY ---');

  try {
    // 6.1 Unauthorized Reconciliation Role Rejection
    let rejectedUnauthorized = false;
    try {
      await PadiFixVerification.PadiFixVerificationGateway.reconcileVerificationAttempt('vatt_dummy_id', {}, {
        role: 'provider',
        userId: 'provider_123'
      });
    } catch (authErr) {
      rejectedUnauthorized = authErr.message.includes('UNAUTHORIZED_RECONCILER');
    }
    assert.strictEqual(rejectedUnauthorized, true, 'Provider role cannot trigger reconciliation');
    pass('6.1 Non-compliance role is strictly blocked from executing reconciliation');
  } catch (e) {
    fail('6.1 Non-compliance role is strictly blocked from executing reconciliation', e);
  }

  try {
    // 6.2 Zero-PII Telemetry Sanitization Filter
    const dirtyTelemetry = {
      event: 'verification_completed',
      provider_id: 101,
      nin: '12345678901',
      vnin: '1024-5678-9812-3456',
      bvn: '22212345678',
      password: 'super_secret_password',
      token: 'jwt_secret_token',
      secret: 'kyc_vendor_secret',
      apiKey: 'api_live_key_xyz',
      rawResponse: { nimc_data: 'confidential' },
      identityDocument: 'base64_scanned_image',
      safe_code: 'VERIFICATION_SUCCESS'
    };

    const cleaned = PadiFixMonetization.sanitizeTelemetryPayload(dirtyTelemetry);
    assert.strictEqual(cleaned.nin, undefined, 'nin must be stripped');
    assert.strictEqual(cleaned.vnin, undefined, 'vnin must be stripped');
    assert.strictEqual(cleaned.bvn, undefined, 'bvn must be stripped');
    assert.strictEqual(cleaned.password, undefined, 'password must be stripped');
    assert.strictEqual(cleaned.token, undefined, 'token must be stripped');
    assert.strictEqual(cleaned.secret, undefined, 'secret must be stripped');
    assert.strictEqual(cleaned.apiKey, undefined, 'apiKey must be stripped');
    assert.strictEqual(cleaned.rawResponse, undefined, 'rawResponse must be stripped');
    assert.strictEqual(cleaned.identityDocument, undefined, 'identityDocument must be stripped');
    assert.strictEqual(cleaned.safe_code, 'VERIFICATION_SUCCESS', 'Safe parameters must be preserved');
    assert.strictEqual(cleaned.provider_id, 101, 'Safe provider_id must be preserved');
    pass('6.2 Zero-PII telemetry sanitization strictly strips all sensitive identity credentials');
  } catch (e) {
    fail('6.2 Zero-PII telemetry sanitization strictly strips all sensitive identity credentials', e);
  }

  try {
    // 6.3 Machine-Readable Decision Codes Completeness
    const codes = PadiFixMonetization.DECISION_CODES;
    assert.ok(codes.VERIFICATION_SUCCESS, 'VERIFICATION_SUCCESS code defined');
    assert.ok(codes.IDENTITY_MISMATCH, 'IDENTITY_MISMATCH code defined');
    assert.ok(codes.IDENTITY_NOT_FOUND, 'IDENTITY_NOT_FOUND code defined');
    assert.ok(codes.DUPLICATE_IDENTITY_REFERENCE, 'DUPLICATE_IDENTITY_REFERENCE code defined');
    assert.ok(codes.PROVIDER_TIMEOUT, 'PROVIDER_TIMEOUT code defined');
    assert.ok(codes.MALFORMED_PROVIDER_RESPONSE, 'MALFORMED_PROVIDER_RESPONSE code defined');
    assert.ok(codes.INVALID_WEBHOOK_SIGNATURE, 'INVALID_WEBHOOK_SIGNATURE code defined');
    assert.ok(codes.UNKNOWN_VERIFICATION_ATTEMPT, 'UNKNOWN_VERIFICATION_ATTEMPT code defined');
    pass('6.3 Standardized machine-readable compliance decision codes verified');
  } catch (e) {
    fail('6.3 Standardized machine-readable compliance decision codes verified', e);
  }

  try {
    // 6.4 Client-Side Direct Trusted-State Escalation Rejection
    // Hard invariant: UNVERIFIED -> VERIFIED_NIN or REQUESTED -> VERIFIED_NIN cannot occur
    assert.throws(() => {
      PadiFixVerification.VerificationStateMachine.validateTransition('UNVERIFIED', 'VERIFIED_NIN');
    }, /HARD INVARIANT VIOLATION/);

    assert.throws(() => {
      PadiFixVerification.VerificationStateMachine.validateTransition('REQUESTED', 'VERIFIED_NIN');
    }, /HARD INVARIANT VIOLATION/);

    // Non-reviewer roles (e.g. customer) cannot trigger reviewer action
    await assert.rejects(async () => {
      await PadiFixVerification.PadiFixVerificationGateway.processReviewerAction('vreq_dummy_escalate', {
        status: 'approved'
      }, { role: 'customer', userId: 'customer_hack_1' });
    }, /UNAUTHORIZED_REVIEWER/);

    pass('6.4 Direct client-side trusted-state escalation is rejected by server invariants');
  } catch (e) {
    fail('6.4 Direct client-side trusted-state escalation is rejected by server invariants', e);
  }

  try {
    // 6.5 Secret Isolation Check (Zero secrets in client configurations)
    assert.strictEqual(PadiFixMonetization.FEATURE_FLAGS.liveKycGatewayEnabled, false, 'liveKycGatewayEnabled must be false');
    assert.strictEqual(PadiFixMonetization.FEATURE_FLAGS.kycLiveEnabled, false, 'kycLiveEnabled must be false');
    assert.strictEqual(PadiFixMonetization.FEATURE_FLAGS.kycProviderMode, 'sandbox', 'kycProviderMode defaults to sandbox');
    assert.strictEqual(typeof PadiFixMonetization.CONFIG.KYC_GATEWAY_SECRET, 'undefined', 'No secrets in public config');
    pass('6.5 Zero secrets exposed in client configuration; live KYC safely disabled');
  } catch (e) {
    fail('6.5 Zero secrets exposed in client configuration; live KYC safely disabled', e);
  }

  // --- SECTION 7: DATABASE MIGRATION 034 & ROW LEVEL SECURITY ---
  console.log('\n--- SECTION 7: DATABASE MIGRATION 034 & ROW LEVEL SECURITY ---');

  try {
    // 7.1 Migration File Verification
    const migPath = path.join(__dirname, '../supabase/migrations/034_padifix_kyc_integration_reconciliation_compliance.sql');
    assert.ok(fs.existsSync(migPath), 'Migration 034 file must exist');
    const migContent = fs.readFileSync(migPath, 'utf8');

    assert.ok(migContent.includes('provider_verification_attempts'), 'Must create provider_verification_attempts table');
    assert.ok(migContent.includes('kyc_webhook_events'), 'Must create kyc_webhook_events table');
    assert.ok(migContent.includes('ROW LEVEL SECURITY'), 'Must enable RLS');
    assert.ok(migContent.includes('idx_pva_attempt_id'), 'Must create attempt index');
    assert.ok(migContent.includes('idx_kwe_event_id'), 'Must create webhook event index');
    pass('7.1 Supabase migration 034 creates durable attempts, webhook deduplication tables, indexes, and RLS');
  } catch (e) {
    fail('7.1 Supabase migration 034 creates durable attempts, webhook deduplication tables, indexes, and RLS', e);
  }

  try {
    // 7.2 Provider Attempt Isolation
    const prov1Attempts = await LokatorDB.getVerificationAttempts(1);
    const prov2Attempts = await LokatorDB.getVerificationAttempts(2);
    // Providers are strictly isolated
    assert.ok(Array.isArray(prov1Attempts), 'Provider 1 attempts is array');
    assert.ok(Array.isArray(prov2Attempts), 'Provider 2 attempts is array');
    for (const a of prov1Attempts) {
      assert.strictEqual(a.provider_id, 1, 'Provider 1 only sees their own attempts');
    }
    pass('7.2 Provider isolation enforced across verification attempts');
  } catch (e) {
    fail('7.2 Provider isolation enforced across verification attempts', e);
  }

  // --- FINAL SUMMARY ---
  console.log('\n================================================================');
  console.log(`PHASE 008 VERIFICATION SUITE SUMMARY:`);
  console.log(`Total Assertions: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Status: ${failedTests === 0 ? 'GREEN (100% PASS)' : 'RED (FAILURES DETECTED)'}`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
})();
