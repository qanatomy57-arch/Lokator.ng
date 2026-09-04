const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });

  // Mobile screenshot
  const mobileCtx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    serviceWorkers: 'block'
  });
  const mPage = await mobileCtx.newPage();
  await mPage.goto('http://localhost:8080', { waitUntil: 'domcontentloaded' });
  await mPage.waitForTimeout(600);

  const heroH = await mPage.evaluate(() => document.getElementById('hero').offsetHeight - window.innerHeight);
  
  // Scene 2 (Electrician)
  await mPage.evaluate((y) => window.scrollTo(0, y), Math.round((1 / 8) * heroH));
  await mPage.waitForTimeout(400);
  await mPage.screenshot({ path: 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\acee3884-cba8-4699-bf72-668b0aefd1f9\\mobile_glass_1pct_scene2.png' });

  // Scene 3 (Plumber)
  await mPage.evaluate((y) => window.scrollTo(0, y), Math.round((2 / 8) * heroH));
  await mPage.waitForTimeout(400);
  await mPage.screenshot({ path: 'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\acee3884-cba8-4699-bf72-668b0aefd1f9\\mobile_glass_1pct_scene3.png' });

  await browser.close();
  console.log('Screenshots captured successfully!');
})();
