const { chromium } = require('playwright');

async function diagnose() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const viewports = [320, 375, 390, 768, 1024, 1280];

  for (const w of viewports) {
    const page = await browser.newPage({ viewport: { width: w, height: 800 } });
    await page.goto('http://127.0.0.1:8080/index.html', { waitUntil: 'domcontentloaded' });
    const res = await page.evaluate(() => {
      const track = document.getElementById('testi-track');
      const cs = window.getComputedStyle(track);
      const viewport = document.getElementById('testi-viewport');
      const vpCs = window.getComputedStyle(viewport);
      const cards = Array.from(document.querySelectorAll('.testi-card'));
      const hiddenCards = document.querySelectorAll('.testi-card[aria-hidden="true"]');
      const firstCard = cards[0];
      const fcRect = firstCard.getBoundingClientRect();
      const trackRect = track.getBoundingClientRect();

      return {
        animationName: cs.animationName,
        animationDuration: cs.animationDuration,
        animationPlayState: cs.animationPlayState,
        trackTransform: cs.transform,
        trackWidth: track.scrollWidth,
        viewportOverflowX: vpCs.overflowX,
        cardCount: cards.length,
        hiddenCardsDisplay: hiddenCards[0] ? window.getComputedStyle(hiddenCards[0]).display : 'none',
        cardWidth: fcRect.width,
        gap: cs.gap
      };
    });

    console.log(`Viewport ${w}px:`, res);
    await page.close();
  }

  await browser.close();
}

diagnose().catch(console.error);
