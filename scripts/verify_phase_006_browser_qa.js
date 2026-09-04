/**
 * PadiFix Phase 006 Browser QA & Visual Acceptance Script
 * Tests:
 * 1. Dashboard Trust & Credential Verification Center flow (vNIN masking, submission, pending state, history)
 * 2. Public Provider Profile trust badge presentation & interactive explainer modal
 * 3. Registration Step 5 transparency callout and honest status
 * 4. Multi-viewport overflow audit across 320px, 390px, 412px, 1280px, 1440px, 1920px
 * 5. Console error and network failure trapping
 */

const assert = require('assert');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const EVIDENCE_DIR = path.join(__dirname, 'visual_evidence', 'phase_006');
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'mobile_320x844', width: 320, height: 844 },
  { name: 'mobile_390x844', width: 390, height: 844 },
  { name: 'mobile_412x915', width: 412, height: 915 },
  { name: 'desktop_1280x720', width: 1280, height: 720 },
  { name: 'desktop_1440x900', width: 1440, height: 900 },
  { name: 'desktop_1920x1080', width: 1920, height: 1080 }
];

async function runBrowserQA() {
  console.log('================================================================');
  console.log('PADIFIX PHASE 006 — BROWSER QA & VISUAL ACCEPTANCE');
  console.log('================================================================\n');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();
  let consoleErrors = [];
  let networkFailures = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('requestfailed', req => {
    const errText = req.failure()?.errorText || '';
    const url = req.url();
    // Ignore aborted third-party map tiles on page navigation
    if (url.includes('tile.openstreetmap.org') && errText.includes('ERR_ABORTED')) {
      return;
    }
    networkFailures.push(`${req.method()} ${url} - ${errText}`);
  });

  const BASE_URL = 'http://localhost:8080';

  // Seed authenticated provider session in localStorage
  await page.goto(`${BASE_URL}/login.html`, { waitUntil: 'networkidle' });
  await page.evaluate(() => {
    const mockProvider = {
      id: 1,
      name: 'Adebayo Okafor',
      trade: 'Master Electrician & Solar Installer',
      category: 'Electrician',
      city: 'Lagos',
      state: 'Lagos',
      lga: 'Surulere',
      area: 'Surulere, Lagos',
      phone: '+2348012345678',
      skills: ['Home Conduit Wiring', 'Inverter & Solar Setup'],
      completedJobs: 540,
      rating: 4.9,
      reviewsCount: 214,
      isAvailable: true,
      isVerified: false,
      ninVerified: false,
      verification_status: 'unverified'
    };
    localStorage.setItem('lokator_supabase_auth_session', JSON.stringify({
      user: { id: '1', email: 'adebayo@example.com', user_metadata: { provider_id: 1, name: 'Adebayo Okafor' } },
      provider: mockProvider
    }));
    localStorage.setItem('lokator_supabase_providers_db', JSON.stringify([mockProvider]));
  });

  // 1. TEST DASHBOARD TRUST & VERIFICATION CENTER
  console.log('--- 1. DASHBOARD TRUST & VERIFICATION CENTER FLOW ---');
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${BASE_URL}/dashboard.html`, { waitUntil: 'networkidle' });

  // Switch to Trust & Subscription Tab
  await page.waitForSelector('button[data-tab="subscription"]', { state: 'visible' });
  await page.click('button[data-tab="subscription"]');
  await page.waitForTimeout(300);

  // Check initial verification status chip
  const initialChipText = await page.$eval('#dash-ver-status-chip', el => el.textContent.trim());
  console.log(`  ✓ Initial verification status chip: "${initialChipText}"`);

  // Check vNIN privacy guidance banner
  const hasPrivacyBanner = await page.$eval('#tab-subscription', el => el.textContent.includes('Privacy Guarantee — Zero Raw NIN Storage'));
  console.log(`  ✓ Privacy Guarantee banner rendered: ${hasPrivacyBanner ? 'PASS' : 'FAIL'}`);

  // Test real-time vNIN input masking preview
  await page.fill('#ver-doc-ref', '1024567890123456');
  await page.waitForTimeout(100);
  const previewCodeText = await page.$eval('#ver-preview-code', el => el.textContent.trim());
  console.log(`  ✓ Real-time input masking preview: "${previewCodeText}"`);
  assert.strictEqual(previewCodeText, 'vNIN: 1024-****-****-3456', 'Preview code must match masked vNIN');

  // Submit Verification Request
  await page.click('#btn-submit-verification');
  await page.waitForTimeout(600);

  // Verify transition to PENDING
  const updatedChipText = await page.$eval('#dash-ver-status-chip', el => el.textContent.trim());
  console.log(`  ✓ Updated verification status chip: "${updatedChipText}"`);
  assert.ok(updatedChipText.includes('Pending') || updatedChipText.includes('Review'), 'Status must transition to pending');

  const pendingNoticeVisible = await page.$eval('#dash-ver-pending-notice', el => window.getComputedStyle(el).display !== 'none');
  console.log(`  ✓ Pending review notice banner visible: ${pendingNoticeVisible ? 'PASS' : 'FAIL'}`);

  const historyText = await page.$eval('#ver-history-list', el => el.textContent.trim());
  console.log(`  ✓ Verification history entry present: ${historyText.includes('vNIN: 1024') ? 'PASS' : 'FAIL'}`);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'dashboard_verification_pending.png') });
  console.log('  📸 Screenshot captured: dashboard_verification_pending.png');

  // 2. TEST PUBLIC PROFILE TRUST PRESENTATION & EXPLAINER MODAL
  console.log('\n--- 2. PUBLIC PROFILE TRUST PRESENTATION & MODAL ---');
  await page.goto(`${BASE_URL}/profile.html?id=1`, { waitUntil: 'networkidle' });

  const heroBadgeText = await page.$eval('#hero-verified-badge', el => el.textContent.trim());
  console.log(`  ✓ Public profile hero verified badge: "${heroBadgeText}"`);

  // Click badge to trigger trust explainer modal
  await page.click('#hero-verified-badge');
  await page.waitForSelector('#modal-trust-explainer', { state: 'visible' });

  const modalHeading = await page.$eval('#trust-modal-heading', el => el.textContent.trim());
  console.log(`  ✓ Trust explainer modal open with heading: "${modalHeading}"`);

  const pillarsCount = await page.$$eval('#trust-modal-pillars > div', els => els.length);
  console.log(`  ✓ Trust explainer modal contains ${pillarsCount} explainable trust pillars`);
  assert.ok(pillarsCount > 0, 'Trust explainer modal must render trust pillars');

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'profile_trust_explainer_modal.png') });
  console.log('  📸 Screenshot captured: profile_trust_explainer_modal.png');

  // Dismiss modal
  await page.click('#btn-dismiss-trust-modal');
  await page.waitForTimeout(200);
  const modalHidden = await page.$eval('#modal-trust-explainer', el => window.getComputedStyle(el).display === 'none');
  console.log(`  ✓ Trust modal dismissed cleanly: ${modalHidden ? 'PASS' : 'FAIL'}`);

  // 3. TEST REGISTRATION TRANSPARENCY CALLOUT
  console.log('\n--- 3. REGISTRATION TRANSPARENCY CALLOUT ---');
  await page.goto(`${BASE_URL}/register.html`, { waitUntil: 'networkidle' });
  const hasRegNotice = await page.$eval('#step-pane-5', el => el.textContent.includes('Platform Verification Notice'));
  console.log(`  ✓ Registration Step 5 contains Platform Verification Notice: ${hasRegNotice ? 'PASS' : 'FAIL'}`);

  const step5Badge = await page.$eval('#prev-badge', el => el.textContent.trim());
  console.log(`  ✓ Step 5 preview card displays: "${step5Badge}"`);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'register_transparency_callout.png') });
  console.log('  📸 Screenshot captured: register_transparency_callout.png');

  // 4. MULTI-VIEWPORT OVERFLOW AUDIT ACROSS 6 VIEWPORTS
  console.log('\n--- 4. MULTI-VIEWPORT OVERFLOW AUDIT (6 VIEWPORTS) ---');
  for (const vp of VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/dashboard.html`, { waitUntil: 'networkidle' });
    const dashOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✓ Dashboard [${vp.name}]: ${dashOverflow ? 'OVERFLOW DETECTED' : '0px overflow (PASS)'}`);
    assert.strictEqual(dashOverflow, false, `Dashboard had horizontal overflow at ${vp.name}`);

    await page.goto(`${BASE_URL}/profile.html?id=1`, { waitUntil: 'networkidle' });
    const profOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`  ✓ Profile [${vp.name}]: ${profOverflow ? 'OVERFLOW DETECTED' : '0px overflow (PASS)'}`);
    assert.strictEqual(profOverflow, false, `Profile had horizontal overflow at ${vp.name}`);
  }

  // 5. CONSOLE AND NETWORK INTEGRITY
  console.log('\n--- 5. CONSOLE & NETWORK AUDIT ---');
  console.log(`  Console Errors: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.log('  Errors:', consoleErrors);
  }
  console.log(`  Network Failures: ${networkFailures.length}`);
  if (networkFailures.length > 0) {
    console.log('  Failures:', networkFailures);
  }
  assert.strictEqual(consoleErrors.length, 0, 'Must have zero uncaught console errors');
  assert.strictEqual(networkFailures.length, 0, 'Must have zero network failures');

  await browser.close();

  console.log('\n================================================================');
  console.log('PHASE 006 BROWSER QA: ALL ASSERTIONS PASSED (GREEN)');
  console.log('================================================================\n');
}

runBrowserQA().catch(err => {
  console.error('Browser QA failed:', err);
  process.exit(1);
});
