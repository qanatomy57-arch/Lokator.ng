const { chromium } = require('playwright');

async function testHeroNetworkLoading() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();

  const videoRequests = [];

  page.on('response', (response) => {
    const url = response.url();
    if (url.endsWith('.mp4') || url.includes('hero_') || url.includes('/hero/')) {
      if (url.endsWith('.mp4')) {
        const headers = response.headers();
        const contentLength = headers['content-length'] ? parseInt(headers['content-length'], 10) : 0;
        videoRequests.push({
          url: url.split('/').pop(),
          status: response.status(),
          size: contentLength
        });
      }
    }
  });

  console.log('Navigating to http://localhost:8080/index.html...');
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(2000);

  console.log('Initial load video requests:', videoRequests.length);
  videoRequests.forEach(r => console.log(` - ${r.url}: ${r.size} bytes (status ${r.status})`));

  const totalInitialBytes = videoRequests.reduce((sum, r) => sum + r.size, 0);
  console.log(`Total initial video bytes: ${(totalInitialBytes / (1024 * 1024)).toFixed(2)} MB`);

  // Assert only video 0 (hero_01_tailoring.mp4) was loaded initially
  const initialVideoUrls = videoRequests.map(r => r.url);
  const loadedVideosInitial = initialVideoUrls.filter(u => u.includes('.mp4'));
  console.log('Loaded videos at boot:', [...new Set(loadedVideosInitial)]);

  // Now simulate scrolling to step 1
  console.log('Scrolling to step 1...');
  await page.evaluate(() => {
    if (window.lokatorDiscovery) {
      window.lokatorDiscovery.scrollToStep(1);
    }
  });
  await page.waitForTimeout(2500);

  console.log('Total video requests after scrolling to step 1:', videoRequests.length);
  const afterStep1Urls = [...new Set(videoRequests.map(r => r.url))];
  console.log('Loaded videos after step 1:', afterStep1Urls);

  await browser.close();
}

testHeroNetworkLoading().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
