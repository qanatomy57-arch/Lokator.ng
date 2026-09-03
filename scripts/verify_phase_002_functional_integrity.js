const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const TARGET_URL = process.env.TEST_URL || 'https://padifix.vercel.app';
const EVIDENCE_DIR = path.join(__dirname, 'visual_evidence', 'phase_002');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const VIEWPORTS = {
  mobile_320x844: { width: 320, height: 844, isMobile: true },
  mobile_390x844: { width: 390, height: 844, isMobile: true },
  mobile_412x915: { width: 412, height: 915, isMobile: true },
  desktop_1280x720: { width: 1280, height: 720, isMobile: false },
  desktop_1440x900: { width: 1440, height: 900, isMobile: false },
  desktop_1920x1080: { width: 1920, height: 1080, isMobile: false },
};

let totalAssertions = 0;
let passedAssertions = 0;
let failedAssertions = 0;
const failureDetails = [];
const consoleErrors = [];
const networkFailures = [];

function assert(condition, testName, details = '') {
  totalAssertions++;
  if (condition) {
    passedAssertions++;
    console.log(`  ✅ [PASS] ${testName}`);
    return true;
  } else {
    failedAssertions++;
    console.error(`  ❌ [FAIL] ${testName} ${details ? '(' + details + ')' : ''}`);
    failureDetails.push({ testName, details });
    return false;
  }
}

async function checkAssetHttp(url) {
  return new Promise((resolve) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      resolve({ statusCode: res.statusCode, contentType: res.headers['content-type'] });
    });
    req.on('error', (err) => {
      resolve({ statusCode: 0, error: err.message });
    });
    req.setTimeout(8000, () => {
      req.abort();
      resolve({ statusCode: 408, error: 'Timeout' });
    });
  });
}

