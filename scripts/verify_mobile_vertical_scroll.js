const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('================================================================================');
  console.log('📱 VERIFYING MOBILE VERTICAL SCROLL (UP/DOWN) THROUGH ALL 9 HERO VIDEOS');
  console.log('================================================================================\n');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block'
  });
  const page = await context.newPage();
  await page.goto('http://localhost:8080', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  // 1. CONFIRM NO HORIZONTAL CONTROLS OR FLOATING PILL EXIST
  console.log('--- TEST 1: ZERO HORIZONTAL PILLS OR SLIDERS ---');
  const pillExists = await page.evaluate(() => {
    const pill = document.getElementById('hero-mobile-nav');
    const prev = document.getElementById('hero-mobile-prev');
    const next = document.getElementById('hero-mobile-next');
    return !!(pill || prev || next);
  });
  assert(!pillExists, 'Mobile pill / horizontal buttons must be completely removed from DOM');
  console.log('  ✅ [PASS] Confirmed: No horizontal pill, arrows, or slider buttons exist in DOM!');

  // 2. VERTICAL SCROLLING DOWN THROUGH ALL 9 SCENES
  console.log('\n--- TEST 2: VERTICAL SCROLLING DOWN (SCENE 1 -> SCENE 9) ---');
  const scrollDistance = await page.evaluate(() => {
    const hero = document.getElementById('hero');
    return hero.offsetHeight - window.innerHeight;
  });
  console.log(`  ℹ️ Mobile scroll distance: ${scrollDistance}px (~${Math.round(scrollDistance / 8)}px per scene)`);

  const observedScenes = [];

  for (let s = 0; s < 9; s++) {
    const targetY = Math.round((s / 8) * scrollDistance);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'auto' }), targetY);
    await page.waitForTimeout(200);

    const sceneData = await page.evaluate((idx) => {
      const slide = document.querySelector(`.hero-slide[data-index="${idx}"]`);
      const currentIdx = window.lokatorDiscovery.currentIndex;
      const progress = window.lokatorDiscovery.currentProgress;
      const opacity = slide ? parseFloat(window.getComputedStyle(slide).opacity) : 0;
      return { currentIdx, progress, opacity };
    }, s);

    assert(sceneData.opacity > 0.6, `Scene ${s + 1} must be active and visible at step ${s} (opacity: ${sceneData.opacity})`);
    console.log(`  ✅ [PASS] Scroll Y=${targetY}px -> Scene ${s + 1} dominant (opacity: ${sceneData.opacity.toFixed(2)}, progress: ${sceneData.progress.toFixed(2)})`);
    observedScenes.push(sceneData.currentIdx);
  }

  // 3. VERTICAL SCROLLING UP (REVERSAL BACK TO TOP)
  console.log('\n--- TEST 3: VERTICAL SCROLLING UP (REVERSAL BACK TO SCENE 1) ---');
  for (let s = 7; s >= 0; s--) {
    const targetY = Math.round((s / 8) * scrollDistance);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'auto' }), targetY);
    await page.waitForTimeout(150);

    const activeIdx = await page.evaluate(() => window.lokatorDiscovery.currentIndex);
    assert.strictEqual(activeIdx, s, `Scrolling up to step ${s} must make Scene ${s + 1} active`);
  }
  console.log('  ✅ [PASS] Scrolling up reversed cleanly through all scenes back to Scene 1 (top: 0)!');

  // 4. NATURAL RELEASE INTO DOWNSTREAM SECTION
  console.log('\n--- TEST 4: NATURAL RELEASE PAST SCENE 9 ---');
  const pastHero = scrollDistance + 300;
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'auto' }), pastHero);
  await page.waitForTimeout(300);

  const downstreamVisible = await page.evaluate(() => {
    const browse = document.getElementById('browse-skills');
    const rect = browse.getBoundingClientRect();
    return rect.top < window.innerHeight && rect.bottom > 0;
  });
  assert(downstreamVisible, 'Browsing downstream sections must be naturally visible past Scene 9');
  console.log('  ✅ [PASS] Released naturally into #browse-skills past Scene 9!');

  await browser.close();

  console.log('\n================================================================================');
  console.log('🎉 ALL MOBILE VERTICAL SCROLL TESTS PASSED WITH 100% SUCCESS!');
  console.log('================================================================================');
})();
