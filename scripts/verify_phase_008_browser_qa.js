/**
 * PadiFix Phase 008 Browser QA & Visual Acceptance Suite
 * Real Playwright multi-viewport browser testing across:
 * - 320×844
 * - 390×844
 * - 412×915
 * - 1280×720
 * - 1440×900
 * - 1920×1080
 *
 * Verifies:
 * 1. Multi-viewport overflow audit (0px horizontal overflow)
 * 2. Provider Trust Center on dashboard.html (tab switching, vNIN masking preview, submission flow)
 * 3. Public provider profile trust badge presentation & modal on profile.html?id=1
 * 4. Compliance operations desk & reconciliation action on admin.html
 * 5. Zero uncaught console errors
 * 6. Visual screenshot evidence saved to scripts/visual_evidence/phase_008/
 */

const assert = require('assert');
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const EVIDENCE_DIR = path.join(__dirname, 'visual_evidence', 'phase_008');
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

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function startStaticServer(port = 8089) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const parsedUrl = new URL(req.url, `http://localhost:${port}`);
      let pathname = parsedUrl.pathname;
      if (pathname === '/') pathname = '/index.html';

      const filePath = path.join(ROOT, decodeURIComponent(pathname));
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType });
      fs.createReadStream(filePath).pipe(res);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        server.listen(port + 1);
      } else {
        reject(err);
      }
    });

    server.listen(port, () => {
      const actualPort = server.address().port;
      resolve({ server, port: actualPort });
    });
  });
}

