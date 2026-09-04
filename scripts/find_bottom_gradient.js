const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route('**/*.mp4', route => route.abort());
  await page.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  const res = await page.evaluate(() => {
    const ba = window.getComputedStyle(document.body, '::after');
    const bb = window.getComputedStyle(document.body, '::before');
    const ha = window.getComputedStyle(document.documentElement, '::after');
    const hb = window.getComputedStyle(document.documentElement, '::before');

    // Also search all elements in document that have gradient in background
    const all = Array.from(document.querySelectorAll('*'));
    const gradients = [];
    for (const el of all) {
      const cs = window.getComputedStyle(el);
      if (cs.backgroundImage && cs.backgroundImage.includes('gradient')) {
        const rect = el.getBoundingClientRect();
        gradients.push({
          tag: el.tagName,
          id: el.id,
          className: el.className,
          bgImage: cs.backgroundImage,
          rect: { top: rect.top, bottom: rect.bottom, left: rect.left, right: rect.right, width: rect.width, height: rect.height },
          position: cs.position
        });
      }
    }

    return {
      bodyAfter: { content: ba.content, bg: ba.backgroundImage || ba.background, pos: ba.position, bottom: ba.bottom, h: ba.height },
      bodyBefore: { content: bb.content, bg: bb.backgroundImage || bb.background },
      htmlAfter: { content: ha.content, bg: ha.backgroundImage || ha.background },
      htmlBefore: { content: hb.content, bg: hb.backgroundImage || hb.background },
      gradients
    };
  });

  console.log('GRADIENT & PSEUDO AUDIT:', JSON.stringify(res, null, 2));
  await browser.close();
})();
