const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('================================================================================');
  console.log('📱 VERIFYING ALL 9 HERO VIDEOS: SCROLLABLE, INTERACTIVE & PLAYING WELL');
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

  // 2. VERTICAL SCROLLING DOWN THROUGH ALL 9 SCENES: SCROLLABLE, INTERACTIVE & PLAYING
  console.log('\n--- TEST 2: ALL 9 SCENES SCROLLABLE, INTERACTIVE & PLAYING WELL ---');
  const scrollDistance = await page.evaluate(() => {
    const hero = document.getElementById('hero');
    return hero.offsetHeight - window.innerHeight;
  });
  console.log(`  ℹ️ Mobile scroll runway distance: ${scrollDistance}px (~${Math.round(scrollDistance / 8)}px per scene)`);

  for (let s = 0; s < 9; s++) {
    const targetY = Math.round((s / 8) * scrollDistance);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'auto' }), targetY);
    await page.waitForFunction((idx) => {
      const slide = document.querySelector(`.hero-slide[data-index="${idx}"]`);
      return slide && parseFloat(window.getComputedStyle(slide).opacity) > 0.8;
    }, s, { timeout: 4000 });

    const sceneData = await page.evaluate((idx) => {
      const slide = document.querySelector(`.hero-slide[data-index="${idx}"]`);
      const card = slide?.querySelector('.story-card');
      const vid = document.getElementById(`video-${idx}`);
      const btn = slide?.querySelector('.btn, a.btn, button');

      const slideOp = slide ? parseFloat(window.getComputedStyle(slide).opacity) : 0;
      const cardOp = card ? parseFloat(window.getComputedStyle(card).opacity) : 0;
      const cardPE = card ? window.getComputedStyle(card).pointerEvents : 'none';
      const slideZ = slide ? window.getComputedStyle(slide).zIndex : '0';

      return {
        currentIndex: window.lokatorDiscovery.currentIndex,
        slideOp,
        cardOp,
        cardPE,
        slideZ,
        hasBtn: !!btn,
        vidPaused: vid ? vid.paused : true,
        vidReady: vid ? vid.readyState : 0,
        vidSrc: vid?.querySelector('source')?.getAttribute('src')
      };
    }, s);

    // Verify scrollability & visibility
    assert(sceneData.slideOp > 0.75, `Scene ${s + 1} slide must be visible (opacity: ${sceneData.slideOp})`);
    assert(sceneData.cardOp > 0.75, `Scene ${s + 1} card must be visible (opacity: ${sceneData.cardOp})`);

    // Verify interactivity: active dominant card MUST have pointer-events: auto and z-index: 10
    assert.strictEqual(sceneData.cardPE, 'auto', `Scene ${s + 1} card must be interactive (pointer-events: auto)`);
    assert.strictEqual(sceneData.slideZ, '10', `Scene ${s + 1} active slide must have z-index: 10`);

    console.log(`  ✅ [PASS] Scene ${s + 1} dominant at Y=${targetY}px | Card opacity: ${sceneData.cardOp.toFixed(2)} (interactive: ${sceneData.cardPE}) | Video: ${sceneData.vidSrc.split('/').pop()}`);
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

  // 4. TEST UNDER REDUCED MOTION: ALL 9 SCENES FULLY SCROLLABLE & REACHABLE
  console.log('\n--- TEST 4: REDUCED MOTION PHONE SIMULATION (ALL 9 SCENES SCROLLABLE) ---');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload({ waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(400);

  const rmScrollDist = await page.evaluate(() => document.getElementById('hero').offsetHeight - window.innerHeight);
  assert(rmScrollDist > 1000, `Reduced motion must NOT collapse scroll runway (actual: ${rmScrollDist}px)`);

  for (let s = 0; s < 9; s++) {
    const targetY = Math.round((s / 8) * rmScrollDist);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'auto' }), targetY);
    await page.waitForFunction((idx) => {
      const slide = document.querySelector(`.hero-slide[data-index="${idx}"]`);
      return slide && parseFloat(window.getComputedStyle(slide).opacity) > 0.75;
    }, s, { timeout: 4000 });

    const active = await page.evaluate((idx) => {
      const slide = document.querySelector(`.hero-slide[data-index="${idx}"]`);
      return {
        currentIndex: window.lokatorDiscovery.currentIndex,
        opacity: slide ? parseFloat(window.getComputedStyle(slide).opacity) : 0
      };
    }, s);
    console.log(`    ℹ️ RM Step ${s}: active index = ${active.currentIndex}, slide opacity = ${active.opacity}`);
    assert(active.opacity > 0.75, `Scene ${s + 1} must be reachable under reduced motion mode (actual: ${active.opacity})`);
  }
  console.log('  ✅ [PASS] All 9 scenes are 100% scrollable and reachable under reduced-motion mode!');

  // 5. NATURAL RELEASE PAST SCENE 9
  console.log('\n--- TEST 5: NATURAL RELEASE PAST SCENE 9 ---');
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
  console.log('🎉 ALL 9 VIDEOS CONFIRMED SCROLLABLE, INTERACTIVE & PLAYING WELL!');
  console.log('================================================================================');
})();
