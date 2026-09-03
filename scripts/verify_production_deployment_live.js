const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PROD_URL = 'https://lokator-ng.vercel.app';
const EVIDENCE_DIR = path.join(__dirname, 'visual_evidence', 'padifix', 'production_step_1');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const DESKTOP_VIEWPORTS = [
  { name: 'Desktop 1280x720', width: 1280, height: 720 },
  { name: 'Desktop 1440x900', width: 1440, height: 900 },
  { name: 'Desktop 1920x1080', width: 1920, height: 1080 }
];

const MOBILE_VIEWPORTS = [
  { name: 'Mobile 320x844', width: 320, height: 844 },
  { name: 'Mobile 360x800', width: 360, height: 800 },
  { name: 'Mobile 390x844', width: 390, height: 844 },
  { name: 'Mobile 412x915', width: 412, height: 915 }
];

const CORE_PAGES = [
  { url: 'index.html', titleContains: 'PadiFix' },
  { url: 'search.html', titleContains: 'PadiFix' },
  { url: 'profile.html?id=1', titleContains: 'PadiFix' },
  { url: 'register.html', titleContains: 'PadiFix' },
  { url: 'login.html', titleContains: 'PadiFix' },
  { url: 'dashboard.html', titleContains: 'PadiFix', auth: true },
  { url: 'about.html', titleContains: 'PadiFix' },
  { url: 'how-it-works.html', titleContains: 'PadiFix' },
  { url: 'join.html', titleContains: 'PadiFix' },
  { url: 'privacy.html', titleContains: 'PadiFix' },
  { url: 'terms.html', titleContains: 'PadiFix' },
  { url: 'offline.html', titleContains: 'PadiFix' }
];

