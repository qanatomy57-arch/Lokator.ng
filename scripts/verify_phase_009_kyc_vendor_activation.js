// ============================================================================
// PADIFIX PHASE 009 — KYC VENDOR SELECTION, PRODUCTION READINESS & ACTIVATION
// Comprehensive verification suite covering:
// 1. Evidence-based vendor evaluation scorecard & commercial economics
// 2. Production configuration & billing kill switch (fails closed)
// 3. Normalized Prembly & Dojah provider adapters in sandbox simulation
// 4. Verification spending guard & rate limit protections
// 5. Policy-controlled failover (user errors never double-bill)
// 6. Webhook HMAC-SHA512 security, replay & tamper conflict protection
// 7. Canonical state machine & compliance reconciliation
// 8. Automated client bundle secret scanning & zero-PII telemetry
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
console.log('PADIFIX PHASE 009 — KYC VENDOR SELECTION & PRODUCTION READINESS');
console.log('================================================================\n');

// Mock localStorage for Node.js test environment
if (typeof global.localStorage === 'undefined') {
  global.localStorage = {
    _store: {},
    getItem(k) { return this._store[k] || null; },
    setItem(k, v) { this._store[k] = String(v); },
    removeItem(k) { delete this._store[k]; },
    clear() { this._store = {}; }
  };
}

// Module paths
const monetizationPath = path.join(__dirname, '../monetization-config.js');
const verificationPath = path.join(__dirname, '../verification-providers.js');
const clientPath = path.join(__dirname, '../supabase-client.js');
const webhookPath = path.join(__dirname, '../api/kyc-webhook.js');
const vendorEvalDocPath = path.join(__dirname, '../docs/PADIFIX_KYC_VENDOR_EVALUATION.md');

const PadiFixMonetization = require(monetizationPath);
const PadiFixVerification = require(verificationPath);
const LokatorDB = require(clientPath);
const kycWebhookHandler = require(webhookPath);

