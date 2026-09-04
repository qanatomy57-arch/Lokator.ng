const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 480 } });
  
  const darkLogoPath = 'http://localhost:8080/icons/padifix-logo-dark.png';
  const markPath = 'http://localhost:8080/icons/padifix-mark.png';
  
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet">
      <style>
        body { background: #0A0E17; color: white; font-family: 'Plus Jakarta Sans', sans-serif; padding: 30px; }
        .nav { display: flex; gap: 40px; align-items: center; background: rgba(10, 14, 23, 0.85); padding: 15px 30px; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 25px; }
        .logo-lockup { height: 38px; display: block; border-radius: 8px; }
        .logo-flex { display: flex; align-items: center; gap: 12px; text-decoration: none; color: white; }
        .mark-img { width: 36px; height: 36px; border-radius: 8px; display: block; }
        .logo-text { font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
      </style>
    </head>
    <body>
      <h3>Option 1: Official Brand Lockup Image (icons/padifix-logo-dark.png)</h3>
      <div class="nav">
        <a href="#"><img src="${darkLogoPath}" class="logo-lockup" alt="PadiFix"></a>
      </div>
      
      <h3>Option 2: Official Mark Image (icons/padifix-mark.png) + Wordmark</h3>
      <div class="nav">
        <a href="#" class="logo-flex">
          <img src="${markPath}" class="mark-img" alt="PadiFix Mark">
          <span class="logo-text">Padi<span style="color: #00A859;">Fix</span></span>
        </a>
      </div>
    </body>
    </html>
  `);
  
  await page.screenshot({ path: 'test_logo_options.png' });
  await browser.close();
  console.log('Saved test_logo_options.png');
})();
