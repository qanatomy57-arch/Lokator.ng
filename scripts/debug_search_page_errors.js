const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log(`[CONSOLE ${msg.type().toUpperCase()}]:`, msg.text()));
  page.on('pageerror', err => console.log(`[PAGE ERROR]:`, err.message, err.stack));

  await page.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(3000);

  const browseHtml = await page.locator('#marketplace-browse-section').innerHTML().catch(e => e.message);
  console.log('Browse Section HTML length:', browseHtml.length);
  
  const providersCount = await page.locator('.provider-card, .artisan-card').count();
  console.log('Providers rendered count:', providersCount);

  const skeletonCount = await page.locator('.provider-skeleton-card, .skeleton').count();
  console.log('Skeleton count:', skeletonCount);

  const countText = await page.locator('#results-count-text').innerText().catch(() => '');
  console.log('Results count text:', countText);

  await browser.close();
})();
