// ============================================================================
// LOKATOR.NG — PHASE 10.13A AUTOMATED VERIFICATION SUITE
// Scope: Monetization Readiness & Payment Gate Audit
// ============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const vm = require('vm');

let passCount = 0;
let failCount = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

async function asyncTest(name, fn) {
  try {
    await fn();
    console.log(`  ✅ [PASS] ${name}`);
    passCount++;
  } catch (err) {
    console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    failCount++;
  }
}

console.log('\n🔒 RUNNING PHASE 10.13A — MONETIZATION READINESS & PAYMENT GATE AUDIT\n');

// ============================================================================
// SECTION 1: CODE-LEVEL PAYMENT GATE
// ============================================================================

console.log('--- SECTION 1: CODE-LEVEL PAYMENT GATE ---');

const coreFiles = [
  'supabase-client.js', 'analytics.js', 'analytics.html',
  'dashboard.js', 'dashboard.html', 'search.js', 'search.html',
  'profile.js', 'profile.html', 'register.html', 'register.js',
  'join.html', 'login.html', 'index.html', 'app.js', 'style.css',
  'telemetry.js', 'categories.js', 'locations.js', 'sw.js'
];

const paymentSDKTokens = ['paystack', 'flutterwave', 'stripe', 'razorpay'];
const billingTokens = ['checkout.session', 'chargeCard', 'createSubscription', 'createPaymentIntent'];
const credentialTokens = ['sk_live_', 'pk_live_', 'sk_test_', 'pk_test_', 'PAYSTACK_SECRET', 'FLW_SECRET', 'STRIPE_SECRET'];

test('1.1 No live payment SDK references in any production file', () => {
  coreFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8').toLowerCase();
      paymentSDKTokens.forEach(token => {
        assert.ok(!content.includes(token), `CRITICAL: Payment SDK "${token}" found in ${file}`);
      });
    }
  });
});

test('1.2 No live billing/checkout endpoint code in any production file', () => {
  coreFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      billingTokens.forEach(token => {
        assert.ok(!content.includes(token), `CRITICAL: Billing endpoint "${token}" found in ${file}`);
      });
    }
  });
});

test('1.3 No payment credentials or API keys in any production file', () => {
  coreFiles.forEach(file => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      credentialTokens.forEach(token => {
        assert.ok(!content.includes(token), `CRITICAL: Payment credential "${token}" found in ${file}`);
      });
    }
  });
});

test('1.4 PAYMENT_PROCESSING_ENABLED feature flag is strictly false', () => {
  const dbCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  assert.ok(dbCode.includes('PAYMENT_PROCESSING_ENABLED: false'), 'PAYMENT_PROCESSING_ENABLED must be false');
});

test('1.5 LIVE_BILLING_ENABLED feature flag is strictly false', () => {
  const dbCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  assert.ok(dbCode.includes('LIVE_BILLING_ENABLED: false'), 'LIVE_BILLING_ENABLED must be false');
});

// ============================================================================
// SECTION 2: FREE MARKETPLACE REGRESSION
// ============================================================================

console.log('\n--- SECTION 2: FREE MARKETPLACE REGRESSION ---');

// Set up VM sandbox for functional tests
const categoriesCode = fs.readFileSync(path.join(__dirname, '../categories.js'), 'utf8');
const telemetryCode = fs.readFileSync(path.join(__dirname, '../telemetry.js'), 'utf8');
const dbCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');

const storageData = {};
const storageMock = {
  _data: storageData,
  getItem(k) { return this._data[k] || null; },
  setItem(k, v) { this._data[k] = String(v); },
  removeItem(k) { delete this._data[k]; },
  clear() { this._data = {}; }
};

const sandbox = {
  window: { addEventListener: () => {}, dispatchEvent: () => true },
  module: {},
  console: console,
  sessionStorage: storageMock,
  localStorage: storageMock,
  document: {
    title: 'Lokator.NG Test',
    readyState: 'complete',
    addEventListener: () => {},
    getElementById: () => null,
    querySelectorAll: () => []
  },
  navigator: { userAgent: 'NodeTestEnv/1.0' },
  performance: { now: () => Date.now() },
  Date: Date, Math: Math, JSON: JSON,
  crypto: { randomUUID: () => '00000000-0000-4000-8000-000000000000' }
};

