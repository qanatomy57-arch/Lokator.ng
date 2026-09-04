const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  
  // Desktop
  const dContext = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const dPage = await dContext.newPage();
  await dPage.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await dPage.waitForTimeout(1000);
  await dPage.screenshot({ path: path.join(__dirname, 'visual_evidence', 'product_audit', 'inspect_search_desktop_raw.png') });

  // Mobile
  const mContext = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mPage = await mContext.newPage();
  await mPage.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await mPage.waitForTimeout(1000);
  await mPage.screenshot({ path: path.join(__dirname, 'visual_evidence', 'product_audit', 'inspect_search_mobile_raw.png') });

  await browser.close();
  console.log('Raw screenshots captured.');
})();
