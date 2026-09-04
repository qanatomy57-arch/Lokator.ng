const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
  await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'domcontentloaded' });
  const res = await page.evaluate(() => {
    const culprits = [];
    const walk = (el) => {
      // Check direct children of body first
      for (const child of el.children) {
        const rect = child.getBoundingClientRect();
        if (child.scrollWidth > 320 || rect.right > 320.5) {
          culprits.push({
            parent: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className.split(' ')[0] : ''),
            tag: child.tagName,
            id: child.id,
            cls: child.className,
            scrollW: child.scrollWidth,
            clientW: child.clientWidth,
            offsetW: child.offsetWidth,
            rectRight: rect.right
          });
        }
      }
    };
    walk(document.body);
    return culprits;
  });
  console.log('Culprits under body:', res);
  await browser.close();
})();
