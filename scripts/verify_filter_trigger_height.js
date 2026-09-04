const { chromium } = require('playwright');

async function verifyFilterTriggerHeight() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
  const viewports = [
    { width: 320, height: 568, name: 'iPhone SE (320px)' },
    { width: 390, height: 844, name: 'iPhone 13/14 (390px)' },
    { width: 412, height: 915, name: 'Pixel 7 (412px)' },
    { width: 640, height: 800, name: 'Small Tablet (640px)' }
  ];

  for (const vp of viewports) {
    const context = await browser.newContext({ viewport: { width: vp.width, height: vp.height } });
    const page = await context.newPage();
    await page.route('**/*.mp4', route => route.abort());
    await page.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.mobile-filter-trigger', { state: 'attached' });

    const triggerBox = await page.$eval('.mobile-filter-trigger', el => {
      const rect = el.getBoundingClientRect();
      const style = window.getComputedStyle(el);
      return {
        width: rect.width,
        height: rect.height,
        minHeight: style.minHeight,
        display: style.display,
        visibility: style.visibility
      };
    });

    console.log(`[${vp.name}] .mobile-filter-trigger:`);
    console.log(`  - Rendered Height: ${triggerBox.height}px (Computed min-height: ${triggerBox.minHeight})`);
    console.log(`  - Rendered Width: ${triggerBox.width}px`);
    console.log(`  - Display: ${triggerBox.display}`);

    if (triggerBox.height < 44) {
      console.error(`  FAIL: Height ${triggerBox.height}px is less than 44px on ${vp.name}`);
      process.exit(1);
    } else {
      console.log(`  ✓ PASS: Meets WCAG 2.5.5 minimum 44px touch target`);
    }
    await context.close();
  }

  await browser.close();
  console.log('ALL VIEWPORT TOUCH TARGET TESTS PASSED!');
}

verifyFilterTriggerHeight().catch(err => {
  console.error(err);
  process.exit(1);
});
