const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 14 Pro'],
    locale: 'en-NG'
  });
  const page = await context.newPage();

  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err));

  await page.goto('http://localhost:4195/search.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  console.log('Clicking mobile filter button...');
  const filterBtn = page.locator('#mobile-filter-btn');
  console.log('filterBtn isVisible:', await filterBtn.isVisible());
  await filterBtn.click();
  await page.waitForTimeout(500);

  const sidebarClass = await page.locator('#filter-sidebar').getAttribute('class');
  console.log('Sidebar classes after click:', sidebarClass);

  const closeBtn = page.locator('#mobile-filter-close-btn');
  console.log('closeBtn isVisible:', await closeBtn.isVisible());
  console.log('closeBtn boundingBox:', await closeBtn.boundingBox());

  const computedDisplay = await closeBtn.evaluate(el => window.getComputedStyle(el).display);
  const computedVisibility = await closeBtn.evaluate(el => window.getComputedStyle(el).visibility);
  const computedOpacity = await closeBtn.evaluate(el => window.getComputedStyle(el).opacity);
  console.log('computedDisplay:', computedDisplay, 'visibility:', computedVisibility, 'opacity:', computedOpacity);

  const sidebarBox = await page.locator('#filter-sidebar').boundingBox();
  console.log('Sidebar bounding box:', sidebarBox);

  await browser.close();
})();
