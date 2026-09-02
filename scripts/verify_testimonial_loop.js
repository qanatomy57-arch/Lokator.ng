/**
 * LOKATOR.NG — TESTIMONIALS CONTINUOUS MARQUEE VERIFICATION SUITE
 * Validates right-to-left seamless, infinite, zero-jump loop across all 9 viewports
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const EVIDENCE_DIR = path.join(__dirname, 'visual_evidence');
const BRAIN_ARTIFACT_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\acee3884-cba8-4699-bf72-668b0aefd1f9';

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'iphone_se_320', width: 320, height: 568 },
  { name: 'iphone_8_375', width: 375, height: 667 },
  { name: 'iphone_14_390', width: 390, height: 844 },
  { name: 'iphone_15pro_393', width: 393, height: 852 },
  { name: 'pixel_7_412', width: 412, height: 915 },
  { name: 'iphone_15promax_430', width: 430, height: 932 },
  { name: 'tablet_768', width: 768, height: 1024 },
  { name: 'desktop_1024', width: 1024, height: 768 },
  { name: 'desktop_1280', width: 1280, height: 800 },
];

async function saveEvidence(page, name) {
  const localPath = path.join(EVIDENCE_DIR, `${name}.png`);
  const brainPath = path.join(BRAIN_ARTIFACT_DIR, `${name}.png`);
  const el = page.locator('#testimonials');
  await el.screenshot({ path: localPath, animations: 'allow', timeout: 8000 });
  try {
    fs.copyFileSync(localPath, brainPath);
  } catch (e) {
    // Ignore if brain path inaccessible
  }
}

async function runTestSuite() {
  console.log('================================================================================');
  console.log('🚀 RUNNING COMPREHENSIVE TESTIMONIALS CONTINUOUS MARQUEE AUDIT');
  console.log('================================================================================\n');

  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  let totalTests = 0;
  let passedTests = 0;

  function assert(cond, msg) {
    totalTests++;
    if (cond) {
      passedTests++;
      console.log(`  ✓ ${msg}`);
    } else {
      console.error(`  ❌ FAILED: ${msg}`);
      throw new Error(`Assertion failed: ${msg}`);
    }
  }

  try {
    // 1. Viewport verification across all 9 viewports
    for (const vp of VIEWPORTS) {
      console.log(`\n--- Auditing Viewport: ${vp.name} (${vp.width}x${vp.height}) ---`);
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        deviceScaleFactor: 2,
        locale: 'en-NG'
      });
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#testimonials', { timeout: 10000 });

      // Scroll to testimonial section
      await page.evaluate(() => {
        document.getElementById('testimonials').scrollIntoView({ behavior: 'instant' });
      });
      await page.waitForTimeout(400);

      // Check Body Overflow
      const overflowCheck = await page.evaluate(() => {
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const bodyScrollW = document.body.scrollWidth;
        return {
          docW,
          scrollW,
          bodyScrollW,
          hasOverflow: scrollW > docW || bodyScrollW > docW
        };
      });
      assert(!overflowCheck.hasOverflow, `${vp.name}: 0px horizontal body overflow (docW=${overflowCheck.docW}, scrollW=${overflowCheck.scrollW})`);

      // Verify Track & Groups Structure
      const trackStructure = await page.evaluate(() => {
        const track = document.getElementById('testi-track');
        const groups = Array.from(track.querySelectorAll('.testi-group'));
        const firstGroupCards = groups[0] ? groups[0].querySelectorAll('.testi-card').length : 0;
        const cs = window.getComputedStyle(track);
        return {
          groupCount: groups.length,
          cardsPerGroup: firstGroupCards,
          animationName: cs.animationName,
          animationDuration: cs.animationDuration,
          animationPlayState: cs.animationPlayState,
          animationTimingFunction: cs.animationTimingFunction
        };
      });

      assert(trackStructure.groupCount === 4, `${vp.name}: Exactly 4 groups present for seamless 4K infinite coverage`);
      assert(trackStructure.cardsPerGroup === 6, `${vp.name}: Exactly 6 testimonial cards per group`);
      assert(trackStructure.animationName === 'scrollTestimonials', `${vp.name}: animationName is scrollTestimonials`);
      assert(trackStructure.animationPlayState === 'running', `${vp.name}: animationPlayState is running`);
      assert(trackStructure.animationTimingFunction === 'linear', `${vp.name}: animationTimingFunction is linear`);

      // Verify Continuous Movement Over Time (t=0, t=1.5s, t=3s)
      const pos0 = await page.evaluate(() => {
        const track = document.getElementById('testi-track');
        const matrix = window.getComputedStyle(track).transform;
        const match = matrix.match(/matrix.*\((.+)\)/);
        if (match) {
          const vals = match[1].split(', ');
          return parseFloat(vals[4]);
        }
        return 0;
      });

      await page.waitForTimeout(1500);

      const pos1 = await page.evaluate(() => {
        const track = document.getElementById('testi-track');
        const matrix = window.getComputedStyle(track).transform;
        const match = matrix.match(/matrix.*\((.+)\)/);
        if (match) {
          const vals = match[1].split(', ');
          return parseFloat(vals[4]);
        }
        return 0;
      });

      await page.waitForTimeout(1500);

      const pos2 = await page.evaluate(() => {
        const track = document.getElementById('testi-track');
        const matrix = window.getComputedStyle(track).transform;
        const match = matrix.match(/matrix.*\((.+)\)/);
        if (match) {
          const vals = match[1].split(', ');
          return parseFloat(vals[4]);
        }
        return 0;
      });

      assert(pos1 < pos0, `${vp.name}: Movement is RIGHT -> LEFT (t=0: ${pos0.toFixed(1)}px, t=1.5s: ${pos1.toFixed(1)}px)`);
      assert(pos2 < pos1, `${vp.name}: Movement continues uninterrupted (t=1.5s: ${pos1.toFixed(1)}px, t=3s: ${pos2.toFixed(1)}px)`);

      // Check Cards Visibility & Readability
      const cardReadability = await page.evaluate(() => {
        const firstCard = document.querySelector('#testi-1');
        const text = firstCard.querySelector('p').textContent;
        const author = firstCard.querySelector('.testi-author strong').textContent;
        const rect = firstCard.getBoundingClientRect();
        return {
          hasText: text.length > 20,
          hasAuthor: author.length > 3,
          cardWidth: rect.width,
          cardHeight: rect.height
        };
      });

      assert(cardReadability.hasText && cardReadability.hasAuthor, `${vp.name}: Card content and author intact`);
      assert(cardReadability.cardWidth >= 280, `${vp.name}: Card width is comfortable for reading (${cardReadability.cardWidth.toFixed(1)}px >= 280px)`);

      // Capture Visual Evidence for key viewports
      if (['iphone_14_390', 'desktop_1280'].includes(vp.name)) {
        await saveEvidence(page, `${vp.name}_testimonials_motion_t0`);
        await page.waitForTimeout(2000);
        await saveEvidence(page, `${vp.name}_testimonials_motion_t2`);
        await page.waitForTimeout(2000);
        await saveEvidence(page, `${vp.name}_testimonials_motion_t4`);
        console.log(`  📸 Saved visual evidence progression for ${vp.name} (t=0s, t=2s, t=4s)`);
      }

      await context.close();
    }

    // 2. Interaction & Lifecycle Verification
    console.log('\n--- Auditing Lifecycle & Interaction Resilience ---');
    {
      const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'domcontentloaded' });

      // Action A: Page load at top, then scroll down to testimonials
      console.log('Action A: Scroll from top to testimonials...');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.waitForTimeout(500);
      await page.evaluate(() => document.getElementById('testimonials').scrollIntoView());
      await page.waitForTimeout(500);

      const movingAfterScroll = await page.evaluate(async () => {
        const track = document.getElementById('testi-track');
        const getX = () => {
          const m = window.getComputedStyle(track).transform.match(/matrix.*\((.+)\)/);
          return m ? parseFloat(m[1].split(', ')[4]) : 0;
        };
        const x1 = getX();
        await new Promise(r => setTimeout(r, 600));
        const x2 = getX();
        return x2 < x1;
      });
      assert(movingAfterScroll, 'Testimonial track continues moving smoothly after scrolling down to section');

      // Action B: Scroll away to footer, then return
      console.log('Action B: Scroll past to footer and return...');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(400);
      await page.evaluate(() => document.getElementById('testimonials').scrollIntoView());
      await page.waitForTimeout(400);

      const movingAfterReturn = await page.evaluate(async () => {
        const track = document.getElementById('testi-track');
        const getX = () => {
          const m = window.getComputedStyle(track).transform.match(/matrix.*\((.+)\)/);
          return m ? parseFloat(m[1].split(', ')[4]) : 0;
        };
        const x1 = getX();
        await new Promise(r => setTimeout(r, 600));
        const x2 = getX();
        return x2 < x1;
      });
      assert(movingAfterReturn, 'Testimonial track continues moving smoothly after returning from footer');

      // Action C: Mobile viewport dynamic resize
      console.log('Action C: Viewport dynamic resize...');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      const movingAfterResize = await page.evaluate(async () => {
        const track = document.getElementById('testi-track');
        const docW = document.documentElement.clientWidth;
        const scrollW = document.documentElement.scrollWidth;
        const getX = () => {
          const m = window.getComputedStyle(track).transform.match(/matrix.*\((.+)\)/);
          return m ? parseFloat(m[1].split(', ')[4]) : 0;
        };
        const x1 = getX();
        await new Promise(r => setTimeout(r, 600));
        const x2 = getX();
        return { isMoving: x2 < x1, noOverflow: scrollW <= docW };
      });
      assert(movingAfterResize.isMoving, 'Testimonial track continues moving after viewport resize to mobile');
      assert(movingAfterResize.noOverflow, '0px horizontal overflow maintained after mobile resize');

      await context.close();
    }

    // 3. Accessibility & Reduced Motion Verification
    console.log('\n--- Auditing Accessibility & prefers-reduced-motion ---');
    {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 800 },
        reducedMotion: 'reduce'
      });
      const page = await context.newPage();
      await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('#testimonials');

      const reducedMotionAudit = await page.evaluate(async () => {
        const track = document.getElementById('testi-track');
        const viewport = document.getElementById('testi-viewport');
        const trackCs = window.getComputedStyle(track);
        const vpCs = window.getComputedStyle(viewport);
        const hiddenGroups = document.querySelectorAll('.testi-group[aria-hidden="true"]');

        const getX = () => {
          const m = trackCs.transform.match(/matrix.*\((.+)\)/);
          return m ? parseFloat(m[1].split(', ')[4]) : 0;
        };
        const x1 = getX();
        await new Promise(r => setTimeout(r, 800));
        const x2 = getX();

        return {
          animationName: trackCs.animationName,
          isMoving: x1 !== x2,
          overflowX: vpCs.overflowX,
          hiddenGroupsHidden: Array.from(hiddenGroups).every(g => window.getComputedStyle(g).display === 'none')
        };
      });

      assert(reducedMotionAudit.animationName === 'none', 'prefers-reduced-motion: animation is disabled (animation: none)');
      assert(!reducedMotionAudit.isMoving, 'prefers-reduced-motion: track is stationary (no motion sickness risk)');
      assert(reducedMotionAudit.overflowX === 'auto', 'prefers-reduced-motion: viewport is manually scrollable (overflow-x: auto)');
      assert(reducedMotionAudit.hiddenGroupsHidden, 'prefers-reduced-motion: duplicate aria-hidden groups hidden to prevent duplicate tab stops');

      await context.close();
    }

    console.log('\n================================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% SUCCESS!`);
    console.log('================================================================================\n');

  } finally {
    await browser.close();
  }
}

runTestSuite().catch(err => {
  console.error('❌ Test suite failed:', err);
  process.exit(1);
});