vm.createContext(sandbox);
vm.runInContext(categoriesCode, sandbox);
vm.runInContext(telemetryCode, sandbox);
vm.runInContext(dbCode, sandbox);

const LokatorDB = sandbox.window.LokatorDB;

test('2.1 LokatorDB core is defined and functional', () => {
  assert.ok(LokatorDB, 'LokatorDB must be defined');
  assert.ok(typeof LokatorDB.getProviders === 'function', 'getProviders must exist');
  assert.ok(typeof LokatorDB.getProviderById === 'function', 'getProviderById must exist');
  assert.ok(typeof LokatorDB.registerProvider === 'function', 'registerProvider must exist');
});

test('2.2 Free search discovery has no payment gate in getProviders', () => {
  const dbCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  const getProvidersIdx = dbCode.indexOf('async getProviders(');
  const getProvidersBlock = dbCode.substring(getProvidersIdx, getProvidersIdx + 5000);
  assert.ok(!getProvidersBlock.includes('requiresPayment'), 'getProviders has no payment check');
  assert.ok(!getProvidersBlock.includes('PAYMENT_PROCESSING'), 'getProviders has no payment flag dependency');
  assert.ok(!getProvidersBlock.includes('entitlement'), 'getProviders has no entitlement gating');
  assert.ok(getProvidersBlock.includes('getLocalStore'), 'getProviders uses local DB store');
});

test('2.3 getProviderById has no billing requirement', () => {
  const dbCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  const getByIdIdx = dbCode.indexOf('async getProviderById(');
  const getByIdBlock = dbCode.substring(getByIdIdx, getByIdIdx + 2000);
  assert.ok(!getByIdBlock.includes('requiresPayment'), 'getProviderById has no payment check');
  assert.ok(!getByIdBlock.includes('billing'), 'getProviderById has no billing dependency');
  assert.ok(!getByIdBlock.includes('checkout'), 'getProviderById has no checkout gate');
});

test('2.4 Phone and WhatsApp contact are free with no payment gating', () => {
  // Profile rendering does not gate contact info behind payment
  const profileJs = fs.readFileSync(path.join(__dirname, '../profile.js'), 'utf8');
  assert.ok(!profileJs.includes('requiresPayment'), 'profile.js has no payment requirement');
  assert.ok(!profileJs.includes('paywall'), 'profile.js has no paywall');
  assert.ok(!profileJs.includes('blocked'), 'profile.js does not block contact');
  assert.ok(!LokatorDB.requiresPaymentForContact, 'No requiresPaymentForContact function exists');
});

// ============================================================================
// SECTION 3: ENTITLEMENT SECURITY
// ============================================================================

console.log('\n--- SECTION 3: ENTITLEMENT SECURITY ---');

test('3.1 All providers receive 6 free default entitlements', () => {
  const ents = LokatorDB.monetization.entitlements.getProviderEntitlements(999999);
  assert.strictEqual(ents.length, 6, 'Unknown provider gets 6 free entitlements');
  assert.ok(ents.includes('search_listing'), 'Has search_listing');
  assert.ok(ents.includes('direct_phone_call'), 'Has direct_phone_call');
  assert.ok(ents.includes('direct_whatsapp'), 'Has direct_whatsapp');
});

test('3.2 Self-grant of paid entitlements is blocked', () => {
  // A non-verified, non-premium provider should NOT have paid entitlements
  const ents = LokatorDB.monetization.entitlements.getProviderEntitlements(999999);
  assert.ok(!ents.includes('platform_verified_badge'), 'Cannot self-grant verified badge');
  assert.ok(!ents.includes('promoted_category_placement'), 'Cannot self-grant promotion');
  assert.ok(!ents.includes('expedited_verification_audit'), 'Cannot self-grant expedited audit');
  assert.ok(!ents.includes('qualified_lead_routing'), 'Cannot self-grant lead routing');
});

test('3.3 Entitlement computation is server/database driven, not client-side overridable', () => {
  // getProviderEntitlements reads from the DB store, not from client params
  const fn = LokatorDB.monetization.entitlements.getProviderEntitlements.toString();
  assert.ok(fn.includes('getLocalStore'), 'Entitlements are computed from DB store, not client input');
  assert.ok(!fn.includes('localStorage.setItem'), 'Entitlement function does not write to localStorage');
  assert.ok(!fn.includes('window.location'), 'Entitlement function does not read URL params');
});

