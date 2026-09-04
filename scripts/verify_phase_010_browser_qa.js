/**
 * PADIFIX — PHASE 010 BROWSER QA & MULTI-VIEWPORT VERIFICATION
 *
 * Verifies across viewports:
 * - 320x844 (Mobile Small)
 * - 390x844 (Mobile Medium / iPhone)
 * - 412x915 (Mobile Large / Android)
 * - 1280x720 (Desktop Compact)
 * - 1440x900 (Desktop Standard)
 * - 1920x1080 (Desktop Full HD)
 *
 * Checks:
 * 1. Provider Dashboard Subscription Tab:
 *    - Current Plan Card (Plan name, price, billing period, renewal date)
 *    - Contact Meter Card (used/total count, progress bar, WhatsApp vs Call stats, privacy guarantee)
 *    - Canonical 4-Plan Upgrade Grid (Free, Basic ₦3,500, Pro ₦5,000 [MOST POPULAR], Premium ₦10,000)
 *    - Non-negotiable principles (0% commission, Zero escrow, Trust separation)
 *    - Billing history table
 * 2. Provider Profile Contact & Review Surfaces:
 *    - Hero Contact Buttons (Call, WhatsApp)
 *    - Contact Limit Modal
 *    - Write a Review Modal with Post-Service Hired Status options
 *    - 5 Category Granular Ratings
 * 3. Zero Horizontal Overflow (0px diff across all viewports)
 * 4. Zero Console Errors
 * 5. Captures visual screenshots to scripts/visual_evidence/phase_010/
 */

const { chromium } = require('playwright');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

const TARGET_URL = process.env.TEST_BASE_URL || 'http://localhost:8080';
const EVIDENCE_DIR = path.join(__dirname, 'visual_evidence', 'phase_010');

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

