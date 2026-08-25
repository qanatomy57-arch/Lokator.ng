const fs = require('fs');
const path = require('path');

async function main() {
  console.log('Generating posters for hero videos...');
  
  let puppeteer;
  const puppeteerPath = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\scratch\\pixel-agents\\node_modules\\puppeteer';
  const puppeteerCorePath = 'C:\\Users\\HP\\.gemini\\antigravity-ide\\scratch\\pixel-agents\\node_modules\\puppeteer-core';
  
  if (fs.existsSync(puppeteerPath)) {
    puppeteer = require(puppeteerPath);
  } else if (fs.existsSync(puppeteerCorePath)) {
    puppeteer = require(puppeteerCorePath);
  } else {
    console.error('Puppeteer path not found');
    process.exit(1);
  }

  const executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const options = {
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
  };

  const browser = await puppeteer.launch(options);
  const page = await browser.newPage();
  
  const posterDir = path.join(__dirname, '..', 'hero');
  if (!fs.existsSync(posterDir)) {
    fs.mkdirSync(posterDir, { recursive: true });
  }

  const htmlPath = path.join(__dirname, '..', 'index.html').replace(/\\/g, '/');
  console.log(`Loading file:///${htmlPath}`);
  await page.goto(`file:///${htmlPath}`, { waitUntil: 'networkidle2' });

  const results = await page.evaluate(async () => {
    const vids = Array.from(document.querySelectorAll('.hero-video'));
    const frames = [];

    for (let i = 0; i < vids.length; i++) {
      const vid = vids[i];
      vid.pause();
      vid.currentTime = 0.5;

      await new Promise((resolve) => {
        if (vid.readyState >= 2) return resolve();
        vid.addEventListener('seeked', resolve, { once: true });
        vid.addEventListener('loadeddata', resolve, { once: true });
        setTimeout(resolve, 2500);
      });

      const canvas = document.createElement('canvas');
      canvas.width = vid.videoWidth || 1280;
      canvas.height = vid.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(vid, 0, 0, canvas.width, canvas.height);
      frames.push({
        index: i,
        width: canvas.width,
        height: canvas.height,
        dataUrl: canvas.toDataURL('image/jpeg', 0.85)
      });
    }
    return frames;
  });

  for (const item of results) {
    const base64Data = item.dataUrl.replace(/^data:image\/jpeg;base64,/, '');
    const fileName = `poster_0${item.index + 1}.jpg`;
    const filePath = path.join(posterDir, fileName);
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    const stat = fs.statSync(filePath);
    console.log(`Saved ${fileName} (${item.width}x${item.height}, ${stat.size} bytes)`);
  }

  await browser.close();
  console.log('Posters successfully generated!');
}

main().catch(err => {
  console.error('Error generating posters:', err);
  process.exit(1);
});