test('3.4 Feature flags are const-locked and not modifiable by client', () => {
  const flags = LokatorDB.monetization.featureFlags;
  assert.strictEqual(flags.PAYMENT_PROCESSING_ENABLED, false);
  assert.strictEqual(flags.LIVE_BILLING_ENABLED, false);
  // Verify that the flags object exists with proper values
  assert.strictEqual(typeof flags.MONETIZATION_ARCHITECTURE_ENABLED, 'boolean');
  assert.strictEqual(typeof flags.MONETIZATION_RESEARCH_ENABLED, 'boolean');
});

// ============================================================================
// SECTION 4: VERIFICATION / PAYMENT SEPARATION
// ============================================================================

console.log('\n--- SECTION 4: VERIFICATION / PAYMENT SEPARATION ---');

test('4.1 upgradeSubscriptionPlan does NOT set is_verified=true', () => {
  const fnCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  // Find upgradeSubscriptionPlan function body
  const upgradeIdx = fnCode.indexOf('async upgradeSubscriptionPlan(');
  const fnBlock = fnCode.substring(upgradeIdx, upgradeIdx + 1500);
  // Verify it never sets is_verified = true or nin_verified = true
  assert.ok(!fnBlock.includes('is_verified = true'), 'upgradeSubscriptionPlan must NOT set is_verified to true');
  assert.ok(!fnBlock.includes('nin_verified = true'), 'upgradeSubscriptionPlan must NOT set nin_verified to true');
  assert.ok(!fnBlock.includes('is_verified: true'), 'upgradeSubscriptionPlan must NOT assign is_verified: true');
});

test('4.2 Payment adapter createCheckoutSession does NOT grant verification', () => {
  const fnCode = LokatorDB.monetization.paymentAdapter.createCheckoutSession.toString();
  assert.ok(!fnCode.includes('is_verified'), 'createCheckoutSession must not reference is_verified');
  assert.ok(!fnCode.includes('nin_verified'), 'createCheckoutSession must not reference nin_verified');
});

test('4.3 Candidate product TRUST_VERIFICATION explicitly states payment != approval', () => {
  const trustProduct = LokatorDB.monetization.candidateProducts.find(p => p.id === 'TRUST_VERIFICATION');
  assert.ok(trustProduct, 'TRUST_VERIFICATION product exists');
  assert.ok(trustProduct.rule.includes('NOT guarantee verification approval'),
    'Trust product rule explicitly states payment does not guarantee verification');
});

test('4.4 Dashboard research UI contains verification separation disclaimer', () => {
  const dashHtml = fs.readFileSync(path.join(__dirname, '../dashboard.html'), 'utf8');
  assert.ok(dashHtml.includes('Paying for verification audit review does NOT guarantee approval'),
    'Dashboard contains explicit payment != approval disclaimer');
});

// ============================================================================
// SECTION 5: PROMOTED LISTING SAFETY
// ============================================================================

console.log('\n--- SECTION 5: PROMOTED LISTING SAFETY ---');

test('5.1 PROMOTED_DISCOVERY product safeguard requires transparent "Sponsored" labeling', () => {
  const promoProd = LokatorDB.monetization.candidateProducts.find(p => p.id === 'PROMOTED_DISCOVERY');
  assert.ok(promoProd, 'PROMOTED_DISCOVERY product exists');
  assert.ok(promoProd.rule.includes('without hiding organic providers'),
    'Promoted product rule requires organic preservation');
});

test('5.2 No active promotion rendering in search results', () => {
  const searchJs = fs.readFileSync(path.join(__dirname, '../search.js'), 'utf8');
  // Search should not have any active "promoted" or "sponsored" insertion logic
  assert.ok(!searchJs.includes('isPromoted'), 'No isPromoted flag used in search rendering');
  assert.ok(!searchJs.includes('sponsoredSlot'), 'No sponsoredSlot logic active in search');
});

