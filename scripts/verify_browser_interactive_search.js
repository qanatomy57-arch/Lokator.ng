/**
 * Lokator.NG — Interactive Search & Suggestion Engine Browser Test
 */
const puppeteer = require('puppeteer');
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 8899;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml'
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = path.join(__dirname, '..', parsedUrl.pathname === '/' ? 'index.html' : parsedUrl.pathname);
  
  if (!fs.existsSync(filePath)) {
    res.writeHead(404);
    res.end('Not found');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': contentType });
  fs.createReadStream(filePath).pipe(res);
});

async function run() {
  server.listen(PORT);
  console.log(`Test server running at http://localhost:${PORT}`);

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  // Track page console errors
  const pageErrors = [];
  page.on('pageerror', err => pageErrors.push(err.message));
  page.on('console', msg => {
    if (msg.type() === 'error') pageErrors.push(msg.text());
  });

  try {
    console.log('\n--- 1. LOADING SEARCH.HTML ---');
    await page.goto(`http://localhost:${PORT}/search.html`, { waitUntil: 'networkidle0' });

    console.log('--- 2. VERIFYING KEYWORD AUTOCOMPLETE SUGGESTIONS ---');
    await page.type('#keyword-search', 'plumb');
    await page.waitForTimeout(400);

    const isSuggVisible = await page.$eval('#search-suggestions', el => el.style.display !== 'none');
    console.log(`  Keyword suggestions visible: ${isSuggVisible ? '✅ YES' : '❌ NO'}`);

    console.log('--- 3. VERIFYING LOCATION AUTOCOMPLETE SUGGESTIONS ---');
    await page.type('#location-search', 'warr');
    await page.waitForTimeout(400);

    const isLocSuggVisible = await page.$eval('#location-suggestions', el => el.style.display !== 'none');
    console.log(`  Location suggestions visible: ${isLocSuggVisible ? '✅ YES' : '❌ NO'}`);

    console.log('--- 4. EXECUTING SEARCH & RENDERING RESULTS ---');
    await page.click('#apply-main-search');
    await page.waitForTimeout(800);

    const cardCount = await page.$$eval('.provider-item-card', cards => cards.length);
    console.log(`  Provider cards rendered: ${cardCount > 0 ? `✅ ${cardCount} cards` : '❌ 0 cards'}`);

    console.log('--- 5. CHECKING JAVASCRIPT CONSOLE HEALTH ---');
    if (pageErrors.length === 0) {
      console.log('  ✅ Clean console: 0 unhandled runtime errors');
    } else {
      console.log(`  ❌ Console errors detected:`, pageErrors);
    }

    if (isSuggVisible && isLocSuggVisible && cardCount > 0 && pageErrors.length === 0) {
      console.log('\n🎉 INTERACTIVE SEARCH AUDIT PASSED 100%!\n');
    } else {
      console.log('\n❌ AUDIT FAILED\n');
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
    server.close();
  }
}

run();
