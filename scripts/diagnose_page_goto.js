const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await context.newPage();
  
  page.on('request', req => console.log('REQ:', req.resourceType(), req.url().slice(0, 80)));
  page.on('requestfailed', req => console.log('REQ FAILED:', req.url().slice(0, 80), req.failure()?.errorText));
  page.on('response', res => console.log('RES:', res.status(), res.url().slice(0, 80)));
  page.on('console', msg => console.log('PAGE CONSOLE:', msg.type(), msg.text().slice(0, 80)));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));

  console.log('Starting goto...');
  try {
    await page.goto('https://padifix.vercel.app/index.html', { waitUntil: 'domcontentloaded', timeout: 45000 });
    console.log('SUCCESS: Navigated to index.html!');
  } catch (err) {
    console.error('FAILED:', err.message);
  } finally {
    await browser.close();
  }
})();