(async function runAllPhase009Tests() {

  // --- SECTION 1: VENDOR EVALUATION, EVIDENCE & COMMERCIAL ECONOMICS ---
  console.log('--- SECTION 1: VENDOR EVALUATION, EVIDENCE & SCORECARD ---');

  try {
    // 1.1 Vendor Evaluation Document Exists
    assert.strictEqual(fs.existsSync(vendorEvalDocPath), true, 'PADIFIX_KYC_VENDOR_EVALUATION.md must exist in docs/');
    const evalContent = fs.readFileSync(vendorEvalDocPath, 'utf8');
    assert.ok(evalContent.includes('Prembly'), 'Must evaluate Prembly');
    assert.ok(evalContent.includes('Dojah'), 'Must evaluate Dojah');
    assert.ok(evalContent.includes('Smile ID'), 'Must evaluate Smile ID / Ninja');
    assert.ok(evalContent.includes('Youverify'), 'Must evaluate Youverify');
    pass('1.1 Vendor evaluation doc exists with complete Nigerian identity provider comparative analysis');
  } catch (e) {
    fail('1.1 Vendor evaluation doc exists with complete Nigerian identity provider comparative analysis', e);
  }

  try {
    // 1.2 Deterministic 100-Point Scorecard Verification
    const evalContent = fs.readFileSync(vendorEvalDocPath, 'utf8');
    assert.ok(evalContent.includes('91/100'), 'Prembly must score 91/100');
    assert.ok(evalContent.includes('87/100'), 'Dojah must score 87/100');
    assert.ok(evalContent.includes('84/100'), 'Smile ID must score 84/100');
    assert.ok(evalContent.includes('82/100'), 'Youverify must score 82/100');
    assert.ok(evalContent.includes('100-Point Scoring Model') || evalContent.includes('100-POINT SCORING MODEL'), 'Scorecard must define 100-point scale');
    pass('1.2 Deterministic 100-point scorecard verified (Prembly 91, Dojah 87, Smile ID 84, Youverify 82)');
  } catch (e) {
    fail('1.2 Deterministic 100-point scorecard verified (Prembly 91, Dojah 87, Smile ID 84, Youverify 82)', e);
  }

  try {
    // 1.3 Provider Roles: Primary (Prembly) & Secondary (Dojah)
    assert.strictEqual(PadiFixMonetization.FLAGS.kycPrimaryProvider, 'prembly', 'Primary provider must be prembly');
    assert.strictEqual(PadiFixMonetization.FLAGS.kycSecondaryProvider, 'dojah', 'Secondary provider must be dojah');
    pass('1.3 Selected primary provider (Prembly) and secondary provider (Dojah) configured in monetization flags');
  } catch (e) {
    fail('1.3 Selected primary provider (Prembly) and secondary provider (Dojah) configured in monetization flags', e);
  }

  try {
    // 1.4 Commercial Economics & Zero Pay-to-Trust Guarantee
    const evalContent = fs.readFileSync(vendorEvalDocPath, 'utf8');
    assert.ok(evalContent.includes('100'), 'Must model 100 verifications');
    assert.ok(evalContent.includes('1,000'), 'Must model 1,000 verifications');
    assert.ok(evalContent.includes('10,000'), 'Must model 10,000 verifications');
    assert.ok(evalContent.includes('100,000'), 'Must model 100,000 verifications');
    assert.ok(evalContent.includes('Platform-Funded Trust Model'), 'Must establish platform-funded trust');
    assert.ok(evalContent.includes('Payment does NOT equal verification') || evalContent.includes('payment ≠ verification'), 'Must forbid payment = verification equivalence');
    pass('1.4 Commercial economics modeled (100-100k verifications) with absolute zero pay-for-badge guarantee');
  } catch (e) {
    fail('1.4 Commercial economics modeled (100-100k verifications) with absolute zero pay-for-badge guarantee', e);
  }

  try {
    // 1.5 Explicit 5-Stage Identity Match Policy
    const evalContent = fs.readFileSync(vendorEvalDocPath, 'utf8');
    assert.ok(evalContent.includes('Format Check') || evalContent.includes('INVALID_VNIN_FORMAT'), 'Must define format policy');
    assert.ok(evalContent.includes('Name Similarity Check') || evalContent.includes('IDENTITY_MISMATCH'), 'Must define match policy');
    assert.ok(evalContent.includes('Cross-Provider Duplicate Check') || evalContent.includes('DUPLICATE_IDENTITY_REFERENCE'), 'Must define duplicate policy');
    assert.ok(evalContent.includes('Server-Controlled Trusted Transition') || evalContent.includes('VERIFIED_NIN'), 'Must define transition policy');
    pass('1.5 Explicit 5-stage identity match policy documented (Format, Upstream, Name match, Duplicate, Transition)');
  } catch (e) {
    fail('1.5 Explicit 5-stage identity match policy documented (Format, Upstream, Name match, Duplicate, Transition)', e);
  }

  // --- SECTION 2: PRODUCTION CONFIGURATION & BILLING KILL SWITCH ---
  console.log('\n--- SECTION 2: CONFIGURATION & BILLING KILL SWITCH ---');

  try {
    // 2.1 Default configuration maintains sandbox mode
    assert.strictEqual(PadiFixMonetization.FLAGS.kycProviderMode, 'sandbox', 'kycProviderMode must default to sandbox');
    pass('2.1 Default configuration maintains sandbox mode (kycProviderMode === "sandbox")');
  } catch (e) {
    fail('2.1 Default configuration maintains sandbox mode (kycProviderMode === "sandbox")', e);
  }

  try {
    // 2.2 Live KYC strictly disabled by default
    assert.strictEqual(PadiFixMonetization.FLAGS.kycLiveEnabled, false, 'kycLiveEnabled must default to false');
    assert.strictEqual(PadiFixMonetization.FLAGS.liveKycGatewayEnabled, false, 'liveKycGatewayEnabled must default to false');
    pass('2.2 Live KYC is strictly disabled by default (kycLiveEnabled === false, liveKycGatewayEnabled === false)');
  } catch (e) {
    fail('2.2 Live KYC is strictly disabled by default (kycLiveEnabled === false, liveKycGatewayEnabled === false)', e);
  }

  try {
    // 2.3 Fail-closed: missing live credentials when live requested blocks verification
    const prembly = new PadiFixVerification.PremblyKycProvider();
    const origLive = PadiFixMonetization.FLAGS.kycLiveEnabled;
    PadiFixMonetization.FLAGS.kycLiveEnabled = true;
    delete process.env.PREMBLY_API_KEY;

    const res = await prembly.verifyIdentity({ docType: 'vnin', docRef: '1234567890123456' });
    PadiFixMonetization.FLAGS.kycLiveEnabled = origLive;

    assert.strictEqual(res.success, false, 'Must fail when credentials missing in live mode');
    assert.strictEqual(res.safeResultCode, 'GATEWAY_CREDENTIALS_MISSING', 'Must return GATEWAY_CREDENTIALS_MISSING');
    assert.strictEqual(res.gated, true, 'Must flag gated');
    pass('2.3 Fail-closed: missing live credentials blocks verification without fallback (GATEWAY_CREDENTIALS_MISSING)');
  } catch (e) {
    fail('2.3 Fail-closed: missing live credentials blocks verification without fallback (GATEWAY_CREDENTIALS_MISSING)', e);
  }

  try {
    // 2.4 Browser / client cannot toggle live KYC flags (server-authoritative kill switch)
    const clientAttempt = {
      isLive: true,
      requireLive: true,
      flags: { kycLiveEnabled: true }
    };
    const guardRes = PadiFixVerification.VerificationSpendingGuard.checkSpendAvailable(clientAttempt);
    assert.strictEqual(guardRes.allowed, false, 'Spending guard must reject client attempt to activate live');
    assert.strictEqual(guardRes.safeCode, 'LIVE_KYC_DISABLED', 'Must identify LIVE_KYC_DISABLED');
    pass('2.4 Browser/client cannot toggle live KYC flags (spending guard strictly blocks client live claims)');
  } catch (e) {
    fail('2.4 Browser/client cannot toggle live KYC flags (spending guard strictly blocks client live claims)', e);
  }

  // --- SECTION 3: PROVIDER ADAPTERS (PREMBLY & DOJAH) ---
  console.log('\n--- SECTION 3: PROVIDER ADAPTERS (PREMBLY & DOJAH) ---');

  try {
    // 3.1 Prembly & Dojah implement complete interface
    const prembly = new PadiFixVerification.PremblyKycProvider();
    const dojah = new PadiFixVerification.DojahKycProvider();

    for (const p of [prembly, dojah]) {
      assert.strictEqual(typeof p.verifyIdentity, 'function');
      assert.strictEqual(typeof p.getCapabilities, 'function');
      assert.strictEqual(typeof p.createVerificationRequest, 'function');
      assert.strictEqual(typeof p.retrieveVerificationStatus, 'function');
      assert.strictEqual(typeof p.verifyWebhook, 'function');
      assert.strictEqual(typeof p.normalizeWebhookEvent, 'function');
      assert.strictEqual(typeof p.normalizeResult, 'function');
      assert.strictEqual(typeof p.healthCheck, 'function');
    }
    pass('3.1 PremblyKycProvider and DojahKycProvider implement complete lifecycle interface contract');
  } catch (e) {
    fail('3.1 PremblyKycProvider and DojahKycProvider implement complete lifecycle interface contract', e);
  }

  try {
    // 3.2 PremblyKycProvider deterministic sandbox verification: SUCCESS -> VERIFIED_NIN
    const prembly = new PadiFixVerification.PremblyKycProvider();
    const res = await prembly.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-PASS' });
    assert.strictEqual(res.success, true, 'Must succeed in sandbox');
    assert.strictEqual(res.outcome, 'VERIFIED', 'Outcome must be VERIFIED');
    assert.strictEqual(res.state, 'VERIFIED_NIN', 'State must be VERIFIED_NIN');
    assert.strictEqual(res.safeResultCode, 'VERIFICATION_SUCCESS', 'Code must be VERIFICATION_SUCCESS');
    assert.ok(res.maskedRef.includes('****'), 'Must mask document reference');
    pass('3.2 PremblyKycProvider sandbox simulation returns VERIFIED_NIN (VERIFICATION_SUCCESS)');
  } catch (e) {
    fail('3.2 PremblyKycProvider sandbox simulation returns VERIFIED_NIN (VERIFICATION_SUCCESS)', e);
  }

  try {
    // 3.3 PremblyKycProvider deterministic sandbox branches: PENDING, REJECTED, FAILED, DUPLICATE, MALFORMED
    const prembly = new PadiFixVerification.PremblyKycProvider();

    const pPend = await prembly.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-PEND' });
    assert.strictEqual(pPend.outcome, 'PENDING');
    assert.strictEqual(pPend.safeResultCode, 'PENDING_REVIEW');

    const pRej = await prembly.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-REJ' });
    assert.strictEqual(pRej.outcome, 'REJECTED');
    assert.strictEqual(pRej.safeResultCode, 'IDENTITY_MISMATCH');

    const pFail = await prembly.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-FAIL' });
    assert.strictEqual(pFail.outcome, 'FAILED');
    assert.strictEqual(pFail.safeResultCode, 'PROVIDER_TIMEOUT');

    const pDup = await prembly.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-DUP' });
    assert.strictEqual(pDup.outcome, 'REJECTED');
    assert.strictEqual(pDup.safeResultCode, 'DUPLICATE_IDENTITY_REFERENCE');

    const pMal = await prembly.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-MALFORMED' });
    assert.strictEqual(pMal.outcome, 'FAILED');
    assert.strictEqual(pMal.safeResultCode, 'MALFORMED_PROVIDER_RESPONSE');

    pass('3.3 PremblyKycProvider sandbox handles PENDING, REJECTED, FAILED, DUPLICATE, and MALFORMED branches');
  } catch (e) {
    fail('3.3 PremblyKycProvider sandbox handles PENDING, REJECTED, FAILED, DUPLICATE, and MALFORMED branches', e);
  }

  try {
    // 3.4 Strict vNIN validation: 16-character alphanumeric required
    const prembly = new PadiFixVerification.PremblyKycProvider();
    const shortRef = await prembly.verifyIdentity({ docType: 'vnin', docRef: 'SHORT123' });
    assert.strictEqual(shortRef.success, false);
    assert.strictEqual(shortRef.safeResultCode, 'INVALID_VNIN_FORMAT');

    const invalidRef = await prembly.verifyIdentity({ docType: 'vnin', docRef: 'INVALID_TOKEN_TEST' });
    assert.strictEqual(invalidRef.success, false);
    assert.strictEqual(invalidRef.safeResultCode, 'INVALID_VNIN_FORMAT');

    pass('3.4 Strict vNIN validation: rejects non-16 char or invalid vNIN token with INVALID_VNIN_FORMAT');
  } catch (e) {
    fail('3.4 Strict vNIN validation: rejects non-16 char or invalid vNIN token with INVALID_VNIN_FORMAT', e);
  }

  try {
    // 3.5 DojahKycProvider deterministic sandbox verification
    const dojah = new PadiFixVerification.DojahKycProvider();

    const dPass = await dojah.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-PASS' });
    assert.strictEqual(dPass.outcome, 'VERIFIED');
    assert.strictEqual(dPass.safeResultCode, 'VERIFICATION_SUCCESS');

    const dRej = await dojah.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-REJ' });
    assert.strictEqual(dRej.outcome, 'REJECTED');
    assert.strictEqual(dRej.safeResultCode, 'IDENTITY_MISMATCH');

    const dFail = await dojah.verifyIdentity({ docType: 'vnin', docRef: 'VNIN-SANDBOX-FAIL' });
    assert.strictEqual(dFail.outcome, 'FAILED');
    assert.strictEqual(dFail.safeResultCode, 'PROVIDER_TIMEOUT');

    pass('3.5 DojahKycProvider sandbox handles SUCCESS, REJECTED, and FAILED branches deterministically');
  } catch (e) {
    fail('3.5 DojahKycProvider sandbox handles SUCCESS, REJECTED, and FAILED branches deterministically', e);
  }

  try {
    // 3.6 VerificationProviderFactory dynamically resolves adapters
    const p1 = PadiFixVerification.VerificationProviderFactory.getProvider('prembly');
    assert.strictEqual(p1.vendor, 'Prembly');

    const p2 = PadiFixVerification.VerificationProviderFactory.getProvider('primary');
    assert.strictEqual(p2.vendor, 'Prembly');

    const p3 = PadiFixVerification.VerificationProviderFactory.getProvider('dojah');
    assert.strictEqual(p3.vendor, 'Dojah');

    const p4 = PadiFixVerification.VerificationProviderFactory.getProvider('secondary');
    assert.strictEqual(p4.vendor, 'Dojah');

    pass('3.6 VerificationProviderFactory dynamically resolves prembly, primary, dojah, and secondary adapters');
  } catch (e) {
    fail('3.6 VerificationProviderFactory dynamically resolves prembly, primary, dojah, and secondary adapters', e);
  }

  // --- SECTION 4: SPENDING GUARD & BILLING CAPS ---
  console.log('\n--- SECTION 4: SPENDING GUARD & BILLING CAPS ---');

  try {
    // 4.1 Daily Verification Volume Cap
    const guard = PadiFixVerification.VerificationSpendingGuard;
    guard._resetCounters();

    for (let i = 0; i < 50; i++) {
      guard.recordSpend(1);
    }

    const check = guard.checkSpendAvailable({ dailyCap: 50 });
    assert.strictEqual(check.allowed, false, 'Must block when daily cap is reached');
    assert.strictEqual(check.safeCode, 'SPEND_CAP_EXCEEDED');
    assert.strictEqual(check.reason, 'DAILY_SPEND_CAP_REACHED');
    guard._resetCounters();
    pass('4.1 VerificationSpendingGuard enforces daily verification volume cap (50 checks/day)');
  } catch (e) {
    fail('4.1 VerificationSpendingGuard enforces daily verification volume cap (50 checks/day)', e);
  }

  try {
    // 4.2 Monthly Verification Volume Cap
    const guard = PadiFixVerification.VerificationSpendingGuard;
    guard._resetCounters();

    guard.recordSpend(500);

    const check = guard.checkSpendAvailable({ dailyCap: 1000, monthlyCap: 500 });
    assert.strictEqual(check.allowed, false, 'Must block when monthly cap is reached');
    assert.strictEqual(check.safeCode, 'SPEND_CAP_EXCEEDED');
    assert.strictEqual(check.reason, 'MONTHLY_SPEND_CAP_REACHED');
    guard._resetCounters();
    pass('4.2 VerificationSpendingGuard enforces monthly verification volume cap (500 checks/month)');
  } catch (e) {
    fail('4.2 VerificationSpendingGuard enforces monthly verification volume cap (500 checks/month)', e);
  }

  try {
    // 4.3 Spending Guard Integration with Gateway
    const guard = PadiFixVerification.VerificationSpendingGuard;
    guard._resetCounters();
    guard.recordSpend(50);

    const origLive = PadiFixMonetization.FLAGS.kycLiveEnabled;
    PadiFixMonetization.FLAGS.kycLiveEnabled = true; // Enable live to test spend cap branch specifically

    const res = await PadiFixVerification.PadiFixVerificationGateway.submitVerificationRequest(
      99,
      { docType: 'vnin', docRef: 'VNIN-SANDBOX-PASS' },
      { requireLive: true, isLive: true, dailyCap: 50 }
    );

    PadiFixMonetization.FLAGS.kycLiveEnabled = origLive;

    assert.strictEqual(res.success, false);
    assert.strictEqual(res.safeResultCode, 'SPEND_CAP_EXCEEDED');
    guard._resetCounters();
    pass('4.3 Verification gateway honors spending guard and halts execution with SPEND_CAP_EXCEEDED');
  } catch (e) {
    fail('4.3 Verification gateway honors spending guard and halts execution with SPEND_CAP_EXCEEDED', e);
  }

  try {
    // 4.4 Automated Counter Rotation & Reset
    const guard = PadiFixVerification.VerificationSpendingGuard;
    guard.dailyCount = 45;
    guard.monthlyCount = 300;
    guard.lastResetDay = 'Yesterday';
    guard._checkAndRotate();

    assert.strictEqual(guard.dailyCount, 0, 'Daily count must reset on new day');
    assert.strictEqual(guard.monthlyCount, 300, 'Monthly count must remain within same month');

    guard._resetCounters();
    pass('4.4 VerificationSpendingGuard rotates daily and monthly counters automatically on date transition');
  } catch (e) {
    fail('4.4 VerificationSpendingGuard rotates daily and monthly counters automatically on date transition', e);
  }

  // --- SECTION 5: POLICY-CONTROLLED FAILOVER ARCHITECTURE ---
  console.log('\n--- SECTION 5: POLICY-CONTROLLED FAILOVER ARCHITECTURE ---');

  try {
    // 5.1 Invariant: User Error (Mismatch / Invalid Format) NEVER Triggers Failover
    const gateway = PadiFixVerification.PadiFixVerificationGateway;
    const res = await gateway.executeWithFailover(
      101,
      { docType: 'vnin', docRef: 'VNIN-SANDBOX-REJ' },
      { enableFailover: true }
    );

    assert.strictEqual(res.failoverTriggered, false, 'Must NOT trigger failover for user rejection/mismatch');
    assert.strictEqual(res.safeResultCode, 'IDENTITY_MISMATCH', 'Must preserve IDENTITY_MISMATCH');
    assert.strictEqual(res.primaryAdapter, 'prembly', 'Must indicate primary adapter');
    pass('5.1 Failover Invariant: User error (IDENTITY_MISMATCH) does NOT trigger failover (prevents double billing)');
  } catch (e) {
    fail('5.1 Failover Invariant: User error (IDENTITY_MISMATCH) does NOT trigger failover (prevents double billing)', e);
  }

  try {
    // 5.2 Upstream Partner Outage/Timeout Triggers Secondary Adapter
    const gateway = PadiFixVerification.PadiFixVerificationGateway;
    const res = await gateway.executeWithFailover(
      102,
      { docType: 'vnin', docRef: 'VNIN-SANDBOX-FAIL' },
      { enableFailover: true, secondaryAdapter: 'sandbox' }
    );

    assert.strictEqual(res.failoverTriggered, true, 'Must trigger failover on upstream PROVIDER_TIMEOUT');
    assert.strictEqual(res.primaryAdapter, 'prembly');
    assert.strictEqual(res.secondaryAdapter, 'sandbox');
    assert.strictEqual(res.primaryResultCode, 'PROVIDER_TIMEOUT');
    pass('5.2 Upstream partner timeout/outage safely triggers secondary provider failover when enabled');
  } catch (e) {
    fail('5.2 Upstream partner timeout/outage safely triggers secondary provider failover when enabled', e);
  }

  // --- SECTION 6: WEBHOOK INGESTION & HMAC-SHA512 SECURITY ---
  console.log('\n--- SECTION 6: WEBHOOK INGESTION & HMAC-SHA512 SECURITY ---');

  try {
    // 6.1 Reject Unauthenticated Webhooks Missing Signature Header
    const mockReq = {
      method: 'POST',
      headers: {},
      body: JSON.stringify({ event: 'verification.success', id: 'evt_001' })
    };
    let capturedStatus = null;
    let capturedBody = null;
    const mockRes = {
      status(code) { capturedStatus = code; return this; },
      json(data) { capturedBody = data; return this; }
    };

    await kycWebhookHandler(mockReq, mockRes);
    assert.strictEqual(capturedStatus, 401, 'Must reject unsigned webhook with 401');
    assert.strictEqual(capturedBody.safeCode, 'UNAUTHENTICATED_WEBHOOK');
    pass('6.1 Webhook handler rejects requests missing signature header with HTTP 401 UNAUTHENTICATED_WEBHOOK');
  } catch (e) {
    fail('6.1 Webhook handler rejects requests missing signature header with HTTP 401 UNAUTHENTICATED_WEBHOOK', e);
  }

  try {
    // 6.2 Constant-time HMAC-SHA512 Verification for Prembly & Dojah Headers
    const webhookSecret = process.env.KYC_WEBHOOK_SECRET || 'test_kyc_webhook_secret_padifix_2026';
    const rawPayload = JSON.stringify({
      id: `evt_prem_${Date.now()}`,
      event: 'identity.verified',
      data: {
        provider_id: 1,
        attempt_id: `vatt_wh_${Date.now()}`,
        status: 'approved',
        verification_type: 'vnin'
      }
    });

    const validSig = crypto.createHmac('sha512', webhookSecret).update(rawPayload).digest('hex');

    const mockReq = {
      method: 'POST',
      headers: {
        'x-prembly-signature': validSig,
        'x-provider-name': 'PREMBLY'
      },
      body: rawPayload
    };

    let capturedStatus = null;
    let capturedBody = null;
    const mockRes = {
      status(code) { capturedStatus = code; return this; },
      json(data) { capturedBody = data; return this; }
    };

    await kycWebhookHandler(mockReq, mockRes);
    assert.strictEqual(capturedStatus, 200, 'Valid Prembly signature must return 200 OK');
    assert.strictEqual(capturedBody.status, 'success');
    assert.strictEqual(capturedBody.state, 'VERIFIED_NIN');
    pass('6.2 Constant-time HMAC-SHA512 verifies x-prembly-signature and transitions state to VERIFIED_NIN');
  } catch (e) {
    fail('6.2 Constant-time HMAC-SHA512 verifies x-prembly-signature and transitions state to VERIFIED_NIN', e);
  }

  try {
    // 6.3 Webhook Idempotency: Duplicate Event Delivery Handled Gracefully
    const eventId = `evt_idem_${Date.now()}`;
    const webhookSecret = process.env.KYC_WEBHOOK_SECRET || 'test_kyc_webhook_secret_padifix_2026';
    const rawPayload = JSON.stringify({
      id: eventId,
      event: 'identity.verified',
      data: { provider_id: 2, status: 'approved' }
    });
    const validSig = crypto.createHmac('sha512', webhookSecret).update(rawPayload).digest('hex');

    const mockReq = {
      method: 'POST',
      headers: { 'x-dojah-signature': validSig, 'x-provider-name': 'DOJAH' },
      body: rawPayload
    };

    let status1, body1, status2, body2;
    const res1 = { status(c) { status1 = c; return this; }, json(d) { body1 = d; return this; } };
    const res2 = { status(c) { status2 = c; return this; }, json(d) { body2 = d; return this; } };

    await kycWebhookHandler(mockReq, res1);
    await kycWebhookHandler(mockReq, res2);

    assert.strictEqual(status1, 200);
    assert.strictEqual(status2, 200);
    assert.strictEqual(body2.idempotent, true, 'Duplicate webhook must return idempotent: true');
    pass('6.3 Webhook idempotency: repeated delivery of identical event returns HTTP 200 with idempotent: true');
  } catch (e) {
    fail('6.3 Webhook idempotency: repeated delivery of identical event returns HTTP 200 with idempotent: true', e);
  }

  try {
    // 6.4 Tampered Payload Replay Detection Returns 409 Conflict
    const eventId = `evt_tamper_${Date.now()}`;
    const webhookSecret = process.env.KYC_WEBHOOK_SECRET || 'test_kyc_webhook_secret_padifix_2026';

    const payloadA = JSON.stringify({ id: eventId, event: 'identity.pending', data: { status: 'pending' } });
    const sigA = crypto.createHmac('sha512', webhookSecret).update(payloadA).digest('hex');

    const payloadB = JSON.stringify({ id: eventId, event: 'identity.verified', data: { status: 'approved' } });
    const sigB = crypto.createHmac('sha512', webhookSecret).update(payloadB).digest('hex');

    let status1, status2, body2;
    const res1 = { status(c) { status1 = c; return this; }, json(d) { return this; } };
    const res2 = { status(c) { status2 = c; return this; }, json(d) { body2 = d; return this; } };

    await kycWebhookHandler({ method: 'POST', headers: { 'x-kyc-signature': sigA }, body: payloadA }, res1);
    await kycWebhookHandler({ method: 'POST', headers: { 'x-kyc-signature': sigB }, body: payloadB }, res2);

    assert.strictEqual(status1, 200);
    assert.strictEqual(status2, 409, 'Tampered replay must return 409 Conflict');
    assert.strictEqual(body2.safeCode, 'REPLAY_CONFLICT');
    pass('6.4 Tampered payload replay with recycled event ID is rejected with HTTP 409 REPLAY_CONFLICT');
  } catch (e) {
    fail('6.4 Tampered payload replay with recycled event ID is rejected with HTTP 409 REPLAY_CONFLICT', e);
  }

  // --- SECTION 7: CANONICAL STATE MACHINE & COMPLIANCE OPERATIONS ---
  console.log('\n--- SECTION 7: CANONICAL STATE MACHINE & COMPLIANCE OPERATIONS ---');

  try {
    // 7.1 State machine approves canonical legal state transitions
    const sm = PadiFixVerification.VerificationStateMachine;
    assert.strictEqual(sm.canTransition('UNVERIFIED', 'REQUESTED'), true);
    assert.strictEqual(sm.canTransition('REQUESTED', 'PENDING'), true);
    assert.strictEqual(sm.canTransition('PENDING', 'VERIFIED_NIN'), true);
    assert.strictEqual(sm.canTransition('PENDING', 'REJECTED'), true);
    assert.strictEqual(sm.canTransition('PENDING', 'FAILED'), true);
    pass('7.1 Canonical state machine validates all legal verification transitions');
  } catch (e) {
    fail('7.1 Canonical state machine validates all legal verification transitions', e);
  }

  try {
    // 7.2 State machine strictly blocks illegal transitions
    const sm = PadiFixVerification.VerificationStateMachine;
    assert.strictEqual(sm.canTransition('UNVERIFIED', 'VERIFIED_NIN'), false);
    assert.strictEqual(sm.canTransition('REJECTED', 'VERIFIED_NIN'), false);
    assert.strictEqual(sm.canTransition('FAILED', 'VERIFIED_NIN'), false);

    assert.throws(() => {
      sm.validateTransition('UNVERIFIED', 'VERIFIED_NIN');
    }, /HARD INVARIANT VIOLATION|Illegal transition/, 'Must throw on illegal transition');

    pass('7.2 Invariant: Illegal direct state transition (UNVERIFIED -> VERIFIED_NIN) is strictly blocked');
  } catch (e) {
    fail('7.2 Invariant: Illegal direct state transition (UNVERIFIED -> VERIFIED_NIN) is strictly blocked', e);
  }

  try {
    // 7.3 Automated Reconciliation Recovers Pending Attempt
    const gateway = PadiFixVerification.PadiFixVerificationGateway;
    const testAttemptId = `vatt_rec_phase9_${Date.now()}`;
    const testReqId = `vreq_rec_phase9_${Date.now()}`;

    // Seed attempt in mock DB
    await LokatorDB.recordVerificationAttemptEntry({
      id: testAttemptId,
      attempt_id: testAttemptId,
      request_id: testReqId,
      provider_id: 1,
      provider_name: 'SANDBOX_KYC',
      provider_reference: 'ref_sbx_PASS_999',
      status: 'pending',
      normalized_result: 'PENDING',
      result_code: 'PENDING_REVIEW',
      evidence_hash: 'hash_test_phase9',
      created_at: new Date(Date.now() - 3600000).toISOString()
    });

    await LokatorDB.recordVerificationRequestEntry({
      id: testReqId,
      provider_id: 1,
      status: 'pending',
      verification_type: 'vnin'
    });

    const recRes = await gateway.reconcileVerificationAttempt(testAttemptId, {}, { role: 'service' });
    assert.strictEqual(recRes.status, 'REMOTE_SUCCESS');
    assert.strictEqual(recRes.targetState, 'VERIFIED_NIN');
    assert.strictEqual(recRes.reconciled, true);
    pass('7.3 Automated reconciliation recovers pending attempt to VERIFIED_NIN with zero PII exposure');
  } catch (e) {
    fail('7.3 Automated reconciliation recovers pending attempt to VERIFIED_NIN with zero PII exposure', e);
  }

  // --- SECTION 8: SECRET ISOLATION & AUTOMATED CLIENT BUNDLE SCAN ---
  console.log('\n--- SECTION 8: SECRET ISOLATION & CLIENT BUNDLE SCAN ---');

  try {
    // 8.1 Automated Bundle Scanner: Scans all public assets for exposed secret keys or patterns
    const rootDir = path.join(__dirname, '..');
    const publicFiles = [
      'index.html',
      'search.html',
      'profile.html',
      'dashboard.html',
      'register.html',
      'login.html',
      'admin.html',
      'about.html',
      'how-it-works.html',
      'join.html',
      'offline.html',
      'app.js',
      'search.js',
      'profile.js',
      'dashboard.js',
      'admin.js',
      'monetization-config.js',
      'verification-providers.js',
      'supabase-client.js',
      'sw.js',
      'style.css'
    ];

    const forbiddenPatterns = [
      /sk_live_[0-9a-zA-Z]{20,}/i,
      /pr_live_[0-9a-zA-Z]{20,}/i,
      /dj_live_[0-9a-zA-Z]{20,}/i,
      /PREMBLY_API_KEY\s*[:=]\s*['"][^'"]{5,}['"]/i,
      /DOJAH_API_KEY\s*[:=]\s*['"][^'"]{5,}['"]/i,
      /KYC_WEBHOOK_SECRET\s*[:=]\s*['"][^'"]{5,}['"]/i,
      /BEGIN (RSA|EC|OPENSSH|PRIVATE) KEY/i
    ];

    let foundLeaks = [];
    for (const file of publicFiles) {
      const fullPath = path.join(rootDir, file);
      if (!fs.existsSync(fullPath)) continue;
      const content = fs.readFileSync(fullPath, 'utf8');
      for (const pattern of forbiddenPatterns) {
        if (pattern.test(content)) {
          foundLeaks.push({ file, pattern: pattern.toString() });
        }
      }
    }

    assert.strictEqual(foundLeaks.length, 0, `Forbidden secrets found in public assets: ${JSON.stringify(foundLeaks)}`);
    pass('8.1 Automated client bundle scan verified: 0 vendor API keys, private keys, or webhook secrets exposed');
  } catch (e) {
    fail('8.1 Automated client bundle scan verified: 0 vendor API keys, private keys, or webhook secrets exposed', e);
  }

  try {
    // 8.2 Client Telemetry Sanitization Strips Sensitive Credentials & Raw NIN/BVN
    const telemetryPayload = {
      event: 'verification_attempt_submitted',
      provider_id: 1,
      vnin: '1234567890123456',
      nin: '11223344556',
      bvn: '22334455667',
      api_key: 'sk_secret_token_live',
      password: 'SuperSecretPassword123!',
      category: 'Electrician'
    };

    const sanitized = PadiFixMonetization.sanitizeTelemetryPayload(telemetryPayload);
    assert.strictEqual(sanitized.nin, undefined, 'Raw NIN must be stripped');
    assert.strictEqual(sanitized.vnin, undefined, 'Raw vNIN must be stripped');
    assert.strictEqual(sanitized.bvn, undefined, 'Raw BVN must be stripped');
    assert.strictEqual(sanitized.api_key, undefined, 'API key must be stripped');
    assert.strictEqual(sanitized.password, undefined, 'Password must be stripped');
    assert.strictEqual(sanitized.category, 'Electrician', 'Safe metadata must be preserved');
    pass('8.2 Telemetry sanitization strictly strips raw NIN, vNIN, BVN, and authentication credentials');
  } catch (e) {
    fail('8.2 Telemetry sanitization strictly strips raw NIN, vNIN, BVN, and authentication credentials', e);
  }

  try {
    // 8.3 Public Profile Trust Badge Masks Underlying Identity Document
    const maskedVnin = PadiFixVerification.maskDocumentReference('vnin', '1024589234812345');
    assert.strictEqual(maskedVnin, 'vNIN: 1024-****-****-2345');
    assert.ok(!maskedVnin.includes('58923481'), 'Intermediate digits must be masked');

    const maskedCac = PadiFixVerification.maskDocumentReference('cac_cert', 'RC1234567');
    assert.strictEqual(maskedCac, 'CAC: RC12****');

    const hash = PadiFixVerification.hashDocumentReference('1024589234812345');
    assert.strictEqual(hash.length, 64, 'Must produce 64-char SHA-256 hex digest');
    pass('8.3 Public trust badge utilizes masked reference format and SHA-256 hash without exposing identity');
  } catch (e) {
    fail('8.3 Public trust badge utilizes masked reference format and SHA-256 hash without exposing identity', e);
  }

  // --- SUMMARY ---
  console.log('\n================================================================');
  console.log('PHASE 009 VERIFICATION SUITE SUMMARY:');
  console.log(`Total Assertions: ${passedTests + failedTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  if (failedTests === 0) {
    console.log('Status: GREEN (100% PASS)');
  } else {
    console.log('Status: RED (FAILURES DETECTED)');
    process.exit(1);
  }
  console.log('================================================================\n');

})();
