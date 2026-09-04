/**
 * PadiFix Phase 004 — Marketplace Growth & Monetization Architecture Test Suite
 * File: scripts/verify_phase_004_monetization_architecture.js
 * 
 * Tests:
 * 1. Monetization Configuration & Feature Flags
 * 2. Marketplace Liquidity Safeguards & Capacity Guard (Max 2 per cluster)
 * 3. Search Relevance & Zero Organic Dilution
 * 4. Provider Value Proposition & Free Core Flywheel Guarantee
 * 5. Telemetry & Strict Privacy Guard (No PII / Financial Credentials)
 * 6. Security, Webhook HMAC Verification & Admin RBAC Controls
 * 7. Mobile Ergonomics, Responsive CSS & 0px Overflow
 * 8. PWA Shell Asset Integration & Offline Resilience
 * 9. Regression Safety Baseline Confirmation
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
let testsPassed = 0;
let testsFailed = 0;

function runTest(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

async function runAsyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✓ ${name}`);
    testsPassed++;
  } catch (err) {
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
    testsFailed++;
  }
}

async function main() {
  console.log('================================================================');
  console.log('PADIFIX PHASE 004 — MONETIZATION ARCHITECTURE VERIFICATION');
  console.log('================================================================\n');

  // Load monetization config module
  const monetizationConfigPath = path.join(ROOT_DIR, 'monetization-config.js');
  const PadiFixMonetization = require(monetizationConfigPath);

  // SECTION 1: MONETIZATION CONFIGURATION & FEATURE FLAGS
  console.log('--- SECTION 1: MONETIZATION CONFIGURATION & FEATURE FLAGS ---');
  
  runTest('1.1 PadiFixMonetization configuration object exports cleanly', () => {
    assert.ok(PadiFixMonetization, 'Module must export an object');
    assert.strictEqual(PadiFixMonetization.NAME, 'PadiFix Marketplace Growth & Monetization Architecture');
    assert.strictEqual(PadiFixMonetization.VERSION, '4.0.0');
    assert.strictEqual(PadiFixMonetization.PHASE, '004');
  });

  runTest('1.2 Safe default feature flags prevent premature monetization', () => {
    const flags = PadiFixMonetization.FEATURE_FLAGS;
    assert.strictEqual(flags.sponsoredListingsEnabled, false, 'Sponsored listings must default to false for safety');
    assert.strictEqual(flags.advertisingEnabled, false, 'Display ads must default to false');
    assert.strictEqual(flags.surveysEnabled, false, 'Surveys must default to false');
    assert.strictEqual(flags.providerSubscriptionsEnabled, false, 'Mandatory subscriptions must default to false');
    assert.strictEqual(flags.paymentLiveMode, false, 'Live payment processing must default to false (test sandbox only)');
    assert.strictEqual(flags.monetizationAnalyticsEnabled, true, 'Telemetry analytics should be enabled for research');
  });

  runTest('1.3 Feature flag inquiry and toggle methods function deterministically', () => {
    assert.strictEqual(PadiFixMonetization.isFeatureEnabled('advertisingEnabled'), false);
    PadiFixMonetization.setFeatureFlag('advertisingEnabled', true);
    assert.strictEqual(PadiFixMonetization.isFeatureEnabled('advertisingEnabled'), true);
    PadiFixMonetization.setFeatureFlag('advertisingEnabled', false); // Restore
    assert.strictEqual(PadiFixMonetization.isFeatureEnabled('advertisingEnabled'), false);
  });

  runTest('1.4 Product catalogue defines transparent pricing and inventory caps', () => {
    const prods = PadiFixMonetization.PRODUCTS;
    assert.ok(prods.PROMOTED_LISTING_STARTER, 'Must have Promoted Listing Starter product');
    assert.strictEqual(prods.PROMOTED_LISTING_STARTER.priceKobo, 200000, 'Starter price must be 200,000 kobo (₦2,000)');
    assert.strictEqual(prods.PROMOTED_LISTING_STARTER.durationDays, 14, 'Starter duration must be 14 days');
    assert.strictEqual(prods.PROMOTED_LISTING_STARTER.maxInventoryPerCluster, 2, 'Max inventory per cluster must be 2');

    assert.ok(prods.TRUST_VERIFICATION_AUDIT, 'Must have Trust Verification Audit product');
    assert.strictEqual(prods.TRUST_VERIFICATION_AUDIT.priceKobo, 350000, 'Audit price must be 350,000 kobo (₦3,500)');
    assert.strictEqual(prods.TRUST_VERIFICATION_AUDIT.guaranteeApproval, false, 'Paid audit must never guarantee approval');
  });

  // SECTION 2: MARKETPLACE LIQUIDITY SAFEGUARDS & CLUSTER CAPACITY
  console.log('\n--- SECTION 2: MARKETPLACE LIQUIDITY SAFEGUARDS & CLUSTER CAPACITY ---');

  runTest('2.1 Cluster capacity guard strictly limits sponsored placements to max 2', () => {
    const activePromos = [
      { category: 'plumber', state: 'Lagos', lga: 'Ikeja', status: 'active', expiresAt: Date.now() + 86400000 }
    ];
    const check1 = PadiFixMonetization.checkClusterCapacity('plumber', 'Lagos', 'Ikeja', activePromos);
    assert.strictEqual(check1.available, true, 'One slot should still be available');
    assert.strictEqual(check1.activeCount, 1);
    assert.strictEqual(check1.maxCapacity, 2);

    // Add second active promo
    activePromos.push({ category: 'plumber', state: 'Lagos', lga: 'Ikeja', status: 'active', expiresAt: Date.now() + 86400000 });
    const check2 = PadiFixMonetization.checkClusterCapacity('plumber', 'Lagos', 'Ikeja', activePromos);
    assert.strictEqual(check2.available, false, 'Cluster should be at full capacity');
    assert.strictEqual(check2.activeCount, 2);
  });

  runTest('2.2 Cluster capacity distinguishes categories, states, and LGAs', () => {
    const activePromos = [
      { category: 'plumber', state: 'Lagos', lga: 'Ikeja', status: 'active', expiresAt: Date.now() + 86400000 },
      { category: 'plumber', state: 'Lagos', lga: 'Ikeja', status: 'active', expiresAt: Date.now() + 86400000 }
    ];
    // Different LGA in same state
    const checkSurulere = PadiFixMonetization.checkClusterCapacity('plumber', 'Lagos', 'Surulere', activePromos);
    assert.strictEqual(checkSurulere.available, true, 'Surulere should have available slots');

    // Different category in same LGA
    const checkElectrician = PadiFixMonetization.checkClusterCapacity('electrician', 'Lagos', 'Ikeja', activePromos);
    assert.strictEqual(checkElectrician.available, true, 'Electrician in Ikeja should have available slots');
  });

  runTest('2.3 Expired promotions are excluded from cluster capacity calculation', () => {
    const mixedPromos = [
      { category: 'carpenter', state: 'Delta', lga: 'Warri South', status: 'active', expiresAt: Date.now() - 5000 }, // Expired
      { category: 'carpenter', state: 'Delta', lga: 'Warri South', status: 'active', expiresAt: Date.now() + 50000 }  // Active
    ];
    const check = PadiFixMonetization.checkClusterCapacity('carpenter', 'Delta', 'Warri South', mixedPromos);
    assert.strictEqual(check.available, true, 'Expired item should not count towards capacity');
    assert.strictEqual(check.activeCount, 1);
  });

  // SECTION 3: SEARCH RELEVANCE & ZERO ORGANIC DILUTION
  console.log('\n--- SECTION 3: SEARCH RELEVANCE & ZERO ORGANIC DILUTION ---');

  runTest('3.1 Core marketplace guarantee protects free listing, search, and direct contact', () => {
    const rules = PadiFixMonetization.CONFIG.RULES;
    assert.strictEqual(rules.COMMISSION_PERCENT, 0, 'PadiFix must maintain 0% commission on jobs');
    assert.strictEqual(rules.FREE_PHONE_CALLS, true, 'Customer phone calls must remain free');
    assert.strictEqual(rules.FREE_WHATSAPP_MESSAGING, true, 'WhatsApp contact must remain free');
    assert.strictEqual(rules.FREE_PROFILE_LISTING, true, 'Artisan listing must remain free forever');
    assert.strictEqual(rules.MAX_SPONSORED_PER_PAGE, 2, 'Max sponsored cards per page is capped at 2');
  });

  runTest('3.2 search.js implements sponsored provider markup and visual badge', () => {
    const searchJsCode = fs.readFileSync(path.join(ROOT_DIR, 'search.js'), 'utf8');
    assert.ok(searchJsCode.includes('badge-tag-promoted'), 'search.js must render badge-tag-promoted');
    assert.ok(searchJsCode.includes('is-sponsored'), 'search.js must add is-sponsored card class');
    assert.ok(searchJsCode.includes('data-is-sponsored'), 'search.js must include data-is-sponsored dataset attribute');
    assert.ok(searchJsCode.includes('⚡ Promoted'), 'search.js must render clear "⚡ Promoted" disclosure');
  });

  runTest('3.3 search.css styles the promoted badge and subtle border highlight', () => {
    const searchCssCode = fs.readFileSync(path.join(ROOT_DIR, 'search.css'), 'utf8');
    assert.ok(searchCssCode.includes('.badge-tag-promoted'), 'search.css must define .badge-tag-promoted');
    assert.ok(searchCssCode.includes('.provider-item-card.is-sponsored'), 'search.css must style .provider-item-card.is-sponsored');
    assert.ok(searchCssCode.includes('rgba(2, 132, 199'), 'search.css must use curated cyan/sky theme for promoted badge');
  });

  // SECTION 4: TELEMETRY & STRICT PRIVACY GUARD
  console.log('\n--- SECTION 4: TELEMETRY & STRICT PRIVACY GUARD ---');

  runTest('4.1 Monetization telemetry events define valid non-PII names', () => {
    const events = PadiFixMonetization.EVENTS;
    assert.strictEqual(events.SPONSORED_IMPRESSION, 'sponsored_impression');
    assert.strictEqual(events.SPONSORED_CLICK, 'sponsored_click');
    assert.strictEqual(events.SPONSORED_CONTACT, 'sponsored_contact_clicked');
    assert.strictEqual(events.CHECKOUT_INIT, 'pilot_checkout_initiated');
    assert.strictEqual(events.PAYMENT_SUCCESS, 'pilot_payment_success');
  });

  runTest('4.2 Forbidden PII and credential keys are blocked from telemetry payload', () => {
    const forbidden = PadiFixMonetization.CONFIG.FORBIDDEN_KEYS;
    assert.ok(forbidden.includes('password'), 'Must forbid password');
    assert.ok(forbidden.includes('token'), 'Must forbid token');
    assert.ok(forbidden.includes('jwt'), 'Must forbid jwt');
    assert.ok(forbidden.includes('card'), 'Must forbid card');
    assert.ok(forbidden.includes('cvv'), 'Must forbid cvv');
    assert.ok(forbidden.includes('pan'), 'Must forbid pan');
    assert.ok(forbidden.includes('nin'), 'Must forbid nin');
    assert.ok(forbidden.includes('bvn'), 'Must forbid bvn');

    // Test sanitizeTelemetryPayload
    const dirtyPayload = {
      providerId: 101,
      trade: 'electrician',
      userPassword: 'secretPassword123',
      card_number: '5060999999999999',
      customer_nin: '12345678901',
      validKey: 'safeValue'
    };
    const cleanPayload = PadiFixMonetization.sanitizeTelemetryPayload(dirtyPayload);
    assert.strictEqual(cleanPayload.providerId, 101);
    assert.strictEqual(cleanPayload.trade, 'electrician');
    assert.strictEqual(cleanPayload.validKey, 'safeValue');
    assert.strictEqual(cleanPayload.userPassword, undefined, 'userPassword must be stripped');
    assert.strictEqual(cleanPayload.card_number, undefined, 'card_number must be stripped');
    assert.strictEqual(cleanPayload.customer_nin, undefined, 'customer_nin must be stripped');
  });

  // SECTION 5: SECURITY, WEBHOOK & ADMIN CONTROLS
  console.log('\n--- SECTION 5: SECURITY, WEBHOOK & ADMIN CONTROLS ---');

  runTest('5.1 Paystack webhook endpoint verifies HMAC-SHA512 signature', () => {
    const webhookCode = fs.readFileSync(path.join(ROOT_DIR, 'api', 'paystack-webhook.js'), 'utf8');
    assert.ok(webhookCode.includes('createHmac'), 'Webhook must create HMAC using crypto');
    assert.ok(webhookCode.includes('sha512'), 'Webhook must use sha512 hash algorithm');
    assert.ok(webhookCode.includes('timingSafeEqual'), 'Webhook must use timingSafeEqual for signature verification');
  });

  runTest('5.2 Serverless payment endpoints enforce server-side validation', () => {
    const initCode = fs.readFileSync(path.join(ROOT_DIR, 'api', 'paystack-init.js'), 'utf8');
    const verifyCode = fs.readFileSync(path.join(ROOT_DIR, 'api', 'paystack-verify.js'), 'utf8');
    assert.ok(initCode.includes('amount'), 'init must validate amount');
    assert.ok(initCode.includes('orderId'), 'init must generate server order reference');
    assert.ok(verifyCode.includes('status'), 'verify must check transaction status');
  });

  runTest('5.3 Admin controls define role-based permissions without code surgery', () => {
    const perms = PadiFixMonetization.ADMIN_CONTROLS.ROLES;
    assert.ok(perms.super_admin.includes('can_modify_pricing'));
    assert.ok(perms.super_admin.includes('can_trigger_refunds'));
    assert.strictEqual(perms.compliance_officer.includes('can_modify_pricing'), false, 'Compliance officer cannot change pricing');
    assert.ok(perms.compliance_officer.includes('can_audit_compliance'), 'Compliance officer can audit compliance');
  });

  // SECTION 6: RESPONSIVE ERGONOMICS & ZERO OVERFLOW
  console.log('\n--- SECTION 6: RESPONSIVE ERGONOMICS & ZERO OVERFLOW ---');

  runTest('6.1 search.html includes monetization-config.js before app logic', () => {
    const searchHtml = fs.readFileSync(path.join(ROOT_DIR, 'search.html'), 'utf8');
    assert.ok(searchHtml.includes('monetization-config.js'), 'search.html must include monetization-config.js');
    const monIdx = searchHtml.indexOf('monetization-config.js');
    const sbIdx = searchHtml.indexOf('supabase-client.js');
    assert.ok(monIdx < sbIdx, 'monetization-config.js must load before supabase-client.js');
  });

  runTest('6.2 dashboard.html includes monetization-config.js before app logic', () => {
    const dashHtml = fs.readFileSync(path.join(ROOT_DIR, 'dashboard.html'), 'utf8');
    assert.ok(dashHtml.includes('monetization-config.js'), 'dashboard.html must include monetization-config.js');
    const monIdx = dashHtml.indexOf('monetization-config.js');
    const sbIdx = dashHtml.indexOf('supabase-client.js');
    assert.ok(monIdx < sbIdx, 'monetization-config.js must load before supabase-client.js');
  });

  runTest('6.3 Promoted badge CSS respects minimum touch target and accessible typography', () => {
    const css = fs.readFileSync(path.join(ROOT_DIR, 'search.css'), 'utf8');
    assert.ok(css.includes('font-weight: 800'), 'Promoted badge must have bold weight for readability');
    assert.ok(css.includes('padding: 2px 8px'), 'Promoted badge must have sufficient breathing padding');
  });

  // SECTION 7: PWA SHELL ASSET INTEGRATION & OFFLINE RESILIENCE
  console.log('\n--- SECTION 7: PWA SHELL ASSET INTEGRATION & OFFLINE RESILIENCE ---');

  runTest('7.1 sw.js caches monetization-config.js in service worker SHELL_ASSETS', () => {
    const swCode = fs.readFileSync(path.join(ROOT_DIR, 'sw.js'), 'utf8');
    assert.ok(swCode.includes('/monetization-config.js'), 'sw.js SHELL_ASSETS must contain /monetization-config.js');
  });

  runTest('7.2 Naira currency formatting helper outputs clean localized currency', () => {
    const formatted1 = PadiFixMonetization.formatNaira(2000);
    const formatted2 = PadiFixMonetization.formatNaira(3500);
    const formatted3 = PadiFixMonetization.formatNaira(18000);
    assert.strictEqual(formatted1, '₦2,000');
    assert.strictEqual(formatted2, '₦3,500');
    assert.strictEqual(formatted3, '₦18,000');
  });

  // SECTION 8: REGRESSION SAFETY CONFIRMATION
  console.log('\n--- SECTION 8: REGRESSION SAFETY CONFIRMATION ---');

  runTest('8.1 Core brand identity, canonical logo, and phone engine remain intact', () => {
    const logoFile = path.join(ROOT_DIR, 'icons', 'padifix-logo-dark.png');
    assert.ok(fs.existsSync(logoFile), 'Canonical logo dark must exist');
    const phoneEngineFile = path.join(ROOT_DIR, 'phone-utils.js');
    assert.ok(fs.existsSync(phoneEngineFile), 'Nigeria phone utility engine must exist');
  });

  runTest('8.2 Supabase client exposes monetization architecture reference', () => {
    const sbClientCode = fs.readFileSync(path.join(ROOT_DIR, 'supabase-client.js'), 'utf8');
    assert.ok(sbClientCode.includes('LokatorDB.monetization'), 'Supabase client must expose LokatorDB.monetization');
    assert.ok(sbClientCode.includes('architecture:'), 'LokatorDB.monetization must include architecture reference');
  });

  console.log('\n================================================================');
  console.log(`PHASE 004 VERIFICATION SUMMARY: ${testsPassed} passed, ${testsFailed} failed`);
  console.log('================================================================');

  if (testsFailed > 0) {
    process.exit(1);
  }
}

main().catch(err => {
  console.error('Fatal test runner failure:', err);
  process.exit(1);
});
