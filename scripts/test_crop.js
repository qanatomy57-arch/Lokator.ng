const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route('**/*.mp4', route => route.abort());
  await page.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Take a screenshot of just a 200x200 crop at the bottom center: x=600 to 800, y=700 to 900
  await page.screenshot({
    path: 'scripts/visual_evidence/product_audit/test_bottom_crop.png',
    clip: { x: 500, y: 700, width: 400, height: 200 }
  });

  // Let's get the background color of whatever is drawn at (700, 850)
  const el = await page.evaluate(() => {
    const target = document.elementFromPoint(700, 850);
    return {
      tag: target.tagName,
      id: target.id,
      className: target.className,
      text: target.innerText?.slice(0, 50),
      parent: target.parentElement?.tagName + '.' + target.parentElement?.className
    };
  });
  console.log('TARGET AT (700, 850):', el);

  await browser.close();
})();
