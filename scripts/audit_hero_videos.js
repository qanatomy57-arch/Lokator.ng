/**
 * AUDIT THE 9 HERO VIDEOS
 */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const VIDEOS = [
  { scene: 1, file: '01_master_marketplace.mp4', poster: 'poster_01.jpg', name: 'Marketplace Overview' },
  { scene: 2, file: '02_electrician.mp4', poster: 'poster_02.jpg', name: 'Electrical Services' },
  { scene: 3, file: '03_plumber.mp4', poster: 'poster_03.jpg', name: 'Plumbing Services' },
  { scene: 4, file: '04_beauty_nail.mp4', poster: 'poster_04.jpg', name: 'Beauty & Nail Services' },
  { scene: 5, file: '05_tailor.mp4', poster: 'poster_05.jpg', name: 'Fashion & Tailoring' },
  { scene: 6, file: '06_mechanic.mp4', poster: 'poster_06.jpg', name: 'Auto Services' },
  { scene: 7, file: '07_carpenter.mp4', poster: 'poster_07.jpg', name: 'Carpentry & Woodwork' },
  { scene: 8, file: '08_cleaner.mp4', poster: 'poster_08.jpg', name: 'Home & Cleaning Services' },
  { scene: 9, file: '09_finale_community.mp4', poster: 'poster_09.jpg', name: 'Nationwide Pro Network' }
];

async function audit() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  
  const results = [];

  for (const v of VIDEOS) {
    const filePath = path.join(__dirname, '..', 'hero', v.file);
    const posterPath = path.join(__dirname, '..', 'hero', v.poster);
    const stat = fs.statSync(filePath);
    const posterStat = fs.existsSync(posterPath) ? fs.statSync(posterPath) : { size: 0 };
    
    // Load metadata in browser
    await page.setContent(`<video id="test-vid" src="http://127.0.0.1:8080/hero/${v.file}" preload="metadata"></video>`);
    const meta = await page.evaluate(async () => {
      const vid = document.getElementById('test-vid');
      return new Promise((resolve) => {
        vid.onloadedmetadata = () => {
          resolve({
            width: vid.videoWidth,
            height: vid.videoHeight,
            duration: vid.duration
          });
        };
        vid.onerror = () => resolve({ width: 0, height: 0, duration: 0, error: true });
        setTimeout(() => resolve({ width: vid.videoWidth, height: vid.videoHeight, duration: vid.duration, timeout: true }), 4000);
      });
    });

    results.push({
      scene: v.scene,
      name: v.name,
      file: v.file,
      format: 'MP4 (H.264 / AAC)',
      dimensions: `${meta.width}x${meta.height}`,
      duration: `${meta.duration ? meta.duration.toFixed(1) : '?'}s`,
      approxSize: `${(stat.size / (1024 * 1024)).toFixed(2)} MB`,
      posterSize: `${(posterStat.size / 1024).toFixed(1)} KB`,
      currentBehavior: v.scene === 1 ? 'Autoplay, looped, active' : 'Preload metadata, plays on snap visible'
    });
  }

  await browser.close();

  console.log(JSON.stringify(results, null, 2));
}

audit().catch(console.error);
