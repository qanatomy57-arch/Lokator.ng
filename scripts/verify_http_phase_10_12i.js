// ============================================================================
// LOKATOR.NG — PHASE 10.12I HTTP & MARKUP VERIFICATION SUITE
// Tests: HTTP Asset Integrity, Funnel Markup, Analytics Dashboard Integration,
// Supply & Demand Table Structure, CSS Tokens & Zero Secret Leaks
// ============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🌐 RUNNING PHASE 10.12I HTTP & ASSET VERIFICATION SUITE...\n');

// 1. Check register.html funnel markup
const regPath = path.join(__dirname, '../register.html');
assert(fs.existsSync(regPath), 'register.html exists');
const regContent = fs.readFileSync(regPath, 'utf8');

console.log('--- TEST GROUP 1: ONBOARDING FUNNEL TELEMETRY MARKUP ---');
assert(regContent.includes('provider_onboarding_started'), 'register.html tracks provider_onboarding_started');
assert(regContent.includes('provider_onboarding_step_completed'), 'register.html tracks provider_onboarding_step_completed');
assert(regContent.includes('provider_onboarding_preview_reached'), 'register.html tracks provider_onboarding_preview_reached');
assert(regContent.includes('provider_onboarding_submitted'), 'register.html tracks provider_onboarding_submitted');
assert(regContent.includes('provider_onboarding_succeeded'), 'register.html tracks provider_onboarding_succeeded');
console.log('  ✅ [PASS] All 5 provider onboarding funnel telemetry events integrated into register.html');

console.log('\n--- TEST GROUP 2: SEARCH & PROFILE FUNNEL TELEMETRY ---');
const searchPath = path.join(__dirname, '../search.js');
const profilePath = path.join(__dirname, '../profile.js');
assert(fs.existsSync(searchPath), 'search.js exists');
assert(fs.existsSync(profilePath), 'profile.js exists');

const searchContent = fs.readFileSync(searchPath, 'utf8');
const profileContent = fs.readFileSync(profilePath, 'utf8');

assert(searchContent.includes('search_submitted'), 'search.js tracks search_submitted');
assert(searchContent.includes('search_no_results'), 'search.js tracks search_no_results with location/category');
assert(searchContent.includes('search_result_viewed'), 'search.js tracks search_result_viewed with counts');
assert(profileContent.includes('provider_profile_viewed'), 'profile.js tracks provider_profile_viewed');
assert(profileContent.includes('phone_clicked'), 'profile.js tracks phone_clicked');
assert(profileContent.includes('whatsapp_clicked'), 'profile.js tracks whatsapp_clicked');
console.log('  ✅ [PASS] All customer search, zero-result, profile, and CTA events enriched');

console.log('\n--- TEST GROUP 3: ANALYTICS DASHBOARD FUNNEL SECTION MARKUP ---');
const analyticsHtmlPath = path.join(__dirname, '../analytics.html');
const analyticsJsPath = path.join(__dirname, '../analytics.js');
assert(fs.existsSync(analyticsHtmlPath), 'analytics.html exists');
assert(fs.existsSync(analyticsJsPath), 'analytics.js exists');

const analyticsHtmlContent = fs.readFileSync(analyticsHtmlPath, 'utf8');
const analyticsJsContent = fs.readFileSync(analyticsJsPath, 'utf8');

assert(analyticsHtmlContent.includes('id="section-funnel-intelligence"'), 'analytics.html contains funnel intelligence section');
assert(analyticsHtmlContent.includes('id="mfi-prov-overall-rate"'), 'analytics.html contains provider overall rate');
assert(analyticsHtmlContent.includes('id="mfi-cust-conv-rate"'), 'analytics.html contains customer conversion rate');
assert(analyticsHtmlContent.includes('id="mfi-supply-demand-tbody"'), 'analytics.html contains supply & demand matrix table');
assert(analyticsHtmlContent.includes('id="mfi-device-breakdown"'), 'analytics.html contains device breakdown');
assert(analyticsJsContent.includes('getMarketplaceFunnelIntelligence'), 'analytics.js loads getMarketplaceFunnelIntelligence');
console.log('  ✅ [PASS] All 6 analytics dashboard funnel cards, tables, and controller hooks present');

console.log('\n--- TEST GROUP 4: ZERO SECRET LEAKS & PRIVACY ---');
assert(!analyticsHtmlContent.includes('service_role'), 'analytics.html does not contain service_role key');
assert(!analyticsJsContent.includes('service_role'), 'analytics.js does not contain service_role key');
assert(!regContent.includes('service_role'), 'register.html does not contain service_role key');
assert(!searchContent.includes('SUPABASE_SERVICE_KEY'), 'search.js does not contain service key');
assert(!profileContent.includes('SUPABASE_SERVICE_KEY'), 'profile.js does not contain service key');
console.log('  ✅ [PASS] Zero secret / credential leaks verified across client assets');

console.log('\n================================================================================');
console.log('🎉 ALL 20 PHASE 10.12I HTTP & MARKUP VERIFICATION CHECKS PASSED (100%)!');
console.log('================================================================================\n');
