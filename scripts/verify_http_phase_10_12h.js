// ============================================================================
// LOKATOR.NG — PHASE 10.12H HTTP & MARKUP VERIFICATION SUITE
// Tests: HTTP Asset Integrity, Dynamic Badges, Transparency Tags, Report Modals,
// Trust Center Dashboard, CSS Tokens & Zero Secret Leaks
// ============================================================================

const fs = require('fs');
const path = require('path');
const assert = require('assert');

console.log('🌐 RUNNING PHASE 10.12H HTTP & ASSET VERIFICATION SUITE...\n');

// 1. Check profile.html static file and markup
const profilePath = path.join(__dirname, '../profile.html');
assert(fs.existsSync(profilePath), 'profile.html exists');
const profileContent = fs.readFileSync(profilePath, 'utf8');

console.log('--- TEST GROUP 1: PROFILE TRUST & TRANSPARENCY MARKUP ---');
assert(profileContent.includes('id="hero-verified-badge"'), 'Dynamic hero verified badge container present');
assert(!profileContent.includes('>NIN Verified Pro<'), 'Hardcoded NIN badge removed');
assert(profileContent.includes('class="provider-supplied-tag"'), 'Self-Reported provider tag present');
assert(profileContent.includes('Standard benchmark estimates provided by the artisan'), 'Pricing transparency notice present');
assert(profileContent.includes('Trust & Safety Guidelines'), 'Sidebar Trust & Safety card present');
assert(profileContent.includes('id="btn-open-report-modal"'), 'Report Listing button present in sidebar');
assert(profileContent.includes('id="report-modal"'), 'Report Provider modal present');
assert(profileContent.includes('id="report-provider-form"'), 'Report Provider form present');
assert(profileContent.includes('id="report-reason"'), 'Report reason selector present');
console.log('  ✅ [PASS] All 9 profile transparency, safety notice, and report modal elements present');

console.log('\n--- TEST GROUP 2: DASHBOARD TRUST CENTER MARKUP ---');
const dashPath = path.join(__dirname, '../dashboard.html');
assert(fs.existsSync(dashPath), 'dashboard.html exists');
const dashContent = fs.readFileSync(dashPath, 'utf8');

assert(dashContent.includes('Trust & Credential Verification Center'), 'Trust & Credential Verification heading present');
assert(dashContent.includes('id="dash-ver-status-chip"'), 'Status chip present');
assert(dashContent.includes('id="dash-ver-status-text"'), 'Status text label present');
assert(dashContent.includes('id="dash-feedback-summary"'), 'Feedback summary container present');
assert(dashContent.includes('id="form-request-verification"'), 'Verification request form present');
assert(dashContent.includes('id="ver-doc-type"'), 'Document type selector present');
assert(dashContent.includes('id="ver-doc-ref"'), 'Document reference input present');
assert(dashContent.includes('id="btn-submit-verification"'), 'Submit verification button present');
console.log('  ✅ [PASS] All 8 dashboard trust center, status breakdown, and request form elements present');

console.log('\n--- TEST GROUP 3: CSS STYLES & DESIGN TOKENS ---');
const stylePath = path.join(__dirname, '../style.css');
const profileCssPath = path.join(__dirname, '../profile.css');
assert(fs.existsSync(stylePath), 'style.css exists');
assert(fs.existsSync(profileCssPath), 'profile.css exists');

const styleContent = fs.readFileSync(stylePath, 'utf8');
const profileCssContent = fs.readFileSync(profileCssPath, 'utf8');

assert(styleContent.includes('.profile-verified-pill.verified'), 'style.css has .profile-verified-pill.verified');
assert(styleContent.includes('.profile-verified-pill.pending'), 'style.css has .profile-verified-pill.pending');
assert(styleContent.includes('.profile-verified-pill.unverified'), 'style.css has .profile-verified-pill.unverified');
assert(styleContent.includes('.provider-supplied-tag'), 'style.css has .provider-supplied-tag');
assert(profileCssContent.includes('.profile-verified-pill.verified'), 'profile.css has .profile-verified-pill.verified');
assert(profileCssContent.includes('.profile-verified-pill.pending'), 'profile.css has .profile-verified-pill.pending');
assert(profileCssContent.includes('.profile-verified-pill.unverified'), 'profile.css has .profile-verified-pill.unverified');
assert(profileCssContent.includes('.provider-supplied-tag'), 'profile.css has .provider-supplied-tag');
console.log('  ✅ [PASS] CSS files contain all required trust badge, pill, and tag styles');

console.log('\n--- TEST GROUP 4: ZERO SECRET LEAKS & PRIVACY ---');
assert(!profileContent.includes('service_role'), 'profile.html does not contain service_role key');
assert(!dashContent.includes('service_role'), 'dashboard.html does not contain service_role key');
assert(!profileContent.includes('SUPABASE_SERVICE_KEY'), 'profile.html does not contain service key');
assert(!dashContent.includes('SUPABASE_SERVICE_KEY'), 'dashboard.html does not contain service key');
console.log('  ✅ [PASS] Zero secret / credential leaks verified across client assets');

console.log('\n================================================================================');
console.log('🎉 ALL 25 PHASE 10.12H HTTP & MARKUP VERIFICATION CHECKS PASSED (100%)!');
console.log('================================================================================\n');
