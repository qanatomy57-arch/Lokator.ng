const { chromium, devices } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext({
    ...devices['iPhone 14 Pro'],
    locale: 'en-NG'
  });
  const page = await context.newPage();

  await page.goto('http://localhost:4195/search.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  const matchedRules = await page.evaluate(() => {
    const el = document.getElementById('mobile-filter-close-btn');
    if (!el) return 'Element not found';

    const sheets = Array.from(document.styleSheets);
    const matchingRules = [];

    sheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach(rule => {
          if (rule.selectorText && el.matches(rule.selectorText)) {
            matchingRules.push({
              sheet: sheet.href ? sheet.href.split('/').pop() : 'inline',
              selector: rule.selectorText,
              cssText: rule.cssText
            });
          }
          if (rule.media) {
            const mediaRules = Array.from(rule.cssRules || []);
            mediaRules.forEach(mr => {
              if (mr.selectorText && el.matches(mr.selectorText)) {
                matchingRules.push({
                  sheet: sheet.href ? sheet.href.split('/').pop() : 'inline',
                  media: rule.media.mediaText,
                  selector: mr.selectorText,
                  cssText: mr.cssText
                });
              }
            });
          }
        });
      } catch (e) {}
    });

    const sidebar = document.getElementById('filter-sidebar');
    const sidebarRules = [];
    sheets.forEach(sheet => {
      try {
        const rules = Array.from(sheet.cssRules || []);
        rules.forEach(rule => {
          if (rule.selectorText && sidebar && sidebar.matches(rule.selectorText)) {
            sidebarRules.push({
              sheet: sheet.href ? sheet.href.split('/').pop() : 'inline',
              selector: rule.selectorText,
              cssText: rule.cssText
            });
          }
          if (rule.media) {
            const mediaRules = Array.from(rule.cssRules || []);
            mediaRules.forEach(mr => {
              if (mr.selectorText && sidebar && sidebar.matches(mr.selectorText)) {
                sidebarRules.push({
                  sheet: sheet.href ? sheet.href.split('/').pop() : 'inline',
                  media: rule.media.mediaText,
                  selector: mr.selectorText,
                  cssText: mr.cssText
                });
              }
            });
          }
        });
      } catch (e) {}
    });

    return {
      closeBtnRules: matchingRules,
      sidebarRules: sidebarRules
    };
  });

  console.log('MATCHED RULES:', JSON.stringify(matchedRules, null, 2));

  await browser.close();
})();
