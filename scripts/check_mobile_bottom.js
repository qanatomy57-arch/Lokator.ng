const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15'
  });
  const page = await context.newPage();
  await page.route('**/*.mp4', route => route.abort());
  await page.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const elInfo = await page.evaluate(() => {
    const list = [];
    for (let y = 780; y <= 840; y += 15) {
      for (let x = 50; x <= 350; x += 100) {
        const el = document.elementFromPoint(x, y);
        if (el && !list.some(item => item.el === el.tagName + '#' + el.id + '.' + el.className)) {
          const cs = window.getComputedStyle(el);
          list.push({
            point: `${x},${y}`,
            el: el.tagName + '#' + el.id + '.' + el.className,
            bg: cs.background,
            boxShadow: cs.boxShadow,
            filter: cs.filter,
            pos: cs.position
          });
        }
      }
    }
    return list;
  });

  console.log('MOBILE BOTTOM INTERSECTIONS:', JSON.stringify(elInfo, null, 2));
  await browser.close();
})();
