/**
 * ============================================================================
 * LOKATOR.NG — VERIFICATION SUITE
 * Structured WhatsApp Job Brief Generator & Nigerian Pidgin Search Engine
 * ============================================================================
 */

const assert = require('assert');
const http = require('http');
const { LokatorAIService, NIGERIA_TRADE_PRICING_GUIDANCE } = require('../ai-service.js');
const { NigeriaSearchLanguage } = require('../search-language.js');
const { NigeriaPhone } = require('../phone-utils.js');

function logPass(msg) {
  console.log(`  \x1b[32m✓\x1b[0m ${msg}`);
}

function logFail(msg, err) {
  console.error(`  \x1b[31m✗\x1b[0m ${msg}`, err || '');
}

async function runTests() {
  console.log('================================================================================');
  console.log('🧪 VERIFYING STRUCTURED WHATSAPP JOB BRIEF GENERATOR & PIDGIN SEARCH');
  console.log('================================================================================\n');

  let passed = 0;
  let failed = 0;

  async function test(name, fn) {
    try {
      await fn();
      logPass(name);
      passed++;
    } catch (err) {
      logFail(name, err);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // SUITE 1: LokatorAIService.generateStructuredJobBrief
  // --------------------------------------------------------------------------
  console.log('📦 SUITE 1: AI Structured WhatsApp Job Brief & Pricing Intelligence');

  await test('1.1 LokatorAIService.generateStructuredJobBrief returns formatted brief with provider name & trade', () => {
    const provider = {
      id: 1,
      name: 'Adebayo Okafor',
      trade: 'Master Electrician & Solar Installer',
      locality: 'Surulere',
      lga: 'Surulere',
      state: 'Lagos',
      phone: '+2348012345678'
    };

    const brief = LokatorAIService.generateStructuredJobBrief(provider, {
      serviceType: 'Inverter & Solar Setup',
      jobScope: 'Emergency Repair',
      clientLocation: '14 Ogunlana Dr, Surulere',
      urgency: 'Urgent / Today',
      materialsOption: 'Labor Only (I will supply materials)',
      details: 'Inverter tripping on load after rain'
    });

    assert.ok(brief.plainText, 'brief.plainText should exist');
    assert.ok(brief.plainText.includes('Adebayo Okafor'), 'Should mention provider name');
    assert.ok(brief.plainText.includes('Inverter & Solar Setup'), 'Should mention requested service');
    assert.ok(brief.plainText.includes('Emergency Repair'), 'Should mention job scope');
    assert.ok(brief.plainText.includes('14 Ogunlana Dr, Surulere'), 'Should mention location');
    assert.ok(brief.plainText.includes('Inverter tripping on load after rain'), 'Should include notes');
    assert.ok(brief.pricingGuidance, 'Should include pricing guidance');
    assert.ok(brief.pricingGuidance.suggested_range, 'Should have suggested range');
  });

  await test('1.2 Pricing benchmark adjusts correctly for materials and emergency status', () => {
    const provider = {
      name: 'Emeka Musa',
      trade: 'Plumber & Pipe Specialist',
      locality: 'Ikeja',
      state: 'Lagos'
    };

    const briefStandard = LokatorAIService.generateStructuredJobBrief(provider, {
      serviceType: 'Pipe Fitting',
      jobScope: 'Routine Maintenance',
      urgency: 'Next Week / Flexible',
      materialsOption: 'Labor Only (I will supply materials)'
    });

    const briefEmergencyWithParts = LokatorAIService.generateStructuredJobBrief(provider, {
      serviceType: 'Burst Pipe Repair',
      jobScope: 'Emergency Repair',
      urgency: 'Urgent / Today',
      materialsOption: 'Materials Included (Artisan to supply parts)'
    });

    assert.ok(briefStandard.pricingGuidance.suggested_range.includes('₦8,000') || briefStandard.pricingGuidance.suggested_range.includes('₦25,000'), 'Standard range expected');
    assert.ok(briefEmergencyWithParts.pricingGuidance.suggested_range.includes('₦25,000') || briefEmergencyWithParts.pricingGuidance.suggested_range.includes('₦65,000'), 'Emergency range expected');
    assert.ok(briefEmergencyWithParts.pricingGuidance.pricing_factors[0].includes('Materials and replacement parts included'), 'Materials factor should be included');
  });

  await test('1.3 WhatsApp URL generation with NigeriaPhone integrates structured brief cleanly', () => {
    const provider = {
      id: 3,
      name: 'Emeka Musa',
      phone: '08034567890',
      trade: 'Plumber'
    };

    const brief = LokatorAIService.generateStructuredJobBrief(provider, {
      serviceType: 'Pipe Leak',
      jobScope: 'Inspection & Diagnosis',
      clientLocation: 'Allen Avenue, Ikeja',
      urgency: 'Tomorrow'
    });

    const waUrl = NigeriaPhone.buildWhatsAppUrl(provider, { customMessage: brief.plainText });
    assert.ok(waUrl.startsWith('https://wa.me/2348034567890?text='), 'Should create valid wa.me URL');
    assert.ok(waUrl.includes(encodeURIComponent('JOB INQUIRY VIA LOKATOR.NG')), 'Should contain encoded brief header');
    assert.ok(waUrl.includes(encodeURIComponent('Emeka Musa')), 'Should contain encoded provider name');
  });

  // --------------------------------------------------------------------------
  // SUITE 2: NigeriaSearchLanguage & Pidgin Query Parsing
  // --------------------------------------------------------------------------
  console.log('\n🇳🇬 SUITE 2: Nigerian Search Language & Pidgin Intent Recognition');

  await test('2.1 Resolves Pidgin queries to canonical trade intent', () => {
    const q1 = NigeriaSearchLanguage.parseNigerianQuery('person wey fit fix my generator');
    assert.ok(q1.serviceIntent, 'Should resolve service intent');
    assert.strictEqual(q1.serviceIntent.canonicalSlug, 'electrician');

    const q2 = NigeriaSearchLanguage.parseNigerianQuery('who sabi sew agbada for Ikeja');
    assert.ok(q2.serviceIntent, 'Should resolve tailor service intent');
    assert.strictEqual(q2.serviceIntent.canonicalSlug, 'tailor');
    assert.strictEqual(q2.extractedLocation, 'Ikeja');

    const q3 = NigeriaSearchLanguage.parseNigerianQuery('who fit repair my AC around Surulere');
    assert.ok(q3.serviceIntent, 'Should resolve ac-technician');
    assert.strictEqual(q3.serviceIntent.canonicalSlug, 'ac-technician');
    assert.strictEqual(q3.extractedLocation, 'Surulere');

    const q4 = NigeriaSearchLanguage.parseNigerianQuery('plumber wey dey close to me');
    assert.ok(q4.serviceIntent, 'Should resolve plumber');
    assert.strictEqual(q4.serviceIntent.canonicalSlug, 'plumber');
    assert.strictEqual(q4.isNearMe, true, 'Should detect proximity intent');
  });

  await test('2.2 Resolves location hierarchy from query correctly', () => {
    const q = NigeriaSearchLanguage.parseNigerianQuery('mechanic in Surulere');
    assert.strictEqual(q.serviceIntent.canonicalSlug, 'mechanic');
    assert.strictEqual(q.extractedLocation, 'Surulere');
    if (q.locationHierarchy) {
      assert.strictEqual(q.locationHierarchy.state, 'Lagos');
      assert.strictEqual(q.locationHierarchy.lga, 'Surulere');
    }
  });

  // --------------------------------------------------------------------------
  // SUITE 3: Browser End-to-End Test with Playwright
  // --------------------------------------------------------------------------
  console.log('\n🌐 SUITE 3: Browser Integration & Mobile Responsiveness');

  let chromium;
  try {
    const pw = require('playwright');
    chromium = pw.chromium;
  } catch (e) {
    try {
      const pw = require('playwright-core');
      chromium = pw.chromium;
    } catch (e2) {}
  }

  if (chromium) {
    await test('3.1 Playwright tests profile.html WhatsApp job brief builder widgets & copy action', async () => {
      const browser = await chromium.launch({ channel: 'msedge', headless: true });
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 },
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_5 like Mac OS X) AppleWebKit/605.1.15'
      });
      const page = await context.newPage();

      await page.goto('http://localhost:4195/profile.html?id=1', { waitUntil: 'networkidle' });
      await page.waitForSelector('#wa-pricing-guidance-pill', { timeout: 6000 });
      await page.waitForTimeout(500);

      // Verify builder card exists
      const builderVisible = await page.locator('#whatsapp-builder').isVisible();
      assert.ok(builderVisible, 'WhatsApp builder card should be visible');

      // Verify AI price benchmark pill
      const priceText = await page.locator('#wa-price-range-text').textContent();
      assert.ok(priceText.includes('Benchmark:'), `Price benchmark should be rendered, got: ${priceText}`);

      // Click "Emergency Fix" scope pill
      const urgentPill = page.locator('.wa-scope-btn[data-scope="Emergency Repair"]');
      await urgentPill.click();
      await page.waitForTimeout(400);

      const isUrgentActive = await urgentPill.evaluate(el => el.classList.contains('active'));
      assert.ok(isUrgentActive, 'Emergency Repair pill should be active');

      // Check updated preview text
      const previewText = await page.locator('#wa-preview-text').textContent();
      assert.ok(previewText.includes('Emergency Repair'), 'Preview text should update with Emergency Repair');
      assert.ok(previewText.includes('JOB INQUIRY VIA LOKATOR.NG'), 'Preview text should have formatted header');

      // Click "Copy Job Brief" button
      const copyBtn = page.locator('#wa-copy-brief-btn');
      await copyBtn.click();
      await page.waitForTimeout(400);

      const toastVisible = await page.locator('#profile-toast').isVisible();
      assert.ok(toastVisible, 'Profile toast should show after copy button click');

      // Verify WhatsApp send button href
      const waHref = await page.locator('#wa-send-btn').getAttribute('href');
      assert.ok(waHref && waHref.startsWith('https://wa.me/2348012345678?text='), `wa-send-btn should have valid WhatsApp URL, got: ${waHref}`);

      await browser.close();
    });

    await test('3.2 Playwright tests search.html Pidgin query intent interpretation banner', async () => {
      const browser = await chromium.launch({ channel: 'msedge', headless: true });
      const context = await browser.newContext({
        viewport: { width: 390, height: 844 }
      });
      const page = await context.newPage();

      // Navigate with Pidgin query in URL
      await page.goto('http://localhost:4195/search.html?q=person+wey+fit+fix+my+generator+for+Surulere', { waitUntil: 'networkidle' });
      await page.waitForSelector('#search-intent-banner', { timeout: 6000 });
      await page.waitForTimeout(500);

      // Verify search intent banner is displayed
      const bannerVisible = await page.locator('#search-intent-banner').isVisible();
      assert.ok(bannerVisible, 'Search intent banner should be visible for Pidgin query');

      const bannerText = await page.locator('#search-intent-banner').textContent();
      assert.ok(bannerText.includes('Electrician') || bannerText.includes('Generator'), `Banner should interpret Generator/Electrician, got: ${bannerText}`);
      assert.ok(bannerText.includes('Surulere'), 'Banner should identify Surulere');

      // Test "Search Literal" toggle button
      const revertBtn = page.locator('#btn-revert-literal');
      await revertBtn.click();
      await page.waitForSelector('.search-intent-content.literal-mode', { timeout: 6000 });

      const literalActive = await page.locator('.search-intent-content.literal-mode').isVisible();
      assert.ok(literalActive, 'Literal mode should be active after toggle');

      await browser.close();
    });
  } else {
    console.log('  ⚠️ Playwright not found in local node_modules, skipped browser E2E steps.');
  }

  console.log('\n================================================================================');
  console.log(`SUMMARY: ${passed} Passed, ${failed} Failed`);
  console.log('================================================================================\n');

  if (failed > 0) process.exit(1);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
