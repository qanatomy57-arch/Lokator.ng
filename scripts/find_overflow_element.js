const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 320, height: 568 } });
  await page.goto('http://127.0.0.1:8080/index.html');
  const res = await page.evaluate(() => {
    const el = document.querySelector('a.btn');
    if (!el) return null;
    let curr = el;
    const path = [];
    while (curr && curr !== document.body) {
      path.push({ tag: curr.tagName, id: curr.id, cls: curr.className, text: curr.textContent?.slice(0, 20) });
      curr = curr.parentElement;
    }
    return path;
  });
  console.log('Hierarchy for first overflowing button:', res);
  await browser.close();
})();