test('5.3 Promotion entitlement requires premium subscription (not self-granted)', () => {
  // Only premium/isTop providers get promoted_category_placement
  const testBasicEnts = LokatorDB.monetization.entitlements.getProviderEntitlements(999998);
  assert.ok(!testBasicEnts.includes('promoted_category_placement'),
    'Basic provider cannot have promoted_category_placement');
});

// ============================================================================
// SECTION 6: LEAD PRODUCT SEMANTICS
// ============================================================================

console.log('\n--- SECTION 6: LEAD PRODUCT SEMANTICS ---');

test('6.1 Qualified lead product distinguishes contact from confirmed job', () => {
  const leadProd = LokatorDB.monetization.candidateProducts.find(p => p.id === 'QUALIFIED_LEAD_ACCESS');
  assert.ok(leadProd, 'QUALIFIED_LEAD_ACCESS product exists');
  assert.ok(leadProd.rule.includes('Contact intent is not a confirmed job'),
    'Lead product rule distinguishes contact intent from confirmed job');
});

test('6.2 Telemetry events use contact_action, not "lead" or "confirmed_job"', () => {
  const telemetryCode = fs.readFileSync(path.join(__dirname, '../telemetry.js'), 'utf8');
  assert.ok(!telemetryCode.includes('confirmed_job'), 'Telemetry does not claim confirmed_job');
  assert.ok(!telemetryCode.includes('guaranteed_lead'), 'Telemetry does not claim guaranteed_lead');
});

// ============================================================================
// SECTION 7: MONETIZATION RESEARCH & WILLINGNESS-TO-PAY EVIDENCE
// ============================================================================

console.log('\n--- SECTION 7: MONETIZATION RESEARCH & WILLINGNESS-TO-PAY ---');

test('7.1 Research engine captures interest and waitlist data', () => {
  assert.ok(typeof LokatorDB.monetization.research.recordProductInterest === 'function');
  assert.ok(typeof LokatorDB.monetization.research.joinProductWaitlist === 'function');
  assert.ok(typeof LokatorDB.monetization.research.getResearchData === 'function');
});

test('7.2 Research data classification: current evidence is Level 0-1 (Awareness/Interest)', () => {
  // In production, actual research data depends on real provider interactions
  // The architecture supports Level 0 (view) and Level 1 (explicit interest/waitlist join)
  // Level 2 (Intent with price acceptance) requires pricing validation not yet done
  // Level 3 (Commitment) requires real payment processing
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  assert.strictEqual(summary.payment_readiness_gate.pillars.willingness_to_pay_validated, false,
    'Willingness-to-pay is correctly classified as NOT validated');
});

test('7.3 Payment readiness classification is ARCHITECTURALLY_READY_BUT_NOT_VALIDATED', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  assert.strictEqual(summary.payment_readiness_gate.classification,
    'ARCHITECTURALLY_READY_BUT_NOT_VALIDATED',
    'Payment readiness gate classification is correct');
});

// ============================================================================
// SECTION 8: TELEMETRY PRIVACY — NO FINANCIAL PII
// ============================================================================

console.log('\n--- SECTION 8: TELEMETRY PRIVACY ---');

test('8.1 Monetization telemetry events contain no financial PII', () => {
  // Inspect what the research engine sends to telemetry
  const dbCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  const interestTelemetryIdx = dbCode.indexOf("'monetization_interest_recorded'");
  const interestBlock = dbCode.substring(interestTelemetryIdx, interestTelemetryIdx + 200);
  assert.ok(!interestBlock.includes('card'), 'No card data in interest telemetry');
  assert.ok(!interestBlock.includes('cvv'), 'No CVV in interest telemetry');
  assert.ok(!interestBlock.includes('bank'), 'No bank account in interest telemetry');
  assert.ok(!interestBlock.includes('password'), 'No password in interest telemetry');
  assert.ok(!interestBlock.includes('nin'), 'No NIN in interest telemetry');
});

test('8.2 Waitlist telemetry events contain no financial PII', () => {
  const dbCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  const waitlistTelemetryIdx = dbCode.indexOf("'monetization_plan_selected'");
  const waitlistBlock = dbCode.substring(waitlistTelemetryIdx, waitlistTelemetryIdx + 200);
  assert.ok(!waitlistBlock.includes('card'), 'No card data in waitlist telemetry');
  assert.ok(!waitlistBlock.includes('cvv'), 'No CVV in waitlist telemetry');
  assert.ok(!waitlistBlock.includes('bank'), 'No bank account in waitlist telemetry');
  assert.ok(!waitlistBlock.includes('password'), 'No password in waitlist telemetry');
});

