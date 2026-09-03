const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('Rendering Brand Assets visual inspection canvas...');
  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true
  });
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <title>PadiFix Brand Assets Inspection</title>
    <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet">
    <style>
      body { font-family: 'Plus Jakarta Sans', sans-serif; background: #0A0E17; color: #F1F5F9; padding: 40px; margin: 0; }
      h1 { font-size: 28px; margin-bottom: 24px; color: #00A859; }
      .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; }
      .card { background: #131B2A; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 24px; text-align: center; }
      .card.light { background: #FFFFFF; color: #0A0E17; border-color: #E2E8F0; }
      .card-title { font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em; color: #94A3B8; margin-bottom: 16px; }
      .card.light .card-title { color: #64748B; }
      img, object { max-width: 100%; height: auto; }
      .preview-box { height: 140px; display: flex; align-items: center; justify-content: center; }
      .og-card { grid-column: span 2; }
    </style>
  </head>
  <body>
    <h1>PadiFix Official Brand Assets — Visual Inspection</h1>
    <div class="grid">
      <div class="card">
        <div class="card-title">padifix-mark.svg (Dark Canvas)</div>
        <div class="preview-box" style="color: #FFF;">
          <img src="http://localhost:8080/icons/padifix-mark.svg" width="90" height="90" style="filter: drop-shadow(0 4px 12px rgba(0,168,89,0.3));" />
        </div>
      </div>
      <div class="card light">
        <div class="card-title">padifix-mark.svg (Light Canvas)</div>
        <div class="preview-box">
          <img src="http://localhost:8080/icons/padifix-mark.svg" width="90" height="90" />
        </div>
      </div>
      <div class="card">
        <div class="card-title">padifix-logo.svg (Horizontal Lockup)</div>
        <div class="preview-box" style="color: #FFF;">
          <img src="http://localhost:8080/icons/padifix-logo.svg" width="220" />
        </div>
      </div>
      <div class="card">
        <div class="card-title">icon.svg (App Icon 512x512)</div>
        <div class="preview-box">
          <img src="http://localhost:8080/icons/icon.svg" width="96" height="96" />
        </div>
      </div>
      <div class="card">
        <div class="card-title">icon-192.png (PWA Icon)</div>
        <div class="preview-box">
          <img src="http://localhost:8080/icons/icon-192.png" width="96" height="96" />
        </div>
      </div>
      <div class="card">
        <div class="card-title">favicon.svg (Browser Tab Icon)</div>
        <div class="preview-box">
          <img src="http://localhost:8080/favicon.svg" width="64" height="64" />
        </div>
      </div>
      <div class="card og-card">
        <div class="card-title">og-image.png (Social Preview Card 1200x630)</div>
        <div style="display: flex; justify-content: center;">
          <img src="http://localhost:8080/og-image.png" style="max-height: 220px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1);" />
        </div>
      </div>
    </div>
  </body>
  </html>
  `;

  await page.setContent(html);
  await page.waitForTimeout(1000);
  const outPath = path.join(__dirname, 'visual_evidence', 'padifix', 'asset_inspection.png');
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(`Saved asset inspection screenshot to: ${outPath}`);

  await browser.close();
})();
