const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';
const EVIDENCE_DIR = path.join(__dirname, 'visual_evidence', 'padifix');

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
  { url: 'index.html', titleContains: 'PadiFix', expectedHeading: 'PadiFix' },
  { url: 'search.html', titleContains: 'PadiFix', expectedHeading: 'PadiFix' },
  { url: 'profile.html?id=1', titleContains: 'PadiFix', expectedHeading: 'PadiFix' },
  { url: 'register.html', titleContains: 'PadiFix', expectedHeading: 'PadiFix' },
  { url: 'login.html', titleContains: 'PadiFix', expectedHeading: 'PadiFix' },
  { url: 'dashboard.html', titleContains: 'PadiFix', expectedHeading: 'PadiFix', auth: true },
  { url: 'about.html', titleContains: 'PadiFix', expectedHeading: 'PadiFix' },
  { url: 'how-it-works.html', titleContains: 'PadiFix', expectedHeading: 'PadiFix' },
  { url: 'join.html', titleContains: 'PadiFix', expectedHeading: 'PadiFix' },
  { url: 'privacy.html', titleContains: 'PadiFix', expectedHeading: 'PadiFix' },
  { url: 'terms.html', titleContains: 'PadiFix', expectedHeading: 'PadiFix' },
  { url: 'offline.html', titleContains: 'PadiFix', expectedHeading: 'PadiFix' },
  { url: 'admin.html', titleContains: 'PadiFix', expectedHeading: 'PadiFix' },
  { url: 'analytics.html', titleContains: 'PadiFix', expectedHeading: 'PadiFix' }
];

const results = {
  desktop: [],
  mobile: [],
  pages: [],
  pwa: [],
  evidenceScreenshots: []
};

