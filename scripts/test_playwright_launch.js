const { chromium } = require('playwright');
const path = require('path');

(async () => {
  console.log('Testing Playwright with Microsoft Edge...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();
  
  const consoleMessages = [];
  page.on('console', msg => consoleMessages.push({ type: msg.type(), text: msg.text() }));
  
  console.log('Navigating to https://padifix.vercel.app...');
  const res = await page.goto('https://padifix.vercel.app', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Status:', res.status());
  
  const title = await page.title();
  console.log('Page Title:', title);
  
  const screenshotPath = path.join(__dirname, 'visual_evidence', 'product_audit', 'test_prod_launch.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Saved screenshot to:', screenshotPath);
  
  await browser.close();
  console.log('Edge launched and captured successfully!');
})();
