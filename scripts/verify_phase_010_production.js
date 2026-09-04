/**
 * PadiFix Phase 010 Production Live Verification
 * Target: https://padifix.vercel.app
 *
 * Requirements:
 * - HTTP health check across production routes
 * - Responsive layout & 0px horizontal overflow
 * - Console error & network failure audit
 * - Client secret isolation (Paystack secret key, Prembly API key, etc.)
 * - Safe fail-closed subscription & KYC state (no unauthorized live billing)
 * - PWA manifest & service worker availability
 */

const { chromium } = require('playwright');
const https = require('https');

const PROD_URL = process.env.PADIFIX_PROD_URL || 'https://padifix.vercel.app';

const ROUTES = [
  '/',
  '/search.html',
  '/profile.html?id=1',
  '/dashboard.html',
  '/admin.html',
  '/manifest.json',
  '/sw.js'
];

function fetchStatus(path) {
  return new Promise((resolve) => {
    https.get(`${PROD_URL}${path}`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({ path, statusCode: res.statusCode, body: data });
      });
    }).on('error', (err) => {
      resolve({ path, statusCode: 500, error: err.message });
    });
  });
}

(async () => {
  console.log('================================================================================');
  console.log(`PADIFIX PHASE 010 PRODUCTION VERIFICATION: ${PROD_URL}`);
  console.log('================================================================================\n');

  let passed = 0;
  let failed = 0;

  function check(name, condition) {
    if (condition) {
      console.log(`  ✅ [PASS] ${name}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${name}`);
      failed++;
    }
  }

  // 1. HTTP Status Checks
  console.log('--- 1. HTTP ROUTE STATUS CHECKS ---');
  for (const r of ROUTES) {
    const res = await fetchStatus(r);
    check(`Route ${r} responds with HTTP ${res.statusCode}`, res.statusCode === 200);
  }

  // 2. Playwright Live Browser Smoke
  console.log('\n--- 2. LIVE BROWSER SMOKE & OVERFLOW AUDIT ---');
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
  const consoleErrors = [];
  const networkFailures = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      const t = msg.text();
      if (!t.includes('favicon') && !t.includes('manifest.webmanifest') && !t.includes('leaflet') && !t.includes('tile.openstreetmap')) {
        consoleErrors.push(t);
      }
    }
  });

  page.on('requestfailed', req => {
    if (!req.url().includes('favicon') && !req.url().includes('tile.openstreetmap')) {
      networkFailures.push(req.url());
    }
  });

  // Check Homepage across desktop and mobile viewports
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto(`${PROD_URL}/`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(600);

  const homeOverflowDesktop = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  check(`Homepage Desktop (1280x720): 0px overflow (diff: ${homeOverflowDesktop}px)`, homeOverflowDesktop === 0);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(300);
  const homeOverflowMobile = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  check(`Homepage Mobile (390x844): 0px overflow (diff: ${homeOverflowMobile}px)`, homeOverflowMobile === 0);

  // Check Search
  await page.goto(`${PROD_URL}/search.html`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(600);
  const searchOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  check(`Search page Mobile (390x844): 0px overflow (diff: ${searchOverflow}px)`, searchOverflow === 0);

  // Check Provider Profile
  await page.goto(`${PROD_URL}/profile.html?id=1`, { waitUntil: 'load', timeout: 30000 });
  await page.waitForTimeout(600);
  const profileOverflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth - document.documentElement.clientWidth;
  });
  check(`Profile page Mobile (390x844): 0px overflow (diff: ${profileOverflow}px)`, profileOverflow === 0);

  // Check Hero Contact Buttons on Profile
  const heroCallBtn = page.locator('#btn-call-hero, .btn-call, [data-action="call"]').first();
  const heroWaBtn = page.locator('#btn-wa-hero, .btn-whatsapp, [data-action="whatsapp"]').first();
  check('Profile hero direct contact buttons exist', (await heroCallBtn.count() > 0) || (await heroWaBtn.count() > 0));

  // Check Customer Review Section on Profile
  const reviewSection = page.locator('#reviews-section, .reviews-wrapper, #ratings-overview, #btn-write-review').first();
  check('Profile customer reviews section is visible', await reviewSection.isVisible().catch(() => false));

  // 3. Security & Secret Isolation Audit
  console.log('\n--- 3. PRODUCTION SECRET ISOLATION & FAIL-CLOSED AUDIT ---');
  const pageHtml = await page.content();
  const hasPaystackSecret = /sk_live_[a-zA-Z0-9]{20,}|PAYSTACK_SECRET_KEY/i.test(pageHtml);
  check('Zero Paystack secret keys exposed in DOM/bundle', !hasPaystackSecret);

  const hasPremblySecret = /pr_live_[a-zA-Z0-9]{20,}|PREMBLY_API_KEY/i.test(pageHtml);
  check('Zero KYC provider private keys exposed in DOM/bundle', !hasPremblySecret);

  // Verify Monetization & KYC safety in browser context
  const clientConfig = await page.evaluate(() => {
    if (typeof PadiFixMonetization !== 'undefined') {
      return {
        flags: PadiFixMonetization.FLAGS || PadiFixMonetization.FEATURE_FLAGS || {},
        plans: PadiFixMonetization.PLANS || PadiFixMonetization.PROVIDER_PLANS || {}
      };
    }
    return { flags: {}, plans: {} };
  });

  const kycLiveSafe = clientConfig.flags.kycLiveEnabled !== true;
  check('Live KYC safely disabled in production client config', kycLiveSafe);

  // 4. Console & Network Error Audit
  console.log('\n--- 4. CONSOLE & NETWORK INTEGRITY AUDIT ---');
  check(`Browser Console: 0 uncaught errors (Trapped: ${consoleErrors.length})`, consoleErrors.length === 0);
  check(`Network Layer: 0 failed critical requests (Trapped: ${networkFailures.length})`, networkFailures.length === 0);

  await browser.close();

  console.log('\n================================================================================');
  console.log(`PRODUCTION VERIFICATION SUMMARY: ${passed} passed, ${failed} failed`);
  if (failed === 0) {
    console.log('FINAL VERDICT: GREEN — Production Verified Safe & Ready');
  } else {
    console.log('FINAL VERDICT: RED — Production Inconsistencies Detected');
  }
  console.log('================================================================================\n');

  process.exit(failed === 0 ? 0 : 1);
})();
