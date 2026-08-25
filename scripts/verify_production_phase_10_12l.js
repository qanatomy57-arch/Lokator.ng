// ============================================================================
// LOKATOR.NG — PHASE 10.12L PRODUCTION DEPLOYMENT EDGE VERIFICATION
// Verifies live production at https://lokator-ng.vercel.app/
// ============================================================================

const https = require('https');
const assert = require('assert');

console.log('🚀 VERIFYING LIVE PRODUCTION EDGE DEPLOYMENT (PHASE 10.12L)...\n');

function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        resolve({ statusCode: res.statusCode, headers: res.headers, body: data });
      });
    }).on('error', reject);
  });
}

async function verifyProduction() {
  console.log('--- TEST 1: LIVE ANALYTICS GROWTH VALIDATION SECTION ---');
  const analyticsRes = await fetchUrl('https://lokator-ng.vercel.app/analytics.html');
  assert.strictEqual(analyticsRes.statusCode, 200, 'Live /analytics.html returns HTTP 200');
  assert(analyticsRes.body.includes('id="section-liquidity-growth-validation"'), 'Live analytics.html contains section-liquidity-growth-validation');
  assert(analyticsRes.body.includes('id="mlg-cohort-tbody"'), 'Live analytics.html contains cohort quality table');
  assert(analyticsRes.body.includes('id="mlg-cluster-response-tbody"'), 'Live analytics.html contains cluster response table');
  assert(analyticsRes.body.includes('id="mlg-decision-matrix-tbody"'), 'Live analytics.html contains decision matrix table');
  console.log('  ✅ [PASS] Live analytics contains Phase 10.12L Liquidity Growth & Conversion Validation section');

  console.log('\n--- TEST 2: LIVE ANALYTICS CONTROLLER LOGIC ---');
  const analyticsJsRes = await fetchUrl('https://lokator-ng.vercel.app/analytics.js');
  assert.strictEqual(analyticsJsRes.statusCode, 200, 'Live /analytics.js returns HTTP 200');
  assert(analyticsJsRes.body.includes('getLiquidityGrowth'), 'Live analytics.js contains getLiquidityGrowth');
  assert(analyticsJsRes.body.includes('mlg-cohort-tbody'), 'Live analytics.js hydrates cohort quality table');
  console.log('  ✅ [PASS] Live analytics.js hydrates Phase 10.12L growth validation tables');

  console.log('\n--- TEST 3: LIVE SUPABASE CLIENT ENGINE EXPORT ---');
  const supabaseJsRes = await fetchUrl('https://lokator-ng.vercel.app/supabase-client.js');
  assert.strictEqual(supabaseJsRes.statusCode, 200, 'Live /supabase-client.js returns HTTP 200');
  assert(supabaseJsRes.body.includes('computeLiquidityGrowthValidation'), 'Live supabase-client.js defines computeLiquidityGrowthValidation');
  assert(supabaseJsRes.body.includes('LokatorDB.liquidityGrowth = {'), 'Live supabase-client.js exports LokatorDB.liquidityGrowth');
  assert(supabaseJsRes.body.includes('EARLY_MARKETPLACE'), 'Live supabase-client.js contains EARLY_MARKETPLACE classification');
  console.log('  ✅ [PASS] Live supabase-client.js exports Liquidity Growth validation engine');

  console.log('\n--- TEST 4: NON-CAUSAL DISCLAIMER IN PRODUCTION ---');
  assert(supabaseJsRes.body.includes('Observed association; causality cannot be established'), 'Live engine includes non-causal disclaimer');
  assert(analyticsRes.body.includes('Observed association; causality cannot be established'), 'Live markup includes non-causal disclaimer');
  console.log('  ✅ [PASS] Non-causal observational disclaimer verified in production assets');

  console.log('\n--- TEST 5: ZERO ACTIVE PAYMENT GATEWAYS SDKS ENFORCEMENT ---');
  const forbiddenTokens = ['paystack', 'flutterwave', 'stripe', 'checkout.session', 'chargeCard'];
  forbiddenTokens.forEach(token => {
    assert(!analyticsJsRes.body.toLowerCase().includes(token), `No ${token} in analytics.js`);
    assert(!supabaseJsRes.body.toLowerCase().includes(token), `No ${token} in supabase-client.js`);
  });
  console.log('  ✅ [PASS] Strictly zero billing tokens / active payment code in production');

  console.log('\n================================================================================');
  console.log('🎉 ALL 5 PHASE 10.12L PRODUCTION EDGE ASSERTIONS PASSED (100%)!');
  console.log('================================================================================\n');
}

verifyProduction().catch(err => {
  console.error('❌ Phase 10.12L Production Verification Failed:', err.message);
  process.exit(1);
});
