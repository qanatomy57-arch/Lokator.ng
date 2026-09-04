/**
 * PADIFIX COMPREHENSIVE REGRESSION RUNNER
 * scripts/run_all_regressions.js
 *
 * Runs all historical regression test suites (Phases 002 through 011.1)
 * and verifies that 100% of tests pass without any hidden regressions.
 */

const { execSync, spawn } = require('child_process');
const path = require('path');
const http = require('http');

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
  { phase: 'Phase 011.2 Infrastructure', script: 'scripts/verify_phase_011_2_infrastructure.js' },
  { phase: 'Phase 011.2 Integration Wiring', script: 'scripts/verify_phase_011_2_integration_wiring.js' }
];

function ensureServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:8080', (res) => {
      resolve(null);
    });
    req.on('error', () => {
      const proc = spawn('node', [path.join(ROOT, 'scripts', 'local_server.js')], {
        cwd: ROOT,
        stdio: 'ignore'
      });
      setTimeout(() => resolve(proc), 1200);
    });
    req.setTimeout(1000, () => {
      req.abort();
      const proc = spawn('node', [path.join(ROOT, 'scripts', 'local_server.js')], {
        cwd: ROOT,
        stdio: 'ignore'
      });
      setTimeout(() => resolve(proc), 1200);
    });
  });
}

async function runAll() {
  console.log('='.repeat(80));
  console.log('🚀 PADIFIX FULL REGRESSION MATRIX (PHASES 002 — 011.2)');
  console.log('='.repeat(80));

  const serverProc = await ensureServer();
  if (serverProc) {
    console.log('  ℹ️ Local test server launched on http://localhost:8080 for browser suites');
  }

  let totalSuites = 0;
  let passedSuites = 0;
  let failedSuites = 0;
  const report = [];

  try {
    for (const suite of SUITES) {
      totalSuites++;
      process.stdout.write(`⏳ Running ${suite.phase} (${path.basename(suite.script)})... `);
      const start = Date.now();
      try {
        const output = execSync(`node "${path.join(ROOT, suite.script)}"`, {
          cwd: ROOT,
          encoding: 'utf8',
          env: { ...process.env, TEST_URL: 'http://localhost:8080', TEST_BASE_URL: 'http://localhost:8080' },
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
  } finally {
    if (serverProc) {
      try { serverProc.kill(); } catch (e) {}
    }
  }
}

runAll().catch(err => {
  console.error('Fatal regression runner error:', err);
  process.exit(1);
});