(async () => {
  console.log('================================================================================');
  console.log(`🌐 LIVE VERCEL PRODUCTION SMOKE TEST: ${PROD_URL}`);
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({ deviceScaleFactor: 1 });
  const page = await context.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon.ico')) {
      consoleErrors.push(msg.text());
    }
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

  async function safeGoto(url) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 });
        return;
      } catch (err) {
        if (attempt === 3) throw err;
        await page.waitForTimeout(600);
      }
    }
  }

  // 1. DESKTOP PRODUCTION HOMEPAGE & LOGO
  console.log('--- 1. DESKTOP VIEWPORT SMOKE TEST ---');
  await page.setViewportSize({ width: 1280, height: 720 });
  await safeGoto(`${PROD_URL}/index.html`);
  await page.waitForTimeout(1000);

  const title = await page.title();
  assert(title.includes('PadiFix') && title.includes('Find Skills. Get Things Done.'), `Live page title matches PadiFix brand: "${title}"`);

  const wordmarkVisible = await page.locator('#logo-link').first().isVisible();
  assert(wordmarkVisible, 'PadiFix header logo & wordmark visible');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert(!overflow, 'Desktop 1280x720: Zero horizontal overflow');

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod_desktop_homepage.png') });
  console.log('  📸 Saved: prod_desktop_homepage.png');

  // 2. MOBILE VIEWPORT SMOKE TEST
  console.log('\n--- 2. MOBILE VIEWPORT SMOKE TEST ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await safeGoto(`${PROD_URL}/index.html`);
  await page.waitForTimeout(1000);

  const mobOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  assert(!mobOverflow, 'Mobile 390x844: Zero horizontal overflow');

  const heroVisible = await page.locator('#hero, #hero-stage, .hero-scroll-wrapper').first().isVisible();
  assert(heroVisible, 'Hero cinematic video container active and visible');

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod_mobile_homepage.png') });
  console.log('  📸 Saved: prod_mobile_homepage.png');

  // 3. SEARCH & PROVIDER DISCOVERY
  console.log('\n--- 3. LIVE SEARCH & PROVIDER DISCOVERY ---');
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto(`${PROD_URL}/search.html?q=electrician`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('.provider-item-card:not(.skeleton-card)', { timeout: 15000 });

  const cardCount = await page.locator('.provider-item-card:not(.skeleton-card)').count();
  assert(cardCount > 0, `Search returns ${cardCount} live provider cards`);

  const firstCardText = await page.locator('.provider-item-card:not(.skeleton-card)').first().innerText();
  assert(firstCardText.length > 20, 'Provider card contains rich profile details');

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod_search.png') });
  console.log('  📸 Saved: prod_search.png');

  // 4. PROVIDER PROFILE & WHATSAPP CTA
  console.log('\n--- 4. LIVE PROVIDER PROFILE & WHATSAPP CTA ---');
  await safeGoto(`${PROD_URL}/profile.html?id=1`);
  await page.waitForSelector('#btn-wa-hero', { timeout: 10000 });

  const waBtnVisible = await page.locator('#btn-wa-hero').first().isVisible();
  assert(waBtnVisible, 'WhatsApp contact action visible on live profile');

  const waHref = await page.locator('#btn-wa-hero').first().getAttribute('href');
  assert(waHref.includes('wa.me') || waHref.includes('whatsapp') || waHref.includes('#'), `WhatsApp URL generated: ${waHref.substring(0, 45)}`);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod_provider_profile.png') });
  console.log('  📸 Saved: prod_provider_profile.png');

  // 5. REGISTRATION WIZARD
  console.log('\n--- 5. LIVE REGISTRATION SURFACE ---');
  await safeGoto(`${PROD_URL}/register.html`);
  const regTitle = await page.title();
  assert(regTitle.includes('PadiFix'), `Register title contains PadiFix: "${regTitle}"`);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod_registration.png') });
  console.log('  📸 Saved: prod_registration.png');

  // 6. LOGIN SURFACE
  console.log('\n--- 6. LIVE LOGIN SURFACE ---');
  await safeGoto(`${PROD_URL}/login.html`);
  const loginTitle = await page.title();
  assert(loginTitle.includes('PadiFix'), `Login title contains PadiFix: "${loginTitle}"`);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod_login.png') });
  console.log('  📸 Saved: prod_login.png');

  // 7. PWA INSTALL SURFACE
  console.log('\n--- 7. LIVE PWA INSTALL SURFACE ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await safeGoto(`${PROD_URL}/index.html`);
  await page.waitForTimeout(500);

  await page.evaluate(() => {
    if (typeof window.PadiFixPWA !== 'undefined' && window.PadiFixPWA.showInstallModal) {
      window.PadiFixPWA.showInstallModal();
    } else {
      const sheet = document.getElementById('pwa-install-sheet');
      if (sheet) {
        sheet.classList.add('active');
        sheet.setAttribute('aria-hidden', 'false');
      }
    }
  });
  await page.waitForTimeout(500);

  const pwaSheetTitle = await page.locator('#pwa-sheet-title').innerText().catch(() => 'N/A');
  assert(pwaSheetTitle.includes('PadiFix'), `PWA Install Sheet reads: "${pwaSheetTitle}"`);

  await page.screenshot({ path: path.join(EVIDENCE_DIR, 'prod_pwa_surface.png') });
  console.log('  📸 Saved: prod_pwa_surface.png');

  // 8. CORE PAGES SMOKE TEST
  console.log('\n--- 8. ALL CORE PAGES INTEGRITY ---');
  for (const pg of CORE_PAGES) {
    if (pg.auth) {
      await page.evaluate(() => {
        localStorage.setItem('lokator_supabase_auth_session', JSON.stringify({
          user: { id: 'prov-001', email: 'verified@padifix.ng' },
          provider: { id: 'prov-001', name: 'Dickson Master Services', trade: 'Electrician' }
        }));
      });
    }
    await safeGoto(`${PROD_URL}/${pg.url}`);
    await page.waitForTimeout(300);
    const pTitle = await page.title();
    assert(pTitle.includes(pg.titleContains), `${pg.url}: Title verified: "${pTitle}"`);
  }

  // 9. LIVE MANIFEST & SERVICE WORKER VALIDATION
  console.log('\n--- 9. LIVE PWA MANIFEST & CACHE VALIDATION ---');
  const manifestResp = await page.goto(`${PROD_URL}/manifest.json`);
  const manifestData = await manifestResp.json();
  assert(manifestData.name.includes('PadiFix'), `Live manifest name is: "${manifestData.name}"`);
  assert(manifestData.short_name === 'PadiFix', `Live manifest short_name is: "${manifestData.short_name}"`);
  assert(manifestData.theme_color === '#00A859', `Live manifest theme_color is: "${manifestData.theme_color}"`);

  const swResp = await page.goto(`${PROD_URL}/sw.js`);
  const swText = await swResp.text();
  assert(swText.includes('padifix-v11.00'), 'Live sw.js cache version is padifix-v11.00');

  console.log('\n================================================================================');
  console.log(`TOTAL: ${passCount} PASSED, ${failCount} FAILED | Console Errors: ${consoleErrors.length}`);
  console.log('================================================================================');

  await browser.close();
  process.exit(failCount === 0 ? 0 : 1);
})();
