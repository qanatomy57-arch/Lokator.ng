const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  await page.goto('http://localhost:8080/login.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);
  
  await page.fill('#login-email', 'invalid_artisan_test@padifix.ng');
  await page.fill('#login-password', 'WrongPassword123!');
  await page.click('#btn-login-submit');
  
  // Wait for alert box to be visible
  await page.waitForSelector('#auth-alert[style*="display: block"]', { timeout: 10000 }).catch(() => {});
  await page.waitForTimeout(1000);
  
  const alertText = await page.locator('#auth-alert').innerText().catch(() => '');
  console.log('Alert text captured:', alertText);
  
  const screenshotPath = path.join(__dirname, 'visual_evidence', 'product_audit', 'flow_g2_login_error_invalid_credentials.png');
  await page.screenshot({ path: screenshotPath });
  console.log('Screenshot saved to:', screenshotPath);
  
  await browser.close();
})();
