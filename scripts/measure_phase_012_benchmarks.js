const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function runPhase012Benchmarks() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--no-sandbox'] });
  const results = {
    network: {},
    searchBenchmark: {},
    secondaryUx: {}
  };

  console.log('=== 1. NETWORK TRANSFER MEASUREMENT (HOMEPAGE BOOT) ===');
  const netContext = await browser.newContext();
  const netPage = await netContext.newPage();

  const networkResponses = [];
  netPage.on('response', res => {
    const url = res.url();
    const headers = res.headers();
    const length = headers['content-length'] ? parseInt(headers['content-length'], 10) : 0;
    networkResponses.push({
      url,
      status: res.status(),
      type: res.request().resourceType(),
      size: length
    });
  });

  const bootStart = Date.now();
  await netPage.goto('http://localhost:8080/index.html', { waitUntil: 'networkidle' });
  await netPage.waitForTimeout(2000);
  const bootDuration = Date.now() - bootStart;

  const videoReqs = networkResponses.filter(r => r.url.endsWith('.mp4'));
  const totalVideoBytes = videoReqs.reduce((sum, r) => sum + r.size, 0);
  const totalAllBytes = networkResponses.reduce((sum, r) => sum + r.size, 0);

  results.network = {
    totalRequests: networkResponses.length,
    totalTransferredBytes: totalAllBytes,
    totalTransferredMb: (totalAllBytes / (1024 * 1024)).toFixed(2),
    videoRequestsCount: videoReqs.length,
    videoUrls: videoReqs.map(r => r.url.split('/').pop()),
    totalVideoBytes: totalVideoBytes,
    totalVideoMb: (totalVideoBytes / (1024 * 1024)).toFixed(2),
    baselinePayloadMb: '22.58',
    payloadReductionPct: (((22.58 - (totalVideoBytes / (1024 * 1024))) / 22.58) * 100).toFixed(1) + '%'
  };

  console.log(`Initial Boot Total Requests: ${results.network.totalRequests}`);
  console.log(`Initial Video Requests: ${results.network.videoRequestsCount} (${results.network.videoUrls.join(', ')})`);
  console.log(`Initial Video Bytes: ${results.network.totalVideoMb} MB (Baseline was 22.58 MB -> Reduction: ${results.network.payloadReductionPct})`);
  await netContext.close();

  console.log('\n=== 2. END-TO-END SEARCH PIPELINE BENCHMARK ===');
  const searchContext = await browser.newContext();
  const searchPage = await searchContext.newPage();
  await searchPage.route('**/*.mp4', route => route.abort());
  await searchPage.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await searchPage.waitForSelector('#keyword-search', { state: 'visible' });

  const testQueries = [
    'electrician',
    'plumber ikeja',
    'mechanic abuja',
    'tailor surulere',
    'carpenter yaba',
    'solar installer',
    'ac repair lekki',
    'painter port harcourt',
    'welder kano',
    'caterer enugu'
  ];

  const searchLatencies = [];

  for (const q of testQueries) {
    const t0 = Date.now();
    await searchPage.fill('#keyword-search', q);
    await searchPage.press('#keyword-search', 'Enter');
    // Wait for results container to finish rendering
    await searchPage.waitForFunction(() => {
      const el = document.getElementById('results-count-text');
      return el && el.textContent.length > 0;
    });
    const duration = Date.now() - t0;
    searchLatencies.push(duration);
    console.log(` - Query: "${q}" -> ${duration}ms`);
    await searchPage.waitForTimeout(100);
  }

  searchLatencies.sort((a, b) => a - b);
  const median = searchLatencies[Math.floor(searchLatencies.length / 2)];
  const p95 = searchLatencies[Math.floor(searchLatencies.length * 0.95)];
  const slowest = searchLatencies[searchLatencies.length - 1];

  results.searchBenchmark = {
    queriesTested: testQueries.length,
    latenciesMs: searchLatencies,
    medianMs: median,
    p95Ms: p95,
    slowestMs: slowest
  };
  console.log(`Search Benchmark Results: Median: ${median}ms | p95: ${p95}ms | Slowest: ${slowest}ms`);
  await searchContext.close();

  console.log('\n=== 3. SECONDARY UX VERIFICATION ===');
  // 3a. Search Zero Results Nearby Opt-in
  const zeroContext = await browser.newContext();
  const zeroPage = await zeroContext.newPage();
  await zeroPage.route('**/*.mp4', route => route.abort());
  await zeroPage.goto('http://localhost:8080/search.html', { waitUntil: 'domcontentloaded' });
  await zeroPage.waitForTimeout(1000);

  // Filter to a location/trade with 0 results
  await zeroPage.fill('#keyword-search', 'xyzrandomartisan');
  await zeroPage.selectOption('#state-select', 'Yobe');
  await zeroPage.press('#keyword-search', 'Enter');
  await zeroPage.waitForTimeout(1000);

  const optinCardVisible = await zeroPage.waitForSelector('.zero-nearby-suggestions-card', { timeout: 4000 })
    .then(() => true).catch(() => false);
  console.log(`3a. Zero Results Nearby LGA Suggestions Card Visible: ${optinCardVisible}`);
  results.secondaryUx.zeroResultsNearbyOptin = optinCardVisible;
  await zeroContext.close();

  // 3b. Dashboard Lead History CSV Export (with authenticated provider session)
  const dashContext = await browser.newContext();
  await dashContext.addInitScript(() => {
    localStorage.setItem('lokator_current_provider', JSON.stringify({
      id: 1,
      name: 'Adebayo Ogunlesi',
      email: 'adebayo@example.com',
      trade: 'Electrical & Solar',
      area: 'Surulere',
      city: 'Lagos',
      verified: true
    }));
  });
  const dashPage = await dashContext.newPage();
  await dashPage.route('**/*.mp4', route => route.abort());
  await dashPage.goto('http://localhost:8080/dashboard.html', { waitUntil: 'domcontentloaded' });
  await dashPage.waitForSelector('#btn-export-leads-csv', { state: 'attached' });

  const exportBtnPresent = await dashPage.$eval('#btn-export-leads-csv', el => !!el);
  console.log(`3b. Dashboard Lead History CSV Export Button Present: ${exportBtnPresent}`);
  results.secondaryUx.leadHistoryCsvExport = exportBtnPresent;
  await dashContext.close();

  // 3c. Profile Portfolio Lightbox Swipe Navigation
  const profContext = await browser.newContext();
  const profPage = await profContext.newPage();
  await profPage.route('**/*.mp4', route => route.abort());
  await profPage.goto('http://localhost:8080/profile.html?id=1', { waitUntil: 'domcontentloaded' });
  await profPage.waitForSelector('.portfolio-card', { state: 'attached' });

  // Open first card
  await profPage.click('.portfolio-card');
  const lbActive = await profPage.$eval('#portfolio-lightbox', el => el.classList.contains('active'));
  console.log(`3c. Lightbox Opened: ${lbActive}`);

  // Dispatch Right Arrow key event
  await profPage.keyboard.press('ArrowRight');
  const nextItemTag = await profPage.$eval('#lightbox-tag', el => el.textContent);
  console.log(`3c. Lightbox After Arrow Navigation: ${nextItemTag}`);
  results.secondaryUx.portfolioLightboxNavigation = lbActive && nextItemTag.includes('2/');
  await profContext.close();

  await browser.close();

  fs.writeFileSync(
    path.join(__dirname, 'phase_012_benchmark_results.json'),
    JSON.stringify(results, null, 2),
    'utf8'
  );
  console.log('\n=== ALL PHASE 012 BENCHMARKS COMPLETED SUCCESSFULLY ===');
}

runPhase012Benchmarks().catch(err => {
  console.error('Benchmark error:', err);
  process.exit(1);
});
