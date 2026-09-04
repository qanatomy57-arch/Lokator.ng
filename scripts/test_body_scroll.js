const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const viewports = [320, 375, 390, 768, 1024, 1280];

  for (const w of viewports) {
    const page = await browser.newPage({ viewport: { width: w, height: 800 } });
    await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'domcontentloaded' });
    const res = await page.evaluate(() => {
      window.scrollTo(500, 0);
      const scrolledX = window.scrollX;
      return {
        docW: document.documentElement.clientWidth,
        docScrollW: document.documentElement.scrollWidth,
        bodyScrollW: document.body.scrollWidth,
        scrolledX: scrolledX
      };
    });
    console.log(`Viewport ${w}px:`, res);
    await page.close();
  }

  await browser.close();
})();
