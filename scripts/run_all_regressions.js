/**
 * PADIFIX COMPREHENSIVE REGRESSION RUNNER
 * scripts/run_all_regressions.js
 *
 * Runs all historical regression test suites (Phases 002 through 011.1)
 * and verifies that 100% of tests pass without any hidden regressions.
 */

const { execSync } = require('child_process');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const SUITES = [
  { phase: 'Phase 002', script: 'scripts/verify_phase_002_functional_integrity.js' },
  { phase: 'Phase 003', script: 'scripts/verify_phase_003_experience_audit.js' },
  { phase: 'Phase 004', script: 'scripts/verify_phase_004_monetization_architecture.js' },
  { phase: 'Phase 005', script: 'scripts/verify_phase_005_provider_growth.js' },
  { phase: 'Phase 006', script: 'scripts/verify_phase_006_provider_verification.js' },
  { phase: 'Phase 007', script: 'scripts/verify_phase_007_provider_verification_gateway.js' },
  { phase: 'Phase 008', script: 'scripts/verify_phase_008_real_kyc_compliance.js' },
  { phase: 'Phase 009', script: 'scripts/verify_phase_009_kyc_vendor_activation.js' },
  { phase: 'Phase 010', script: 'scripts/verify_phase_010_provider_monetization.js' },
  { phase: 'Phase 011', script: 'scripts/verify_phase_011_provider_subscriptions.js' },
  { phase: 'Phase 011.1 Real Integration', script: 'scripts/verify_phase_011_1_real_integration.js' },
  { phase: 'Phase 011.2 Infrastructure', script: 'scripts/verify_phase_011_2_infrastructure.js' }
];

console.log('='.repeat(80));
console.log('🚀 PADIFIX FULL REGRESSION MATRIX (PHASES 002 — 011.2)');
console.log('='.repeat(80));

let totalSuites = 0;
let passedSuites = 0;
let failedSuites = 0;
const report = [];

for (const suite of SUITES) {
  totalSuites++;
  process.stdout.write(`⏳ Running ${suite.phase} (${path.basename(suite.script)})... `);
  const start = Date.now();
  try {
    const output = execSync(`node "${path.join(ROOT, suite.script)}"`, {
      cwd: ROOT,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe']
    });
    const duration = ((Date.now() - start) / 1000).toFixed(2);
    passedSuites++;
    process.stdout.write(`✅ PASS (${duration}s)\n`);
    report.push({ ...suite, status: 'PASS', duration });
  } catch (err) {
    failedSuites++;
    process.stdout.write(`❌ FAIL\n`);
    console.error(`\n--- ERROR OUTPUT FOR ${suite.phase} ---`);
    console.error(err.stdout || err.stderr || err.message);
    report.push({ ...suite, status: 'FAIL', error: err.message });
  }
}

console.log('\n' + '='.repeat(80));
console.log(`REGRESSION SUMMARY: ${passedSuites}/${totalSuites} suites passed (${failedSuites} failures)`);
console.log('='.repeat(80));

if (failedSuites > 0) {
  console.error('\n❌ VERDICT: RED — Regression failures detected');
  process.exit(1);
} else {
  console.log('\n🎉 VERDICT: GREEN — 100% REGRESSION INTEGRITY CERTIFIED ACROSS ALL PHASES');
  process.exit(0);
}
