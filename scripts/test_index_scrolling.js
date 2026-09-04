const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', err => errors.push(err.message));

  await page.route('**/*.mp4', route => route.abort());
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);

  // 1. Check dot bar visibility at top
  const isDotBarVisible = await page.evaluate(() => {
    const el = document.querySelector('.hero-timeline-nav') || document.getElementById('hero-timeline-nav');
    if (!el) return false;
    const cs = window.getComputedStyle(el);
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0' && parseFloat(cs.width) > 0;
  });
  console.log('Dot bar visible at top?', isDotBarVisible);

  // 2. Scroll through scene 3, scene 6
  await page.evaluate(() => window.scrollTo(0, 2500));
  await page.waitForTimeout(600);

  // 3. Scroll down past hero into "Browse Nigeria's Canonical Trades & Industries" (matching Photo 2)
  const tradesSection = await page.$('#trades, .trades-section, .categories-section, section:has(h2:has-text("Browse Nigeria"))');
  if (tradesSection) {
    await tradesSection.scrollIntoViewIfNeeded();
  } else {
    await page.evaluate(() => window.scrollTo(0, 7500));
  }
  await page.waitForTimeout(1000);

  const isDotBarVisibleDownPage = await page.evaluate(() => {
    const el = document.querySelector('.hero-timeline-nav') || document.getElementById('hero-timeline-nav');
    if (!el) return false;
    const cs = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return cs.display !== 'none' && cs.visibility !== 'hidden' && cs.opacity !== '0' && rect.width > 0 && rect.height > 0;
  });
  console.log('Dot bar visible down page?', isDotBarVisibleDownPage);

  await page.screenshot({
    path: 'scripts/visual_evidence/product_audit/index_trades_scrolled_without_dots.png',
    fullPage: false,
    timeout: 5000
  });

  console.log('Any page errors?', errors);
  await browser.close();
})();
