/**
 * LOKATOR.NG — PHASE 10.16 TRUST & SAFETY COMPLIANCE SUITE
 * Validates verification queue processing, badge approval/rejection workflows,
 * customer dispute report resolution, and compliance audit logging.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// Mock browser environment
const storage = {};
global.localStorage = {
  getItem: (k) => storage[k] || null,
  setItem: (k, v) => { storage[k] = String(v); },
  removeItem: (k) => { delete storage[k]; },
  clear: () => { Object.keys(storage).forEach(k => delete storage[k]); }
};
global.window = global;
global.document = {
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => []
};

// Mock Telemetry
const telemetryEvents = [];
global.LokatorTelemetry = {
  trackEvent: (evt, data) => telemetryEvents.push({ evt, data, time: Date.now() })
};

// Load supabase-client.js
const clientCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
eval(clientCode);

let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passed++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failed++;
  }
}

async function runPhase10_16Suite() {
  console.log('\n================================================================================');
  console.log('🛡️ LOKATOR.NG — PHASE 10.16 TRUST & SAFETY COMPLIANCE VERIFICATION SUITE');
  console.log('================================================================================\n');

  // Seed sample provider data
  const mockProviders = [
    {
      id: 701,
      first_name: 'Tarila',
      last_name: 'Ebi',
      trade: 'Master Electrician',
      category: 'electrician',
      state: 'Delta',
      lga: 'Warri South',
      phone: '08012345678',
      is_verified: false,
      verification_status: 'pending',
      verification_doc_type: 'NIN National Identity',
      verification_doc_ref: 'NIN-99482716382'
    },
    {
      id: 702,
      first_name: 'Blessing',
      last_name: 'Osagie',
      trade: 'Borehole Plumber',
      category: 'plumber',
      state: 'Edo',
      lga: 'Oredo',
      phone: '08023456789',
      is_verified: false,
      verification_status: 'unverified'
    }
  ];

  localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(mockProviders));
  localStorage.removeItem('lokator_compliance_reports');
  localStorage.removeItem('lokator_compliance_audit_logs');
  telemetryEvents.length = 0;

  console.log('--- 1. COMPLIANCE ENGINE & QUEUE DISCOVERY ---');
  await test('1.1 LokatorDB.compliance exists and exports required methods', async () => {
    assert.ok(LokatorDB.compliance);
    assert.strictEqual(typeof LokatorDB.compliance.getPendingVerifications, 'function');
    assert.strictEqual(typeof LokatorDB.compliance.approveVerification, 'function');
    assert.strictEqual(typeof LokatorDB.compliance.rejectVerification, 'function');
    assert.strictEqual(typeof LokatorDB.compliance.reportProvider, 'function');
    assert.strictEqual(typeof LokatorDB.compliance.getReportedCases, 'function');
    assert.strictEqual(typeof LokatorDB.compliance.resolveReport, 'function');
    assert.strictEqual(typeof LokatorDB.compliance.getAuditLogs, 'function');
  });

  await test('1.2 getPendingVerifications returns queued artisan submissions', async () => {
    const queue = LokatorDB.compliance.getPendingVerifications();
    assert.strictEqual(queue.length, 1);
    assert.strictEqual(queue[0].provider_id, 701);
    assert.strictEqual(queue[0].doc_type, 'NIN National Identity');
  });

  console.log('\n--- 2. VERIFICATION APPROVAL & AUDIT TRAIL ---');
  await test('2.1 approveVerification upgrades artisan status to Verified Pro and grants badges', async () => {
    const res = LokatorDB.compliance.approveVerification(701, {
      reviewer: 'Compliance Officer Adebayo',
      notes: 'NIN registry slip validated.',
      badgeType: 'Verified Pro'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.provider.is_verified, true);
    assert.strictEqual(res.provider.nin_verified, true);
    assert.strictEqual(res.provider.verification_status, 'verified');
    assert.strictEqual(res.provider.badge_title, 'Verified Pro');

    // Verify database was updated
    const providers = JSON.parse(localStorage.getItem('lokator_supabase_providers_db') || '[]');
    const prov701 = providers.find(p => p.id === 701);
    assert.strictEqual(prov701.is_verified, true);
  });

  await test('2.2 approveVerification records entry in compliance audit log', async () => {
    const logs = LokatorDB.compliance.getAuditLogs();
    assert.ok(logs.length > 0);
    const log = logs[0];
    assert.strictEqual(log.action, 'VERIFICATION_APPROVED');
    assert.strictEqual(log.provider_id, 701);
    assert.strictEqual(log.reviewer, 'Compliance Officer Adebayo');
  });

  console.log('\n--- 3. VERIFICATION REJECTION WORKFLOW ---');
  await test('3.1 rejectVerification marks status rejected and records explanatory feedback', async () => {
    // Request verification for provider 702
    mockProviders[1].verification_status = 'pending';
    localStorage.setItem('lokator_supabase_providers_db', JSON.stringify(mockProviders));

    const res = LokatorDB.compliance.rejectVerification(702, {
      reviewer: 'Compliance Officer Adebayo',
      reason: 'ID slip blurry and unreadable'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.provider.is_verified, false);
    assert.strictEqual(res.provider.verification_status, 'rejected');
    assert.strictEqual(res.provider.rejection_reason, 'ID slip blurry and unreadable');
  });

  console.log('\n--- 4. DISPUTE & REPORTING DESK ---');
  let createdReport = null;
  await test('4.1 reportProvider registers customer report and logs open dispute', async () => {
    const res = LokatorDB.compliance.reportProvider(701, {
      reporter_name: 'Emeka Chukwu',
      reporter_phone: '08098765432',
      issue_type: 'no_show',
      details: 'Artisan rescheduled twice without advance notice.'
    });

    assert.strictEqual(res.success, true);
    assert.ok(res.report.report_id.startsWith('rep_'));
    assert.strictEqual(res.report.status, 'open');
    createdReport = res.report;

    const cases = LokatorDB.compliance.getReportedCases();
    assert.strictEqual(cases.length, 1);
    assert.strictEqual(cases[0].issue_type, 'no_show');
  });

  await test('4.2 resolveReport marks case resolved and records remediation notes', async () => {
    const res = LokatorDB.compliance.resolveReport(createdReport.report_id, {
      reviewer: 'Dispute Desk Lead',
      resolution: 'Artisan issued apology and honored booking with 10% courtesy discount.',
      actionTaken: 'warning_and_remediated'
    });

    assert.strictEqual(res.success, true);
    assert.strictEqual(res.report.status, 'resolved');
    assert.strictEqual(res.report.action_taken, 'warning_and_remediated');
  });

  console.log('\n--- 5. TELEMETRY & SAFE MONETIZATION INVARIANTS ---');
  await test('5.1 Telemetry events tracked for verification and dispute actions', async () => {
    const approveEvt = telemetryEvents.find(e => e.evt === 'compliance_verification_approved');
    const rejectEvt = telemetryEvents.find(e => e.evt === 'compliance_verification_rejected');
    const reportEvt = telemetryEvents.find(e => e.evt === 'provider_reported_dispute');
    assert.ok(approveEvt);
    assert.ok(rejectEvt);
    assert.ok(reportEvt);
  });

  await test('5.2 Safe zero-payment baseline preserved', async () => {
    assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_LIVE_MODE, false);
    assert.strictEqual(LokatorDB.monetization.featureFlags.COMMISSIONS_ENABLED, false);
  });

  console.log('\n================================================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PHASE 10.16 TRUST & SAFETY COMPLIANCE ASSERTIONS PASSED (100%)!`);
  } else {
    console.log(`❌ ${passed} PASSED, ${failed} FAILED`);
  }
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runPhase10_16Suite();
