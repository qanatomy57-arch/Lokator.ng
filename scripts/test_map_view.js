const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  
  // Desktop Map View
  const contextDesktop = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const pageDesktop = await contextDesktop.newPage();
  await pageDesktop.route('**/*.mp4', route => route.abort());
  await pageDesktop.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await pageDesktop.waitForTimeout(1500);
  await pageDesktop.click('#btn-view-map');
  await pageDesktop.waitForTimeout(1500);
  await pageDesktop.screenshot({ path: 'scripts/visual_evidence/product_audit/search_desktop_map_view.png', fullPage: false });

  // Mobile Map View
  const contextMobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const pageMobile = await contextMobile.newPage();
  await pageMobile.route('**/*.mp4', route => route.abort());
  await pageMobile.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await pageMobile.waitForTimeout(1500);
  await pageMobile.click('#btn-view-map');
  await pageMobile.waitForTimeout(1500);
  await pageMobile.screenshot({ path: 'scripts/visual_evidence/product_audit/search_mobile_map_view.png', fullPage: false });

  console.log('MAP VIEW SCREENSHOTS CAPTURED');
  await browser.close();
})();