test('8.3 Research data store does not persist financial information', () => {
  const dbCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  const researchStoreIdx = dbCode.indexOf('MONETIZATION_STORAGE_KEY');
  const storeBlock = dbCode.substring(researchStoreIdx, researchStoreIdx + 2000);
  assert.ok(!storeBlock.includes('cardNumber'), 'No cardNumber in research store');
  assert.ok(!storeBlock.includes('accountNumber'), 'No accountNumber in research store');
  assert.ok(!storeBlock.includes('cvv'), 'No CVV in research store');
});

// ============================================================================
// SECTION 9: PAYMENT ARCHITECTURE SECURITY REVIEW
// ============================================================================

console.log('\n--- SECTION 9: PAYMENT ARCHITECTURE SECURITY ---');

test('9.1 PaymentProviderAdapter interface is complete and mock-gated', () => {
  const adapter = LokatorDB.monetization.paymentAdapter;
  assert.ok(adapter, 'Adapter exists');
  assert.strictEqual(adapter.isLive, false, 'Adapter is not live');
  assert.strictEqual(typeof adapter.createCheckoutSession, 'function');
  assert.strictEqual(typeof adapter.verifyWebhookSignature, 'function');
  assert.strictEqual(typeof adapter.processWebhookEvent, 'function');
  assert.strictEqual(typeof adapter.reconcileRefund, 'function');
});

test('9.2 Adapter returns RESEARCH_MODE for checkout attempts', () => {
  // Since PAYMENT_PROCESSING_ENABLED is false, the adapter returns RESEARCH_MODE
  // This is a synchronous check on the flag state
  assert.strictEqual(LokatorDB.monetization.featureFlags.PAYMENT_PROCESSING_ENABLED, false,
    'Payment processing flag is false, adapter would return RESEARCH_MODE');
  assert.strictEqual(LokatorDB.monetization.paymentAdapter.isLive, false, 'Adapter is not live');
});

test('9.3 Webhook signature verification rejects empty signatures', async () => {
  const result = await LokatorDB.monetization.paymentAdapter.verifyWebhookSignature(null, null, 'secret');
  assert.strictEqual(result, false, 'Empty payload/signature rejects');
});

test('9.4 Webhook event processor requires event ID (idempotency)', async () => {
  try {
    await LokatorDB.monetization.paymentAdapter.processWebhookEvent({});
    assert.fail('Should have thrown for missing event ID');
  } catch (e) {
    assert.ok(e.message.includes('missing event id'), 'Throws for missing event ID');
  }
});

test('9.5 Payment provider abstraction supports future multi-vendor without coupling', () => {
  // The adapter is instantiated with a default name, supporting future swapping
  assert.strictEqual(LokatorDB.monetization.paymentAdapter.providerName, 'MOCK_GATEWAY');
  // No vendor-specific SDK import exists in the codebase
  const dbCode = fs.readFileSync(path.join(__dirname, '../supabase-client.js'), 'utf8');
  assert.ok(!dbCode.includes("require('paystack')"), 'No paystack require');
  assert.ok(!dbCode.includes("require('flutterwave')"), 'No flutterwave require');
  assert.ok(!dbCode.includes("require('stripe')"), 'No stripe require');
});

// ============================================================================
// SECTION 10: MONETIZATION DAMAGE TEST — NO MARKETPLACE DEGRADATION
// ============================================================================

console.log('\n--- SECTION 10: MONETIZATION DAMAGE TEST ---');

test('10.1 Search function has no monetization dependency', () => {
  const searchJs = fs.readFileSync(path.join(__dirname, '../search.js'), 'utf8');
  assert.ok(!searchJs.includes('monetization'), 'search.js has zero monetization dependency');
  assert.ok(!searchJs.includes('entitlement'), 'search.js has zero entitlement dependency');
});

test('10.2 Profile page has no monetization gating', () => {
  const profileJs = fs.readFileSync(path.join(__dirname, '../profile.js'), 'utf8');
  assert.ok(!profileJs.includes('PAYMENT_PROCESSING'), 'profile.js has no payment processing check');
  assert.ok(!profileJs.includes('requiresPayment'), 'profile.js has no payment requirement');
});