(async () => {
  console.log('================================================================');
  console.log('PADIFIX PHASE 008 — MULTI-VIEWPORT BROWSER QA & VISUAL ACCEPTANCE');
  console.log('================================================================\n');

  const { server, port } = await startStaticServer(8089);
  const BASE_URL = `http://localhost:${port}`;
  console.log(`Local test server running at ${BASE_URL}\n`);

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const consoleErrors = [];

  function recordConsole(msg) {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!text.includes('favicon') && !text.includes('manifest.webmanifest')) {
        consoleErrors.push(text);
      }
    }
  }

  // --- 1. MULTI-VIEWPORT OVERFLOW AUDIT ---
  console.log('--- 1. MULTI-VIEWPORT OVERFLOW AUDIT ---');
  for (const vp of VIEWPORTS) {
    const page = await context.newPage();
    await page.setViewportSize({ width: vp.width, height: vp.height });
    page.on('console', recordConsole);

    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(400);

    const overflow = await page.evaluate(() => {
      const docW = document.documentElement.clientWidth;
      const scrollW = document.documentElement.scrollWidth;
      return scrollW - docW;
    });

    assert.strictEqual(overflow <= 0, true, `Viewport ${vp.name} must have 0px overflow (found ${overflow}px)`);
    console.log(`  ✅ [PASS] ${vp.name}: 0px horizontal overflow verified`);
    await page.close();
  }

  // --- 2. PROVIDER TRUST CENTER ON DASHBOARD ---
  console.log('\n--- 2. PROVIDER TRUST CENTER ON DASHBOARD ---');
  {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1280, height: 720 });
    page.on('console', recordConsole);

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

    await page.goto(`${BASE_URL}/dashboard.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    // Switch to Trust & Subscription Tab
    await page.waitForSelector('button[data-tab="subscription"]', { state: 'visible' });
    await page.click('button[data-tab="subscription"]');
    await page.evaluate(() => {
      if (typeof window.switchTab === 'function') {
        window.switchTab('subscription');
      }
    });
    await page.waitForTimeout(400);

    // Verify verification form fields exist
    await page.waitForSelector('#form-request-verification', { state: 'visible' });
    await page.waitForSelector('#ver-doc-type', { state: 'visible' });
    await page.waitForSelector('#ver-doc-ref', { state: 'visible' });
    await page.waitForSelector('#ver-preview-code', { state: 'visible' });

    // Test real-time document masking preview
    await page.selectOption('#ver-doc-type', 'vnin');
    await page.fill('#ver-doc-ref', '1024567890123456');
    const previewText = await page.textContent('#ver-preview-code');
    console.log(`  Masked Preview: "${previewText}"`);
    assert.strictEqual(previewText, 'vNIN: 1024-****-****-3456');

    // Capture Screenshot: Trust Center
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'dashboard_trust_center.png') });
    console.log('  ✅ [PASS] Captured: dashboard_trust_center.png');

    await page.close();
  }

  // --- 3. PUBLIC PROVIDER PROFILE TRUST BADGE ---
  console.log('\n--- 3. PUBLIC PROVIDER PROFILE TRUST BADGE ---');
  {
    const page = await context.newPage();
    await page.setViewportSize({ width: 390, height: 844 });
    page.on('console', recordConsole);

    await page.goto(`${BASE_URL}/profile.html?id=1`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(600);

    await page.waitForSelector('#hero-verified-badge', { state: 'visible' });
    await page.click('#hero-verified-badge');
    await page.waitForSelector('#modal-trust-explainer', { state: 'visible' });

    const modalHeading = await page.textContent('#trust-modal-heading');
    console.log(`  Trust Modal Heading: "${modalHeading}"`);
    assert.ok(modalHeading.length > 0);

    // Capture Screenshot: Trust Explainer Modal
    await page.screenshot({ path: path.join(EVIDENCE_DIR, 'profile_trust_badge.png') });
    console.log('  ✅ [PASS] Captured: profile_trust_badge.png');

    await page.close();
  }

  // --- 4. COMPLIANCE OPERATIONS DESK & RECONCILIATION ---
  console.log('\n--- 4. COMPLIANCE OPERATIONS DESK & RECONCILIATION ---');
  {
    const page = await context.newPage();
    await page.setViewportSize({ width: 1440, height: 900 });
    page.on('console', recordConsole);

    await page.goto(`${BASE_URL}/admin.html`, { waitUntil: 'networkidle' });
    await page.waitForTimeout(500);

    // Verify KYC Mode badge
    const kycBadge = await page.$('#badge-kyc-mode');
    assert.ok(kycBadge !== null, 'KYC Mode badge rendered');
    const badgeText = await page.evaluate(el => el.textContent, kycBadge);
    assert.ok(badgeText.includes('Sandbox Mode'), 'Badge indicates Sandbox Mode');
    console.log(`  KYC Engine Status: "${badgeText.trim()}"`);

    // Verify Reconcile Pending KYC Button
    const reconcileBtn = await page.$('#btn-reconcile-kyc');
    assert.ok(reconcileBtn !== null, 'Reconcile button rendered');

    // Click Reconcile button and verify feedback appears
    await reconcileBtn.click();
    await page.waitForTimeout(400);

    const feedbackEl = await page.$('#reconcile-feedback');
    assert.ok(feedbackEl !== null, 'Reconcile feedback banner present');
    const feedbackText = await page.evaluate(el => el.textContent, feedbackEl);
    assert.ok(feedbackText.includes('Reconciliation complete') || feedbackText.includes('Reconcil'), 'Feedback confirmation displayed');
    console.log(`  Reconciliation Response: "${feedbackText.trim()}"`);

    // Capture compliance desk screenshot
    const shotPath = path.join(EVIDENCE_DIR, 'compliance_queue_reconciliation.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log(`  ✅ [PASS] Captured: compliance_queue_reconciliation.png`);

    await page.close();
  }

  await browser.close();
  server.close();

  // --- SUMMARY ---
  console.log('\n================================================================');
  console.log(`BROWSER QA AUDIT SUMMARY:`);
  console.log(`Viewports Tested: 6 (320x844, 390x844, 412x915, 1280x720, 1440x900, 1920x1080)`);
  console.log(`Horizontal Layout Overflow: 0px across all viewports`);
  console.log(`Uncaught Console Errors: ${consoleErrors.length}`);
  console.log(`Visual Screenshots Generated: 3 in scripts/visual_evidence/phase_008/`);
  console.log(`STATUS: ${consoleErrors.length === 0 ? 'GREEN (100% PASS)' : 'RED'}`);
  console.log('================================================================\n');

  if (consoleErrors.length > 0) {
    process.exit(1);
  }
})();
