/**
 * PADIFIX PHASE 013 — MASTER PRODUCTION READINESS & GO-LIVE VERIFICATION SUITE
 * scripts/verify_phase_013_production.js
 *
 * Deterministic orchestrator that executes all certification domains and
 * compiles a unified, machine-readable launch readiness verdict.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');

const SUITES = [
  {
    domain: 'DOMAIN A: Production Deployment & Assets',
    file: 'scripts/probe_production_endpoints.js',
    critical: true
  },
  {
    domain: 'DOMAIN F & G & L: Security, Authorization & RLS',
    file: 'scripts/verify_phase_013_security_authorization.js',
    critical: true
  },
  {
    domain: 'DOMAIN J: PWA, Manifest & Offline Resilience',
    file: 'scripts/verify_production_pwa.js',
    critical: true
  },
  {
    domain: 'DOMAIN H & I: Monetization & Business Invariants',
    file: 'scripts/verify_production_monetization.js',
    critical: true
  },
  {
    domain: 'DOMAIN C & M: Mobile Ergonomics & Touch Targets',
    file: 'scripts/verify_filter_trigger_height.js',
    critical: true
  },
  {
    domain: 'DOMAIN D & I: Nigerian LGA Constitutional Integrity',
    file: 'scripts/verify_774_lgas_deterministic.js',
    critical: true
  },
  {
    domain: 'DOMAIN O: Integration Hardening & Resilience',
    file: 'scripts/verify_phase_011_3_hardening.js',
    critical: true
  },
  {
    domain: 'DOMAIN E & H: Provider Subscriptions Lifecycle',
    file: 'scripts/verify_phase_011_provider_subscriptions.js',
    critical: true
  }
];

async function runMasterCertification() {
  console.log('='.repeat(80));
  console.log('🌟 PADIFIX PHASE 013: MASTER PRODUCTION READINESS & GO-LIVE VERIFICATION');
  console.log('='.repeat(80));

  const results = [];
  let passedSuites = 0;
  let failedSuites = 0;

  for (const suite of SUITES) {
    console.log(`\n▶️  RUNNING: ${suite.domain}`);
    console.log(`   Script: ${suite.file}`);
    const start = Date.now();
    try {
      const stdout = execSync(`node ${suite.file}`, {
        cwd: ROOT,
        stdio: 'pipe',
        encoding: 'utf8'
      });
      const duration = Date.now() - start;
      console.log(`   ✅ PASSED (${duration}ms)`);
      passedSuites++;
      results.push({ domain: suite.domain, script: suite.file, status: 'PASS', durationMs: duration });
    } catch (err) {
      const duration = Date.now() - start;
      console.error(`   ❌ FAILED (${duration}ms)`);
      console.error(`      Error: ${err.message}`);
      if (err.stdout) console.error(`      Stdout: ${err.stdout.slice(-300)}`);
      if (err.stderr) console.error(`      Stderr: ${err.stderr.slice(-300)}`);
      failedSuites++;
      results.push({ domain: suite.domain, script: suite.file, status: 'FAIL', durationMs: duration, error: err.message });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log(`MASTER CERTIFICATION RESULTS: ${passedSuites}/${SUITES.length} suites passed`);
  console.log('='.repeat(80));

  const certificationVerdict = failedSuites === 0 ? 'GO' : 'NO-GO';
  console.log(`\n🏆 FINAL LAUNCH READINESS VERDICT: [ ${certificationVerdict} ]\n`);

  fs.writeFileSync(
    path.join(__dirname, 'visual_evidence', 'phase_013', 'master_certification_results.json'),
    JSON.stringify({ timestamp: new Date().toISOString(), verdict: certificationVerdict, passedSuites, failedSuites, results }, null, 2)
  );

  if (failedSuites > 0) {
    process.exit(1);
  }
}

runMasterCertification().catch(err => {
  console.error('Master runner failed:', err);
  process.exit(1);
});