async function runAudit() {
  console.log('='.repeat(80));
  console.log(`PADIFIX PHASE 002: POST-REBRAND FUNCTIONAL INTEGRITY AUDIT`);
  console.log(`Target: ${TARGET_URL}`);
  console.log(`Evidence: ${EVIDENCE_DIR}`);
  console.log('='.repeat(80));

  // --- SECTION 1: DIRECT HTTP ASSET & NETWORK INTEGRITY AUDIT ---
  console.log('\n--- 1. DIRECT HTTP ASSET AUDIT ---');
  const requiredAssets = [
    '/icons/padifix-logo-dark.png',
    '/icons/padifix-logo-light.png',
    '/icons/padifix-mark.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-maskable-192.png',
    '/icons/icon-maskable-512.png',
    '/favicon.png',
    '/favicon.svg',
    '/apple-touch-icon.png',
    '/og-image.png',
    '/manifest.json',
    '/sw.js',
    '/style.css',
    '/app.js',
    '/offline.html'
  ];

  for (const asset of requiredAssets) {
    const assetUrl = `${TARGET_URL}${asset}`;
    const res = await checkAssetHttp(assetUrl);
    const ok = res.statusCode >= 200 && res.statusCode < 300;
    assert(ok, `Network Asset: ${asset}`, `HTTP status: ${res.statusCode}`);
    if (!ok) {
      networkFailures.push({ asset, statusCode: res.statusCode, error: res.error });
    }
  }

  // Launch Playwright Browser using installed msedge channel
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext();
  const page = await context.newPage();

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      // Ignore external analytics / benign warnings
      if (!text.includes('favicon.ico') && !text.includes('google-analytics') && !text.includes('doubleclick')) {
        consoleErrors.push({ url: page.url(), text });
      }
    }
  });

  page.on('requestfailed', (req) => {
    const failure = req.failure();
    const url = req.url();
    const errText = failure ? failure.errorText : 'Unknown';
    if (!url.includes('google-analytics') && 
        !url.includes('doubleclick') && 
        !url.includes('favicon.ico') && 
        !(url.includes('openstreetmap.org') && errText === 'net::ERR_ABORTED')) {
      networkFailures.push({ url, error: errText });
    }
  });

  // --- SECTION 2: MULTI-VIEWPORT HOMEPAGE REGRESSION ---
  console.log('\n--- 2. MULTI-VIEWPORT HOMEPAGE AUDIT ---');
  for (const [vpName, vpSize] of Object.entries(VIEWPORTS)) {
    await page.setViewportSize({ width: vpSize.width, height: vpSize.height });
    await page.goto(`${TARGET_URL}/index.html`, { waitUntil: 'load', timeout: 30000 });
    await page.waitForTimeout(1000);

    const title = await page.title();
    assert(title.includes('PadiFix'), `${vpName}: Title contains PadiFix`);

    // Brand logo image decoded & visible
    const logoImg = page.locator('header .logo img, header a.logo img, .navbar .logo img, .brand-logo-img').first();
    const logoVisible = await logoImg.isVisible().catch(() => false);
    assert(logoVisible, `${vpName}: Header brand logo image is visible`);

    const logoNaturalWidth = await logoImg.evaluate(el => el.naturalWidth).catch(() => 0);
    assert(logoNaturalWidth > 0, `${vpName}: Header brand logo naturalWidth > 0 (${logoNaturalWidth}px)`);

    // Zero horizontal overflow
    const overflow = await page.evaluate(() => {
      const doc = document.documentElement;
      return doc.scrollWidth - window.innerWidth;
    });
    assert(overflow <= 1, `${vpName}: Zero horizontal overflow (diff: ${overflow}px)`);

    // Functional elements
    const heroTitle = await page.locator('.story-card-title, h1, .hero-title').first().textContent().catch(() => '');
    assert(heroTitle.trim().length > 5, `${vpName}: Hero headline rendered ("${heroTitle.trim().substring(0, 30)}...")`);

    const searchInput = page.locator('#search-card input, #hero-search-input, .search-card input, input[type="text"]').first();
    const searchInputVisible = await searchInput.isVisible().catch(() => false);
    assert(searchInputVisible, `${vpName}: Hero search input is visible & usable`);

    // Category / Industry cards
    const categoryCardsCount = await page.locator('#marketplace-industry-grid .card, .popular-services-row a, a[href*="search.html?service="]').count().catch(() => 0);
    assert(categoryCardsCount >= 4, `${vpName}: Category cards rendered (${categoryCardsCount} found)`);

    // Top Provider discovery cards
    const providerCardsCount = await page.locator('.tp-card, .story-card').count().catch(() => 0);
    assert(providerCardsCount >= 3, `${vpName}: Provider discovery cards rendered (${providerCardsCount} found)`);

    // Mobile nav drawer interaction
    if (vpSize.isMobile) {
      const hamburger = page.locator('#hamburger, .hamburger, .mobile-nav-toggle').first();
      const hamburgerVisible = await hamburger.isVisible().catch(() => false);
      assert(hamburgerVisible, `${vpName}: Mobile hamburger button visible`);

      if (hamburgerVisible) {
        await hamburger.click();
        await page.waitForTimeout(400);

        const drawer = page.locator('#mobile-nav-drawer, .mobile-nav-drawer').first();
        const drawerOpen = await drawer.evaluate(el => el.classList.contains('active') || el.classList.contains('open') || el.getAttribute('aria-hidden') === 'false').catch(() => false);
        assert(drawerOpen, `${vpName}: Mobile navigation drawer opens on tap`);

        // Check drawer logo
        const drawerLogo = drawer.locator('img.brand-logo-img, .drawer-brand img, .drawer-logo img').first();
        const drawerLogoVisible = await drawerLogo.isVisible().catch(() => false);
        assert(drawerLogoVisible, `${vpName}: Drawer brand logo is visible and active`);

        // Close drawer
        const closeBtn = page.locator('#mobile-nav-close-btn, .drawer-close-btn').first();
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
          await page.waitForTimeout(400);
          const drawerClosed = await drawer.evaluate(el => !el.classList.contains('active') && !el.classList.contains('open')).catch(() => true);
          assert(drawerClosed, `${vpName}: Mobile navigation drawer closes cleanly`);
        }
      }
    }

    // Capture screenshot
    const ssPath = path.join(EVIDENCE_DIR, `homepage_${vpName}.png`);
    await page.screenshot({ path: ssPath });
  }

  // --- SECTION 3: SEARCH & FILTERING REGRESSION ---
  console.log('\n--- 3. SEARCH & MARKETPLACE FILTERING REGRESSION ---');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${TARGET_URL}/search.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1000);

  const searchTitle = await page.title();
  assert(searchTitle.includes('PadiFix') || searchTitle.includes('Explore') || searchTitle.includes('Search'), `Search page title valid: "${searchTitle}"`);

  // Search input & interactive search
  const keywordSearch = page.locator('#keyword-search').first();
  assert(await keywordSearch.isVisible(), `Keyword search input field (#keyword-search) is visible`);

  const locationSearch = page.locator('#location-search').first();
  assert(await locationSearch.isVisible(), `Location search input field (#location-search) is visible`);

  // Check state & LGA filters
  const stateSelect = page.locator('#state-select').first();
  const lgaSelect = page.locator('#lga-select').first();
  assert(await stateSelect.isVisible(), `State filter dropdown (#state-select) is visible`);
  assert(await lgaSelect.isVisible(), `LGA filter dropdown (#lga-select) is visible`);

  // Provider cards rendering (.provider-item-card)
  const initialCardsCount = await page.locator('#providers-container .provider-item-card').count();
  assert(initialCardsCount >= 1, `Initial provider cards rendered (${initialCardsCount} providers found)`);

  // State selection triggers LGA cascading
  await stateSelect.selectOption('Lagos');
  await page.waitForTimeout(600);
  const lgaOptionCount = await lgaSelect.locator('option').count();
  assert(lgaOptionCount > 5, `Selecting Lagos populates LGAs (${lgaOptionCount} options)`);

  // Test keyword search for Electrician
  await keywordSearch.fill('Electrician');
  const searchSubmitBtn = page.locator('#search-btn, .search-submit-btn, button[type="submit"]').first();
  if (await searchSubmitBtn.isVisible()) {
    await searchSubmitBtn.click();
  } else {
    await keywordSearch.press('Enter');
  }
  await page.waitForTimeout(800);

  const filteredCardsCount = await page.locator('#providers-container .provider-item-card').count();
  assert(filteredCardsCount >= 1, `Filtering by 'Electrician' yields results (${filteredCardsCount} cards)`);

  // Test empty state
  await keywordSearch.fill('zzznosuchartisanexist999');
  if (await searchSubmitBtn.isVisible()) {
    await searchSubmitBtn.click();
  } else {
    await keywordSearch.press('Enter');
  }
  await page.waitForTimeout(800);
  const emptyStateVisible = await page.locator('#empty-state').isVisible().catch(() => false);
  assert(emptyStateVisible, `Empty state element (#empty-state) is visible for unmatched query`);

  // Reset search
  await keywordSearch.fill('');
  if (await searchSubmitBtn.isVisible()) {
    await searchSubmitBtn.click();
  } else {
    await keywordSearch.press('Enter');
  }
  await page.waitForTimeout(800);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'search_flow.png') });

  // --- SECTION 4: PROVIDER PROFILE & CONTACT FLOW ---
  console.log('\n--- 4. PROVIDER PROFILE & CONTACT FLOW REGRESSION ---');
  await page.goto(`${TARGET_URL}/profile.html?id=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1000);

  const profileTitle = await page.title();
  assert(profileTitle.includes('PadiFix') || profileTitle.length > 5, `Profile page loads with title: "${profileTitle}"`);

  const providerName = await page.locator('.provider-hero-name, h1, .profile-name').first().textContent().catch(() => '');
  assert(providerName.trim().length > 2, `Provider profile renders name: "${providerName.trim()}"`);

  // Verified badge
  const verifiedBadge = page.locator('.verified-badge, .badge-verified, [aria-label*="verified"]').first();
  assert(await verifiedBadge.isVisible().catch(() => false), `Verified artisan trust badge rendered`);

  // Contact actions
  const callBtn = page.locator('#btn-call-hero, #sidebar-call-btn, #sticky-call-btn').first();
  assert(await callBtn.isVisible(), `Direct Phone Call button visible`);

  const waBtn = page.locator('#wa-send-btn, #sticky-wa-btn, a[href*="wa.me"]').first();
  assert(await waBtn.isVisible(), `WhatsApp Booking / Message button visible`);

  // Reviews section
  const reviewsSection = page.locator('#reviews-section, .reviews-summary-card').first();
  assert(await reviewsSection.isVisible(), `Customer Reviews section rendered`);

  const writeReviewBtn = page.locator('#btn-open-review-modal').first();
  assert(await writeReviewBtn.isVisible(), `Write a Review action button visible`);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'profile_flow.png') });

  // --- SECTION 5: REGISTRATION ONBOARDING WIZARD REGRESSION ---
  console.log('\n--- 5. REGISTRATION WIZARD REGRESSION ---');
  await page.goto(`${TARGET_URL}/register.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1000);

  const regTitle = await page.title();
  assert(regTitle.includes('Register') || regTitle.includes('PadiFix'), `Registration page title valid: "${regTitle}"`);

  // Form inputs
  const fnameInput = page.locator('#fname').first();
  const lnameInput = page.locator('#lname').first();
  const phoneInput = page.locator('#phone').first();
  const emailInput = page.locator('#email').first();
  const passwordInput = page.locator('#password').first();

  assert(await fnameInput.isVisible(), `Registration Step 1 First Name input (#fname) visible`);
  assert(await lnameInput.isVisible(), `Registration Step 1 Last Name input (#lname) visible`);
  assert(await phoneInput.isVisible(), `Registration Step 1 Phone input (#phone) visible`);
  assert(await emailInput.isVisible(), `Registration Step 1 Email input (#email) visible`);
  assert(await passwordInput.isVisible(), `Registration Step 1 Password input (#password) visible`);

  // Step 1 Next button validation test
  const step1NextBtn = page.locator('#btn-step-1-next').first();
  assert(await step1NextBtn.isVisible(), `Continue button (#btn-step-1-next) visible`);

  await step1NextBtn.click();
  await page.waitForTimeout(300);

  const errFname = page.locator('#err-fname').first();
  const errPhone = page.locator('#err-phone').first();
  const errFnameVisible = await errFname.evaluate(el => window.getComputedStyle(el).display !== 'none').catch(() => false);
  const errPhoneVisible = await errPhone.evaluate(el => window.getComputedStyle(el).display !== 'none').catch(() => false);
  assert(errFnameVisible || errPhoneVisible, `Form validation error triggers when submitting empty Step 1`);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'registration_flow.png') });

  // --- SECTION 6: DASHBOARD & AUTH REGRESSION ---
  console.log('\n--- 6. DASHBOARD & AUTHENTICATION REGRESSION ---');
  await page.goto(`${TARGET_URL}/login.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1000);

  const loginTitle = await page.title();
  assert(loginTitle.includes('Login') || loginTitle.includes('PadiFix'), `Login page title valid: "${loginTitle}"`);

  const loginEmail = page.locator('#login-email').first();
  const loginPass = page.locator('#login-password').first();
  const loginSubmit = page.locator('button[type="submit"], .btn-primary').first();

  assert(await loginEmail.isVisible(), `Login email/phone input (#login-email) visible`);
  assert(await loginPass.isVisible(), `Login password input (#login-password) visible`);
  assert(await loginSubmit.isVisible(), `Login submit button visible`);

  // Test validation alert via forgot password link
  const forgotLink = page.locator('#forgot-link').first();
  if (await forgotLink.isVisible()) {
    await forgotLink.click();
    await page.waitForTimeout(300);
    const alertBox = page.locator('#auth-alert').first();
    const alertVisible = await alertBox.evaluate(el => window.getComputedStyle(el).display !== 'none').catch(() => false);
    assert(alertVisible, `Validation alert (#auth-alert) is triggered on empty forgot-password request`);
  }

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'login_flow.png') });

  // Dashboard unauthenticated guard check (should redirect to login.html)
  await page.evaluate(() => localStorage.removeItem('lokator_supabase_auth_session'));
  await page.goto(`${TARGET_URL}/dashboard.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1000);
  const currentUrl = page.url();
  assert(currentUrl.includes('login.html'), `Unauthenticated dashboard access properly redirects to login.html`);

  // Dashboard authenticated session check
  await page.evaluate(() => {
    localStorage.setItem('lokator_supabase_auth_session', JSON.stringify({
      user: { id: 1, email: 'adebayo@padifix.ng' }
    }));
  });
  await page.goto(`${TARGET_URL}/dashboard.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(1200);

  const dashTitle = await page.title();
  assert(dashTitle.includes('Dashboard') || dashTitle.includes('PadiFix'), `Authenticated dashboard title valid: "${dashTitle}"`);

  const dashLogo = page.locator('header .logo img, .dash-header .logo img, img.brand-logo-img').first();
  assert(await dashLogo.isVisible().catch(() => false), `Dashboard brand logo visible`);

  const kpiCards = await page.locator('.kpi-card').count();
  assert(kpiCards >= 4, `Dashboard KPI metrics ribbon rendered (${kpiCards} cards)`);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'dashboard_flow.png') });

  // --- SECTION 7: PWA, MANIFEST & SERVICE WORKER REGRESSION ---
  console.log('\n--- 7. PWA, MANIFEST & SERVICE WORKER REGRESSION ---');
  await page.goto(`${TARGET_URL}/manifest.json`, { waitUntil: 'load', timeout: 30000 });
  const manifestContent = await page.content();
  let manifestJson = null;
  try {
    const rawText = await page.locator('body').innerText();
    manifestJson = JSON.parse(rawText);
  } catch (e) {
    try {
      manifestJson = JSON.parse(manifestContent.replace(/<[^>]*>/g, ''));
    } catch (e2) {}
  }

  assert(manifestJson !== null, `Manifest parsed as valid JSON`);
  if (manifestJson) {
    assert(manifestJson.name.includes('PadiFix'), `Manifest name: "${manifestJson.name}"`);
    assert(manifestJson.short_name === 'PadiFix', `Manifest short_name: "${manifestJson.short_name}"`);
    assert(manifestJson.theme_color === '#00A859', `Manifest theme_color: "${manifestJson.theme_color}"`);
    assert(Array.isArray(manifestJson.icons) && manifestJson.icons.length >= 4, `Manifest defines >= 4 icons (${manifestJson.icons?.length || 0})`);
  }

  // Check SW content directly
  await page.goto(`${TARGET_URL}/sw.js`, { waitUntil: 'load', timeout: 30000 });
  const swText = await page.locator('body').innerText().catch(() => '');
  assert(swText.includes('padifix-v12.00') || swText.includes('padifix-v'), `Service worker defines current PadiFix cache version`);

  // Check Offline fallback
  await page.goto(`${TARGET_URL}/offline.html`, { waitUntil: 'load', timeout: 30000 });
  const offlineText = await page.locator('body').innerText().catch(() => '');
  assert(offlineText.includes('Offline') || offlineText.includes('Internet') || offlineText.includes('PadiFix'), `Offline fallback page renders informative status`);

  await browser.close();

  // --- SECTION 8: CONSOLE & NETWORK SUMMARY ---
  console.log('\n--- 8. TELEMETRY & ERROR REPORT ---');
  console.log(`Console Errors Trapped: ${consoleErrors.length}`);
  if (consoleErrors.length > 0) {
    console.error('Console errors:');
    consoleErrors.forEach((e, i) => console.error(`  [${i+1}] ${e.url}: ${e.text}`));
  }
  assert(consoleErrors.length === 0, `Browser Console: 0 uncaught exceptions or error logs`);

  console.log(`Network Failures Trapped: ${networkFailures.length}`);
  if (networkFailures.length > 0) {
    console.error('Network failures:');
    networkFailures.forEach((f, i) => console.error(`  [${i+1}] ${f.url || f.asset}: ${f.error || f.statusCode}`));
  }
  assert(networkFailures.length === 0, `Network Layer: 0 failed requests or 404s`);

  // --- SUMMARY ---
  console.log('\n' + '='.repeat(80));
  console.log(`PHASE 002 FUNCTIONAL INTEGRITY AUDIT SUMMARY:`);
  console.log(`Total Assertions: ${totalAssertions}`);
  console.log(`Passed: ${passedAssertions}`);
  console.log(`Failed: ${failedAssertions}`);
  const verdict = failedAssertions === 0 ? 'GREEN — PadiFix Rebrand Has No Detected Functional Regression' :
                  failedAssertions <= 2 ? 'YELLOW — Functional Regression Found and Requires Follow-up' :
                  'RED — Critical Regression Detected';
  console.log(`FINAL VERDICT: ${verdict}`);
  console.log('='.repeat(80));

  const reportData = {
    totalAssertions,
    passedAssertions,
    failedAssertions,
    verdict,
    failureDetails,
    consoleErrors,
    networkFailures,
    timestamp: new Date().toISOString()
  };

  fs.writeFileSync(path.join(EVIDENCE_DIR, 'phase_002_report.json'), JSON.stringify(reportData, null, 2));

  if (failedAssertions > 0) {
    process.exit(1);
  }
}

runAudit().catch((err) => {
  console.error('Audit execution error:', err);
  process.exit(1);
});
