const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const img1Raw = fs.readFileSync('C:/Users/HP/.gemini/antigravity-ide/brain/acee3884-cba8-4699-bf72-668b0aefd1f9/.user_uploaded/media_1788457345794.png');
const img2Raw = fs.readFileSync('C:/Users/HP/.gemini/antigravity-ide/brain/acee3884-cba8-4699-bf72-668b0aefd1f9/.user_uploaded/media_1788457357462.png');
const img1DataUrl = `data:image/png;base64,${img1Raw.toString('base64')}`;
const img2DataUrl = `data:image/png;base64,${img2Raw.toString('base64')}`;

(async () => {
  console.log('Processing brand assets from user guidelines...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  // Load the brand sheet and app icon
  await page.setContent(`
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { margin: 0; background: #0A0E17; }
        canvas { display: block; }
      </style>
    </head>
    <body>
      <img id="appIconSrc" src="${img1DataUrl}" />
      <img id="brandSheetSrc" src="${img2DataUrl}" />
    </body>
    </html>
  `);

  await page.waitForFunction(() => {
    const i1 = document.getElementById('appIconSrc');
    const i2 = document.getElementById('brandSheetSrc');
    return i1 && i1.complete && i1.naturalWidth > 0 && i2 && i2.complete && i2.naturalWidth > 0;
  });

  const dimensions = await page.evaluate(() => {
    const i1 = document.getElementById('appIconSrc');
    const i2 = document.getElementById('brandSheetSrc');
    return {
      img1: { w: i1.naturalWidth, h: i1.naturalHeight },
      img2: { w: i2.naturalWidth, h: i2.naturalHeight }
    };
  });
  console.log('Source dimensions:', dimensions);

  // Generate icons/icon-512.png & icons/icon-192.png from the App Icon
  const generatePng = async (w, h, renderFn, outputPath) => {
    await page.evaluate(({ w, h, renderFnStr }) => {
      let canvas = document.getElementById('renderCanvas');
      if (!canvas) {
        canvas = document.createElement('canvas');
        canvas.id = 'renderCanvas';
        document.body.appendChild(canvas);
      }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, w, h);
      const fn = eval('(' + renderFnStr + ')');
      fn(ctx, w, h, document);
    }, { w, h, renderFnStr: renderFn.toString() });

    const dataUrl = await page.evaluate(() => document.getElementById('renderCanvas').toDataURL('image/png'));
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, '');
    fs.writeFileSync(outputPath, Buffer.from(base64, 'base64'));
    console.log(`Saved: ${outputPath} (${w}x${h})`);
  };

  // 1. App Icon 512x512
  await generatePng(512, 512, function(ctx, w, h, doc) {
    const img = doc.getElementById('appIconSrc');
    // Draw rounded squircle
    ctx.drawImage(img, 0, 0, w, h);
  }, 'icons/icon-512.png');

  // 2. App Icon 192x192
  await generatePng(192, 192, function(ctx, w, h, doc) {
    const img = doc.getElementById('appIconSrc');
    ctx.drawImage(img, 0, 0, w, h);
  }, 'icons/icon-192.png');

  // 3. Maskable Icon 512x512 (with padding safe zone)
  await generatePng(512, 512, function(ctx, w, h, doc) {
    ctx.fillStyle = '#1A2332';
    ctx.fillRect(0, 0, w, h);
    const img = doc.getElementById('appIconSrc');
    // Draw centered with safe zone margin (80%)
    const pad = w * 0.1;
    ctx.drawImage(img, pad, pad, w * 0.8, h * 0.8);
  }, 'icons/icon-maskable-512.png');

  // 4. Maskable Icon 192x192
  await generatePng(192, 192, function(ctx, w, h, doc) {
    ctx.fillStyle = '#1A2332';
    ctx.fillRect(0, 0, w, h);
    const img = doc.getElementById('appIconSrc');
    const pad = w * 0.1;
    ctx.drawImage(img, pad, pad, w * 0.8, h * 0.8);
  }, 'icons/icon-maskable-192.png');

  // 5. Apple Touch Icon 180x180
  await generatePng(180, 180, function(ctx, w, h, doc) {
    const img = doc.getElementById('appIconSrc');
    ctx.drawImage(img, 0, 0, w, h);
  }, 'apple-touch-icon.png');

  // 6. Favicon PNG 64x64
  await generatePng(64, 64, function(ctx, w, h, doc) {
    const img = doc.getElementById('appIconSrc');
    ctx.drawImage(img, 0, 0, w, h);
  }, 'favicon.png');

  // 7. Social Preview Card og-image.png (1200x630)
  await generatePng(1200, 630, function(ctx, w, h, doc) {
    // Dark luxury background gradient matching PadiFix
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#0A0E17');
    grad.addColorStop(0.5, '#111827');
    grad.addColorStop(1, '#0A0E17');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Decorative ambient glow circles
    const radGlow1 = ctx.createRadialGradient(250, 315, 10, 250, 315, 300);
    radGlow1.addColorStop(0, 'rgba(0, 168, 89, 0.25)');
    radGlow1.addColorStop(1, 'transparent');
    ctx.fillStyle = radGlow1;
    ctx.fillRect(0, 0, w, h);

    // Draw App Icon
    const img = doc.getElementById('appIconSrc');
    ctx.save();
    ctx.shadowColor = 'rgba(0, 168, 89, 0.4)';
    ctx.shadowBlur = 40;
    ctx.drawImage(img, 100, 165, 300, 300);
    ctx.restore();

    // Typography
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 84px system-ui, -apple-system, sans-serif';
    ctx.fillText('Padi', 460, 270);

    ctx.fillStyle = '#00A859';
    ctx.fillText('Fix', 645, 270);

    ctx.fillStyle = '#52E58C';
    ctx.font = '600 36px system-ui, -apple-system, sans-serif';
    ctx.fillText('Find Skills. Get Things Done.', 460, 340);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '400 28px system-ui, -apple-system, sans-serif';
    ctx.fillText("Nigeria's Local-Services Marketplace", 460, 395);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.font = '500 24px system-ui, -apple-system, sans-serif';
    ctx.fillText('Whatever You Need. We’ve Got You.', 460, 445);
  }, 'og-image.png');

  await browser.close();
  console.log('Brand image asset generation complete!');
})();