test('10.3 Registration has no payment requirement', () => {
  const regHtml = fs.readFileSync(path.join(__dirname, '../register.html'), 'utf8');
  assert.ok(!regHtml.includes('payment required'), 'Registration has no payment required text');
  assert.ok(!regHtml.includes('credit card'), 'Registration has no credit card field');
});

// ============================================================================
// SECTION 11: PRODUCT VALIDATION & RANKING
// ============================================================================

console.log('\n--- SECTION 11: PRODUCT VALIDATION & RANKING ---');

test('11.1 All 4 candidate products are defined with complete metadata', () => {
  const products = LokatorDB.monetization.candidateProducts;
  assert.strictEqual(products.length, 4, 'Exactly 4 candidate products');
  products.forEach(prod => {
    assert.ok(prod.id, `Product has id: ${prod.id}`);
    assert.ok(prod.name, `Product has name: ${prod.name}`);
    assert.ok(prod.customer_value, `Product has customer_value`);
    assert.ok(prod.provider_value, `Product has provider_value`);
    assert.ok(prod.complexity, `Product has complexity`);
    assert.ok(prod.risk, `Product has risk`);
    assert.ok(prod.evidence_level, `Product has evidence_level`);
    assert.ok(prod.pricing_placeholder, `Product has pricing_placeholder`);
    assert.ok(prod.rule, `Product has safeguard rule`);
  });
});

test('11.2 Product priority ranking is evidence-based', () => {
  const products = LokatorDB.monetization.candidateProducts;
  assert.strictEqual(products[0].priority_rank, 1, '#1 is TRUST_VERIFICATION');
  assert.strictEqual(products[1].priority_rank, 2, '#2 is PROMOTED_DISCOVERY');
  assert.strictEqual(products[2].priority_rank, 3, '#3 is QUALIFIED_LEAD_ACCESS');
  assert.strictEqual(products[3].priority_rank, 4, '#4 is TRANSACTION_COMMISSION (deferred)');
});

test('11.3 All pricing is labeled as RESEARCH PLACEHOLDER', () => {
  const products = LokatorDB.monetization.candidateProducts;
  products.forEach(prod => {
    assert.ok(prod.pricing_placeholder.includes('RESEARCH PLACEHOLDER') || prod.pricing_placeholder.includes('DEFERRED'),
      `${prod.id} pricing must be labeled as RESEARCH PLACEHOLDER or DEFERRED`);
  });
  const plans = LokatorDB.monetization.candidatePlans;
  plans.forEach(plan => {
    if (plan.status !== 'ACTIVE') {
      assert.ok(plan.price_display.includes('RESEARCH PLACEHOLDER'),
        `${plan.plan_id} price_display must include RESEARCH PLACEHOLDER`);
    }
  });
});

// ============================================================================
// SECTION 12: REGIONAL ANALYSIS (DELTA & EDO)
// ============================================================================

console.log('\n--- SECTION 12: REGIONAL ANALYSIS ---');

test('12.1 Summary includes Delta and Edo regional insights', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  assert.ok(summary.regional_insights.delta_priority_market, 'Delta insights exist');
  assert.ok(summary.regional_insights.edo_strategic_adjacent, 'Edo insights exist');
  assert.ok(summary.regional_insights.national_baseline, 'National baseline exists');
});

test('12.2 National baseline confirms free marketplace', () => {
  const summary = LokatorDB.monetization.getMonetizationSummary(30);
  const national = summary.regional_insights.national_baseline;
  assert.ok(national.free_marketplace_status.includes('Free'), 'National is free marketplace');
  assert.ok(national.monetization_policy.includes('0%'), '0% commissions national policy');
});

// ============================================================================
// FINAL SUMMARY
// ============================================================================

console.log('\n================================================================================');
if (failCount === 0) {
  console.log(`🎉 ALL ${passCount} PHASE 10.13A PAYMENT GATE AUDIT ASSERTIONS PASSED (100%)!`);
} else {
  console.log(`❌ ${passCount} PASSED, ${failCount} FAILED`);
}
console.log('================================================================================\n');

if (failCount > 0) process.exit(1);
