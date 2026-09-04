const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
  
  // Desktop
  const contextDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.route('**/*.mp4', route => route.abort());
  await pageDesktop.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await pageDesktop.waitForTimeout(2000);
  await pageDesktop.screenshot({ path: 'scripts/visual_evidence/product_audit/search_desktop_current.png', fullPage: false });
  
  // Mobile
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.route('**/*.mp4', route => route.abort());
  await pageMobile.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await pageMobile.waitForTimeout(2000);
  await pageMobile.screenshot({ path: 'scripts/visual_evidence/product_audit/search_mobile_current.png', fullPage: false });
  
  console.log('SEARCH CURRENT SCREENSHOTS CAPTURED');
  await browser.close();
})();
