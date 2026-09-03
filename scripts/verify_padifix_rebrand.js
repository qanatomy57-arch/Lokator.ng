const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  console.log('================================================================================');
  console.log('🛡️ PADIFIX BRAND MIGRATION & REGRESSION VERIFICATION');
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--autoplay-policy=no-user-gesture-required']
  });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 }
  });
  const page = await context.newPage();

  const baseUrl = 'http://localhost:8080';
  let passCount = 0;
  let failCount = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passCount++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failCount++;
    }
  }

  async function safeGoto(url) {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 12000 });
        return;
      } catch (err) {
        if (attempt === 3) throw err;
        await page.waitForTimeout(400);
      }
    }
  }

  // 1. MANIFEST.JSON VALIDATION
  console.log('--- 1. WEB APP MANIFEST VALIDATION ---');
  try {
    const manifestRaw = fs.readFileSync(path.join(__dirname, '../manifest.json'), 'utf8');
    const manifest = JSON.parse(manifestRaw);
    assert(manifest.name.includes('PadiFix'), `Manifest name is "${manifest.name}"`);
    assert(manifest.short_name === 'PadiFix', `Manifest short_name is "${manifest.short_name}"`);
    assert(manifest.description.includes("local-services marketplace"), 'Manifest description matches positioning');
    assert(manifest.theme_color === '#00A859', `Manifest theme_color is ${manifest.theme_color} (Vibrant Green)`);
  } catch (err) {
    assert(false, `Manifest validation error: ${err.message}`);
  }

  // 2. INDEX.HTML VERIFICATION (DESKTOP)
  console.log('\n--- 2. INDEX.HTML (DESKTOP 1280x800) ---');
  await safeGoto(`${baseUrl}/index.html`);
  const indexTitle = await page.title();
  assert(indexTitle.includes('PadiFix'), `Title contains PadiFix: "${indexTitle}"`);
  assert(indexTitle.includes('Find Skills. Get Things Done.'), `Title contains tagline: "${indexTitle}"`);

  const logoText = await page.locator('#logo-link .logo-text').innerText();
  assert(logoText.includes('PadiFix') || logoText.includes('Fix'), `Navbar wordmark text: "${logoText}"`);

  const discoveryEngine = await page.evaluate(() => {
    return {
      hasLegacy: typeof window.lokatorDiscovery !== 'undefined',
      hasNew: typeof window.padiFixDiscovery !== 'undefined',
      activeScene: window.padiFixDiscovery ? window.padiFixDiscovery.activeSceneIndex : null
    };
  });
  assert(discoveryEngine.hasLegacy, 'Backward-compatible window.lokatorDiscovery singleton exists');
  assert(discoveryEngine.hasNew, 'Brand-aligned window.padiFixDiscovery singleton exists');

  // Screenshot Desktop
  await page.screenshot({ path: path.join(__dirname, 'padifix_desktop_hero.png') });
  console.log('  📸 Captured padifix_desktop_hero.png');

  // 3. INDEX.HTML (MOBILE 390x844 iPhone 14)
  console.log('\n--- 3. INDEX.HTML (MOBILE 390x844) ---');
  await page.setViewportSize({ width: 390, height: 844 });
  await safeGoto(`${baseUrl}/index.html`);
  await page.waitForTimeout(400);

  const heroTitle = await page.locator('.hero-title').first().innerText();
  assert(heroTitle.includes('Professionals') || heroTitle.includes('Find Trusted') || heroTitle.includes('PadiFix'), `Hero title active: "${heroTitle}"`);

  await page.screenshot({ path: path.join(__dirname, 'padifix_mobile_hero.png') });
  console.log('  📸 Captured padifix_mobile_hero.png');

  // 4. SEARCH.HTML VERIFICATION
  console.log('\n--- 4. SEARCH.HTML VERIFICATION ---');
  await page.setViewportSize({ width: 1280, height: 800 });
  await safeGoto(`${baseUrl}/search.html`);
  const searchTitle = await page.title();
  assert(searchTitle.includes('PadiFix'), `Search title contains PadiFix: "${searchTitle}"`);
  await page.screenshot({ path: path.join(__dirname, 'padifix_search_page.png') });
  console.log('  📸 Captured padifix_search_page.png');

  // 5. PROFILE.HTML VERIFICATION
  console.log('\n--- 5. PROFILE.HTML VERIFICATION ---');
  await safeGoto(`${baseUrl}/profile.html?id=1`);
  await page.waitForTimeout(400);
  const profileTitle = await page.title();
  assert(profileTitle.includes('PadiFix'), `Profile title contains PadiFix: "${profileTitle}"`);
  await page.screenshot({ path: path.join(__dirname, 'padifix_provider_profile.png') });
  console.log('  📸 Captured padifix_provider_profile.png');

  // 6. REGISTER.HTML VERIFICATION
  console.log('\n--- 6. REGISTER.HTML VERIFICATION ---');
  await safeGoto(`${baseUrl}/register.html`);
  const regTitle = await page.title();
  assert(regTitle.includes('PadiFix'), `Register title contains PadiFix: "${regTitle}"`);
  const regHeroSub = await page.locator('.reg-hero-text p').first().innerText();
  assert(regHeroSub.includes('PadiFix'), `Register hero subtext: "${regHeroSub}"`);
  await page.screenshot({ path: path.join(__dirname, 'padifix_registration_page.png') });
  console.log('  📸 Captured padifix_registration_page.png');

  // 7. REMAINING CORE SURFACES TITLE AUDIT
  console.log('\n--- 7. SYSTEM SURFACES AUDIT ---');
  const pagesToCheck = [
    { url: 'login.html', expected: 'PadiFix' },
    { url: 'dashboard.html', expected: 'PadiFix', requiresAuth: true },
    { url: 'about.html', expected: 'PadiFix' },
    { url: 'how-it-works.html', expected: 'PadiFix' },
    { url: 'terms.html', expected: 'PadiFix' },
    { url: 'privacy.html', expected: 'PadiFix' },
    { url: 'offline.html', expected: 'PadiFix' },
    { url: 'join.html', expected: 'PadiFix' },
    { url: 'admin.html', expected: 'PadiFix' },
    { url: 'analytics.html', expected: 'PadiFix' }
  ];

  for (const item of pagesToCheck) {
    if (item.requiresAuth) {
      await page.evaluate(() => {
        localStorage.setItem('lokator_supabase_auth_session', JSON.stringify({
          user: { id: 'prov-001', email: 'verified@padifix.ng' },
          provider: { id: 'prov-001', name: 'Dickson Master', trade: 'Electrician' }
        }));
      });
    }
    await safeGoto(`${baseUrl}/${item.url}`);
    await page.waitForTimeout(300);
    const title = await page.title();
    assert(title.includes(item.expected), `${item.url} title contains "${item.expected}": "${title}"`);
  }

  console.log('\n================================================================================');
  console.log(`TOTAL: ${passCount} PASSED, ${failCount} FAILED`);
  console.log('================================================================================');

  await browser.close();
  process.exit(failCount === 0 ? 0 : 1);
})();
