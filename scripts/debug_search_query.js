const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.type(), msg.text()));
  page.on('pageerror', err => console.error('PAGE ERROR:', err));

  console.log('Opening page...');
  await page.goto('http://localhost:4195/search.html?service=electrician&state=Delta&lga=Okpe');
  await page.waitForTimeout(3000);

  const debugInfo = await page.evaluate(() => {
    return {
      providersContainerHtml: document.getElementById('providers-container') ? document.getElementById('providers-container').innerHTML.substring(0, 300) : 'NO CONTAINER',
      emptyStateDisplay: document.getElementById('empty-state') ? document.getElementById('empty-state').style.display : 'NO EMPTY',
      resultsCount: document.getElementById('results-count-text') ? document.getElementById('results-count-text').textContent : 'NO COUNT',
      allProvidersInStore: typeof LokatorDB !== 'undefined' ? (typeof PROVIDERS_DATA !== 'undefined' ? PROVIDERS_DATA.length : 'NO DATA') : 'NO DB'
    };
  });

  console.log('DEBUG INFO:', debugInfo);
  await browser.close();
})();
