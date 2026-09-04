const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Abort .mp4 to see page load speed
  await page.route('**/*.mp4', route => route.abort());

  const start = Date.now();
  console.log('Navigating with .mp4 aborted...');
  await page.goto('https://padifix.vercel.app', { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log(`DOMContentLoaded reached in ${Date.now() - start}ms!`);
  
  const title = await page.title();
  console.log('Title:', title);
  
  await browser.close();
})();
