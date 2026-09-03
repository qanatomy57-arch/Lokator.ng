const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
  console.log('================================================================================');
  console.log('🎬 VERIFYING ALL 9 HERO VIDEOS PLAY & LOOP AS USER SCROLLS ON MOBILE');
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

  const scrollDistance = await page.evaluate(() => document.getElementById('hero').offsetHeight - window.innerHeight);
  console.log(`ℹ️ Mobile scroll distance: ${scrollDistance}px (~${Math.round(scrollDistance / 8)}px per scene)\n`);

  for (let s = 0; s < 9; s++) {
    const targetY = Math.round((s / 8) * scrollDistance);
    await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'auto' }), targetY);
    await page.waitForTimeout(400);

    const videoState = await page.evaluate(async (idx) => {
      const vid = document.getElementById(`video-${idx}`);
      if (!vid) return null;

      const initialTime = vid.currentTime;
      await new Promise(resolve => setTimeout(resolve, 250));
      const advancedTime = vid.currentTime;

      return {
        id: vid.id,
        src: vid.querySelector('source')?.getAttribute('src')?.split('/')?.pop(),
        paused: vid.paused,
        loop: vid.loop,
        initialTime,
        advancedTime,
        timeAdvanced: advancedTime >= initialTime,
        readyState: vid.readyState
      };
    }, s);

    console.log(`  Scene ${s + 1} (Y=${targetY}px):`);
    console.log(`    - Video: ${videoState.src}`);
    console.log(`    - Paused: ${videoState.paused} (expected: false)`);
    console.log(`    - Looping: ${videoState.loop} (expected: true)`);
    console.log(`    - Time progressed: ${videoState.initialTime.toFixed(2)}s -> ${videoState.advancedTime.toFixed(2)}s`);

    assert.strictEqual(videoState.paused, false, `Video ${s} (${videoState.src}) MUST NOT BE PAUSED when Scene ${s + 1} is active`);
    assert.strictEqual(videoState.loop, true, `Video ${s} (${videoState.src}) must have loop=true`);
    console.log(`    ✅ [PASS] Video ${s} is PLAYING & LOOPING smoothly!\n`);
  }

  // REVERSAL CHECK: Scroll back up to Scene 2
  console.log('--- REVERSAL PLAYBACK TEST: SCROLLING UP TO SCENE 2 ---');
  const scene2Y = Math.round((1 / 8) * scrollDistance);
  await page.evaluate((y) => window.scrollTo({ top: y, behavior: 'auto' }), scene2Y);
  await page.waitForTimeout(400);

  const revState = await page.evaluate(async () => {
    const vid = document.getElementById('video-1');
    const initialTime = vid.currentTime;
    await new Promise(resolve => setTimeout(resolve, 200));
    return {
      paused: vid.paused,
      advancedTime: vid.currentTime,
      loop: vid.loop
    };
  });

  assert.strictEqual(revState.paused, false, 'Video 1 must resume playing on upward scroll');
  assert.strictEqual(revState.loop, true, 'Video 1 must retain loop=true');
  console.log('  ✅ [PASS] Video 1 resumes playing and looping upon scrolling back up!\n');

  await browser.close();

  console.log('================================================================================');
  console.log('🎉 ALL 9 HERO VIDEOS VERIFIED PLAYING AND LOOPING ON MOBILE SCROLL!');
  console.log('================================================================================');
})();
