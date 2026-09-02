/**
 * CAPTURE VISUAL EVIDENCE FOR PHASE 1 SCROLL-DRIVEN HERO ENGINE
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';
const ARTIFACTS_DIR = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\acee3884-cba8-4699-bf72-668b0aefd1f9';

async function captureEvidence() {
  console.log('Capturing Phase 1 Visual Evidence...');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--autoplay-policy=no-user-gesture-required', '--mute-audio']
  });

  // 1. Desktop 1280x800 Flow
  const desktopContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    serviceWorkers: 'block'
  });
  const page = await desktopContext.newPage();
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  const runwayH = await page.evaluate(() => document.getElementById('hero').offsetHeight);
  const scrollDist = runwayH - 800;

  // State 1: Scene 1 (Marketplace Overview)
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hero_p1_desktop_scene1_master.png') });
  console.log('  📸 Captured hero_p1_desktop_scene1_master.png');

  // State 2: Scene 2 (Electrician, p=0.125)
  await page.evaluate((y) => window.scrollTo(0, y), scrollDist * 0.125);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hero_p1_desktop_scene2_electrician.png') });
  console.log('  📸 Captured hero_p1_desktop_scene2_electrician.png');

  // State 3: Velvety crossfade between Scene 3 and 4 (p=0.3125)
  await page.evaluate((y) => window.scrollTo(0, y), scrollDist * 0.3125);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hero_p1_desktop_crossfade_blend.png') });
  console.log('  📸 Captured hero_p1_desktop_crossfade_blend.png');

  // State 4: Scene 5 (Tailor, p=0.500)
  await page.evaluate((y) => window.scrollTo(0, y), scrollDist * 0.5);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hero_p1_desktop_scene5_tailor.png') });
  console.log('  📸 Captured hero_p1_desktop_scene5_tailor.png');

  // State 5: Scene 7 (Carpenter, p=0.750)
  await page.evaluate((y) => window.scrollTo(0, y), scrollDist * 0.75);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hero_p1_desktop_scene7_carpenter.png') });
  console.log('  📸 Captured hero_p1_desktop_scene7_carpenter.png');

  // State 6: Scene 9 (Finale Community, p=1.000)
  await page.evaluate((y) => window.scrollTo(0, y), scrollDist);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hero_p1_desktop_scene9_community.png') });
  console.log('  📸 Captured hero_p1_desktop_scene9_community.png');

  // State 7: Natural Downstream Release into #browse-skills
  await page.evaluate((y) => window.scrollTo(0, y + 400), scrollDist);
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(ARTIFACTS_DIR, 'hero_p1_desktop_natural_release.png') });
  console.log('  📸 Captured hero_p1_desktop_natural_release.png');

  await desktopContext.close();

  // 2. Mobile iPhone 14 (390x844)
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block'
  });
  const mPage = await mobileContext.newPage();
  await mPage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await mPage.waitForTimeout(600);

  const mRunwayH = await mPage.evaluate(() => document.getElementById('hero').offsetHeight);
  const mScrollDist = mRunwayH - 844;

  // Mobile Scene 1
  await mPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'hero_p1_mobile_390_scene1.png') });
  console.log('  📸 Captured hero_p1_mobile_390_scene1.png');

  // Mobile Scene 4 (Beauty & Nails)
  await mPage.evaluate((y) => window.scrollTo(0, y), mScrollDist * 0.375);
  await mPage.waitForTimeout(400);
  await mPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'hero_p1_mobile_390_scene4_beauty.png') });
  console.log('  📸 Captured hero_p1_mobile_390_scene4_beauty.png');

  // Mobile Scene 9 (Finale)
  await mPage.evaluate((y) => window.scrollTo(0, y), mScrollDist);
  await mPage.waitForTimeout(400);
  await mPage.screenshot({ path: path.join(ARTIFACTS_DIR, 'hero_p1_mobile_390_scene9_finale.png') });
  console.log('  📸 Captured hero_p1_mobile_390_scene9_finale.png');

  await mobileContext.close();

  // 3. Mobile Small iPhone SE (320x568)
  const seContext = await browser.newContext({
    viewport: { width: 320, height: 568 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block'
  });
  const sePage = await seContext.newPage();
  await sePage.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  await sePage.waitForTimeout(600);

  await sePage.screenshot({ path: path.join(ARTIFACTS_DIR, 'hero_p1_mobile_320_scene1.png') });
  console.log('  📸 Captured hero_p1_mobile_320_scene1.png');

  await seContext.close();

  await browser.close();
  console.log('All visual evidence captures completed successfully!');
}

captureEvidence().catch(console.error);
