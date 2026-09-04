const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.route('**/*.mp4', route => route.abort());

  await page.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  // Set state to Yobe and search for "xyzrandomtrade"
  await page.fill('#keyword-search', 'xyzrandomtrade');
  await page.selectOption('#state-select', 'Yobe');
  await page.press('#keyword-search', 'Enter');
  await page.waitForTimeout(1000);

  const emptyStateHtml = await page.$eval('#empty-state', el => el.innerHTML);
  console.log('Empty state HTML includes zero-nearby-suggestions-card?', emptyStateHtml.includes('zero-nearby-suggestions-card'));

  const cardHtml = await page.$eval('.zero-nearby-suggestions-card', el => el.outerHTML).catch(() => 'NOT FOUND');
  console.log('Card HTML:', cardHtml.slice(0, 300));

  await browser.close();
})();
