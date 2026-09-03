// ============================================================================
// PADIFIX — CANONICAL LOGO INTEGRATION VERIFICATION SUITE
// Tests local or production deployment across desktop & mobile viewports
// ============================================================================

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.argv[2] || 'http://localhost:8080';
const EVIDENCE_DIR = path.resolve(__dirname, '..', 'evidence_canonical_logo');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'desktop_1440x900', width: 1440, height: 900, isMobile: false },
  { name: 'desktop_1280x720', width: 1280, height: 720, isMobile: false },
  { name: 'desktop_1920x1080', width: 1920, height: 1080, isMobile: false },
  { name: 'mobile_390x844_iphone14', width: 390, height: 844, isMobile: true },
  { name: 'mobile_412x915_pixel7', width: 412, height: 915, isMobile: true },
  { name: 'mobile_320x844_iphonese', width: 320, height: 844, isMobile: true }
];

const PAGES_TO_TEST = [
  { name: 'homepage', path: '/index.html' },
  { name: 'search', path: '/search.html' },
  { name: 'profile', path: '/profile.html?id=prv_001' },
  { name: 'register', path: '/register.html' },
  { name: 'login', path: '/login.html' },
  { name: 'dashboard', path: '/dashboard.html' },
  { name: 'about', path: '/about.html' },
  { name: 'how_it_works', path: '/how-it-works.html' }
];

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;
const errors = [];

function assert(condition, message) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`  [PASS] ${message}`);
  } else {
    failedChecks++;
    console.error(`  [FAIL] ${message}`);
    errors.push(message);
  }
}

async function run() {
  console.log('====================================================');
  console.log(`PADIFIX CANONICAL LOGO INTEGRATION TEST SUITE`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Evidence Directory: ${EVIDENCE_DIR}`);
  console.log('====================================================\n');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // 1. BRAND ASSET INTEGRITY CHECKS (Direct HTTP checks)
  console.log('--- 1. DIRECT CANONICAL BRAND ASSET CHECKS ---');
  const context = await browser.newContext();
  const page = await context.newPage();

  const brandAssets = [
    '/icons/padifix-logo-dark.png',
    '/icons/padifix-logo-light.png',
    '/icons/padifix-mark.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-maskable-192.png',
    '/icons/icon-maskable-512.png',
    '/favicon.png',
    '/apple-touch-icon.png',
    '/og-image.png',
    '/manifest.json'
  ];

  for (const asset of brandAssets) {
    const res = await page.goto(`${BASE_URL}${asset}`, { waitUntil: 'load' });
    assert(res.status() === 200, `Asset accessible: ${asset} (HTTP 200)`);
  }

  // Check manifest icons reference canonical assets
  const manifestRes = await page.goto(`${BASE_URL}/manifest.json`);
  const manifestJson = JSON.parse(await manifestRes.text());
  assert(manifestJson.name.includes('PadiFix'), 'Manifest name contains PadiFix');
  assert(manifestJson.icons.length >= 4, 'Manifest defines >= 4 app icons');

  await page.close();
  await context.close();

  // 2. MULTI-VIEWPORT RENDERING & LOGO VISIBILITY
  console.log('\n--- 2. MULTI-VIEWPORT HOMEPAGE RENDERING ---');
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });
    const p = await ctx.newPage();
    await p.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle' });

    // Header logo verification
    const headerLogo = p.locator('#logo-link img.brand-logo-img').first();
    const logoVisible = await headerLogo.isVisible();
    assert(logoVisible, `${vp.name}: Header canonical logo is visible`);

    // Verify image is actually loaded with valid natural dimensions
    const imgLoaded = await headerLogo.evaluate(img => img.complete && img.naturalWidth > 0 && img.naturalHeight > 0);
    assert(imgLoaded, `${vp.name}: Header canonical logo image successfully decoded`);

    // Zero horizontal overflow check
    const overflow = await p.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert(!overflow, `${vp.name}: Zero horizontal layout overflow`);

    // Save screenshot evidence
    const shotPath = path.join(EVIDENCE_DIR, `padifix_canonical_logo_${vp.name}.png`);
    await p.screenshot({ path: shotPath, fullPage: false });
    console.log(`  [OK] Screenshot captured: ${shotPath}`);

    await p.close();
    await ctx.close();
  }

  // 3. CORE PAGE SURFACE VERIFICATION
  console.log('\n--- 3. KEY CORE PAGES LOGO PLACEMENT VERIFICATION ---');
  const desktopCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });

  for (const target of PAGES_TO_TEST) {
    const p = await desktopCtx.newPage();
    const res = await p.goto(`${BASE_URL}${target.path}`, { waitUntil: 'networkidle' });
    assert(res.status() === 200, `${target.name}: HTTP 200 OK`);

    // Verify logo link
    const logoLink = p.locator('a.logo').first();
    const linkVisible = await logoLink.isVisible();
    assert(linkVisible, `${target.name}: Logo element visible`);

    // Verify image inside logo link
    const logoImg = p.locator('a.logo img.brand-logo-img').first();
    const imgVisible = await logoImg.isVisible();
    assert(imgVisible, `${target.name}: Canonical brand logo image visible`);

    const imgDecoded = await logoImg.evaluate(img => img.complete && img.naturalWidth > 0);
    assert(imgDecoded, `${target.name}: Canonical logo decoded with natural dimensions`);

    const shotPath = path.join(EVIDENCE_DIR, `padifix_canonical_page_${target.name}.png`);
    await p.screenshot({ path: shotPath, fullPage: false });
    console.log(`  [OK] Page screenshot captured: ${shotPath}`);

    await p.close();
  }

  await desktopCtx.close();
  await browser.close();

  console.log('\n====================================================');
  console.log(`VERIFICATION SUMMARY:`);
  console.log(`Total Assertions: ${totalChecks}`);
  console.log(`Passed: ${passedChecks}`);
  console.log(`Failed: ${failedChecks}`);
  if (failedChecks === 0) {
    console.log(`VERDICT: GREEN - ALL CANONICAL LOGO CHECKS PASSED`);
  } else {
    console.log(`VERDICT: RED - SOME CHECKS FAILED:`);
    errors.forEach(e => console.log(`  - ${e}`));
  }
  console.log('====================================================\n');

  if (failedChecks > 0) {
    process.exit(1);
  }
}

run().catch(err => {
  console.error('Fatal error in test suite:', err);
  process.exit(1);
});
