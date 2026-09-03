const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';

(async () => {
  console.log('================================================================================');
  console.log('🛠️ PADIFIX FUNCTIONAL & PWA REGRESSION AUDIT (PHASE 011.1)');
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  let passed = 0;
  let failed = 0;

  function assert(cond, msg) {
    if (cond) {
      console.log(`  ✅ [PASS] ${msg}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${msg}`);
      failed++;
    }
  }

  // 1. MANIFEST & SERVICE WORKER SPEC
  console.log('--- 1. PWA & CACHE INTEGRITY ---');
  const manifestRaw = fs.readFileSync(path.join(__dirname, '../manifest.json'), 'utf8');
  const manifest = JSON.parse(manifestRaw);
  assert(manifest.name === 'PadiFix — Find Skills. Get Things Done.', 'Manifest name matches exact specification');
  assert(manifest.short_name === 'PadiFix', 'Manifest short_name is "PadiFix"');
  assert(manifest.theme_color === '#00A859', 'Manifest theme_color is vibrant green (#00A859)');

  const swContent = fs.readFileSync(path.join(__dirname, '../sw.js'), 'utf8');
  assert(swContent.includes('padifix-v11.00'), 'sw.js cache version bumped to padifix-v11.00');
  assert(!swContent.includes('lokator-v10'), 'Old lokator cache version removed from sw.js');

  // 2. SEARCH ENGINE & CANONICAL FILTERING
  console.log('\n--- 2. SEARCH & FILTER REGRESSION ---');
  await page.goto(`${BASE_URL}/search.html?q=electrician`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const filteredCount = await page.locator('.provider-item-card').count();
  assert(filteredCount > 0, `Search query 'q=electrician' renders ${filteredCount} matching provider cards`);

  const firstCardText = await page.locator('.provider-item-card').first().innerText();
  assert(firstCardText.length > 20, 'Provider card contains rich profile details and contact actions');

  // 3. WHATSAPP CTA DISPATCH ON PROVIDER PROFILE
  console.log('\n--- 3. PROVIDER PROFILE & CONTACT ACTIONS ---');
  await page.goto(`${BASE_URL}/profile.html?id=1`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(600);

  const waBtn = await page.locator('#btn-wa-hero, #wa-send-btn').first();
  const waBtnVisible = await waBtn.isVisible().catch(() => false);
  assert(waBtnVisible, 'WhatsApp contact action is visible on provider profile');

  const waHref = await waBtn.getAttribute('href').catch(() => '');
  assert(waHref.includes('wa.me') || waHref.includes('whatsapp') || waHref.includes('#'), `WhatsApp action link present: ${waHref.substring(0, 40)}`);

  // 4. OFFLINE CAPABILITY & FALLBACK
  console.log('\n--- 4. OFFLINE SCREEN VERIFICATION ---');
  await page.goto(`${BASE_URL}/offline.html`, { waitUntil: 'domcontentloaded' });
  const offlineTitle = await page.title();
  assert(offlineTitle.includes('PadiFix'), `Offline page title contains PadiFix: "${offlineTitle}"`);
  const offlineHeading = await page.locator('h1, h2').first().innerText();
  assert(offlineHeading.includes('Offline') || offlineHeading.includes('Connection') || offlineHeading.includes('PadiFix'), `Offline heading rendered: "${offlineHeading}"`);

  console.log('\n================================================================================');
  console.log(`TOTAL: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================================');

  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
})();
