const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  page.on('response', resp => {
    if (resp.status() === 404) {
      console.log('404 URL:', resp.url());
    }
  });

  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Console error:', msg.text());
    }
  });

  await page.goto('http://localhost:4195/profile.html?id=8', { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await browser.close();
})();