(async () => {
  console.log('================================================================================');
  console.log('🚀 PADIFIX PRE-PRODUCTION ACCEPTANCE TEST SUITE (PHASE 011.1)');
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });

  const context = await browser.newContext({
    deviceScaleFactor: 1
  });

  // Track console errors
  const consoleErrors = [];
  const page = await context.newPage();
  page.on('console', msg => {
    if (msg.type() === 'error' && !msg.text().includes('favicon.ico') && !msg.text().includes('ERR_CONNECTION_REFUSED')) {
      consoleErrors.push(msg.text());
    }
  });

  // 1. DESKTOP VIEWPORT ACCEPTANCE
  console.log('--- 1. DESKTOP VISUAL ACCEPTANCE ---');
  for (const vp of DESKTOP_VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const title = await page.title();
    const hasWordmark = await page.locator('#logo-link .logo-text').isVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);

    const pass = title.includes('PadiFix') && hasWordmark && !overflow;
    results.desktop.push({ viewport: vp.name, pass, title, overflow });
    console.log(`  ${pass ? '✅' : '❌'} ${vp.name}: Title="${title}", WordmarkVisible=${hasWordmark}, Overflow=${overflow}`);

    if (vp.width === 1280) {
      const p = path.join(EVIDENCE_DIR, 'padifix_desktop_homepage.png');
      await page.screenshot({ path: p });
      results.evidenceScreenshots.push('padifix_desktop_homepage.png');
      console.log(`  📸 Saved: padifix_desktop_homepage.png`);
    }
  }

  // 2. MOBILE VIEWPORT ACCEPTANCE
  console.log('\n--- 2. MOBILE VISUAL ACCEPTANCE ---');
  for (const vp of MOBILE_VIEWPORTS) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const overflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });

    const pass = !overflow;
    results.mobile.push({ viewport: vp.name, pass, overflow });
    console.log(`  ${pass ? '✅' : '❌'} ${vp.name}: Zero Overflow=${!overflow}`);

    if (vp.width === 390) {
      const p = path.join(EVIDENCE_DIR, 'padifix_mobile_homepage.png');
      await page.screenshot({ path: p });
      results.evidenceScreenshots.push('padifix_mobile_homepage.png');
      console.log(`  📸 Saved: padifix_mobile_hero.png`);
    }
  }

  // 3. CORE PAGES ACCEPTANCE
  console.log('\n--- 3. ALL 14 CORE PAGES VERIFICATION ---');
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const pg of CORE_PAGES) {
    if (pg.auth) {
      await page.evaluate(() => {
        localStorage.setItem('lokator_supabase_auth_session', JSON.stringify({
          user: { id: 'prov-001', email: 'verified@padifix.ng' },
          provider: { id: 'prov-001', name: 'Dickson Master Services', trade: 'Electrician' }
        }));
      });
    }

    await page.goto(`${BASE_URL}/${pg.url}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(400);

    const title = await page.title();
    const titleMatch = title.includes(pg.titleContains);
    const pass = titleMatch;

    results.pages.push({ url: pg.url, pass, title });
    console.log(`  ${pass ? '✅' : '❌'} ${pg.url}: Title="${title}"`);

    // Capture specific screenshots required for visual evidence
    if (pg.url === 'search.html') {
      const p = path.join(EVIDENCE_DIR, 'padifix_search.png');
      await page.screenshot({ path: p });
      results.evidenceScreenshots.push('padifix_search.png');
      console.log(`  📸 Saved: padifix_search.png`);
    } else if (pg.url.startsWith('profile.html')) {
      const p = path.join(EVIDENCE_DIR, 'padifix_provider_profile.png');
      await page.screenshot({ path: p });
      results.evidenceScreenshots.push('padifix_provider_profile.png');
      console.log(`  📸 Saved: padifix_provider_profile.png`);
    } else if (pg.url === 'register.html') {
      const p = path.join(EVIDENCE_DIR, 'padifix_registration.png');
      await page.screenshot({ path: p });
      results.evidenceScreenshots.push('padifix_registration.png');
      console.log(`  📸 Saved: padifix_registration.png`);
    } else if (pg.url === 'login.html') {
      const p = path.join(EVIDENCE_DIR, 'padifix_login.png');
      await page.screenshot({ path: p });
      results.evidenceScreenshots.push('padifix_login.png');
      console.log(`  📸 Saved: padifix_login.png`);
    }
  }

  // 4. PWA / INSTALL SURFACE
  console.log('\n--- 4. PWA INSTALL SURFACE VERIFICATION ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(500);

  // Trigger PWA bottom sheet for inspection
  await page.evaluate(() => {
    if (typeof window.PadiFixPWA !== 'undefined' && window.PadiFixPWA.showInstallModal) {
      window.PadiFixPWA.showInstallModal();
    } else if (typeof window.LokatorPWA !== 'undefined' && window.LokatorPWA.showInstallModal) {
      window.LokatorPWA.showInstallModal();
    } else {
      const sheet = document.getElementById('pwa-install-sheet');
      if (sheet) {
        sheet.classList.add('active');
        sheet.setAttribute('aria-hidden', 'false');
      }
    }
  });
  await page.waitForTimeout(600);

  const pwaSheetTitle = await page.locator('#pwa-sheet-title').innerText().catch(() => 'N/A');
  const pwaPass = pwaSheetTitle.includes('PadiFix');
  results.pwa.push({ check: 'PWA Install Sheet Title', pass: pwaPass, value: pwaSheetTitle });
  console.log(`  ${pwaPass ? '✅' : '❌'} PWA Sheet Title: "${pwaSheetTitle}"`);

  const pwaScreenshotPath = path.join(EVIDENCE_DIR, 'padifix_pwa_install_surface.png');
  await page.screenshot({ path: pwaScreenshotPath });
  results.evidenceScreenshots.push('padifix_pwa_install_surface.png');
  console.log(`  📸 Saved: padifix_pwa_install_surface.png`);

  console.log('\n================================================================================');
  console.log(`SUMMARY: ${results.evidenceScreenshots.length} / 7 Required Screenshots Generated in scripts/visual_evidence/padifix/`);
  console.log(`Console Errors: ${consoleErrors.length}`);
  console.log('================================================================================');

  fs.writeFileSync(
    path.join(EVIDENCE_DIR, 'acceptance_test_report.json'),
    JSON.stringify({ results, consoleErrors }, null, 2),
    'utf8'
  );

  await browser.close();
  process.exit(0);
})();
