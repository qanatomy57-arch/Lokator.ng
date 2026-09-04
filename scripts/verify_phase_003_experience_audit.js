// ============================================================================
// PADIFIX PHASE 003: MARKETPLACE EXPERIENCE, CONVERSION & SOCIAL PRESENCE AUDIT SUITE
// Automated verification for PadiFix Phase 003 implementation
// ============================================================================

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:8080';
const EVIDENCE_DIR = path.join(__dirname, 'visual_evidence', 'phase_003');

if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
}

const VIEWPORTS = [
  { name: 'mobile_320x844', width: 320, height: 844 },
  { name: 'mobile_390x844', width: 390, height: 844 },
  { name: 'mobile_412x915', width: 412, height: 915 },
  { name: 'desktop_1280x720', width: 1280, height: 720 },
  { name: 'desktop_1440x900', width: 1440, height: 900 },
  { name: 'desktop_1920x1080', width: 1920, height: 1080 }
];

let totalPassed = 0;
let totalFailed = 0;
const failures = [];

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    totalPassed++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
    totalFailed++;
    failures.push(message);
  }
}

async function runPhase003Audit() {
  console.log('================================================================================');
  console.log(`🚀 STARTING PADIFIX PHASE 003 EXPERIENCE, CONVERSION & SOCIAL AUDIT`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`Evidence Directory: ${EVIDENCE_DIR}`);
  console.log('================================================================================\n');

  const browser = await chromium.launch({
    channel: 'msedge',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 PadiFixAuditBot/3.0'
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      const txt = msg.text();
      // Filter out standard OpenStreetMap tile 404s/aborts during testing
      if (!txt.includes('tile.openstreetmap.org') && !txt.includes('net::ERR_ABORTED')) {
        consoleErrors.push(txt);
      }
    }
  });

  try {
    // --- 1. SOCIAL PRESENCE AUDIT ---
    console.log('--- 1. OFFICIAL SOCIAL PRESENCE AUDIT ---');
    const pagesWithSocial = [
      { url: `${BASE_URL}/index.html`, name: 'Homepage' },
      { url: `${BASE_URL}/about.html`, name: 'About Page' },
      { url: `${BASE_URL}/search.html`, name: 'Search Directory' },
      { url: `${BASE_URL}/profile.html?id=1`, name: 'Provider Profile' },
      { url: `${BASE_URL}/how-it-works.html`, name: 'How It Works' }
    ];

    for (const p of pagesWithSocial) {
      await page.goto(p.url, { waitUntil: 'domcontentloaded' });
      
      const igLinks = await page.$$eval('a[href*="instagram.com"]', links => links.map(l => l.href));
      const fbLinks = await page.$$eval('a[href*="facebook.com"]', links => links.map(l => l.href));

      const hasCanonicalIg = igLinks.some(l => l.includes('official_padifix'));
      const hasCanonicalFb = fbLinks.some(l => l.includes('1RVkjG915z'));

      assert(hasCanonicalIg, `${p.name}: Contains official Instagram link (https://www.instagram.com/official_padifix)`);
      assert(hasCanonicalFb, `${p.name}: Contains official Facebook community link (https://www.facebook.com/share/1RVkjG915z/)`);
    }

    // --- 2. METADATA & OPENGRAPH AUDIT ---
    console.log('\n--- 2. METADATA, OPENGRAPH & CANONICAL URL AUDIT ---');
    const pagesWithMeta = [
      { url: `${BASE_URL}/index.html`, name: 'Homepage' },
      { url: `${BASE_URL}/about.html`, name: 'About Page' },
      { url: `${BASE_URL}/search.html`, name: 'Search Directory' },
      { url: `${BASE_URL}/profile.html?id=1`, name: 'Provider Profile' },
      { url: `${BASE_URL}/register.html`, name: 'Provider Registration' },
      { url: `${BASE_URL}/how-it-works.html`, name: 'How It Works' }
    ];

    for (const p of pagesWithMeta) {
      await page.goto(p.url, { waitUntil: 'domcontentloaded' });
      const canonical = await page.$eval('link[rel="canonical"]', el => el.href).catch(() => null);
      const ogTitle = await page.$eval('meta[property="og:title"]', el => el.content).catch(() => null);
      const ogDesc = await page.$eval('meta[property="og:description"]', el => el.content).catch(() => null);
      const ogImage = await page.$eval('meta[property="og:image"]', el => el.content).catch(() => null);
      const twCard = await page.$eval('meta[name="twitter:card"]', el => el.content).catch(() => null);

      assert(canonical && canonical.includes('padifix.vercel.app'), `${p.name}: Has canonical link pointing to padifix.vercel.app`);
      assert(Boolean(ogTitle && ogTitle.includes('PadiFix')), `${p.name}: Has og:title containing 'PadiFix'`);
      assert(Boolean(ogDesc && ogDesc.length > 20), `${p.name}: Has descriptive og:description`);
      assert(Boolean(ogImage && ogImage.includes('og-image.png')), `${p.name}: Has valid og:image configured`);
      assert(Boolean(twCard), `${p.name}: Has twitter:card metadata configured`);
    }

    // --- 3. SEARCH INTENT & TYPO TOLERANCE AUDIT ---
    console.log('\n--- 3. SEARCH INTENT & NIGERIAN TYPO TOLERANCE AUDIT ---');
    await page.goto(`${BASE_URL}/search.html`, { waitUntil: 'networkidle' });

    const typoTests = [
      { query: 'plumba', expectedSlug: 'plumber' },
      { query: 'electrishan', expectedSlug: 'electrician' },
      { query: 'mekanic', expectedSlug: 'mechanic' },
      { query: 'capenter', expectedSlug: 'carpenter' }
    ];

    for (const t of typoTests) {
      const detected = await page.evaluate((q) => {
        if (typeof NigeriaSearchLanguage !== 'undefined' && NigeriaSearchLanguage.parseNigerianQuery) {
          const res = NigeriaSearchLanguage.parseNigerianQuery(q);
          return res ? res.canonicalSlug : null;
        }
        return null;
      }, t.query);

      assert(detected === t.expectedSlug, `Search Language: Typo '${t.query}' resolves to canonical slug '${t.expectedSlug}' (Got: '${detected}')`);
    }

    // --- 4. TOUCH TARGETS & ACCESSIBILITY AUDIT ---
    console.log('\n--- 4. TOUCH TARGET ACCESSIBILITY AUDIT ---');
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });
    const socLinkBox = await page.$eval('.soc-link', el => {
      const rect = el.getBoundingClientRect();
      return { width: rect.width, height: rect.height };
    }).catch(() => ({ width: 0, height: 0 }));

    assert(socLinkBox.width >= 40 && socLinkBox.height >= 40, `Social links have thumb-friendly touch target >= 40px (Current: ${socLinkBox.width}x${socLinkBox.height}px)`);

    // --- 5. MULTI-VIEWPORT RESPONSIVENESS & ZERO OVERFLOW AUDIT ---
    console.log('\n--- 5. MULTI-VIEWPORT ZERO OVERFLOW AUDIT ---');
    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle' });

      const overflowDiff = await page.evaluate(() => {
        return Math.max(0, document.documentElement.scrollWidth - window.innerWidth);
      });

      assert(overflowDiff === 0, `${vp.name}: Zero horizontal overflow (scrollWidth === window.innerWidth)`);
      
      const screenshotPath = path.join(EVIDENCE_DIR, `phase_003_${vp.name}_homepage.png`);
      await page.screenshot({ path: screenshotPath, fullPage: false });
    }

    // --- 6. CUSTOMER CONVERSION JOURNEY AUDIT ---
    console.log('\n--- 6. CUSTOMER CONVERSION JOURNEY AUDIT ---');
    await page.setViewportSize({ width: 390, height: 844 }); // Mobile test
    await page.goto(`${BASE_URL}/search.html`, { waitUntil: 'networkidle' });

    // Ensure provider cards rendered
    const cardCount = await page.$$eval('.provider-item-card', cards => cards.length);
    assert(cardCount > 0, `Search Directory renders ${cardCount} active provider cards`);

    // Navigate to profile
    await page.goto(`${BASE_URL}/profile.html?id=1`, { waitUntil: 'networkidle' });
    const waButton = page.locator('#wa-send-btn, #sticky-wa-btn, a[href*="wa.me"]').first();
    const phoneButton = page.locator('#btn-call-hero, #sidebar-call-btn, #sticky-call-btn').first();
    const reviewsSection = page.locator('#reviews-section, .reviews-summary-card').first();
    const writeReviewBtn = page.locator('#btn-open-review-modal').first();

    assert(await waButton.isVisible().catch(() => false), 'Provider Profile: WhatsApp Direct Contact CTA is visible');
    assert(await phoneButton.isVisible().catch(() => false), 'Provider Profile: Phone Direct Call CTA is visible');
    assert(await reviewsSection.isVisible().catch(() => false), 'Provider Profile: Customer Reviews & Ratings section is present');
    assert(await writeReviewBtn.isVisible().catch(() => false), 'Provider Profile: Write a Review CTA is present');

    // --- 7. PROVIDER ONBOARDING JOURNEY AUDIT ---
    console.log('\n--- 7. PROVIDER ONBOARDING JOURNEY AUDIT ---');
    await page.goto(`${BASE_URL}/register.html`, { waitUntil: 'networkidle' });
    const step1Title = await page.$eval('.reg-card-title', el => el.textContent.trim()).catch(() => '');
    const step1Btn = page.locator('#btn-step-1-next').first();

    assert(step1Title.includes('Personal Details') || step1Title.includes('Step 1') || await step1Btn.isVisible(), 'Provider Onboarding: Multi-step registration wizard active');
    
    // --- 8. TRUST & SAFETY AUDIT ---
    console.log('\n--- 8. TRUST & SAFETY AUDIT ---');
    await page.goto(`${BASE_URL}/profile.html?id=1`, { waitUntil: 'networkidle' });
    const trustBadge = page.locator('.verified-badge, .badge-verified, [aria-label*="verified"]').first();
    assert(await trustBadge.isVisible().catch(() => false), 'Provider Profile: Verified Artisan badge rendered for verified provider');

    const reportBtn = page.locator('#btn-report-listing, button:has-text("Report")').first();
    assert(await reportBtn.isVisible().catch(() => false), 'Provider Profile: Report Misleading Listing modal trigger exists');

    console.log('\n================================================================================');
    console.log(`AUDIT SUMMARY: ${totalPassed} PASSED, ${totalFailed} FAILED | Console Errors: ${consoleErrors.length}`);
    console.log(`FINAL VERDICT: ${totalFailed === 0 ? 'GREEN — EXCELLENCE CERTIFIED' : 'RED — ISSUES FOUND'}`);
    console.log('================================================================================\n');

  } finally {
    await browser.close();
  }

  if (totalFailed > 0) {
    process.exit(1);
  }
}

runPhase003Audit().catch(err => {
  console.error('Fatal error during Phase 003 audit:', err);
  process.exit(1);
});
