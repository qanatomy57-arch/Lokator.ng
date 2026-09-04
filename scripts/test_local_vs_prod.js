const { chromium } = require('playwright');
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');

// Ensure local server is up
function ensureLocalServer() {
  return new Promise(resolve => {
    http.get('http://localhost:8080', res => resolve(null))
      .on('error', () => {
        const proc = spawn('node', [path.join(__dirname, 'local_server.js')], { stdio: 'ignore' });
        setTimeout(() => resolve(proc), 1500);
      });
  });
}

(async () => {
  const serverProc = await ensureLocalServer();
  console.log('Local server ready.');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
  });

  const page = await browser.newPage();
  
  console.log('Testing http://localhost:8080/index.html...');
  const t0 = Date.now();
  await page.goto('http://localhost:8080/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  console.log(`Local loaded in ${Date.now() - t0}ms! Title:`, await page.title());

  await browser.close();
  if (serverProc) serverProc.kill();
})();
