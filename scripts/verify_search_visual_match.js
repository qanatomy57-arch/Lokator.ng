const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function verifySearchVisualMatch() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 393, height: 852 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true
  });

  const page = await context.newPage();

  console.log('Navigating to search page for electrician in Okpe, Delta State...');
  await page.goto('http://localhost:4195/search.html?service=electrician&state=Delta&lga=Okpe', { waitUntil: 'domcontentloaded' });
  
  // Wait for results to render
  await page.waitForSelector('.provider-item-card', { timeout: 10000 });
  await page.waitForTimeout(500);

  // Verify elements
  const resultsCountText = await page.textContent('#results-count-text');
  console.log('Results count heading:', resultsCountText);

  // Check if dark browse section is hidden
  const browseHidden = await page.evaluate(() => {
    const el = document.getElementById('marketplace-browse-section');
    return !el || el.style.display === 'none';
  });
  console.log('Is browse section hidden during search?', browseHidden);

  // Check provider card
  const cardFound = await page.locator('.provider-item-card').count();
  console.log(`Provider cards found: ${cardFound}`);

  // Check Call and Message buttons
  const callBtnText = await page.locator('.action-btn.call-btn').first().textContent();
  const msgBtnText = await page.locator('.action-btn.message-btn').first().textContent();
  console.log(`Action buttons: [${callBtnText.trim()}] [${msgBtnText.trim()}]`);

  // Check overflow
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth <= window.innerWidth + 2;
  });
  console.log('Zero horizontal overflow?', overflow);

  const screenshotPath = path.resolve(__dirname, 'search_mobile_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  console.log(`Screenshot saved to: ${screenshotPath}`);

  await browser.close();
}

verifySearchVisualMatch().catch(err => {
  console.error('Error running visual test:', err);
  process.exit(1);
});
