const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PROD_URL = 'https://lokator-ng.vercel.app';
const EVIDENCE_DIR = path.join(__dirname, 'visual_evidence', 'padifix', 'phase_012_2');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'Desktop 1280x720', width: 1280, height: 720, isMobile: false },
  { name: 'Desktop 1440x900', width: 1440, height: 900, isMobile: false },
  { name: 'Mobile 390x844', width: 390, height: 844, isMobile: true },
  { name: 'Mobile 412x915', width: 412, height: 915, isMobile: true }
];

(async () => {
  console.log('================================================================================');
  console.log('🌐 PHASE 012.2 LIVE PRODUCTION MULTI-VIEWPORT SMOKE TEST');
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  let passCount = 0;
  let failCount = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✅ [PASS] ${msg}`);
      passCount++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failCount++;
    }
  }

  for (const vp of VIEWPORTS) {
    console.log(`\n--- TESTING VIEWPORT: ${vp.name} ---`);
    const context = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 1
    });
    const page = await context.newPage();

    async function safeGoto(url) {
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
          return;
        } catch (e) {
          if (attempt === 3) throw e;
          await page.waitForTimeout(500);
        }
      }
    }

    // 1. Homepage
    await safeGoto(`${PROD_URL}/index.html`);
    await page.waitForTimeout(800);
    const title = await page.title();
    assert(title.includes('PadiFix'), `${vp.name}: Homepage title includes PadiFix`);

    const hasWordmark = await page.locator('#logo-link').first().isVisible();
    assert(hasWordmark, `${vp.name}: PadiFix logo mark & wordmark visible`);

    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    assert(!overflow, `${vp.name}: Zero horizontal overflow`);

    const filename = `smoke_${vp.name.replace(/\s+/g, '_').toLowerCase()}.png`;
    await page.screenshot({ path: path.join(EVIDENCE_DIR, filename) });
    console.log(`  📸 Screenshot: ${filename}`);

    // 2. Search
    if (!vp.isMobile) {
      await safeGoto(`${PROD_URL}/search.html?q=plumber`);
      await page.waitForSelector('.provider-item-card:not(.skeleton-card)', { timeout: 12000 });
      const cards = await page.locator('.provider-item-card:not(.skeleton-card)').count();
      assert(cards > 0, `${vp.name}: Search directory returns ${cards} provider cards`);
    }

    await context.close();
  }

  // 3. Functional checks
  console.log('\n--- FUNCTIONAL INTEGRITY CHECKS ---');
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  async function safeGoto(url) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        return;
      } catch (e) {
        if (attempt === 3) throw e;
        await page.waitForTimeout(500);
      }
    }
  }

  // Profile & WhatsApp
  await safeGoto(`${PROD_URL}/profile.html?id=1`);
  await page.waitForSelector('#btn-wa-hero', { timeout: 10000 });
  const waVisible = await page.locator('#btn-wa-hero').first().isVisible();
  assert(waVisible, 'Provider profile WhatsApp CTA is visible and interactive');

  // Register
  await safeGoto(`${PROD_URL}/register.html`);
  const regTitle = await page.title();
  assert(regTitle.includes('PadiFix'), `Register page title confirmed: "${regTitle}"`);

  // Login
  await safeGoto(`${PROD_URL}/login.html`);
  const loginTitle = await page.title();
  assert(loginTitle.includes('PadiFix'), `Login page title confirmed: "${loginTitle}"`);

  // PWA Manifest
  const manifest = await (await page.goto(`${PROD_URL}/manifest.json`)).json();
  assert(manifest.short_name === 'PadiFix' && manifest.theme_color === '#00A859', 'PWA Manifest verified');

  // Service Worker
  const swText = await (await page.goto(`${PROD_URL}/sw.js`)).text();
  assert(swText.includes('padifix-v11.00'), 'Service worker cache version padifix-v11.00 verified');

  console.log('\n================================================================================');
  console.log(`TOTAL: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================================');

  await browser.close();
  process.exit(failCount === 0 ? 0 : 1);
})();
