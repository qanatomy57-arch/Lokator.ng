const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route('**/*.mp4', route => route.abort());
  await page.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // Find all elements or pseudo elements that might be creating the bottom dark gradient
  const elements = await page.evaluate(() => {
    const all = Array.from(document.querySelectorAll('*'));
    const results = [];
    for (const el of all) {
      const style = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      const beforeStyle = window.getComputedStyle(el, '::before');
      const afterStyle = window.getComputedStyle(el, '::after');

      const isBottomFixed = (style.position === 'fixed' || style.position === 'sticky') && rect.bottom >= 800;
      const hasDarkBg = style.backgroundImage.includes('gradient') || style.background.includes('gradient') || style.boxShadow.includes('rgba(0');

      if (isBottomFixed) {
        results.push({
          tag: el.tagName,
          id: el.id,
          className: el.className,
          position: style.position,
          bottom: style.bottom,
          height: rect.height,
          zIndex: style.zIndex,
          bg: style.background,
          boxShadow: style.boxShadow
        });
      }

      if (afterStyle.content && afterStyle.content !== 'none') {
        results.push({
          parent: el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + el.className : ''),
          pseudo: '::after',
          position: afterStyle.position,
          bottom: afterStyle.bottom,
          bg: afterStyle.backgroundImage || afterStyle.background,
          boxShadow: afterStyle.boxShadow
        });
      }
    }
    return results;
  });

  console.log('BOTTOM ELEMENTS FOUND:', JSON.stringify(elements, null, 2));

  // Also check elements at point (720, 850)
  const elAtBottom = await page.evaluate(() => {
    const el = document.elementFromPoint(720, 880);
    return el ? { tag: el.tagName, id: el.id, className: el.className, outerHTML: el.outerHTML.slice(0, 200) } : null;
  });
  console.log('ELEMENT AT (720, 880):', elAtBottom);

  await browser.close();
})();
