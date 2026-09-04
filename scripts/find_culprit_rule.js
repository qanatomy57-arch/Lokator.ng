const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.route('**/*.mp4', route => route.abort());
  await page.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(2000);

  // We want to find which element or CSS rule causes the dark gradient at the bottom.
  // We will check all stylesheet rules for linear-gradient or box-shadow
  const stylesWithGradient = await page.evaluate(() => {
    const matched = [];
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sheet = document.styleSheets[i];
      try {
        const rules = sheet.cssRules || sheet.rules;
        for (let j = 0; j < rules.length; j++) {
          const rule = rules[j];
          if (rule.cssText && (
            (rule.cssText.includes('gradient') && (rule.cssText.includes('bottom') || rule.cssText.includes('rgba(0') || rule.cssText.includes('#000') || rule.cssText.includes('black'))) ||
            (rule.cssText.includes('position: fixed') && (rule.cssText.includes('bottom: 0') || rule.cssText.includes('bottom:0')))
          )) {
            matched.push({
              href: sheet.href ? sheet.href.split('/').pop() : 'inline',
              selector: rule.selectorText,
              css: rule.cssText
            });
          }
        }
      } catch (e) {}
    }
    return matched;
  });

  console.log('RULES CAUSING GRADIENT/FIXED AT BOTTOM:', JSON.stringify(stylesWithGradient, null, 2));
  await browser.close();
})();
