/**
 * Phase 013 Production Runtime Audit
 * scripts/audit_production_runtime.js
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const PROD_URL = 'https://padifix.vercel.app';
const EVIDENCE_DIR = path.join(__dirname, 'visual_evidence', 'phase_013');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'mobile_320x568', width: 320, height: 568, isMobile: true },
  { name: 'mobile_390x844', width: 390, height: 844, isMobile: true },
  { name: 'mobile_412x915', width: 412, height: 915, isMobile: true },
  { name: 'tablet_768x1024', width: 768, height: 1024, isMobile: true },
  { name: 'desktop_1280x800', width: 1280, height: 800, isMobile: false }
];

async function runProductionRuntimeAudit() {
  console.log('='.repeat(80));
  console.log(`🚀 AUDITING PRODUCTION RUNTIME: ${PROD_URL}`);
  console.log('='.repeat(80));

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const auditReport = {
    timestamp: new Date().toISOString(),
    prodUrl: PROD_URL,
    consoleMessages: [],
    networkFailures: [],
    viewports: {},
    customerJourney: {},
    performance: {}
  };

  try {
    // 1. Audit Desktop 1280x800 Homepage Runtime
    console.log('\n--- 1. AUDITING HOMEPAGE RUNTIME (DESKTOP 1280x800) ---');
    const desktopContext = await browser.newContext({
      viewport: { width: 1280, height: 800 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    });
    const desktopPage = await desktopContext.newPage();

    desktopPage.on('console', msg => {
      const entry = { type: msg.type(), text: msg.text() };
      auditReport.consoleMessages.push(entry);
      if (msg.type() === 'error') {
        console.error(`  ❌ [CONSOLE ERROR] ${msg.text()}`);
      }
    });

    desktopPage.on('pageerror', err => {
      auditReport.consoleMessages.push({ type: 'pageerror', text: err.message });
      console.error(`  ❌ [UNCAUGHT EXCEPTION] ${err.message}`);
    });

    desktopPage.on('requestfailed', req => {
      const entry = { url: req.url(), failure: req.failure()?.errorText || 'unknown' };
      auditReport.networkFailures.push(entry);
      console.warn(`  ⚠️  [REQUEST FAILED] ${req.url()} (${entry.failure})`);
    });

    const startTime = Date.now();
    await desktopPage.goto(`${PROD_URL}/index.html`, { waitUntil: 'load', timeout: 30000 });
    const loadTimeMs = Date.now() - startTime;
    console.log(`  ✓ Homepage document loaded in ${loadTimeMs}ms`);

    // Wait for video/DOM
    await desktopPage.waitForTimeout(2000);

    // Verify Scene 1 and Hero Title
    const heroTitle = await desktopPage.locator('.hero-title, .scene-title, h1').first().innerText().catch(() => '');
    console.log(`  ✓ Hero title rendered: "${heroTitle.trim()}"`);

    // Verify Scene 1 Video is present
    const scene1Video = await desktopPage.evaluate(() => {
      const v = document.querySelector('video');
      return v ? { src: v.currentSrc || v.src, paused: v.paused, readyState: v.readyState } : null;
    });
    console.log('  ✓ Hero video state:', scene1Video);

    const homeScreenshot = path.join(EVIDENCE_DIR, 'prod_home_desktop_1280.png');
    await desktopPage.screenshot({ path: homeScreenshot, fullPage: false });
    console.log(`  ✓ Saved screenshot: ${homeScreenshot}`);

    // 2. Audit Viewports for Layout & Responsiveness
    console.log('\n--- 2. AUDITING MOBILE & TABLET VIEWPORTS ---');
    for (const vp of VIEWPORTS) {
      const ctx = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        isMobile: vp.isMobile,
        userAgent: vp.isMobile
          ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15'
          : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      });
      const p = await ctx.newPage();

      // Check search page
      await p.goto(`${PROD_URL}/search.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await p.waitForTimeout(1500);

      // Check horizontal overflow
      const overflow = await p.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth;
      });

      // Check mobile filter trigger touch target if mobile
      let filterBtnRect = null;
      if (vp.isMobile) {
        filterBtnRect = await p.evaluate(() => {
          const btn = document.querySelector('.mobile-filter-trigger');
          if (!btn) return null;
          const r = btn.getBoundingClientRect();
          const s = window.getComputedStyle(btn);
          return { width: r.width, height: r.height, minHeight: s.minHeight, display: s.display };
        });
      }

      const shotPath = path.join(EVIDENCE_DIR, `prod_search_${vp.name}.png`);
      await p.screenshot({ path: shotPath, fullPage: false });

      console.log(`  [${vp.name}] Overflow: ${overflow ? '❌ YES' : '✅ NO'} | Filter Trigger: ${filterBtnRect ? `${filterBtnRect.height}px (min ${filterBtnRect.minHeight})` : 'N/A'}`);
      auditReport.viewports[vp.name] = { overflow, filterBtnRect, shot: shotPath };

      await ctx.close();
    }

    // 3. Complete Customer Journey on Production Search
    console.log('\n--- 3. TESTING CUSTOMER JOURNEY ON PRODUCTION ---');
    const journeyCtx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const jp = await journeyCtx.newPage();

    await jp.goto(`${PROD_URL}/search.html`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await jp.waitForTimeout(1500);

    // Search for electrician
    const keywordInput = jp.locator('#keyword-search');
    await keywordInput.fill('electrician');
    await jp.waitForTimeout(500);
    await jp.keyboard.press('Enter');
    await jp.waitForTimeout(1000);

    const resultCount = await jp.locator('.provider-item-card, .provider-card').count();
    console.log(`  ✓ Search "electrician" returned ${resultCount} cards`);

    const searchResultShot = path.join(EVIDENCE_DIR, 'prod_customer_search_results.png');
    await jp.screenshot({ path: searchResultShot });

    // Open first provider profile
    await jp.goto(`${PROD_URL}/profile.html?id=1`, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await jp.waitForTimeout(1500);

    const profileName = await jp.locator('.provider-name, h1, .profile-title').first().innerText().catch(() => '');
    console.log(`  ✓ Provider profile opened: "${profileName.trim()}"`);

    // Check WhatsApp link
    const waLink = await jp.evaluate(() => {
      const btn = document.querySelector('a[href*="wa.me"], a[href*="whatsapp"]');
      return btn ? btn.href : null;
    });
    console.log(`  ✓ WhatsApp link generated: ${waLink ? '✅ YES (' + waLink.slice(0, 45) + '...)' : '❌ NO'}`);

    // Check Phone link
    const phoneLink = await jp.evaluate(() => {
      const btn = document.querySelector('a[href^="tel:"]');
      return btn ? btn.href : null;
    });
    console.log(`  ✓ Phone call link generated: ${phoneLink ? '✅ YES (' + phoneLink + ')' : '❌ NO'}`);

    const profileShot = path.join(EVIDENCE_DIR, 'prod_customer_profile_id1.png');
    await jp.screenshot({ path: profileShot });

    await journeyCtx.close();
    await desktopContext.close();

    console.log('\n' + '='.repeat(80));
    console.log('✅ PRODUCTION RUNTIME AUDIT COMPLETED');
    console.log('='.repeat(80));

    fs.writeFileSync(
      path.join(EVIDENCE_DIR, 'prod_audit_summary.json'),
      JSON.stringify(auditReport, null, 2)
    );

  } catch (err) {
    console.error('❌ Error during production runtime audit:', err);
  } finally {
    await browser.close();
  }
}

runProductionRuntimeAudit().catch(console.error);
