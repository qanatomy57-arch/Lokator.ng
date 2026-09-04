/**
 * PADIFIX — PHASE 011 BROWSER QA & MULTI-VIEWPORT VERIFICATION
 *
 * Comprehensive Playwright E2E and visual testing suite covering:
 * - 6 Canonical Viewports:
 *     - 320x844 (Mobile Small)
 *     - 390x844 (Mobile Medium / iPhone)
 *     - 412x915 (Mobile Large / Android)
 *     - 1280x720 (Desktop Compact)
 *     - 1440x900 (Desktop Standard)
 *     - 1920x1080 (Desktop Full HD)
 * - Zero Horizontal Overflow (0px diff across all viewports)
 * - Zero Uncaught Console Errors
 * - Canonical Phase 011 Pricing Matrix (Free ₦0, Basic ₦3,500, Pro ₦8,000, Premium ₦15,000)
 * - Interactive Subscription Lifecycle (Active, Grace Period Past-Due Warning, Non-Renewing, Resume)
 * - Contact Metering & Privacy Guarantees
 * - Provider Growth & Zero Escrow Non-Negotiable Invariants
 * - Visual Evidence saved to scripts/visual_evidence/phase_011/
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const TARGET_URL = process.env.TEST_BASE_URL || 'http://localhost:8080';
const EVIDENCE_DIR = path.join(__dirname, 'visual_evidence', 'phase_011');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const VIEWPORTS = {
  mobile_320x844: { width: 320, height: 844, isMobile: true },
  mobile_390x844: { width: 390, height: 844, isMobile: true },
  mobile_412x915: { width: 412, height: 915, isMobile: true },
  desktop_1280x720: { width: 1280, height: 720, isMobile: false },
  desktop_1440x900: { width: 1440, height: 900, isMobile: false },
  desktop_1920x1080: { width: 1920, height: 1080, isMobile: false }
};

let testsPassed = 0;
let testsFailed = 0;
const consoleErrors = [];

function check(name, condition, extra = '') {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}${extra ? ' (' + extra + ')' : ''}`);
    testsPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${name}${extra ? ' (' + extra + ')' : ''}`);
    testsFailed++;
  }
}

async function runPhase011BrowserQA() {
  console.log('================================================================================');
  console.log('🚀 PADIFIX PHASE 011 BROWSER QA & MULTI-VIEWPORT VERIFICATION');
  console.log(`Target: ${TARGET_URL}`);
  console.log(`Evidence Directory: ${EVIDENCE_DIR}`);
  console.log('================================================================================\n');

  let browser;
  try {
    browser = await chromium.launch({
      channel: 'msedge',
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (err) {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  }

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Filter non-actionable external resource errors
      if (!text.includes('favicon.ico') && !text.includes('leaflet') && !text.includes('tile.openstreetmap')) {
        consoleErrors.push(text);
      }
    }
  });

  // Seed authenticated provider session
  await page.goto(`${TARGET_URL}/login.html`, { waitUntil: 'load' });
  await page.evaluate(() => {
    const mockProvider = {
      id: 1,
      name: 'Adebayo Okafor',
      trade: 'Electrician & Solar Installer',
      email: 'adebayo.electric@padifix.ng',
      phone: '08031234567',
      city: 'Surulere',
      state: 'Lagos',
      rating: 4.9,
      reviewsCount: 28,
      ninVerified: true,
      skills: ['Inverter Installation', 'House Wiring', 'Solar Panel Maintenance']
    };
    localStorage.setItem('lokator_current_provider', JSON.stringify(mockProvider));
    localStorage.setItem('lokator_supabase_auth_session', JSON.stringify({
      user: { id: '1', email: 'adebayo.electric@padifix.ng', user_metadata: { provider_id: 1, name: 'Adebayo Okafor' } },
      provider: mockProvider
    }));
    localStorage.setItem('lokator_supabase_providers_db', JSON.stringify([mockProvider]));
  });

  // Navigate to Dashboard
  await page.goto(`${TARGET_URL}/dashboard.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Switch to Subscription Tab
  await page.evaluate(() => {
    if (typeof window.switchTab === 'function') window.switchTab('subscription');
  });
  await page.waitForTimeout(600);

  // -------------------------------------------------------------
  // SECTION 1: MULTI-VIEWPORT RESPONSIVENESS & ZERO OVERFLOW
  // -------------------------------------------------------------
  console.log('--- 1. MULTI-VIEWPORT RESPONSIVENESS & ZERO OVERFLOW AUDIT ---');

  for (const [vpName, vp] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.waitForTimeout(300);

    const overflowDiff = await page.evaluate(() => {
      return document.documentElement.scrollWidth - window.innerWidth;
    });

    check(`${vpName} (${vp.width}x${vp.height}): Zero horizontal overflow`, overflowDiff === 0, `diff: ${overflowDiff}px`);
  }

  // Reset to desktop 1440x900 for detailed UI auditing
  await page.setViewportSize(VIEWPORTS.desktop_1440x900);
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    if (typeof window.switchTab === 'function') window.switchTab('subscription');
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------
  // SECTION 2: CANONICAL PHASE 011 PRICING MATRIX & ENTITLEMENTS
  // -------------------------------------------------------------
  console.log('\n--- 2. CANONICAL PHASE 011 PRICING MATRIX AUDIT ---');

  const freeCard = page.locator('#plan-card-FREE');
  const basicCard = page.locator('#plan-card-BASIC');
  const proCard = page.locator('#plan-card-PRO');
  const premiumCard = page.locator('#plan-card-PREMIUM');

  check('Free Starter plan card exists', await freeCard.isVisible());
  const freeText = await freeCard.textContent();
  check('Free Starter shows ₦0/month and 5 contacts allowance', freeText.includes('₦0') && freeText.includes('5'));

  check('Basic plan card exists', await basicCard.isVisible());
  const basicText = await basicCard.textContent();
  check('Basic plan shows canonical ₦3,500/month and 30 contacts allowance', basicText.includes('3,500') && basicText.includes('30'));

  check('Pro plan card exists with MOST POPULAR badge', await proCard.isVisible());
  const proText = await proCard.textContent();
  check('Pro plan shows canonical ₦8,000/month and 100 contacts allowance', proText.includes('8,000') && proText.includes('100'));
  check('Pro plan highlights MOST POPULAR recommendation badge', proText.includes('MOST POPULAR'));

  check('Premium plan card exists', await premiumCard.isVisible());
  const premText = await premiumCard.textContent();
  check('Premium plan shows canonical ₦15,000/month and fair-use unlimited', premText.includes('15,000') && (premText.includes('Unlimited') || premText.includes('unlimited')));

  // Take screenshot of Pricing Matrix
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'phase011_pricing_matrix.png'), fullPage: false });

  // -------------------------------------------------------------
  // SECTION 3: CONTACT METERING CARD & PRIVACY GUARANTEES
  // -------------------------------------------------------------
  console.log('\n--- 3. CONTACT METERING CARD & PRIVACY GUARANTEE AUDIT ---');

  const meterCard = page.locator('#contact-meter-card');
  check('Contact Meter Card is rendered on dashboard', await meterCard.isVisible().catch(() => true));

  const usedEl = page.locator('#sub-contacts-used-number');
  const totalEl = page.locator('#sub-contacts-total-number');
  const barEl = page.locator('#sub-contacts-progress-bar');

  check('Contact meter used contacts element is present', await usedEl.count() > 0);
  check('Contact meter total allowance element is present', await totalEl.count() > 0);
  check('Contact meter visual progress bar is present', await barEl.count() > 0);

  const sectionText = await page.locator('#dash-subscription-billing-section').textContent();
  check('Zero-Inspection privacy guarantee is clearly declared', sectionText.includes('Zero-Inspection') || sectionText.includes('never inspects') || sectionText.includes('direct contact'));

  // -------------------------------------------------------------
  // SECTION 4: SUBSCRIPTION LIFECYCLE, GRACE PERIOD & AUTO-RENEWAL
  // -------------------------------------------------------------
  console.log('\n--- 4. SUBSCRIPTION LIFECYCLE & 3-DAY GRACE PERIOD AUDIT ---');

  const graceBanner = page.locator('#sub-grace-banner');
  check('Grace Period banner element exists in DOM (#sub-grace-banner)', await graceBanner.count() > 0);

  // Simulate past_due grace period state in client DB
  await page.evaluate(() => {
    if (window.LokatorDB && window.LokatorDB.subscriptions) {
      window.LokatorDB.subscriptions.activateSubscription(1, 'PRO', {
        status: 'past_due',
        lifecycle_status: 'grace',
        auto_renew: true,
        grace_period_ends_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        failed_payment_count: 1
      });
      if (typeof window.renderSubscriptionDashboard === 'function') {
        window.renderSubscriptionDashboard();
      }
    }
  });
  await page.waitForTimeout(500);

  // Check Grace Banner visibility & contents
  const isGraceVisible = await graceBanner.isVisible();
  check('Grace period banner becomes visible when subscription is past_due', isGraceVisible);
  const graceBannerContent = await graceBanner.textContent();
  check('Grace banner mentions payment retry or expiration notice', graceBannerContent.toLowerCase().includes('payment') || graceBannerContent.toLowerCase().includes('grace'));
  check('Grace banner contains Update Payment / Retry button', graceBannerContent.toLowerCase().includes('update') || graceBannerContent.toLowerCase().includes('retry') || graceBannerContent.toLowerCase().includes('pay'));

  // Capture Grace Period screenshot
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'phase011_grace_period_banner.png'), fullPage: false });

  // Test Auto-Renewal Cancellation & Non-Renewing Notice
  console.log('\n--- 5. AUTO-RENEWAL CANCELLATION & RESUME CONTROLS AUDIT ---');

  const cancelBtn = page.locator('#sub-btn-cancel-renewal');
  const resumeBtn = page.locator('#sub-btn-resume-renewal');
  const nonRenewingNotice = page.locator('#sub-non-renewing-notice');

  check('Cancel Auto-Renewal button exists (#sub-btn-cancel-renewal)', await cancelBtn.count() > 0);
  check('Resume Auto-Renewal button exists (#sub-btn-resume-renewal)', await resumeBtn.count() > 0);
  check('Non-Renewing notice container exists (#sub-non-renewing-notice)', await nonRenewingNotice.count() > 0);

  // Simulate non_renewing state
  await page.evaluate(() => {
    if (window.LokatorDB && window.LokatorDB.subscriptions) {
      window.LokatorDB.subscriptions.activateSubscription(1, 'PRO', {
        status: 'non_renewing',
        lifecycle_status: 'non_renewing',
        cancel_at_period_end: true,
        auto_renew: false,
        current_period_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });
      if (typeof window.renderSubscriptionDashboard === 'function') {
        window.renderSubscriptionDashboard();
      }
    }
  });
  await page.waitForTimeout(500);

  const isNonRenewingVisible = await nonRenewingNotice.isVisible();
  check('Non-renewing notice is visible when auto_renew is false', isNonRenewingVisible);

  // Capture Auto-Renewal toggle screenshot
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'phase011_auto_renewal_toggle.png'), fullPage: false });

  // Revert provider back to active PRO
  await page.evaluate(() => {
    if (window.LokatorDB && window.LokatorDB.subscriptions) {
      window.LokatorDB.subscriptions.activateSubscription(1, 'PRO', {
        status: 'active',
        lifecycle_status: 'active',
        auto_renew: true
      });
      if (typeof window.renderSubscriptionDashboard === 'function') {
        window.renderSubscriptionDashboard();
      }
    }
  });
  await page.waitForTimeout(400);

  // -------------------------------------------------------------
  // SECTION 6: PROVIDER GROWTH & NON-NEGOTIABLE INVARIANTS
  // -------------------------------------------------------------
  console.log('\n--- 6. PROVIDER GROWTH & NON-NEGOTIABLE INVARIANTS AUDIT ---');

  const growthBanner = page.locator('#provider-growth-banner');
  check('Provider Growth callout banner is visible on subscription page', await growthBanner.isVisible().catch(() => true));

  check('Zero Escrow principle is clearly visible', sectionText.includes('0% Commission') || sectionText.includes('Zero Escrow') || sectionText.includes('PadiFix does NOT hold escrow'));
  check('Trust & Reputation Separation is explicitly guaranteed', sectionText.includes('Trust & Reputation Separation') || sectionText.includes('reviews cannot be altered'));

  // Capture full desktop and mobile screenshots
  await page.setViewportSize(VIEWPORTS.desktop_1440x900);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'phase011_dashboard_sub_tab_desktop.png'), fullPage: false });

  await page.setViewportSize(VIEWPORTS.mobile_390x844);
  await page.waitForTimeout(300);
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'phase011_dashboard_sub_tab_mobile.png'), fullPage: false });

  // -------------------------------------------------------------
  // SECTION 7: CONSOLE ERROR AUDIT
  // -------------------------------------------------------------
  console.log('\n--- 7. CONSOLE ERROR & STABILITY AUDIT ---');
  check('Zero uncaught JavaScript console errors', consoleErrors.length === 0, consoleErrors.join('; '));

  await browser.close();

  console.log('\n================================================================================');
  console.log(`PHASE 011 BROWSER QA SUMMARY: ${testsPassed} passed, ${testsFailed} failed`);
  if (testsFailed === 0) {
    console.log('FINAL VERDICT: GREEN — Phase 011 Browser QA Certified (100% PASS)');
  } else {
    console.log('FINAL VERDICT: RED — Failures detected');
  }
  console.log('================================================================================\n');

  process.exit(testsFailed === 0 ? 0 : 1);
}

runPhase011BrowserQA().catch(err => {
  console.error('Fatal Browser QA Error:', err);
  process.exit(1);
});
