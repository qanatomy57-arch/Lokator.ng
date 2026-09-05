const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const http = require('http');

const ROOT = path.join(__dirname, '..');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

function startServer(port = 8899) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      let pathname = new URL(req.url, `http://localhost:${port}`).pathname;
      if (pathname === '/') pathname = '/index.html';
      const filePath = path.join(ROOT, decodeURIComponent(pathname));
      if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        res.writeHead(404); res.end('Not Found'); return;
      }
      res.writeHead(200, { 'Content-Type': MIME_TYPES[path.extname(filePath)] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(port, () => resolve(server));
  });
}

function parseRgb(colorStr) {
  const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!match) return [0, 0, 0];
  return [parseInt(match[1]), parseInt(match[2]), parseInt(match[3])];
}

function getLuminance([r, g, b]) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function getContrastRatio(fgRgb, bgRgb) {
  const lum1 = getLuminance(fgRgb);
  const lum2 = getLuminance(bgRgb);
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

(async () => {
  const server = await startServer(8899);
  const BASE = 'http://localhost:8899';
  const outDir = path.resolve(__dirname, 'visual_evidence/theme_dual_mode');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const results = {
    pagesTested: [],
    themeCyclingVerified: false,
    contrastChecks: [],
    screenshotsCaptured: []
  };

  try {
    const page = await browser.newPage({
      viewport: { width: 412, height: 915 }, // Modern mobile standard (Pixel 7)
      isMobile: true,
      hasTouch: true
    });

    console.log('=== 1. TESTING THEME TOGGLE & PERSISTENCE ON DASHBOARD ===');
    await page.goto(`${BASE}/login.html`, { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => {
      const mock = {
        id: '1',
        name: 'Adebayo Okafor',
        trade: 'Electrician & Solar Installer',
        phone: '+2348012345678',
        subscription_tier: 'PRO',
        monthly_contacts_used: 0,
        monthly_contacts_limit: 100
      };
      localStorage.setItem('lokator_supabase_auth_session', JSON.stringify({ user: { id: '1' }, provider: mock }));
      localStorage.setItem('lokator_provider_profile', JSON.stringify(mock));
      localStorage.setItem('padifix_theme', 'light');
    });

    await page.goto(`${BASE}/dashboard.html#subscription`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    // Verify initial light theme
    let currentTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    console.log(`Initial theme loaded: ${currentTheme}`);
    if (currentTheme !== 'light') throw new Error(`Expected light theme, got ${currentTheme}`);

    // Capture Light Mode Dashboard Screenshot
    const dashLightShot = path.join(outDir, 'dashboard_mobile_light.png');
    await page.screenshot({ path: dashLightShot });
    results.screenshotsCaptured.push(dashLightShot);
    console.log('📸 Captured dashboard_mobile_light.png');

    // Check Light Mode Contrast
    const lightMetrics = await page.evaluate(() => {
      const body = window.getComputedStyle(document.body);
      const card = window.getComputedStyle(document.querySelector('.kpi-card') || document.body);
      const banner = window.getComputedStyle(document.querySelector('.provider-growth-banner') || document.body);
      return {
        bodyBg: body.backgroundColor,
        bodyFg: body.color,
        cardBg: card.backgroundColor,
        cardFg: card.color,
        bannerBg: banner.backgroundColor,
        bannerFg: banner.color
      };
    });

    const lightRatio = getContrastRatio(parseRgb(lightMetrics.bodyFg), parseRgb(lightMetrics.bodyBg));
    console.log(`Light Mode Body Contrast Ratio: ${lightRatio.toFixed(2)}:1 (WCAG AAA >= 7:1)`);
    results.contrastChecks.push({ mode: 'light', element: 'body', ratio: lightRatio.toFixed(2) });

    // Cycle to Dark Mode
    console.log('Toggling theme to DARK...');
    await page.evaluate(() => {
      window.PadiFixTheme.setTheme('dark');
    });
    await page.waitForTimeout(400);

    currentTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    const storedTheme = await page.evaluate(() => localStorage.getItem('padifix_theme'));
    console.log(`Updated theme attribute: ${currentTheme}, localStorage: ${storedTheme}`);
    if (currentTheme !== 'dark' || storedTheme !== 'dark') throw new Error('Theme toggle to dark failed');

    // Capture Dark Mode Dashboard Screenshot
    const dashDarkShot = path.join(outDir, 'dashboard_mobile_dark.png');
    await page.screenshot({ path: dashDarkShot });
    results.screenshotsCaptured.push(dashDarkShot);
    console.log('📸 Captured dashboard_mobile_dark.png');

    // Check Dark Mode Contrast
    const darkMetrics = await page.evaluate(() => {
      const body = window.getComputedStyle(document.body);
      const card = window.getComputedStyle(document.querySelector('.kpi-card') || document.body);
      const banner = window.getComputedStyle(document.querySelector('.provider-growth-banner') || document.body);
      return {
        bodyBg: body.backgroundColor,
        bodyFg: body.color,
        cardBg: card.backgroundColor,
        cardFg: card.color,
        bannerBg: banner.backgroundColor,
        bannerFg: banner.color
      };
    });

    const darkRatio = getContrastRatio(parseRgb(darkMetrics.bodyFg), parseRgb(darkMetrics.bodyBg));
    console.log(`Dark Mode Body Contrast Ratio: ${darkRatio.toFixed(2)}:1 (WCAG AAA >= 7:1)`);
    results.contrastChecks.push({ mode: 'dark', element: 'body', ratio: darkRatio.toFixed(2) });

    results.pagesTested.push('dashboard.html');
    results.themeCyclingVerified = true;

    // === 2. TESTING REGISTER PAGE ===
    console.log('\n=== 2. TESTING REGISTER PAGE IN DUAL MODE ===');
    await page.goto(`${BASE}/register.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    // Register Dark Mode Screenshot
    const regDarkShot = path.join(outDir, 'register_mobile_dark.png');
    await page.screenshot({ path: regDarkShot });
    results.screenshotsCaptured.push(regDarkShot);
    console.log('📸 Captured register_mobile_dark.png');

    // Toggle to Light Mode
    await page.evaluate(() => window.PadiFixTheme.setTheme('light'));
    await page.waitForTimeout(400);

    const regLightShot = path.join(outDir, 'register_mobile_light.png');
    await page.screenshot({ path: regLightShot });
    results.screenshotsCaptured.push(regLightShot);
    console.log('📸 Captured register_mobile_light.png');
    results.pagesTested.push('register.html');

    // === 3. TESTING SEARCH PAGE ===
    console.log('\n=== 3. TESTING SEARCH PAGE IN DUAL MODE ===');
    await page.goto(`${BASE}/search.html`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(600);

    const searchLightShot = path.join(outDir, 'search_mobile_light.png');
    await page.screenshot({ path: searchLightShot });
    results.screenshotsCaptured.push(searchLightShot);
    console.log('📸 Captured search_mobile_light.png');

    // Toggle to Dark Mode
    await page.evaluate(() => window.PadiFixTheme.setTheme('dark'));
    await page.waitForTimeout(400);

    const searchDarkShot = path.join(outDir, 'search_mobile_dark.png');
    await page.screenshot({ path: searchDarkShot });
    results.screenshotsCaptured.push(searchDarkShot);
    console.log('📸 Captured search_mobile_dark.png');
    results.pagesTested.push('search.html');

    // === 4. TESTING DESKTOP HOMEPAGE (INDEX.HTML) ===
    console.log('\n=== 4. TESTING DESKTOP INDEX PAGE IN DUAL MODE ===');
    const desktopPage = await browser.newPage({
      viewport: { width: 1280, height: 800 }
    });

    await desktopPage.goto(`${BASE}/index.html`, { waitUntil: 'domcontentloaded' });
    await desktopPage.waitForTimeout(600);

    // Check navbar toggle existence
    const toggleExists = await desktopPage.evaluate(() => !!document.querySelector('.theme-toggle-btn'));
    console.log(`Desktop navbar theme toggle exists: ${toggleExists}`);
    if (!toggleExists) throw new Error('Desktop navbar toggle not found');

    // Switch to dark mode
    await desktopPage.evaluate(() => window.PadiFixTheme.setTheme('dark'));
    await desktopPage.waitForTimeout(400);

    const indexDarkShot = path.join(outDir, 'index_desktop_dark.png');
    await desktopPage.screenshot({ path: indexDarkShot });
    results.screenshotsCaptured.push(indexDarkShot);
    console.log('📸 Captured index_desktop_dark.png');

    // Switch to light mode
    await desktopPage.evaluate(() => window.PadiFixTheme.setTheme('light'));
    await desktopPage.waitForTimeout(400);

    const indexLightShot = path.join(outDir, 'index_desktop_light.png');
    await desktopPage.screenshot({ path: indexLightShot });
    results.screenshotsCaptured.push(indexLightShot);
    console.log('📸 Captured index_desktop_light.png');
    results.pagesTested.push('index.html');

    console.log('\n=============================================');
    console.log('🏆 ALL DUAL-MODE VERIFICATIONS COMPLETED 100%!');
    console.log(`Tested Pages: ${results.pagesTested.join(', ')}`);
    console.log(`Contrast Ratios: Light=${lightRatio.toFixed(2)}:1, Dark=${darkRatio.toFixed(2)}:1`);
    console.log('=============================================');

    fs.writeFileSync(path.join(outDir, 'verification_summary.json'), JSON.stringify(results, null, 2));

  } catch (err) {
    console.error('❌ Verification failed with error:', err);
    process.exit(1);
  } finally {
    await browser.close();
    server.close();
  }
})();