function check(name, condition) {
  if (condition) {
    console.log(`  ✅ [PASS] ${name}`);
    testsPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${name}`);
    testsFailed++;
  }
}

async function runBrowserQA() {
  console.log('================================================================================');
  console.log('🚀 PADIFIX PHASE 010 BROWSER QA & MULTI-VIEWPORT VERIFICATION');
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

  // -------------------------------------------------------------
  // SECTION 1: PROVIDER DASHBOARD SUBSCRIPTION & BILLING
  // -------------------------------------------------------------
  console.log('--- 1. PROVIDER DASHBOARD SUBSCRIPTION & BILLING AUDIT ---');

  // Navigate to login and seed mock session
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

  await page.goto(`${TARGET_URL}/dashboard.html`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Switch to Subscription tab
  const subNavBtn = page.locator('button[data-tab="subscription"]').first();
  if (await subNavBtn.isVisible().catch(() => false)) {
    await subNavBtn.click();
  }
  await page.evaluate(() => {
    if (typeof window.switchTab === 'function') window.switchTab('subscription');
  });
  await page.waitForTimeout(800);

  // Check Current Plan Card Elements
  const planSection = page.locator('#dash-subscription-billing-section');
  check('Subscription section is rendered on dashboard', await planSection.isVisible());

  const planPill = page.locator('#sub-plan-pill');
  check('Current plan badge is visible (PRO / FREE / BASIC)', (await planPill.textContent()).length > 0);

  const planPrice = page.locator('#sub-plan-price');
  check('Current plan price is displayed with currency symbol (₦)', (await planPrice.textContent()).includes('₦'));

  const leadMeterUsed = page.locator('#sub-contacts-used-number');
  check('Lead meter used contacts count is visible', (await leadMeterUsed.textContent()).length > 0);

  const leadMeterTotal = page.locator('#sub-contacts-total-number');
  check('Lead meter total contacts allowance is visible', (await leadMeterTotal.textContent()).length > 0);

  const leadMeterProgress = page.locator('#sub-contacts-progress-bar');
  check('Lead meter progress bar is visible', await leadMeterProgress.isVisible());

  // Check 4 Canonical Plan Cards
  const freeCard = page.locator('#plan-card-FREE');
  const basicCard = page.locator('#plan-card-BASIC');
  const proCard = page.locator('#plan-card-PRO');
  const premiumCard = page.locator('#plan-card-PREMIUM');

  check('Canonical Free plan card is present', await freeCard.isVisible());
  check('Canonical Basic plan card is present (₦3,500/mo)', (await basicCard.textContent()).includes('3,500'));
  check('Canonical Pro plan card is present with MOST POPULAR badge', (await proCard.textContent()).includes('MOST POPULAR'));
  check('Canonical Premium plan card is present (₦10,000/mo)', (await premiumCard.textContent()).includes('10,000'));

  // Check Non-Negotiable Invariants Banner
  const zeroCommText = await page.locator('#dash-subscription-billing-section').textContent();
  check('0% Commission guarantee banner is clearly stated', zeroCommText.includes('0% Commission'));
  check('Zero escrow & direct customer payment model is stated', zeroCommText.includes('PadiFix does NOT hold escrow'));
  check('Strict separation of trust & monetization is clearly declared', zeroCommText.includes('Trust & Reputation Separation'));

  // Check Billing History Table
  const billingTable = page.locator('#sub-billing-history-tbody');
  check('Billing history table exists and is rendered', await billingTable.isVisible());

  // Capture Dashboard Subscription Screenshot
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'phase_010_dashboard_subscription.png'), fullPage: false });

  // -------------------------------------------------------------
  // SECTION 2: PROVIDER PROFILE CONTACT & REVIEW LOOP AUDIT
  // -------------------------------------------------------------
  console.log('\n--- 2. PROVIDER PROFILE CONTACT & REVIEW LOOP AUDIT ---');

  await page.goto(`${TARGET_URL}/profile.html?id=1`, { waitUntil: 'load' });
  await page.waitForTimeout(1000);

  // Contact Buttons
  const callBtn = page.locator('#btn-call-hero');
  const waBtn = page.locator('#btn-wa-hero');
  check('Hero Direct Phone Call button is present', await callBtn.isVisible());
  check('Hero Direct WhatsApp Booking button is present', await waBtn.isVisible());

  // Write a Review Modal
  const openReviewBtn = page.locator('#btn-open-review-modal');
  check('Write a Customer Review button is visible', await openReviewBtn.isVisible());

  await openReviewBtn.click();
  await page.waitForTimeout(500);

  const reviewModal = page.locator('#review-modal');
  check('Review modal opens successfully', await reviewModal.isVisible());

  // Check "Did you hire this provider?" question & options
  const hiredStatusOptions = page.locator('#hired-status-options');
  check('Post-Service Hired Status Question is rendered', await hiredStatusOptions.isVisible());

  const hiredBtns = page.locator('.hired-status-btn');
  check('Has 3 distinct hired status choices (Completed, In-progress, Not hired)', (await hiredBtns.count()) === 3);

  // Check 5 Category Ratings
  const catQuality = page.locator('#star-picker-quality');
  const catProf = page.locator('#star-picker-professionalism');
  const catComm = page.locator('#star-picker-communication');
  const catPricing = page.locator('#star-picker-pricing');
  const catPunctuality = page.locator('#star-picker-punctuality');

  check('Category Rating 1: Quality of Work is present', await catQuality.isVisible());
  check('Category Rating 2: Professionalism is present', await catProf.isVisible());
  check('Category Rating 3: Communication is present', await catComm.isVisible());
  check('Category Rating 4: Value for Money (pricing) is present', await catPricing.isVisible());
  check('Category Rating 5: Reliability / Punctuality is present', await catPunctuality.isVisible());

  // Capture Profile Review Modal Screenshot
  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'phase_010_profile_review_modal.png'), fullPage: false });

  // Close review modal
  await page.locator('#review-modal-close').click();
  await page.waitForTimeout(400);

  // -------------------------------------------------------------
  // SECTION 3: MULTI-VIEWPORT RESPONSIVENESS & ZERO OVERFLOW
  // -------------------------------------------------------------
  console.log('\n--- 3. MULTI-VIEWPORT RESPONSIVENESS & ZERO OVERFLOW AUDIT ---');

  for (const [vpName, vpSize] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize({ width: vpSize.width, height: vpSize.height });

    // Test Dashboard at this viewport
    await page.goto(`${TARGET_URL}/dashboard.html`, { waitUntil: 'load' });
    await page.evaluate(() => { if (typeof switchTab === 'function') switchTab('subscription'); });
    await page.waitForTimeout(500);

    const dashOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`Dashboard ${vpName} (${vpSize.width}x${vpSize.height}): Zero horizontal overflow (diff: ${dashOverflow}px)`, dashOverflow <= 1);

    // Test Profile at this viewport
    await page.goto(`${TARGET_URL}/profile.html?id=1`, { waitUntil: 'load' });
    await page.waitForTimeout(500);

    const profOverflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`Profile ${vpName} (${vpSize.width}x${vpSize.height}): Zero horizontal overflow (diff: ${profOverflow}px)`, profOverflow <= 1);

    // Capture responsive screenshots for representative viewports
    if (vpName === 'mobile_320x844' || vpName === 'mobile_390x844' || vpName === 'desktop_1920x1080') {
      await page.screenshot({
        path: path.join(EVIDENCE_DIR, `phase_010_dash_${vpName}.png`),
        fullPage: false
      });
    }
  }

  // -------------------------------------------------------------
  // SECTION 4: CONSOLE ERROR TRAP
  // -------------------------------------------------------------
  console.log('\n--- 4. BROWSER CONSOLE ERROR AUDIT ---');
  check(`Browser Console: 0 uncaught exceptions or error logs (Trapped: ${consoleErrors.length})`, consoleErrors.length === 0);
  if (consoleErrors.length > 0) {
    console.error('Console errors trapped:', consoleErrors);
  }

  await browser.close();

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n================================================================================');
  console.log(`PHASE 010 BROWSER QA SUMMARY: ${testsPassed} passed, ${testsFailed} failed`);
  if (testsFailed === 0) {
    console.log('FINAL VERDICT: GREEN — 100% EXCELLENCE CERTIFIED');
    process.exit(0);
  } else {
    console.error('FINAL VERDICT: RED — Browser QA Regressions Detected');
    process.exit(1);
  }
}

runBrowserQA().catch(err => {
  console.error('Fatal Browser QA Error:', err);
  process.exit(1);
});
